import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { ScanLine, LogIn, LogOut, CheckCircle, AlertCircle } from 'lucide-react';

export const ScannerView: React.FC = () => {
  const { checkoutEquipment, returnEquipment } = useAppContext();
  const [mode, setMode] = useState<'checkout' | 'return'>('checkout');

  const [equipmentQr, setEquipmentQr] = useState('EQ-MAC-01');
  const [borrowerQr, setBorrowerQr] = useState('STU-001');
  const [returnCondition, setReturnCondition] = useState<'Good' | 'Fair' | 'Damaged'>('Good');
  
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    const res = checkoutEquipment(equipmentQr, borrowerQr);
    setResult(res);
  };

  const handleReturn = (e: React.FormEvent) => {
    e.preventDefault();
    const res = returnEquipment(equipmentQr, returnCondition);
    setResult(res);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand/10 text-brand">
            <ScanLine size={32} />
          </div>
          <CardTitle className="text-2xl text-lab-text">Smart QR Scanner</CardTitle>
          <p className="mt-2 text-sm text-slate-500">
            Simulate scanning QR codes to check equipment in or out.
          </p>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex rounded-lg bg-slate-100 p-1">
            <button
              onClick={() => { setMode('checkout'); setResult(null); }}
              className={`flex flex-1 items-center justify-center rounded-md py-2.5 text-sm font-medium transition-all ${
                mode === 'checkout'
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Check Out
            </button>
            <button
              onClick={() => { setMode('return'); setResult(null); }}
              className={`flex flex-1 items-center justify-center rounded-md py-2.5 text-sm font-medium transition-all ${
                mode === 'return'
                  ? 'bg-white text-slate-950 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LogIn className="mr-2 h-4 w-4" />
              Return
            </button>
          </div>

          <form onSubmit={mode === 'checkout' ? handleCheckout : handleReturn} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Equipment QR</label>
              <input
                type="text"
                value={equipmentQr}
                onChange={(e) => setEquipmentQr(e.target.value)}
                placeholder="e.g. EQ-MAC-01"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                required
              />
              <p className="text-xs text-slate-500">Test codes: EQ-MAC-01 (Avail), EQ-MAC-02 (Borrowed)</p>
            </div>

            {mode === 'checkout' && (
              <div className="space-y-2 pb-2">
                <label className="text-sm font-medium text-slate-700">Borrower QR</label>
                <input
                  type="text"
                  value={borrowerQr}
                  onChange={(e) => setBorrowerQr(e.target.value)}
                  placeholder="e.g. STU-001"
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  required
                />
                 <p className="text-xs text-slate-500">Test codes: STU-001, FAC-001, STF-001</p>
              </div>
            )}

            {mode === 'return' && (
              <div className="space-y-2 pb-2">
                <label className="text-sm font-medium text-slate-700">Return Condition</label>
                <select
                  value={returnCondition}
                  onChange={(e) => setReturnCondition(e.target.value as 'Good' | 'Fair' | 'Damaged')}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                >
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Damaged">Damaged</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              className="mt-4 w-full rounded-md bg-brand py-2.5 text-sm font-semibold text-white shadow hover:bg-brand/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand block text-center"
            >
              {mode === 'checkout' ? 'Process Check Out' : 'Process Return'}
            </button>
          </form>

          {result && (
            <div className={`mt-6 rounded-md p-4 ${result.success ? 'bg-emerald-50' : 'bg-red-50'}`}>
              <div className="flex">
                <div className="shrink-0">
                  {result.success ? (
                    <CheckCircle className="h-5 w-5 text-emerald-400" aria-hidden="true" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                  )}
                </div>
                <div className="ml-3">
                  <h3 className={`text-sm font-medium ${result.success ? 'text-emerald-800' : 'text-red-800'}`}>
                    {result.success ? 'Transaction Successful' : 'Transaction Failed'}
                  </h3>
                  <div className={`mt-2 text-sm ${result.success ? 'text-emerald-700' : 'text-red-700'}`}>
                    <p>{result.message}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
