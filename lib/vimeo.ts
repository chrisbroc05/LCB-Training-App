export async function uploadVideoToVimeo(params: { fileBuffer: Buffer; fileName: string }) {
  const accessToken = process.env.VIMEO_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("VIMEO_ACCESS_TOKEN is required for video responses.");
  }

  const createResponse = await fetch("https://api.vimeo.com/me/videos", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.vimeo.*+json;version=3.4",
    },
    body: JSON.stringify({
      name: params.fileName,
      privacy: {
        view: "unlisted",
      },
      upload: {
        approach: "tus",
        size: params.fileBuffer.length.toString(),
      },
    }),
  });

  if (!createResponse.ok) {
    throw new Error("Unable to create Vimeo upload.");
  }

  const createPayload = (await createResponse.json()) as {
    uri?: string;
    upload?: {
      upload_link?: string;
    };
  };

  const uploadLink = createPayload.upload?.upload_link;
  if (!uploadLink || !createPayload.uri) {
    throw new Error("Vimeo upload link was not returned.");
  }

  const uploadResponse = await fetch(uploadLink, {
    method: "PATCH",
    headers: {
      "Tus-Resumable": "1.0.0",
      "Upload-Offset": "0",
      "Content-Type": "application/offset+octet-stream",
      Accept: "application/vnd.vimeo.*+json;version=3.4",
    },
    body: params.fileBuffer,
  });

  if (!uploadResponse.ok && uploadResponse.status !== 204) {
    throw new Error("Unable to upload video bytes to Vimeo.");
  }

  const videoId = createPayload.uri.split("/").pop();
  if (!videoId) {
    throw new Error("Unable to resolve uploaded Vimeo video id.");
  }

  return `https://vimeo.com/${videoId}`;
}
