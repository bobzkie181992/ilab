import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Settings, 
  Calendar, 
  Clock, 
  Download, 
  Search, 
  LayoutDashboard, 
  ScanLine, 
  History,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Activity,
  MoreVertical,
  ChevronRight,
  QrCode
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { FaceScanner } from './FaceScanner';
import { QRScanner } from './QRScanner';

export const AttendanceView: React.FC = () => {
  const { state, updateAttendanceSchedule } = useAppContext();
  const [activeTab, setActiveTab] = useState<'kiosk' | 'logs' | 'settings'>('kiosk');
  const [scanMode, setScanMode] = useState<'face' | 'qr'>('face');
  const [searchQuery, setSearchQuery] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const todaysLogs = state.attendanceLogs.filter(l => l.date === today);
  const ojtStudents = state.users.filter(u => u.isOJT);

  const stats = [
    { label: 'Total OJTs', value: ojtStudents.length, icon: Users, color: 'text-brand' },
    { label: 'Present Today', value: new Set(todaysLogs.map(l => l.userId)).size, icon: CheckCircle2, color: 'text-emerald-500' },
    { label: 'Lates Today', value: todaysLogs.filter(l => l.status === 'Late').length, icon: AlertCircle, color: 'text-amber-500' },
    { label: 'Avg Attendance', value: '94%', icon: Activity, color: 'text-blue-500' },
  ];

  return (
    <div className="space-y-6">
      {/* View Header Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex bg-slate-100 p-1 rounded-2xl w-fit">
          {[
            { id: 'kiosk', label: 'Scanner', icon: ScanLine },
            { id: 'logs', label: 'Logs & Review', icon: History },
            { id: 'settings', label: 'Schedule', icon: Settings },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab.id 
                  ? 'bg-white text-brand shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-white/40'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 shadow-sm transition-all hover:translate-y-[-1px] active:translate-y-[0px]">
          <Download className="h-4 w-4" />
          <span>Export Summary</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'kiosk' && (
          <motion.div
            key="kiosk"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Scan Mode Toggle */}
            <div className="flex bg-slate-200/50 p-1 rounded-xl w-fit">
              <button
                onClick={() => setScanMode('face')}
                className={`flex items-center space-x-2 px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  scanMode === 'face' ? 'bg-white text-brand shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <ScanLine className="h-3.5 w-3.5" />
                <span>Face ID</span>
              </button>
              <button
                onClick={() => setScanMode('qr')}
                className={`flex items-center space-x-2 px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  scanMode === 'qr' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <QrCode className="h-3.5 w-3.5" />
                <span>QR Code</span>
              </button>
            </div>

            <div className="max-w-6xl mx-auto w-full">
              <Card className="border-none shadow-none bg-transparent">
                {scanMode === 'face' ? <FaceScanner kioskMode={true} /> : <QRScanner kioskMode={true} />}
              </Card>
            </div>
          </motion.div>
        )}

        {activeTab === 'logs' && (
          <motion.div
            key="logs"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            className="space-y-6"
          >
            {/* Quick Stats Banner */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat, i) => (
                <Card key={i}>
                  <CardContent className="p-6 flex items-center space-x-4">
                    <div className={`p-3 rounded-2xl bg-slate-50 border border-slate-100 ${stat.color}`}>
                       <stat.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{stat.label}</p>
                      <p className="text-xl font-black text-slate-900">{stat.value}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-50">
                <CardTitle className="text-lg font-bold">Attendance History</CardTitle>
                <div className="relative w-64">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                   <input 
                    type="text" 
                    placeholder="Search students..." 
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-1 focus:ring-brand focus:border-brand"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                   />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-4">Student</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Timestamp</th>
                        <th className="px-6 py-4">Shift</th>
                        <th className="px-6 py-4">Action</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Verification</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {state.attendanceLogs
                        .filter(l => state.users.find(u => u.id === l.userId)?.name.toLowerCase().includes(searchQuery.toLowerCase()))
                        .slice().reverse().map(log => {
                        const user = state.users.find(u => u.id === log.userId);
                        return (
                          <tr key={log.id} className="group hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-3">
                                <div className="h-8 w-8 rounded-lg overflow-hidden bg-slate-100">
                                  <img src={user?.imageUrl} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-slate-800">{user?.name}</p>
                                  <p className="text-[10px] text-slate-400">{user?.idNumber}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-xs font-medium text-slate-600">{log.date}</td>
                            <td className="px-6 py-4 text-xs font-bold text-slate-700">
                               {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </td>
                            <td className="px-6 py-4">
                               <span className="text-[10px] font-black text-slate-400 px-2 py-0.5 border border-slate-200 rounded">{log.shift}</span>
                            </td>
                            <td className="px-6 py-4">
                               <span className={`text-[10px] font-black ${log.type === 'Time In' ? 'text-indigo-600' : 'text-slate-600'}`}>{log.type}</span>
                            </td>
                            <td className="px-6 py-4">
                               <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                 log.status === 'Present' ? 'bg-emerald-100 text-emerald-700' : 
                                 log.status === 'Late' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                               }`}>
                                 {log.status}
                               </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                               <div className="flex items-center justify-end text-emerald-500">
                                  <CheckCircle2 className="h-4 w-4 mr-1" />
                                  <span className="text-[10px] font-black uppercase">Encrypted</span>
                               </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === 'settings' && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-2xl mx-auto"
          >
            <Card>
              <CardHeader className="border-b border-slate-50">
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 text-brand mr-3" />
                  Attendance Config Manager
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">AM Session</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-2">Time In Deadline</label>
                        <input 
                          type="time" 
                          value={state.attendanceSchedule.amIn}
                          onChange={(e) => updateAttendanceSchedule({ ...state.attendanceSchedule, amIn: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-1 focus:ring-brand"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-2">Logout Start</label>
                        <input 
                          type="time" 
                          value={state.attendanceSchedule.amOut}
                          onChange={(e) => updateAttendanceSchedule({ ...state.attendanceSchedule, amOut: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-1 focus:ring-brand"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">PM Session</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-2">Time In Deadline</label>
                        <input 
                          type="time" 
                          value={state.attendanceSchedule.pmIn}
                          onChange={(e) => updateAttendanceSchedule({ ...state.attendanceSchedule, pmIn: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-1 focus:ring-brand"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-2">Logout Start</label>
                        <input 
                          type="time" 
                          value={state.attendanceSchedule.pmOut}
                          onChange={(e) => updateAttendanceSchedule({ ...state.attendanceSchedule, pmOut: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-1 focus:ring-brand"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-brand/5 border border-brand/10 rounded-2xl flex items-start space-x-4">
                   <AlertCircle className="h-6 w-6 text-brand mt-1" />
                   <div>
                     <p className="text-sm font-black text-slate-800 mb-1">Global Shift Enforcement</p>
                     <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                       System uses atomic server-time synchronization. Modifying these limits will take effect immediately for all active scanner kiosks. Reports generated will use historical limits active at the time of log creation to preserve integrity.
                     </p>
                   </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
