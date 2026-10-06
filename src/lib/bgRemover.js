/**
 * Client-side in-browser Background Remover using @imgly/background-removal
 * Optimized with WebGPU hardware acceleration, Web Worker proxying, 
 * pre-scaled image downsampling, and in-memory singleton prewarming.
 */

// Singleton pre-warmed model promise
let prewarmPromise = null;

/**
 * Pre-warms and caches the AI model in memory ahead of time
 */
export async function prewarmBgRemover() {
  if (typeof window === 'undefined') return;
  if (prewarmPromise) return prewarmPromise;

  prewarmPromise = (async () => {
    try {
      const imgly = await import('@imgly/background-removal');
      const preload = imgly.preload;
      if (typeof preload === 'function') {
        await preload({
          publicPath: 'https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/',
          model: 'isnet_fp16',
          device: 'gpu',
        });
        console.log('[AI Cutout] Engine pre-warmed in memory (WebGPU)');
      }
    } catch (err) {
      console.warn('[AI Cutout] Prewarm notice:', err);
    }
  })();

  return prewarmPromise;
}

/**
 * Pre-scales massive camera/phone images (e.g. 12-24 MP) down to a max dimension of 1280px.
 * This cuts tensor calculations by ~75% without visible loss in product cutout quality.
 */
export async function optimizeInputImage(imageSource, maxDimension = 1280) {
  if (typeof window === 'undefined') return imageSource;

  return new Promise((resolve) => {
    const img = new Image();
    let objectUrl = null;

    if (typeof imageSource === 'string') {
      img.src = imageSource;
    } else if (imageSource instanceof Blob) {
      objectUrl = URL.createObjectURL(imageSource);
      img.src = objectUrl;
    } else {
      return resolve(imageSource);
    }

    img.onload = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);

      const { naturalWidth: width, naturalHeight: height } = img;

      // If already within reasonable dimensions, do not downscale
      if (width <= maxDimension && height <= maxDimension) {
        return resolve(imageSource);
      }

      let newWidth = width;
      let newHeight = height;
      if (width > height) {
        newWidth = maxDimension;
        newHeight = Math.round((height * maxDimension) / width);
      } else {
        newHeight = maxDimension;
        newWidth = Math.round((width * maxDimension) / height);
      }

      const canvas = document.createElement('canvas');
      canvas.width = newWidth;
      canvas.height = newHeight;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, newWidth, newHeight);

      canvas.toBlob((blob) => {
        resolve(blob || imageSource);
      }, 'image/png', 0.95);
    };

    img.onerror = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      resolve(imageSource);
    };
  });
}

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

  // 1. If source is a URL string, fetch into Blob first to prevent CORS cross-origin blocks
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

  // 2. Pre-scale giant camera images down to max 1280px (reduces tensor math by ~75%)
  if (onProgress) onProgress({ phase: 'Optimizing image resolution...', percent: 10 });
  const scaledImage = await optimizeInputImage(imageInput, 1280);

  // 3. Dynamically import @imgly/background-removal
  const imgly = await import('@imgly/background-removal');
  const removeBackground = imgly.removeBackground || imgly.default;

  if (typeof removeBackground !== 'function') {
    throw new Error('Background removal AI engine failed to initialize.');
  }

  // 4. Run inference with WebGPU hardware acceleration and worker proxying
  const rawBlob = await removeBackground(scaledImage, {
    publicPath: 'https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/',
    model: 'isnet_fp16',
    device: 'gpu',          // Uses WebGPU graphics hardware acceleration
    proxyToWorker: true,    // Proxies ONNX WASM/GPU execution off the main UI thread
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
          phase = percent > 0 ? `Loading AI model (${percent}%)...` : 'Initializing AI model...';
        } else if (key.includes('compute') || key.includes('inference')) {
          phase = 'GPU isolating product...';
        }
        onProgress({ phase, percent, key });
      }
    },
  });

  // 5. Automatically clean up faint background noise specks and table shadows
  try {
    const cleanedBlob = await cleanupAlphaChannel(rawBlob, 25);
    return cleanedBlob;
  } catch (cleanErr) {
    console.warn('[AI Cutout] Alpha cleanup fallback to raw blob:', cleanErr);
    return rawBlob;
  }
}
