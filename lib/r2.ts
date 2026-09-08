import { Readable } from "stream";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export const R2_VIDEO_PREFIX = "r2:";

function getR2Config() {
  const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME;

  if (!endpoint || !accessKeyId || !secretAccessKey || !bucketName) {
    throw new Error(
      "CLOUDFLARE_R2_ENDPOINT, CLOUDFLARE_R2_ACCESS_KEY_ID, CLOUDFLARE_R2_SECRET_ACCESS_KEY, and CLOUDFLARE_R2_BUCKET_NAME are required.",
    );
  }

  return { endpoint, accessKeyId, secretAccessKey, bucketName };
}

function getR2Client() {
  const { endpoint, accessKeyId, secretAccessKey } = getR2Config();

  return new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

function sanitizeFileName(fileName: string) {
  const baseName = fileName.split(/[/\\]/).pop() ?? "submission-video.mp4";
  const sanitized = baseName.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  return sanitized || "submission-video.mp4";
}

export function formatR2VideoReference(key: string) {
  return `${R2_VIDEO_PREFIX}${key}`;
}

export function parseR2VideoReference(value: string) {
  if (!value.startsWith(R2_VIDEO_PREFIX)) {
    return null;
  }

  const key = value.slice(R2_VIDEO_PREFIX.length).trim();
  return key.length > 0 ? key : null;
}

export function getAdminR2VideoUrl(reference: string) {
  const key = parseR2VideoReference(reference);
  if (!key) {
    return null;
  }

  return `/api/admin/r2-video/${key.split("/").map(encodeURIComponent).join("/")}`;
}

export function isR2VideoReference(value: string) {
  return parseR2VideoReference(value) !== null;
}

export async function uploadSubmissionVideoToR2(file: File) {
  const { bucketName } = getR2Config();
  const key = `submissions/${Date.now()}-${sanitizeFileName(file.name)}`;
  const contentType = file.type || "video/mp4";
  const body = Readable.fromWeb(file.stream() as Parameters<typeof Readable.fromWeb>[0]);

  await getR2Client().send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
      ContentLength: file.size,
    }),
  );

  return key;
}

export async function getR2ObjectStream(key: string) {
  const { bucketName } = getR2Config();

  const response = await getR2Client().send(
    new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    }),
  );

  if (!response.Body) {
    throw new Error("Video not found in R2.");
  }

  return {
    body: response.Body as NodeJS.ReadableStream,
    contentType: response.ContentType ?? "video/mp4",
    contentLength: response.ContentLength,
  };
}
