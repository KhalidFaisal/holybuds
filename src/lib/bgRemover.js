/**
 * Client-side in-browser Background Remover using @imgly/background-removal
 * Runs ONNX/WASM locally without sending data to external APIs.
 */

/**
 * Strips low-opacity noise pixels (< alphaThreshold) to eliminate faint table shadows
 */
export async function cleanupAlphaChannel(blob, alphaThreshold = 25) {
  if (typeof window === 'undefined' || !blob) return blob;
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      for (let i = 0; i < data.length; i += 4) {
        // If alpha is below threshold, zero it completely to remove dust/shadow specks
        if (data[i + 3] < alphaThreshold) {
          data[i + 3] = 0;
        }
      }

      ctx.putImageData(imgData, 0, 0);
      canvas.toBlob((cleanBlob) => {
        resolve(cleanBlob || blob);
      }, 'image/png');
    };
    img.onerror = () => resolve(blob);
    img.src = url;
  });
}

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

  const rawBlob = await removeBackground(imageInput, {
    publicPath: 'https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/',
    model: 'isnet_fp16', // High precision model for crisp edges without quantization noise
    device: 'cpu',
    output: {
      format: 'image/png',
      quality: 0.98,
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

  // Automatically clean up faint background noise specks and table shadows
  try {
    const cleanedBlob = await cleanupAlphaChannel(rawBlob, 25);
    return cleanedBlob;
  } catch (cleanErr) {
    console.warn('[AI Cutout] Alpha cleanup fallback to raw blob:', cleanErr);
    return rawBlob;
  }
}
