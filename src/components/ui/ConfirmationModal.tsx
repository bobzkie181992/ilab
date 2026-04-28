import React from 'react';
import { Card, CardContent } from './Card';
import { AlertCircle, LogOut } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
  icon?: 'alert' | 'logout';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'warning',
  icon = 'alert'
}) => {
  if (!isOpen) return null;

  const variantClasses = {
    danger: 'bg-red-600 hover:bg-red-700',
    warning: 'bg-brand hover:bg-brand/90',
    info: 'bg-blue-600 hover:bg-blue-700'
  };

  const iconClasses = {
    danger: 'text-red-600 bg-red-50',
    warning: 'text-amber-600 bg-amber-50',
    info: 'text-blue-600 bg-blue-50'
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className={`p-3 rounded-full shrink-0 ${iconClasses[variant]}`}>
              {icon === 'logout' ? (
                <LogOut className="h-6 w-6" />
              ) : (
                <AlertCircle className="h-6 w-6" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-900 mb-1">{title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">{message}</p>
              
              <div className="flex space-x-3">
                <button
                  onClick={onCancel}
                  className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  {cancelLabel}
                </button>
                <button
                  onClick={onConfirm}
                  className={`flex-1 px-4 py-2 text-sm font-bold text-white rounded-lg transition-colors ${variantClasses[variant]}`}
                >
                  {confirmLabel}
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
