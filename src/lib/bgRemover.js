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
      if (!res.ok) throw new Error(`Direct fetch failed with status ${res.status}`);
      imageInput = await res.blob();
    } catch (err) {
      console.warn('[AI Cutout] Direct fetch failed, trying admin proxy fallback...', err);
      // Fallback via authenticated admin image proxy
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const proxyRes = await fetch(`/api/admin/proxy-image?url=${encodeURIComponent(imageSource)}`, {
        headers,
      });
      if (!proxyRes.ok) {
        throw new Error('Could not download image. Please check image URL or CORS policy.');
      }
      imageInput = await proxyRes.blob();
    }
  }

  // Dynamically import @imgly/background-removal
  const imgly = await import('@imgly/background-removal');
  const removeBackground = imgly.removeBackground || imgly.default;

  if (typeof removeBackground !== 'function') {
    throw new Error('Background removal AI engine failed to initialize.');
  }

  const resultBlob = await removeBackground(imageInput, {
    publicPath: 'https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/',
    model: 'isnet_quint8', // Faster ~40MB quantized model
    device: 'cpu',
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
        if (key.includes('fetch') || key.includes('model')) {
          phase = percent > 0 ? `Downloading AI model (${percent}%)...` : 'Initializing AI model...';
        } else if (key.includes('compute') || key.includes('inference')) {
          phase = 'Isolating product...';
        }
        onProgress({ phase, percent, key });
      }
    },
  });

  return resultBlob;
}
