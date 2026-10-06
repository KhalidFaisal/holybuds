/**
 * Client-side in-browser Background Remover using @imgly/background-removal
 * Runs ONNX/WASM locally without sending data to external APIs.
 */

export async function removeImageBackground(imageSource, onProgress, token = null) {
  let imageInput = imageSource;

  // If source is a URL string, fetch it into a Blob first to avoid CORS / cross-origin issues
  if (typeof imageSource === 'string') {
    try {
      const res = await fetch(imageSource, { mode: 'cors' });
      if (!res.ok) throw new Error('Direct fetch failed');
      imageInput = await res.blob();
    } catch (err) {
      // Fallback via authenticated admin image proxy
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const proxyRes = await fetch(`/api/admin/proxy-image?url=${encodeURIComponent(imageSource)}`, {
        headers,
      });
      if (!proxyRes.ok) {
        throw new Error('Could not load image. Please verify URL.');
      }
      imageInput = await proxyRes.blob();
    }
  }

  // Dynamically import @imgly/background-removal so it never bloats the initial bundle
  const { default: removeBackground } = await import('@imgly/background-removal');

  const resultBlob = await removeBackground(imageInput, {
    model: 'isnet_fp16',
    output: {
      format: 'image/png',
      quality: 0.95,
    },
    progress: (key, current, total) => {
      if (onProgress) {
        let percent = 0;
        if (total > 0) {
          percent = Math.min(100, Math.round((current / total) * 100));
        }
        let phase = 'Processing product image...';
        if (key.includes('fetch')) {
          phase = percent > 0 ? `Loading AI model (${percent}%)...` : 'Initializing AI engine...';
        } else if (key.includes('compute')) {
          phase = 'Removing background...';
        }
        onProgress({ phase, percent, key });
      }
    },
  });

  return resultBlob;
}
