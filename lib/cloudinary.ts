import { createHash } from "crypto";

type UploadVideoParams = {
  fileBuffer: Buffer;
  fileName: string;
};

type CloudinaryUploadResult = {
  secureUrl: string;
  publicId: string;
  format: string | null;
  bytes: number;
};

function getCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are required.",
    );
  }

  return { cloudName, apiKey, apiSecret };
}

function buildUploadSignature(params: Record<string, string>, apiSecret: string) {
  const signatureBase = Object.entries(params)
    .filter(([, value]) => value.length > 0)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return createHash("sha1")
    .update(`${signatureBase}${apiSecret}`)
    .digest("hex");
}

function sanitizeBaseName(fileName: string) {
  const withoutExtension = fileName.replace(/\.[^/.]+$/, "");
  return withoutExtension
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function getCloudinaryAttachmentDownloadUrl(params: {
  publicId: string;
  format: string | null;
}) {
  const { cloudName } = getCloudinaryConfig();
  const extension = params.format ? `.${params.format}` : "";
  return `https://res.cloudinary.com/${cloudName}/video/upload/fl_attachment/${params.publicId}${extension}`;
}

export async function uploadVideoToCloudinary(params: UploadVideoParams): Promise<CloudinaryUploadResult> {
  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const folder = process.env.CLOUDINARY_UPLOAD_FOLDER?.trim() || "lcb-training/submissions";
  const publicId = `${folder}/${Date.now()}-${sanitizeBaseName(params.fileName) || "coach-response"}`;

  const signature = buildUploadSignature(
    {
      folder,
      public_id: publicId,
      timestamp,
    },
    apiSecret,
  );

  const formData = new FormData();
  formData.set("api_key", apiKey);
  formData.set("timestamp", timestamp);
  formData.set("folder", folder);
  formData.set("public_id", publicId);
  formData.set("signature", signature);
  formData.set("resource_type", "video");
  formData.set("file", new Blob([params.fileBuffer]), params.fileName || "coach-response.mp4");

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/video/upload`, {
    method: "POST",
    body: formData,
  });

  const payload = (await response.json().catch(() => ({}))) as {
    secure_url?: string;
    public_id?: string;
    format?: string;
    bytes?: number;
    error?: { message?: string };
  };

  if (!response.ok || !payload.secure_url || !payload.public_id) {
    throw new Error(
      payload.error?.message ||
        `Unable to upload video to Cloudinary (status ${response.status}).`,
    );
  }

  return {
    secureUrl: payload.secure_url,
    publicId: payload.public_id,
    format: payload.format ?? null,
    bytes: payload.bytes ?? params.fileBuffer.byteLength,
  };
}
