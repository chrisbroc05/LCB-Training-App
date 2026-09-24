export type PresignedSwingUploadResponse = {
  uploadUrl: string;
  r2Key: string;
  contentType: string;
  expiresInSeconds: number;
};

export function uploadVideoToPresignedUrl(
  file: File,
  uploadUrl: string,
  contentType: string,
  onProgress: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", contentType);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve();
        return;
      }

      reject(new Error(`Upload failed with status ${xhr.status}`));
    };

    xhr.onerror = () => {
      reject(new Error("Upload failed"));
    };

    xhr.onabort = () => {
      reject(new Error("Upload aborted"));
    };

    xhr.send(file);
  });
}
