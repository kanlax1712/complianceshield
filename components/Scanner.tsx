
import React, { useEffect, useRef, useState } from 'react';

interface ScannerProps {
  onScan: (base64: string) => void;
  onBarcodeScan: (barcode: string, previewUrl?: string) => void;
  isProcessing: boolean;
  initialMode?: ScanMode;
}

type ScanMode = 'label' | 'barcode';

const createBarcodeDetector = () => {
  const DetectorClass = (window as any).BarcodeDetector;
  if (!DetectorClass) return null;
  try {
    return new DetectorClass({ formats: ['qr_code', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'] });
  } catch {
    return null;
  }
};

export const Scanner: React.FC<ScannerProps> = ({ onScan, onBarcodeScan, isProcessing, initialMode }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scanTimerRef = useRef<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState<ScanMode>(initialMode || 'label');
  const [barcodeStatus, setBarcodeStatus] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStatus, setCameraStatus] = useState<'unknown' | 'ready' | 'blocked' | 'unsupported'>('unknown');

  const isBarcodeDetectorSupported = () => Boolean((window as any).BarcodeDetector);
  const isCameraSupported = () => Boolean(navigator.mediaDevices?.getUserMedia);

  useEffect(() => {
    if (initialMode) {
      setScanMode(initialMode);
    }
  }, [initialMode]);

  useEffect(() => {
    if (scanMode === 'barcode') {
      if (!isBarcodeDetectorSupported() || !isCameraSupported()) {
        setCameraStatus('unsupported');
      } else if (cameraStatus === 'unknown') {
        setCameraStatus('ready');
      }
    }
  }, [scanMode]);

  useEffect(() => {
    return () => {
      if (scanTimerRef.current) {
        window.clearInterval(scanTimerRef.current);
      }
      stopCamera();
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        setPreviewUrl(reader.result as string);
        onScan(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBarcodeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const preview = reader.result as string;
      setPreviewUrl(preview);
      try {
        const barcode = await detectBarcodeFromImage(preview);
        if (!barcode) {
          setBarcodeStatus("No barcode detected. Try a clearer image.");
          return;
        }
        setBarcodeStatus(null);
        onBarcodeScan(barcode, preview);
      } catch (err: any) {
        setBarcodeStatus(err.message || "Failed to scan barcode.");
      }
    };
    reader.readAsDataURL(file);
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const triggerBarcodeUpload = () => {
    barcodeInputRef.current?.click();
  };

  const detectBarcodeFromImage = async (dataUrl: string) => {
    const detector = createBarcodeDetector();
    if (!detector) {
      throw new Error("Barcode scanning is not supported in this browser.");
    }
    const image = await loadImageElement(dataUrl);
    const results = await detector.detect(image);
    if (!results || results.length === 0) return null;
    return results[0].rawValue || null;
  };

  const loadImageElement = (dataUrl: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Could not read image."));
      img.src = dataUrl;
    });

  const startCameraScan = async () => {
    setBarcodeStatus(null);
    const detector = createBarcodeDetector();
    if (!detector) {
      setBarcodeStatus("Barcode scanning is not supported in this browser.");
      setCameraStatus('unsupported');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraActive(true);
        setCameraStatus('ready');
      }
      scanTimerRef.current = window.setInterval(async () => {
        if (!videoRef.current) return;
        try {
          const results = await detector.detect(videoRef.current);
          if (results && results.length > 0) {
            const value = results[0].rawValue;
            if (value) {
              stopCamera();
              onBarcodeScan(value);
            }
          }
        } catch {
          // ignore transient scan errors
        }
      }, 700);
    } catch (err: any) {
      setBarcodeStatus(err.message || "Unable to access camera.");
      setCameraStatus('blocked');
    }
  };

  const stopCamera = () => {
    if (scanTimerRef.current) {
      window.clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  return (
    <div className="w-full max-w-xl mx-auto p-6 surface rounded-3xl shadow-xl border border-white/10">
      <div className="flex flex-col items-center gap-6">
        <div className="w-full grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              setScanMode('label');
              setBarcodeStatus(null);
              setPreviewUrl(null);
              stopCamera();
            }}
            className={`glass-button py-3 rounded-2xl text-xs font-bold border flex items-center justify-center gap-2 ${
              scanMode === 'label' ? 'bg-cyan-300 text-slate-900 border-cyan-300' : 'bg-white/10 text-white/70 border-white/10'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Image Upload
          </button>
          <button
            onClick={() => {
              setScanMode('barcode');
              setBarcodeStatus(null);
              setPreviewUrl(null);
            }}
            className={`glass-button py-3 rounded-2xl text-xs font-bold border flex items-center justify-center gap-2 ${
              scanMode === 'barcode' ? 'bg-cyan-300 text-slate-900 border-cyan-300' : 'bg-white/10 text-white/70 border-white/10'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7h2v10H3M7 7v10m4-10v10m4-10v10m4-10h2v10h-2" />
            </svg>
            Barcode Scanner
          </button>
        </div>

        {scanMode === 'label' ? (
          <>
            <div 
              className="relative w-full aspect-video rounded-2xl bg-white/10 flex items-center justify-center border-2 border-dashed border-white/20 overflow-hidden group cursor-pointer hover:border-white/40 transition-colors"
              onClick={triggerUpload}
            >
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center text-white/60">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="font-medium">Capture or Upload Product Label</p>
                  <p className="text-xs">Supports JPG, PNG</p>
                </div>
              )}
              
              {isProcessing && (
                <div className="absolute inset-0 bg-[#062034]/70 backdrop-blur-sm flex flex-col items-center justify-center animate-pulse">
                  <div className="w-10 h-10 border-4 border-cyan-200 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-white/80 font-bold tracking-wider">AI AUDITING IN PROGRESS...</p>
                </div>
              )}
            </div>

            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
              capture="environment"
            />

            <div className="w-full flex gap-3">
              <button
                onClick={triggerUpload}
                disabled={isProcessing}
                className="glass-button flex-1 bg-cyan-300 hover:bg-cyan-200 text-slate-900 font-semibold py-4 px-6 rounded-2xl transition-all shadow-lg shadow-cyan-500/30 active:scale-95 flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                Select Item Label
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="relative w-full aspect-video rounded-2xl bg-white/10 border-2 border-dashed border-white/20 overflow-hidden">
              {isCameraActive ? (
                <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
              ) : previewUrl ? (
                <img src={previewUrl} alt="Barcode Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-white/60">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7h2v10H3M7 7v10m4-10v10m4-10v10m4-10h2v10h-2" />
                  </svg>
                  <p className="font-medium">Scan or Upload Barcode</p>
                  <p className="text-xs">Tap Scan with Camera to activate</p>
                </div>
              )}

              {isProcessing && (
                <div className="absolute inset-0 bg-[#062034]/70 backdrop-blur-sm flex flex-col items-center justify-center animate-pulse">
                  <div className="w-10 h-10 border-4 border-cyan-200 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-white/80 font-bold tracking-wider">FETCHING PRODUCT DATA...</p>
                </div>
              )}
            </div>

            <input 
              type="file" 
              ref={barcodeInputRef}
              onChange={handleBarcodeFileChange}
              accept="image/*"
              className="hidden"
              capture="environment"
            />

            {barcodeStatus && (
              <div className="w-full text-center text-xs font-bold text-amber-200 bg-amber-500/20 border border-amber-400/40 rounded-xl py-2">
                {barcodeStatus}
              </div>
            )}

            <div className="w-full grid grid-cols-2 gap-3">
              <button
                onClick={isCameraActive ? stopCamera : startCameraScan}
                disabled={isProcessing || cameraStatus === 'unsupported'}
                className={`glass-button border font-bold py-4 rounded-2xl text-xs ${
                  cameraStatus === 'unsupported'
                    ? 'bg-white/5 border-white/10 text-white/30'
                    : 'bg-white/10 border-white/10 text-white/80'
                }`}
              >
                {isCameraActive ? "Stop Camera" : "Scan with Camera"}
              </button>
              <button
                onClick={triggerBarcodeUpload}
                disabled={isProcessing}
                className="glass-button bg-cyan-300 hover:bg-cyan-200 text-slate-900 font-semibold py-4 px-6 rounded-2xl transition-all shadow-lg shadow-cyan-500/30 active:scale-95 flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                Upload Barcode Image
              </button>
            </div>
            <div className="w-full text-center text-[10px] font-bold uppercase tracking-widest text-white/60">
              {cameraStatus === 'unsupported'
                ? "Camera not available in this browser"
                : cameraStatus === 'blocked'
                ? "Camera blocked. Allow access in browser"
                : "Camera ready when you start scan"}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
