async function getResponseDetails(response: Response) {
  const raw = await response.text();
  return raw.slice(0, 1000);
}

export type ParsedVimeoUrl = {
  videoId: string;
  hash: string | null;
};

export function parseVimeoUrl(url: string | null | undefined): ParsedVimeoUrl | null {
  if (!url) {
    return null;
  }

  const trimmed = url.trim();

  const playerMatch = trimmed.match(/player\.vimeo\.com\/video\/(\d+)(?:\?([^#]*))?/i);
  if (playerMatch) {
    const query = playerMatch[2] ?? "";
    const hashParam = query.match(/(?:^|&)h=([^&]+)/i);
    return {
      videoId: playerMatch[1],
      hash: hashParam ? decodeURIComponent(hashParam[1]) : null,
    };
  }

  const pathOnly = trimmed.split("?")[0].split("#")[0];
  const standardMatch = pathOnly.match(/(?:www\.)?vimeo\.com\/(\d+)(?:\/([a-zA-Z0-9]+))?\/?$/i);
  if (standardMatch) {
    return {
      videoId: standardMatch[1],
      hash: standardMatch[2] ?? null,
    };
  }

  return null;
}

export function isValidVimeoUrl(value: string) {
  return parseVimeoUrl(value) !== null;
}

export function extractVimeoVideoId(url: string | null | undefined) {
  return parseVimeoUrl(url)?.videoId ?? null;
}

export function toVimeoEmbedUrl(url: string | null | undefined) {
  const parsed = parseVimeoUrl(url);
  if (!parsed) {
    return null;
  }

  const params = new URLSearchParams({
    title: "0",
    byline: "0",
    portrait: "0",
    dnt: "1",
  });

  if (parsed.hash) {
    params.set("h", parsed.hash);
  }

  return `https://player.vimeo.com/video/${parsed.videoId}?${params.toString()}`;
}

export function normalizeVimeoUrl(value: string) {
  const parsed = parseVimeoUrl(value);
  if (!parsed) {
    return value.trim();
  }

  if (parsed.hash) {
    return `https://vimeo.com/${parsed.videoId}/${parsed.hash}`;
  }

  return `https://vimeo.com/${parsed.videoId}`;
}

export async function uploadVideoToVimeo(params: { fileBuffer: Buffer; fileName: string }) {
  const accessToken = process.env.VIMEO_ACCESS_TOKEN;
  const folderId = "29488403";
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
    const details = await getResponseDetails(createResponse);
    throw new Error(
      `Unable to create Vimeo upload (status ${createResponse.status}). Response: ${details}`,
    );
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
    body: new Uint8Array(params.fileBuffer),
  });

  if (!uploadResponse.ok && uploadResponse.status !== 204) {
    const details = await getResponseDetails(uploadResponse);
    throw new Error(
      `Unable to upload video bytes to Vimeo (status ${uploadResponse.status}). Response: ${details}`,
    );
  }

  const videoId = createPayload.uri.split("/").pop();
  if (!videoId) {
    throw new Error("Unable to resolve uploaded Vimeo video id.");
  }

  const addToFolderResponse = await fetch(
    `https://api.vimeo.com/me/projects/${folderId}/videos/${videoId}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.vimeo.*+json;version=3.4",
      },
    },
  );

  if (!addToFolderResponse.ok && addToFolderResponse.status !== 204) {
    const details = await getResponseDetails(addToFolderResponse);
    throw new Error(
      `Unable to add Vimeo video to folder ${folderId} (status ${addToFolderResponse.status}). Response: ${details}`,
    );
  }

  return `https://vimeo.com/${videoId}`;
}
