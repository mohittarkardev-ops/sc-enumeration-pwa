import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Camera, Flashlight, AlertCircle, CheckCircle2, RefreshCw, Upload, ZoomIn, ZoomOut, Loader2 } from 'lucide-react';
import { parseAadhaarQRCode } from '../utils/aadhaarQrParser';

/**
 * Downsamples large mobile camera photos (e.g. 12MP/48MP) to ~1600px
 * so ZXing/html5-qrcode can decode them quickly without memory pressure.
 */
async function optimizeImageForQrScan(file) {
  return new Promise((resolve) => {
    if (!file || !file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const maxDim = 1600;
      if (img.width <= maxDim && img.height <= maxDim) {
        resolve(file); // Size is already optimal
        return;
      }

      let w = img.width;
      let h = img.height;
      if (w > h) {
        h = Math.round((h * maxDim) / w);
        w = maxDim;
      } else {
        w = Math.round((w * maxDim) / h);
        h = maxDim;
      }

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, w, h);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(new File([blob], file.name || 'qr.jpg', { type: 'image/jpeg' }));
          } else {
            resolve(file);
          }
        },
        'image/jpeg',
        0.92
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });
}

export default function AadhaarQRScanner({ isOpen, onClose, onScanSuccess }) {
  const [scanError, setScanError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(true);
  const [torchOn, setTorchOn] = useState(false);
  const [canToggleTorch, setCanToggleTorch] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [zoomRange, setZoomRange] = useState({ min: 1, max: 1, step: 0.1 });
  const [canZoom, setCanZoom] = useState(false);

  const scannerRef = useRef(null);
  const isStoppingRef = useRef(false);
  const readerElementId = 'aadhaar-qr-reader-container';

  useEffect(() => {
    if (!isOpen) return;

    let html5QrCode = null;
    let isMounted = true;

    const startScanner = async () => {
      setScanError('');
      setIsScanning(true);

      // Short delay for modal DOM animation
      await new Promise((r) => setTimeout(r, 180));

      const container = document.getElementById(readerElementId);
      if (!container || !isMounted) return;

      try {
        html5QrCode = new Html5Qrcode(readerElementId, {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true // Native hardware acceleration on Chrome Android
          },
          verbose: false
        });
        scannerRef.current = html5QrCode;

        // Optimized scan config for dense Aadhaar QR codes
        const config = {
          fps: 15,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            // 88% of viewfinder size gives maximum resolution for dense Aadhaar QRs
            const size = Math.max(260, Math.floor(minEdge * 0.88));
            return { width: size, height: size };
          },
          videoConstraints: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          }
        };

        await html5QrCode.start(
          { facingMode: 'environment' },
          config,
          (decodedText) => {
            // Success callback
            const parseResult = parseAadhaarQRCode(decodedText);
            if (parseResult.success) {
              if (navigator.vibrate) {
                try { navigator.vibrate(120); } catch (_) {}
              }
              stopScanner().then(() => {
                onScanSuccess(parseResult.data);
                onClose();
              });
            } else {
              setScanError(parseResult.error || 'अमान्य आधार QR कोड। कृपया साफ़ QR पर फ़ोकस करें।');
            }
          },
          () => {
            // Frame scan in progress
          }
        );

        if (!isMounted) {
          stopScanner();
          return;
        }

        // Check camera track capabilities for Torch and Zoom
        try {
          const capabilities = html5QrCode.getRunningTrackCapabilities();
          if (capabilities) {
            if (capabilities.torch) {
              setCanToggleTorch(true);
            }
            if (capabilities.zoom) {
              setCanZoom(true);
              setZoomRange({
                min: capabilities.zoom.min || 1,
                max: capabilities.zoom.max || 3,
                step: capabilities.zoom.step || 0.1
              });
              setZoomLevel(capabilities.zoom.min || 1);
            }
          }
        } catch (_) {}
      } catch (err) {
        console.error('Aadhaar Camera start error:', err);
        setHasCameraPermission(false);
        setScanError('कैमरा शुरू करने में असमर्थ। कृपया कैमरा अनुमति दें या नीचे गैलरी से फोटो चुनें।');
        setIsScanning(false);
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      stopScanner();
    };
  }, [isOpen]);

  const stopScanner = async () => {
    if (isStoppingRef.current) return;
    isStoppingRef.current = true;

    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (e) {
        console.warn('Scanner stop notice:', e);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
    isStoppingRef.current = false;
  };

  const handleToggleTorch = async () => {
    if (!scannerRef.current || !canToggleTorch) return;
    try {
      const nextState = !torchOn;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: nextState }]
      });
      setTorchOn(nextState);
    } catch (e) {
      console.warn('Torch toggle error:', e);
    }
  };

  const handleZoomChange = async (newZoom) => {
    if (!scannerRef.current || !canZoom) return;
    try {
      const clamped = Math.max(zoomRange.min, Math.min(zoomRange.max, newZoom));
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ zoom: clamped }]
      });
      setZoomLevel(clamped);
    } catch (e) {
      console.warn('Zoom change error:', e);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setScanError('');
    setIsProcessingFile(true);

    try {
      // 1. Stop active camera first so html5-qrcode can safely scan file
      await stopScanner();

      // 2. Downsample huge phone photos to prevent memory crashes
      const optimizedFile = await optimizeImageForQrScan(file);

      // 3. Scan file using dummy container (fixed offscreen with layout)
      const html5FileScanner = new Html5Qrcode('aadhaar-file-reader-dummy', {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true
        },
        verbose: false
      });

      const decodedText = await html5FileScanner.scanFile(optimizedFile, true);
      const parseResult = parseAadhaarQRCode(decodedText);

      if (parseResult.success) {
        if (navigator.vibrate) {
          try { navigator.vibrate(120); } catch (_) {}
        }
        onScanSuccess(parseResult.data);
        onClose();
      } else {
        setScanError(parseResult.error || 'फोटो में मान्य आधार QR कोड नहीं मिला।');
      }
    } catch (err) {
      console.error('File scan error:', err);
      setScanError('फोटो से QR कोड नहीं पढ़ा जा सका। कृपया स्पष्ट और सीधे एंगल की फोटो अपलोड करें।');
    } finally {
      setIsProcessingFile(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-2 sm:p-4 backdrop-blur-xs font-['Hind'] select-none animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="p-3 bg-slate-800 border-b border-slate-700 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shadow-xs">
              <Camera className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base leading-tight">
                आधार QR कोड स्कैनर (HD)
              </h3>
              <p className="text-[11px] text-slate-300">
                नाम, जन्मतिथि, लिंग व पता स्वतः भरने हेतु
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopScanner().then(onClose);
            }}
            className="p-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors"
            title="बंद करें"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder / Camera Feed */}
        <div className="relative bg-black flex-1 flex flex-col items-center justify-center min-h-[320px] overflow-hidden">
          <div id={readerElementId} className="w-full h-full min-h-[320px]" />

          {/* Dummy element for offscreen file scanning */}
          <div
            id="aadhaar-file-reader-dummy"
            style={{
              position: 'fixed',
              top: '-9999px',
              left: '-9999px',
              width: '320px',
              height: '320px',
              visibility: 'hidden'
            }}
          />

          {/* Camera Controls Overlay: Torch & Zoom */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 z-20">
            {canToggleTorch && isScanning && (
              <button
                type="button"
                onClick={handleToggleTorch}
                className={`p-2.5 rounded-full backdrop-blur-md transition-all shadow-lg ${
                  torchOn
                    ? 'bg-amber-400 text-slate-900 ring-2 ring-amber-300'
                    : 'bg-black/60 text-white hover:bg-black/80'
                }`}
                title="टॉर्च ऑन/ऑफ"
              >
                <Flashlight className="w-4 h-4" />
              </button>
            )}

            {canZoom && isScanning && (
              <div className="bg-black/60 backdrop-blur-md rounded-2xl p-1 flex flex-col items-center gap-1 shadow-lg text-white">
                <button
                  type="button"
                  onClick={() => handleZoomChange(zoomLevel + zoomRange.step * 2)}
                  className="p-1 hover:text-amber-300"
                  title="ज़ूम इन"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <span className="text-[9px] font-bold">{zoomLevel.toFixed(1)}x</span>
                <button
                  type="button"
                  onClick={() => handleZoomChange(zoomLevel - zoomRange.step * 2)}
                  className="p-1 hover:text-amber-300"
                  title="ज़ूम आउट"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Processing File Overlay */}
          {isProcessingFile && (
            <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center gap-2.5 z-30 text-white">
              <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
              <p className="text-sm font-bold">आधार फोटो से QR डिकोड हो रहा है...</p>
              <p className="text-xs text-slate-400">कृपया 1-2 सेकंड प्रतीक्षा करें</p>
            </div>
          )}

          {/* Tips Overlay */}
          <div className="absolute bottom-2 inset-x-2 bg-slate-950/85 backdrop-blur-md p-2 rounded-xl text-center border border-slate-800 text-white z-10 pointer-events-none">
            <p className="text-xs font-bold text-amber-300 flex items-center justify-center gap-1.5">
              <span>🎯 आधार कार्ड के QR कोड को चौकोर फ्रेम में रखें</span>
            </p>
            <p className="text-[10px] text-slate-300 mt-0.5">
              कैमरा 15-20 सेमी दूर रखें ताकि QR कोड धुंधला न हो और फ़ोकस बना रहे
            </p>
          </div>
        </div>

        {/* Error Notification */}
        {scanError && (
          <div className="p-2.5 bg-red-950/90 border-t border-red-800 text-red-200 text-xs flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{scanError}</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="p-3 bg-slate-800 border-t border-slate-700 flex items-center justify-between gap-2 shrink-0">
          {/* File Upload Fallback */}
          <label className="flex-1 py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-98 shadow-sm">
            <Upload className="w-3.5 h-3.5" />
            <span>गैलरी / फ़ाइल से QR फोटो चुनें</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>

          <button
            type="button"
            onClick={() => {
              stopScanner().then(onClose);
            }}
            className="py-2 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-bold active:scale-98"
          >
            रद्द करें
          </button>
        </div>
      </div>
    </div>
  );
}
