import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, Flashlight, AlertCircle, CheckCircle2, RefreshCw, Upload } from 'lucide-react';
import { parseAadhaarQRCode } from '../utils/aadhaarQrParser';

export default function AadhaarQRScanner({ isOpen, onClose, onScanSuccess }) {
  const [scanError, setScanError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(true);
  const [torchOn, setTorchOn] = useState(false);
  const [canToggleTorch, setCanToggleTorch] = useState(false);

  const scannerRef = useRef(null);
  const readerElementId = 'aadhaar-qr-reader-container';

  useEffect(() => {
    if (!isOpen) return;

    let html5QrCode = null;
    let isMounted = true;

    const startScanner = async () => {
      setScanError('');
      setIsScanning(true);

      // Short delay to ensure DOM element exists
      await new Promise((r) => setTimeout(r, 150));

      const container = document.getElementById(readerElementId);
      if (!container || !isMounted) return;

      try {
        html5QrCode = new Html5Qrcode(readerElementId);
        scannerRef.current = html5QrCode;

        const config = {
          fps: 15,
          qrbox: { width: 260, height: 260 },
          aspectRatio: 1.0,
          formatsToSupport: [0] // QR_CODE only for maximum performance
        };

        await html5QrCode.start(
          { facingMode: 'environment' },
          config,
          (decodedText) => {
            // Success callback
            const parseResult = parseAadhaarQRCode(decodedText);
            if (parseResult.success) {
              if (navigator.vibrate) {
                try { navigator.vibrate(100); } catch (e) {}
              }
              stopScanner().then(() => {
                onScanSuccess(parseResult.data);
                onClose();
              });
            } else {
              setScanError(parseResult.error || 'अमान्य आधार QR कोड। कृपया सही QR पर फोकस करें।');
            }
          },
          (errorMessage) => {
            // Scanning in progress, ignore frequent frame errors
          }
        );

        // Check torch capability
        try {
          const capabilities = html5QrCode.getRunningTrackCapabilities();
          if (capabilities && capabilities.torch) {
            setCanToggleTorch(true);
          }
        } catch (e) {}
      } catch (err) {
        console.error('Camera start error:', err);
        setHasCameraPermission(false);
        setScanError('कैमरा शुरू करने में असमर्थ। कृपया कैमरा अनुमति (Permission) दें अथवा नीचे से QR फोटो चुनें।');
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
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (e) {
        console.warn('Scanner stop warning:', e);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const handleToggleTorch = async () => {
    if (!scannerRef.current) return;
    try {
      const nextState = !torchOn;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: nextState }]
      });
      setTorchOn(nextState);
    } catch (e) {
      console.warn('Torch toggle failed:', e);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setScanError('');
    try {
      const html5Qr = new Html5Qrcode('aadhaar-file-reader-dummy');
      const decodedText = await html5Qr.scanFile(file, true);
      const parseResult = parseAadhaarQRCode(decodedText);
      if (parseResult.success) {
        await stopScanner();
        onScanSuccess(parseResult.data);
        onClose();
      } else {
        setScanError(parseResult.error || 'फोटो में मान्य आधार QR कोड नहीं मिला।');
      }
    } catch (err) {
      setScanError('फोटो से QR पढ़ने में विफलता। कृपया साफ़ फोटो अपलोड करें।');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs font-['Hind'] select-none animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-3.5 bg-slate-800 border-b border-slate-700 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shadow-xs">
              <Camera className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base leading-tight">
                आधार कार्ड QR स्कैनर
              </h3>
              <p className="text-[11px] text-slate-300">
                नाम, जन्मतिथि, आयु, लिंग व पता स्वतः भरने हेतु
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
        <div className="relative bg-black flex-1 flex flex-col items-center justify-center min-h-[300px] overflow-hidden">
          <div id={readerElementId} className="w-full h-full min-h-[300px]" />

          {/* Dummy element for file scan fallback */}
          <div id="aadhaar-file-reader-dummy" className="hidden" />

          {/* Flashlight button */}
          {canToggleTorch && isScanning && (
            <button
              type="button"
              onClick={handleToggleTorch}
              className={`absolute top-3 right-3 p-2.5 rounded-full z-20 backdrop-blur-md transition-all shadow-md ${
                torchOn ? 'bg-amber-400 text-slate-900 ring-2 ring-amber-300' : 'bg-black/50 text-white hover:bg-black/70'
              }`}
              title="टॉर्च / फ्लैशलाइट"
            >
              <Flashlight className="w-4 h-4" />
            </button>
          )}

          {/* Instructions banner */}
          <div className="absolute bottom-2 inset-x-2 bg-slate-950/80 backdrop-blur-md p-2 rounded-xl text-center border border-slate-800 text-white z-10">
            <p className="text-xs font-bold text-amber-300 flex items-center justify-center gap-1.5">
              <span>🎯 आधार कार्ड के QR कोड को कैमरे के चौकोर बॉक्स में रखें</span>
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              कैमरा फोकस होते ही 1 सेकंड में डेटा स्वतः पढ़ लिया जाएगा
            </p>
          </div>
        </div>

        {/* Error Notification */}
        {scanError && (
          <div className="p-3 bg-red-950/90 border-t border-red-800 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{scanError}</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="p-3 bg-slate-800 border-t border-slate-700 flex items-center justify-between gap-2">
          {/* File Upload Fallback */}
          <label className="flex-1 py-2 px-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-98">
            <Upload className="w-3.5 h-3.5" />
            <span>गैलरी से QR फोटो चुनें</span>
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
