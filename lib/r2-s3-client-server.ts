import "server-only";

import { Agent as HttpAgent } from "http";
import { Agent as HttpsAgent } from "https";
import { S3Client } from "@aws-sdk/client-s3";
import { NodeHttpHandler } from "@smithy/node-http-handler";

const R2_CONNECT_TIMEOUT_MS = 2_000;
const R2_REQUEST_TIMEOUT_MS = 5_000;
/** Initial attempt + one retry for playback URL signing path. */
export const R2_PLAYBACK_MAX_ATTEMPTS = 2;

let sharedR2Client: S3Client | null = null;
let playbackR2Client: S3Client | null = null;

export function getR2Config() {
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

function createR2RequestHandler() {
  return new NodeHttpHandler({
    connectionTimeout: R2_CONNECT_TIMEOUT_MS,
    requestTimeout: R2_REQUEST_TIMEOUT_MS,
    throwOnRequestTimeout: true,
    httpAgent: new HttpAgent({ family: 4, keepAlive: true }),
    httpsAgent: new HttpsAgent({ family: 4, keepAlive: true }),
  });
}

function createR2Client(maxAttempts: number) {
  const { endpoint, accessKeyId, secretAccessKey } = getR2Config();

  return new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    requestHandler: createR2RequestHandler(),
    maxAttempts,
  });
}

export function getR2Client() {
  if (!sharedR2Client) {
    sharedR2Client = createR2Client(3);
  }
  return sharedR2Client;
}

export function getR2PlaybackClient() {
  if (!playbackR2Client) {
    playbackR2Client = createR2Client(R2_PLAYBACK_MAX_ATTEMPTS);
  }
  return playbackR2Client;
}
