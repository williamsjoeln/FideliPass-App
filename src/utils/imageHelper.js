// Image processing helper: reads, resizes and optimizes logos for fast real-time Firestore sync and offline storage
export function processImageFile(file, maxWidth = 360, maxHeight = 360, quality = 0.85) {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('No se seleccionó ningún archivo'));
    }

    if (!file.type.startsWith('image/')) {
      return reject(new Error('El archivo seleccionado debe ser una imagen (PNG, JPG, SVG o WebP)'));
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate proportional dimensions
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(e.target.result); // Fallback to raw data url
        }

        // Draw image onto canvas
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to standard PNG (Apple Wallet & Google Wallet strictly require PNG format)
        try {
          const dataUrl = canvas.toDataURL('image/png');
          resolve(dataUrl);
        } catch {
          resolve(e.target.result);
        }
      };

      img.onerror = () => reject(new Error('No se pudo decodificar la imagen seleccionada'));
      img.src = e.target.result;
    };

    reader.onerror = () => reject(new Error('Error al leer el archivo desde el dispositivo'));
    reader.readAsDataURL(file);
  });
}

/**
 * Automatically creates a full-width panoramic horizontal banner (1125 x 432 px - Apple Wallet & FideliPass standard)
 * from any uploaded logo.
 * 
 * Automatically detects whether the logo background is white, dark, colored or transparent,
 * and fills both left & right wings seamlessly so it NEVER appears as an awkward square.
 * Centers the logo with zero distortion.
 */
export function generateSeamlessHorizontalBanner(logoInput, fallbackBgColor = '#1B474A') {
  return new Promise((resolve) => {
    if (!logoInput) {
      return resolve({ bannerDataUrl: null, detectedBgColor: fallbackBgColor });
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const w = img.width || 400;
        const h = img.height || 400;

        // 1. Analyze corner and perimeter pixels to detect the logo's native background color
        const sampleCanvas = document.createElement('canvas');
        sampleCanvas.width = Math.min(w, 200);
        sampleCanvas.height = Math.min(h, 200);
        const sampleCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });

        let detectedColor = fallbackBgColor;
        let isTransparent = false;

        if (sampleCtx) {
          sampleCtx.drawImage(img, 0, 0, sampleCanvas.width, sampleCanvas.height);
          const sw = sampleCanvas.width;
          const sh = sampleCanvas.height;

          // Sample pixels from the 4 corners and top/bottom edges
          const samples = [
            [2, 2],
            [sw - 3, 2],
            [2, sh - 3],
            [sw - 3, sh - 3],
            [Math.floor(sw / 2), 2],
            [Math.floor(sw / 2), sh - 3]
          ];

          let totalR = 0, totalG = 0, totalB = 0, opaqueCount = 0;

          samples.forEach(([sx, sy]) => {
            const pixel = sampleCtx.getImageData(sx, sy, 1, 1).data;
            if (pixel[3] < 35) {
              isTransparent = true;
            } else {
              totalR += pixel[0];
              totalG += pixel[1];
              totalB += pixel[2];
              opaqueCount++;
            }
          });

          if (!isTransparent && opaqueCount > 0) {
            const r = Math.round(totalR / opaqueCount);
            const g = Math.round(totalG / opaqueCount);
            const b = Math.round(totalB / opaqueCount);
            detectedColor = `rgb(${r}, ${g}, ${b})`;
          } else {
            detectedColor = fallbackBgColor || '#FFFFFF';
          }
        }

        // 2. Build standard 1125 x 432 panoramic banner (2.6:1 ratio)
        const bannerW = 1125;
        const bannerH = 432;
        const bannerCanvas = document.createElement('canvas');
        bannerCanvas.width = bannerW;
        bannerCanvas.height = bannerH;
        const bannerCtx = bannerCanvas.getContext('2d');

        if (!bannerCtx) {
          return resolve({ bannerDataUrl: (typeof logoInput === 'string' ? logoInput : null), detectedBgColor: detectedColor });
        }

        // Fill 100% of the canvas seamlessly with the detected color
        bannerCtx.fillStyle = detectedColor;
        bannerCtx.fillRect(0, 0, bannerW, bannerH);

        // Center the logo proportionally without any distortion
        const maxDrawW = 760;
        const maxDrawH = 360;

        let scale = Math.min(maxDrawW / w, maxDrawH / h);
        if (scale > 1.2) scale = 1.2;

        const drawW = Math.round(w * scale);
        const drawH = Math.round(h * scale);
        const drawX = Math.round((bannerW - drawW) / 2);
        const drawY = Math.round((bannerH - drawH) / 2);

        bannerCtx.drawImage(img, drawX, drawY, drawW, drawH);

        const bannerDataUrl = bannerCanvas.toDataURL('image/png', 0.92);
        resolve({ bannerDataUrl, detectedBgColor: detectedColor });
      } catch (err) {
        console.warn("Could not generate seamless banner:", err);
        resolve({ bannerDataUrl: (typeof logoInput === 'string' ? logoInput : null), detectedBgColor: fallbackBgColor });
      }
    };

    img.onerror = () => {
      resolve({ bannerDataUrl: (typeof logoInput === 'string' ? logoInput : null), detectedBgColor: fallbackBgColor });
    };

    img.src = typeof logoInput === 'string' ? logoInput : (logoInput instanceof File ? URL.createObjectURL(logoInput) : '');
  });
}
