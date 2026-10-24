import assert from "node:assert/strict";
import { VIDEO_POSTER_CAPTURE_TIMEOUT_MS } from "../lib/video-poster-capture-shared";

assert.equal(VIDEO_POSTER_CAPTURE_TIMEOUT_MS, 8000);
console.log("video-poster-capture-shared ok");
