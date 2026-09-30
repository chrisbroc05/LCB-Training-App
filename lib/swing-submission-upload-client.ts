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
  return uploadVideoToPresignedUrlWithAbort(file, uploadUrl, contentType, onProgress).promise;
}

export function uploadVideoToPresignedUrlWithAbort(
  file: File,
  uploadUrl: string,
  contentType: string,
  onProgress: (percent: number) => void,
) {
  const xhr = new XMLHttpRequest();
  const promise = new Promise<void>((resolve, reject) => {
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

  return {
    promise,
    abort: () => xhr.abort(),
  };
}
