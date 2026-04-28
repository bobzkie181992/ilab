import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Printer, X } from 'lucide-react';
import { toast } from 'sonner';

interface QRCodeDisplayProps {
  value: string;
  label: string;
  subLabel?: string;
  onClose?: () => void;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ value, label, subLabel, onClose }) => {
  const qrRef = useRef<HTMLDivElement>(null);

  const downloadQR = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width + 40;
      canvas.height = img.height + 100;
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 20, 20);
        
        ctx.fillStyle = 'black';
        ctx.font = 'bold 16px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(label, canvas.width / 2, img.height + 50);
        
        if (subLabel) {
          ctx.font = '12px Inter, sans-serif';
          ctx.fillStyle = '#64748b';
          ctx.fillText(subLabel, canvas.width / 2, img.height + 70);
        }
      }

      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `QR_${value}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
      toast.success('QR Code downloaded successfully');
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const printQR = () => {
    window.print();
  };

  return (
    <div className="flex flex-col items-center p-6 bg-white rounded-2xl shadow-xl max-w-xs mx-auto border border-slate-100">
      <div className="w-full flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-slate-800">QR Code Identification</h3>
        {onClose && (
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
            <X className="h-4 w-4 text-slate-400" />
          </button>
        )}
      </div>
      
      <div ref={qrRef} className="bg-slate-50 p-4 rounded-xl mb-4">
        <QRCodeSVG 
          value={value} 
          size={200}
          level="H"
          includeMargin={true}
        />
      </div>
      
      <div className="text-center mb-6">
        <p className="text-lg font-bold text-slate-900">{label}</p>
        <p className="text-xs text-slate-500 font-mono mt-1 uppercase tracking-widest">{value}</p>
        {subLabel && <p className="text-xs text-slate-400 mt-1">{subLabel}</p>}
      </div>
      
      <div className="flex w-full gap-2">
        <button 
          onClick={downloadQR}
          className="flex-1 flex items-center justify-center space-x-2 bg-slate-900 text-white py-2 rounded-lg text-xs font-bold hover:bg-slate-800 transition-all active:scale-95"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Download</span>
        </button>
        <button 
          onClick={printQR}
          className="flex items-center justify-center bg-slate-100 text-slate-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-200 transition-all active:scale-95"
        >
          <Printer className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
