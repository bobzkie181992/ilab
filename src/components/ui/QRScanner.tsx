import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onError?: (errorMessage: string) => void;
  onClose: () => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScan, onError, onClose }) => {
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isClosingRef = useRef(false);
  const isStartingRef = useRef(false);
  const onScanRef = useRef(onScan);
  const onErrorRef = useRef(onError);
  const onCloseRef = useRef(onClose);
  const qrRegionId = React.useId().replace(/:/g, ''); // Generate unique ID
  const [isStarted, setIsStarted] = useState(false);

  // Keep refs up-to-date to avoid scanner restart
  useEffect(() => {
    onScanRef.current = onScan;
    onErrorRef.current = onError;
    onCloseRef.current = onClose;
  }, [onScan, onError, onClose]);

  const handleClose = () => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      html5QrCodeRef.current.stop().then(() => {
        html5QrCodeRef.current?.clear();
        onCloseRef.current();
      }).catch((err) => {
        console.error("Error stopping scanner", err);
        onCloseRef.current();
      });
    } else {
      onCloseRef.current();
    }
  };

  useEffect(() => {
    if (!scannerRef.current) return;
    if (!isStarted) return;
    if (isStartingRef.current) return; // Prevent double initialization in strict mode

    let ignore = false;
    isStartingRef.current = true;
    
    // We clear the container first to prevent duplicate video elements if the previous cleanup didn't finish.
    scannerRef.current.innerHTML = '';
    
    const html5QrCode = new Html5Qrcode(`qr-reader-${qrRegionId}`);
    html5QrCodeRef.current = html5QrCode;

    const startScanner = async () => {
      try {
        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 }
          },
          (decodedText) => {
            if (ignore || isClosingRef.current) return;
            isClosingRef.current = true; // Prevent multiple scans
            onScanRef.current(decodedText);
            html5QrCode.stop().then(() => {
              html5QrCode.clear();
              onCloseRef.current();
            }).catch(err => {
              console.error(err);
              onCloseRef.current();
            });
          },
          (errorMessage) => {
            if (ignore || isClosingRef.current) return;
            if (errorMessage?.includes("NotFoundException")) return; // Ignore standard scan mismatch errors
            if (onErrorRef.current) onErrorRef.current(errorMessage);
          }
        );

        // If the component unmounted while we were starting the camera, stop it immediately.
        if (ignore || isClosingRef.current) {
          await html5QrCode.stop();
          html5QrCode.clear();
          if (scannerRef.current) scannerRef.current.innerHTML = '';
        }
      } catch (err: any) {
        if (!ignore && !isClosingRef.current) {
          console.error("Failed to start scanner:", err);
          if (onErrorRef.current) onErrorRef.current(err?.message || "Failed to start scanner");
        }
      }
    };

    startScanner();

    return () => {
      ignore = true;
      isStartingRef.current = false;
      if (html5QrCode.isScanning) {
        html5QrCode.stop().then(() => {
          html5QrCode.clear();
          if (scannerRef.current) scannerRef.current.innerHTML = '';
        }).catch(console.error);
      } else {
        html5QrCode.clear();
        if (scannerRef.current) scannerRef.current.innerHTML = '';
      }
    };
  }, [qrRegionId, isStarted]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-4 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">Scan QR Code</h3>
          <button onClick={handleClose} className="rounded-full bg-slate-100 p-1 hover:bg-slate-200">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x text-slate-500"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
        <div id={`qr-reader-${qrRegionId}`} ref={scannerRef} className="relative overflow-hidden rounded-lg bg-black min-h-[250px] flex items-center justify-center">
          {!isStarted && (
            <button 
              onClick={() => setIsStarted(true)} 
              className="rounded-md bg-brand px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              Start Camera
            </button>
          )}
        </div>
        <p className="mt-4 text-center text-sm text-slate-500">Point your camera at the QR code</p>
      </div>
    </div>
  );
};

