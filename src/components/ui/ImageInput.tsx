import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, Upload, X } from 'lucide-react';

interface ImageInputProps {
  value?: string;
  onChange: (value: string) => void;
}

export const ImageInput: React.FC<ImageInputProps> = ({ value, onChange }) => {
  const [mode, setMode] = useState<'view' | 'camera' | 'upload'>('view');
  const webcamRef = useRef<Webcam>(null);

  const handleCapture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        onChange(imageSrc);
        setMode('view');
      }
    }
  }, [webcamRef, onChange]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange(reader.result as string);
        setMode('view');
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-4">
        {value ? (
          <div className="relative h-24 w-24 rounded-full overflow-hidden border-2 border-slate-200">
            <img src={value} alt="Profile" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 m-1 hover:bg-red-600 focus:outline-none"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="h-24 w-24 rounded-full bg-slate-100 flex items-center justify-center border-2 border-dashed border-slate-300">
            <UserIcon className="w-8 h-8 text-slate-400" />
          </div>
        )}

        <div className="flex flex-col space-y-2">
          <button
            type="button"
            onClick={() => setMode('camera')}
            className="flex items-center space-x-2 px-3 py-1.5 bg-slate-100 text-slate-700 text-sm rounded-lg hover:bg-slate-200"
          >
            <Camera className="w-4 h-4" />
            <span>Take Photo</span>
          </button>
          
          <label className="flex items-center space-x-2 px-3 py-1.5 bg-slate-100 text-slate-700 text-sm rounded-lg hover:bg-slate-200 cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Upload Image</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </label>
        </div>
      </div>

      {mode === 'camera' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4">
          <div className="bg-white rounded-xl shadow-xl overflow-hidden w-full max-w-md flex flex-col">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold">Capture Photo</h3>
              <button type="button" onClick={() => setMode('view')}><X className="w-5 h-5" /></button>
            </div>
            <div className="relative aspect-video bg-black">
              {/* @ts-ignore */}
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{ facingMode: 'user' }}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4 text-center">
              <button
                type="button"
                onClick={handleCapture}
                className="bg-brand text-white px-6 py-2 rounded-full font-bold shadow-md hover:bg-brand/90"
              >
                Capture
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const UserIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
