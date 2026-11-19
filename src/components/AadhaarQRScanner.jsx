import React, { useEffect, useRef, useState } from 'react';
import { 
  X, 
  Camera, 
  Flashlight, 
  AlertCircle, 
  CheckCircle2, 
  Upload, 
  ZoomIn, 
  ZoomOut, 
  Loader2,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { 
  readBarcodesFromImageFile, 
  readBarcodesFromImageData, 
  setZXingModuleOverrides 
} from 'zxing-wasm/reader';
import { parseAadhaarQRCode } from '../utils/aadhaarQrParser';

// Configure zxing-wasm to load the high-performance C++ WebAssembly binary
setZXingModuleOverrides({
  locateFile: () => '/zxing_reader.wasm'
});

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

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameIdRef = useRef(null);
  const isDecodingBusyRef = useRef(false);
  const hasDetectedRef = useRef(false);

  // ── Camera Lifecycle ──
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    hasDetectedRef.current = false;
    isDecodingBusyRef.current = false;

    const startCamera = async () => {
      setScanError('');
      setIsScanning(true);

      // Constraints for crystal-clear HD video stream
      const constraints = {
        audio: false,
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
          advanced: [{ focusMode: 'continuous' }]
        }
      };

      try {
        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (strictErr) {
          // Fallback to simpler constraints if 1080p is unavailable
          stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: { facingMode: 'environment' }
          });
        }

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        // Check Torch & Zoom Capabilities
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack && typeof videoTrack.getCapabilities === 'function') {
          try {
            const caps = videoTrack.getCapabilities();
            if (caps.torch) {
              setCanToggleTorch(true);
            }
            if (caps.zoom) {
              setCanZoom(true);
              setZoomRange({
                min: caps.zoom.min || 1,
                max: caps.zoom.max || 3,
                step: caps.zoom.step || 0.1
              });
              setZoomLevel(caps.zoom.min || 1);
            }
          } catch (_) {}
        }

        // Start scanning frames
        startScanLoop();
      } catch (err) {
        console.error('Camera initialization error:', err);
        setHasCameraPermission(false);
        setScanError('कैमरा शुरू करने में असमर्थ। कृपया कैमरा अनुमति दें या नीचे गैलरी से फोटो चुनें।');
        setIsScanning(false);
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, [isOpen]);

  const stopCamera = () => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  // ── Frame Scanning Loop (Dual Engine: Native BarcodeDetector + ZXing WASM) ──
  const startScanLoop = () => {
    let lastScanTime = 0;
    const SCAN_INTERVAL_MS = 120; // Scan every ~120ms (8-10 scans/sec for peak responsiveness)

    // Check if browser has native BarcodeDetector API (hardware accelerated)
    const hasNativeDetector = typeof window !== 'undefined' && 'BarcodeDetector' in window;
    let nativeDetector = null;
    if (hasNativeDetector) {
      try {
        nativeDetector = new window.BarcodeDetector({ formats: ['qr_code'] });
      } catch (_) {}
    }

    const scanFrame = async (timestamp) => {
      if (hasDetectedRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && video.readyState >= 2 && canvas) {
        if (timestamp - lastScanTime >= SCAN_INTERVAL_MS && !isDecodingBusyRef.current) {
          lastScanTime = timestamp;
          isDecodingBusyRef.current = true;

          try {
            const vWidth = video.videoWidth;
            const vHeight = video.videoHeight;

            if (vWidth > 0 && vHeight > 0) {
              canvas.width = vWidth;
              canvas.height = vHeight;
              const ctx = canvas.getContext('2d', { willReadFrequently: true });
              ctx.drawImage(video, 0, 0, vWidth, vHeight);

              let decodedRawText = null;

              // Engine 1: Native BarcodeDetector (instant on Chrome Android)
              if (nativeDetector) {
                try {
                  const nativeResults = await nativeDetector.detect(canvas);
                  if (nativeResults && nativeResults.length > 0 && nativeResults[0].rawValue) {
                    decodedRawText = nativeResults[0].rawValue;
                  }
                } catch (_) {}
              }

              // Engine 2: Industrial ZXing-C++ WebAssembly (handles dense 3000-char Aadhaar QRs)
              if (!decodedRawText) {
                const imageData = ctx.getImageData(0, 0, vWidth, vHeight);
                const wasmResults = await readBarcodesFromImageData(imageData, {
                  formats: ['QRCode'],
                  tryHarder: true,
                  tryRotate: true,
                  tryInvert: true
                });

                if (wasmResults && wasmResults.length > 0 && wasmResults[0].text) {
                  decodedRawText = wasmResults[0].text;
                }
              }

              // If a QR was decoded, process Aadhaar data
              if (decodedRawText && !hasDetectedRef.current) {
                hasDetectedRef.current = true;
                const parseResult = parseAadhaarQRCode(decodedRawText);

                if (parseResult.success) {
                  // Haptic feedback
                  if (typeof navigator !== 'undefined' && navigator.vibrate) {
                    try { navigator.vibrate(120); } catch (_) {}
                  }

                  stopCamera();
                  onScanSuccess(parseResult.data);
                  onClose();
                  return;
                } else {
                  // Text decoded but not Aadhaar format, allow retry
                  hasDetectedRef.current = false;
                  setScanError(parseResult.error || 'आधार QR कोड अमान्य है। कृपया कार्ड के सही QR कोड पर फ़ोकस करें।');
                }
              }
            }
          } catch (loopErr) {
            console.warn('Frame scan warning:', loopErr);
          } finally {
            isDecodingBusyRef.current = false;
          }
        }
      }

      if (!hasDetectedRef.current) {
        animationFrameIdRef.current = requestAnimationFrame(scanFrame);
      }
    };

    animationFrameIdRef.current = requestAnimationFrame(scanFrame);
  };

  // ── Torch / Flashlight Control ──
  const handleToggleTorch = async () => {
    if (!streamRef.current || !canToggleTorch) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;

    try {
      const nextState = !torchOn;
      await track.applyConstraints({
        advanced: [{ torch: nextState }]
      });
      setTorchOn(nextState);
    } catch (e) {
      console.warn('Torch toggle error:', e);
    }
  };

  // ── Zoom Control ──
  const handleZoomChange = async (newZoom) => {
    if (!streamRef.current || !canZoom) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;

    try {
      const clamped = Math.max(zoomRange.min, Math.min(zoomRange.max, newZoom));
      await track.applyConstraints({
        advanced: [{ zoom: clamped }]
      });
      setZoomLevel(clamped);
    } catch (e) {
      console.warn('Zoom change error:', e);
    }
  };

  // ── Gallery / Image File Upload (Instant ZXing WASM Engine) ──
  const handleFileUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setScanError('');
    setIsProcessingFile(true);

    try {
      // Decode image directly using C++ WebAssembly
      const results = await readBarcodesFromImageFile(file, {
        formats: ['QRCode'],
        tryHarder: true,
        tryRotate: true,
        tryInvert: true
      });

      if (results && results.length > 0 && results[0].text) {
        const decodedText = results[0].text;
        const parseResult = parseAadhaarQRCode(decodedText);

        if (parseResult.success) {
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            try { navigator.vibrate(120); } catch (_) {}
          }
          stopCamera();
          onScanSuccess(parseResult.data);
          onClose();
          return;
        } else {
          setScanError(parseResult.error || 'फोटो में मिला QR कोड मान्य आधार डेटा नहीं है।');
        }
      } else {
        setScanError('फोटो में आधार QR कोड नहीं मिल सका। कृपया स्पष्ट, सीधी फोटो अपलोड करें जिसमें QR कोड साफ़ दिखे।');
      }
    } catch (err) {
      console.error('File scan error:', err);
      setScanError('फ़ाइल पढ़ने में त्रुटि: ' + (err.message || 'अज्ञात त्रुटि'));
    } finally {
      setIsProcessingFile(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm select-none animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="p-3 bg-slate-800 border-b border-slate-700 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shadow-xs">
              <Camera className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base leading-tight flex items-center gap-1.5">
                <span>आधार QR स्कैनर</span>
                <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded">
                  ZXing-C++ WASM
                </span>
              </h3>
              <p className="text-[11px] text-slate-300">
                नाम, जन्मतिथि, लिंग व पता स्वतः भरने हेतु
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors"
            title="बंद करें"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder / Live Video Camera Feed */}
        <div className="relative bg-black flex-1 flex flex-col items-center justify-center min-h-[340px] overflow-hidden">
          {/* Native HTML5 Video Element */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover min-h-[340px]"
          />

          {/* Offscreen Canvas for Image Processing */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Animated Viewfinder Overlay with Corner Brackets */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-6">
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 border-2 border-white/30 rounded-2xl overflow-hidden shadow-2xl">
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-amber-400 rounded-tl-xl" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-amber-400 rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-amber-400 rounded-bl-xl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-amber-400 rounded-br-xl" />

              {/* Animated laser scan beam */}
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-pulse shadow-[0_0_12px_#fbbf24] top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Camera Controls: Torch & Zoom */}
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
              <p className="text-sm font-bold">WASM इंजन द्वारा QR स्कैन हो रहा है...</p>
              <p className="text-xs text-slate-400">कृपया प्रतीक्षा करें</p>
            </div>
          )}

          {/* Guidance Banner */}
          <div className="absolute bottom-2 inset-x-2 bg-slate-950/85 backdrop-blur-md p-2 rounded-xl text-center border border-slate-800 text-white z-10 pointer-events-none">
            <p className="text-xs font-bold text-amber-300 flex items-center justify-center gap-1.5">
              <span>🎯 आधार कार्ड के QR कोड को पीले चौकोर बॉक्स में रखें</span>
            </p>
            <p className="text-[10px] text-slate-300 mt-0.5">
              कैमरा 15-20 सेमी दूर रखें ताकि QR कोड साफ़ दिखे (धुंधला न हो)
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
          {/* File Upload Button (Powered by zxing-wasm) */}
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
              stopCamera();
              onClose();
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
