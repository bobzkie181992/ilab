import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card, CardContent } from '../ui/Card';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Edit2, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Info,
  Layers
} from 'lucide-react';
import { Facility, FacilityBooking } from '../../types';
import { FacilityForm } from './FacilityForm';
import { ConfirmationModal } from '../ui/ConfirmationModal';
import { QRCodeSVG } from 'qrcode.react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval,
  isWithinInterval,
  parseISO,
} from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

export const BookingsView: React.FC = () => {
  const { state, addBooking, cancelBooking, approveBooking, rejectBooking, completeBooking, addFacility, updateFacility, deleteFacility } = useAppContext();
  const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarFacilityId, setCalendarFacilityId] = useState<string>('');

  // Drag states
  const [dragStart, setDragStart] = useState<Date | null>(null);
  const [dragEnd, setDragEnd] = useState<Date | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [bookingPurpose, setBookingPurpose] = useState('');
  const [bookingDate, setBookingDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDateValue, setEndDateValue] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:00');

  const [isFacilityFormOpen, setIsFacilityFormOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState<Facility | undefined>(undefined);
  const [locationFilter, setLocationFilter] = useState('All');

  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    variant: 'warning' as 'danger' | 'warning' | 'info'
  });

  const isDean = state.currentUser?.position === 'Dean';
  const isAdmin = state.currentUser?.role === 'Admin';

  const handleSaveFacility = (facilityData: Omit<Facility, 'id'>) => {
    const actionLabel = editingFacility ? 'Update' : 'Add';
    setConfirmConfig({
      isOpen: true,
      title: `${actionLabel} Facility`,
      message: `Do you want to ${actionLabel.toLowerCase()} the facility "${facilityData.name}"?`,
      variant: 'info',
      onConfirm: () => {
        if (editingFacility) {
          updateFacility(editingFacility.id, facilityData);
        } else {
          addFacility(facilityData);
        }
        setIsFacilityFormOpen(false);
        setEditingFacility(undefined);
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleDeleteFacility = (id: string, name: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Facility',
      message: `Are you sure you want to delete "${name}"? This will also remove all associated active bookings.`,
      variant: 'danger',
      onConfirm: () => {
        deleteFacility(id);
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleEditFacility = (facility: Facility) => {
    setEditingFacility(facility);
    setIsFacilityFormOpen(true);
  };

  const handleBook = (facility: Facility, date?: Date, endD?: Date) => {
    setSelectedFacility(facility);
    if (date) {
      setBookingDate(format(date, 'yyyy-MM-dd'));
      setEndDateValue(format(endD || date, 'yyyy-MM-dd'));
    }
    setIsBookingModalOpen(true);
  };

  const confirmBooking = () => {
    if (!selectedFacility || !state.currentUser) return;

    const startStr = `${bookingDate}T${startTime}:00`;
    const endStr = `${endDateValue}T${endTime}:00`;
    
    const startObj = new Date(startStr);
    const endObj = new Date(endStr);

    if (endObj <= startObj) {
      toast.error('End date/time must be after start date/time.');
      return;
    }

    // Client-side conflict check for better UI feedback
    const hasConflict = state.bookings.some(b => {
      if (b.facilityId !== selectedFacility.id || (b.status !== 'Confirmed' && b.status !== 'Pending Approval')) return false;
      const bStart = new Date(b.startTime).getTime();
      const bEnd = new Date(b.endTime).getTime();
      return (startObj.getTime() < bEnd && endObj.getTime() > bStart);
    });

    setConfirmConfig({
      isOpen: true,
      title: 'Confirm Reservation',
      message: hasConflict 
        ? `The facility is already booked for this time range. Would you like to join the QUEUE for ${selectedFacility.name}?` 
        : `Do you want to book ${selectedFacility.name} from ${format(startObj, 'PPp')} to ${format(endObj, 'PPp')}?`,
      variant: hasConflict ? 'warning' : 'info',
      onConfirm: () => {
        addBooking({
          facilityId: selectedFacility.id,
          userId: state.currentUser!.id,
          startTime: startObj.toISOString(),
          endTime: endObj.toISOString(),
          purpose: bookingPurpose || 'Laboratory Work'
        });

        setIsBookingModalOpen(false);
        setSelectedFacility(null);
        setBookingPurpose('');
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Drag handlers
  const onDateMouseDown = (day: Date) => {
    setDragStart(day);
    setDragEnd(day);
    setIsDragging(true);
    setSelectedDate(day);
  };

  const onDateMouseEnter = (day: Date) => {
    if (isDragging) {
      setDragEnd(day);
    }
  };

  const onDateMouseUp = () => {
    if (isDragging && dragStart && dragEnd) {
      const start = dragStart < dragEnd ? dragStart : dragEnd;
      const end = dragStart < dragEnd ? dragEnd : dragStart;
      
      const targetFacility = state.facilities.find(f => f.id === calendarFacilityId) || state.facilities[0];
      
      if (targetFacility) {
        handleBook(targetFacility, start, end);
      } else {
        toast.error('No facilities available.');
      }
    }
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  };

  // Calendar Logic
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const bookingsForSelectedDate = useMemo(() => {
    return state.bookings.filter(b => 
      isSameDay(parseISO(b.startTime), selectedDate) && 
      (b.status === 'Confirmed' || b.status === 'Pending Approval' || b.status === 'Queued') &&
      (!calendarFacilityId || b.facilityId === calendarFacilityId)
    ).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [state.bookings, selectedDate, calendarFacilityId]);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Facility</h2>
          <p className="text-sm text-slate-500">Reserve laboratory zones, simulation rooms, and PC stations.</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button 
              onClick={() => setViewMode('grid')}
              className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-md transition-all",
                viewMode === 'grid' ? "bg-white text-brand shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              Grid View
            </button>
            <button 
              onClick={() => setViewMode('calendar')}
              className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-md transition-all",
                viewMode === 'calendar' ? "bg-white text-brand shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              Calendar
            </button>
          </div>
          {isAdmin && (
            <button
              onClick={() => setIsFacilityFormOpen(true)}
              className="flex items-center justify-center rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-brand/90 transition-all active:scale-95 whitespace-nowrap"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Facility
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-6">
          <AnimatePresence mode="wait">
            {viewMode === 'grid' ? (
              <motion.div
                key="grid"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center space-x-2">
                    <MapPin className="h-5 w-5 text-brand" />
                    <span>Available Facilities</span>
                  </h3>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Filter:</span>
                    <select 
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      className="text-[10px] font-bold text-slate-600 bg-white border border-slate-200 rounded px-2 py-1 outline-none focus:border-brand"
                    >
                      <option value="All">All Locations</option>
                      {Array.from(new Set(state.facilities.map(f => f.location))).filter(Boolean).map(loc => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {state.facilities
                    .filter(facility => locationFilter === 'All' || facility.location === locationFilter)
                    .map(facility => {
                      const activeBooking = state.bookings.find(b => 
                        b.facilityId === facility.id && 
                        (b.status === 'Confirmed' || b.status === 'Pending Approval') && 
                        isWithinInterval(new Date(), { start: parseISO(b.startTime), end: parseISO(b.endTime) })
                      );
                      const isOccupied = !!activeBooking;
                      
                      return (
                        <Card key={facility.id} className={`${isOccupied ? 'ring-2 ring-amber-500/20' : ''} group relative overflow-hidden transition-all hover:shadow-md`}>
                          {isAdmin && (
                            <div className="absolute top-2 right-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleEditFacility(facility); }}
                                className="p-2 rounded-full bg-white/90 shadow-sm text-slate-400 hover:text-brand hover:bg-white transition-all scale-90 hover:scale-100"
                                title="Edit Facility"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteFacility(facility.id, facility.name); }}
                                className="p-2 rounded-full bg-white/90 shadow-sm text-slate-400 hover:text-red-500 hover:bg-white transition-all scale-90 hover:scale-100"
                                title="Delete Facility"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                          <CardContent className="p-5">
                            <div className="flex justify-between items-start mb-3">
                              <span className={cn(
                                "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                                facility.type === 'Room' ? 'bg-purple-100 text-purple-700' :
                                facility.type === 'Zone' ? 'bg-blue-100 text-blue-700' :
                                'bg-emerald-100 text-emerald-700'
                              )}>
                                {facility.type}
                              </span>
                              <div className="flex flex-col items-end">
                                {isOccupied ? (
                                  <span className="text-[10px] font-bold text-amber-600 flex items-center bg-amber-50 px-2 py-0.5 rounded-full">
                                    <XCircle className="w-3 h-3 mr-1" /> BUSY UNTIL {format(parseISO(activeBooking.endTime), 'p')}
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold text-emerald-600 flex items-center bg-emerald-50 px-2 py-0.5 rounded-full">
                                    <CheckCircle2 className="w-3 h-3 mr-1" /> AVAILABLE
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h4 className="font-bold text-slate-900 mb-1">{facility.name}</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{facility.location}</p>
                              </div>
                              <div className="bg-white p-1 rounded-lg border border-slate-100 shadow-sm">
                                <QRCodeSVG value={facility.qrCode} size={40} />
                              </div>
                            </div>

                            {facility.description && (
                              <p className="text-[11px] text-slate-500 leading-relaxed mb-4 line-clamp-2 italic">
                                {facility.description}
                              </p>
                            )}

                            <div className="flex items-center space-x-4 mb-4 text-[10px] font-bold text-slate-500">
                              <div className="flex items-center">
                                <Plus className="w-3 h-3 mr-1 text-slate-300" />
                                <span>Max: {facility.capacity}</span>
                              </div>
                              {facility.amenities && facility.amenities.length > 0 && (
                                <div className="flex items-center">
                                  <Layers className="w-3 h-3 mr-1 text-slate-300" />
                                  <span className="truncate max-w-[150px]">{facility.amenities.join(', ')}</span>
                                </div>
                              )}
                            </div>
                            
                            <button
                              onClick={() => handleBook(facility)}
                              className={cn(
                                "w-full rounded-lg py-2.5 text-xs font-bold transition-all shadow-sm active:scale-[0.98]",
                                isOccupied ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "bg-brand hover:bg-brand/90 text-white"
                              )}
                            >
                              {isOccupied ? 'Queue to Use' : 'Book Facility'}
                            </button>
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="calendar"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
              >
                {/* Calendar Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50 gap-4">
                  <div className="flex items-center space-x-4">
                    <h3 className="text-lg font-bold text-slate-900">{format(currentDate, 'MMMM yyyy')}</h3>
                    <div className="flex bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
                      <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-1 hover:bg-slate-50 rounded text-slate-500"><ChevronLeft className="w-4 h-4" /></button>
                      <button onClick={() => setCurrentDate(new Date())} className="px-2 py-1 text-[10px] font-black uppercase text-slate-400 hover:text-brand">Today</button>
                      <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-1 hover:bg-slate-50 rounded text-slate-500"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Select Facility:</span>
                    <select
                      value={calendarFacilityId}
                      onChange={(e) => setCalendarFacilityId(e.target.value)}
                      className="text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-brand shadow-sm min-w-[180px]"
                    >
                      <option value="">All Facilities</option>
                      {state.facilities.map(f => (
                        <option key={f.id} value={f.id}>{f.name} ({f.location})</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="hidden xl:flex items-center space-x-4">
                    <div className="flex items-center space-x-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                      <span className="text-[10px] font-black uppercase text-slate-400">Confirmed</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                      <span className="text-[10px] font-black uppercase text-slate-400">Pending</span>
                    </div>
                  </div>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 border-b border-slate-100">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="py-2 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest bg-white">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 border-l border-slate-100" onMouseLeave={() => { if(isDragging) onDateMouseUp(); }}>
                  {days.map((day, i) => {
                    const isSelected = isSameDay(day, selectedDate);
                    const isToday = isSameDay(day, new Date());
                    const isCurrentMonth = isSameMonth(day, monthStart);
                    
                    const dayBookings = state.bookings.filter(b => 
                      isSameDay(parseISO(b.startTime), day) && 
                      (b.status === 'Confirmed' || b.status === 'Pending Approval' || b.status === 'Queued') &&
                      (!calendarFacilityId || b.facilityId === calendarFacilityId)
                    );

                    const isInDragRange = dragStart && dragEnd && (
                      (day >= dragStart && day <= dragEnd) || (day <= dragStart && day >= dragEnd)
                    );

                    return (
                      <div 
                        key={day.toString()} 
                        onMouseDown={() => onDateMouseDown(day)}
                        onMouseEnter={() => onDateMouseEnter(day)}
                        onMouseUp={onDateMouseUp}
                        className={cn(
                          "min-h-[100px] p-2 border-r border-b border-slate-100 cursor-pointer transition-all select-none",
                          !isCurrentMonth && "bg-slate-50/30 opacity-40",
                          isSelected && !isInDragRange && "bg-brand/5 ring-1 ring-inset ring-brand/20 shadow-inner",
                          isInDragRange && "bg-brand/20 ring-1 ring-inset ring-brand/40 shadow-sm",
                          !isSelected && !isInDragRange && "hover:bg-slate-50"
                        )}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className={cn(
                            "text-[11px] font-bold",
                            isSelected ? "text-brand" : "text-slate-600",
                            isToday && !isSelected && "w-6 h-6 flex items-center justify-center bg-brand text-white rounded-full"
                          )}>
                            {format(day, 'd')}
                          </span>
                        </div>
                        
                        <div className="space-y-1 overflow-hidden">
                          {dayBookings.slice(0, 3).map(b => (
                            <div 
                              key={b.id}
                              className={cn(
                                "text-[9px] px-1.5 py-0.5 rounded truncate font-medium",
                                b.status === 'Confirmed' ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                                b.status === 'Queued' ? "bg-indigo-50 text-indigo-700 border border-indigo-100" :
                                "bg-amber-50 text-amber-700 border border-amber-100"
                              )}
                            >
                              {format(parseISO(b.startTime), 'p')} {state.facilities.find(f => f.id === b.facilityId)?.name}
                            </div>
                          ))}
                          {dayBookings.length > 3 && (
                            <div className="text-[8px] font-bold text-slate-400 pl-1 uppercase tracking-tighter">
                              + {dayBookings.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar Panel */}
        <div className="lg:col-span-4 space-y-6">
          {viewMode === 'calendar' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm border-t-4 border-t-brand">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-sm font-bold text-slate-900">Bookings for <span className="text-brand">{format(selectedDate, 'MMM d, yyyy')}</span></h4>
                  <div className="p-2 rounded-full bg-slate-50">
                    <CalendarIcon className="w-4 h-4 text-brand" />
                  </div>
                </div>

                <div className="space-y-3">
                  {bookingsForSelectedDate.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-xs text-slate-400 italic">No bookings on this day.</p>
                      <button 
                        onClick={() => {
                          const targetFacility = state.facilities.find(f => f.id === calendarFacilityId) || state.facilities[0];
                          if (targetFacility) {
                            handleBook(targetFacility, selectedDate);
                          } else {
                            toast.error('No facilities available.');
                          }
                        }}
                        className="mt-4 text-[10px] font-black uppercase text-brand hover:underline tracking-widest"
                      >
                        + Book a Facility
                      </button>
                    </div>
                  ) : (
                    bookingsForSelectedDate.map(booking => {
                      const facility = state.facilities.find(f => f.id === booking.facilityId);
                      const user = state.users.find(u => u.id === booking.userId);
                      return (
                        <div key={booking.id} className="group border border-slate-100 rounded-xl p-3 hover:border-slate-200 transition-all hover:bg-slate-50">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{facility?.name}</span>
                            <span className={cn(
                              "text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded",
                              booking.status === 'Confirmed' ? "bg-emerald-100 text-emerald-700" :
                              booking.status === 'Queued' ? "bg-indigo-100 text-indigo-700" :
                              "bg-amber-100 text-amber-700"
                            )}>{booking.status}</span>
                          </div>
                          <div className="flex items-center text-[10px] font-bold text-slate-500 space-x-3">
                            <div className="flex items-center">
                              <Clock className="w-3 h-3 mr-1 text-slate-400" />
                              {format(parseISO(booking.startTime), 'p')} - {format(parseISO(booking.endTime), 'p')}
                            </div>
                            <div className="text-brand/70">
                              By {user?.name.split(' ')[0]}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </motion.div>
          )}

          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Status</h4>
            <div className="space-y-4">
              {/* Pending Approvals (Dean Only) */}
              {isDean && state.bookings.filter(b => b.status === 'Pending Approval' || b.status === 'Queued').length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 px-2 py-1 rounded w-fit">Needs Approval</h4>
                  {state.bookings.filter(b => b.status === 'Pending Approval' || b.status === 'Queued').map(booking => {
                    const facility = state.facilities.find(f => f.id === booking.facilityId);
                    const user = state.users.find(u => u.id === booking.userId);
                    return (
                      <Card key={booking.id} className={`border-l-4 ${booking.status === 'Queued' ? 'border-l-indigo-500' : 'border-l-amber-500'} shadow-sm`}>
                        <CardContent className="p-4 space-y-3">
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{facility?.name}</div>
                            <div className="text-[10px] text-slate-500 font-medium">Requested by {user?.name} {booking.status === 'Queued' && '(Queued)'}</div>
                            <div className="text-[10px] font-bold text-slate-400 mt-1">
                              {format(parseISO(booking.startTime), 'MMM d, h:mm a')}
                            </div>
                          </div>
                          <div className="flex space-x-2 pt-1">
                            <button onClick={() => approveBooking(booking.id)} className="flex-1 rounded-lg bg-emerald-600 font-bold text-white text-[10px] py-2 hover:bg-emerald-700 transition-colors">Approve</button>
                            <button onClick={() => rejectBooking(booking.id)} className="flex-1 rounded-lg bg-slate-100 font-bold text-slate-600 text-[10px] py-2 hover:bg-slate-200 transition-colors">Reject</button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">My Active Reservations</h4>
              {state.bookings.filter(b => b.userId === state.currentUser?.id && (b.status === 'Confirmed' || b.status === 'Pending Approval' || b.status === 'Queued')).length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center bg-slate-50/50">
                  <CalendarIcon className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">No active reservations.</p>
                </div>
              ) : (
                state.bookings
                  .filter(b => b.userId === state.currentUser?.id && (b.status === 'Confirmed' || b.status === 'Pending Approval' || b.status === 'Queued'))
                  .map(booking => {
                    const facility = state.facilities.find(f => f.id === booking.facilityId);
                    const statusColors = {
                      'Pending Approval': 'border-l-amber-500',
                      'Confirmed': 'border-l-brand',
                      'Queued': 'border-l-indigo-500'
                    };
                    return (
                      <Card key={booking.id} className={`border-l-4 ${statusColors[booking.status as keyof typeof statusColors]} shadow-sm overflow-hidden group`}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-bold text-slate-900 text-sm truncate max-w-[150px]">{facility?.name}</div>
                            <div className={cn(
                              "text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded",
                              booking.status === 'Confirmed' ? "bg-brand/10 text-brand" : booking.status === 'Queued' ? "bg-indigo-100 text-indigo-600" : "bg-amber-100 text-amber-600"
                            )}>
                              {booking.status}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center text-[10px] font-bold text-slate-600">
                              <CalendarIcon className="w-3 h-3 mr-1 text-slate-400" />
                              {format(parseISO(booking.startTime), 'MMM d, h:mm a')}
                            </div>
                            <div className="flex items-center text-[10px] font-bold text-slate-600">
                              <Clock className="w-3 h-3 mr-1 text-slate-400" />
                              End: {format(parseISO(booking.endTime), 'h:mm a')}
                            </div>
                            {booking.purpose && (
                              <p className="text-[10px] text-slate-400 font-medium italic border-t border-slate-50 mt-2 pt-2 line-clamp-1">{booking.purpose}</p>
                            )}
                          </div>
                          <div className="flex space-x-2 mt-4">
                            {(booking.status === 'Pending Approval' || booking.status === 'Queued') && (
                               <button 
                                 onClick={() => cancelBooking(booking.id)}
                                 className="flex-1 rounded-lg bg-red-50 text-red-600 py-2 text-[9px] font-black uppercase tracking-widest hover:bg-red-100 transition-colors"
                               >
                                 Withdraw
                               </button>
                            )}
                            {booking.status === 'Confirmed' && (
                               <button 
                                 onClick={() => completeBooking(booking.id)}
                                 className="flex-1 rounded-lg bg-emerald-50 text-emerald-600 py-2 text-[9px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-colors"
                               >
                                 Complete
                               </button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Booking Modal */}
      <AnimatePresence>
        {isBookingModalOpen && selectedFacility && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl relative overflow-hidden"
            >
              {/* Decor */}
              <div className="absolute top-0 left-0 w-full h-2 bg-brand opacity-80" />
              
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Book {selectedFacility.name}</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Laboratory Reservation</p>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg">
                  <MapPin className="w-5 h-5 text-brand" />
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Purpose of Reservation</label>
                  <input
                    type="text"
                    required
                    value={bookingPurpose}
                    onChange={(e) => setBookingPurpose(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium focus:bg-white focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand transition-all"
                    placeholder="e.g. Capstone Research, Systems Development"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Start Date</label>
                    <input 
                      type="date"
                      value={bookingDate}
                      min={format(new Date(), 'yyyy-MM-dd')}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium focus:bg-white focus:border-brand transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">End Date</label>
                    <input 
                      type="date"
                      value={endDateValue}
                      min={bookingDate}
                      onChange={(e) => setEndDateValue(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium focus:bg-white focus:border-brand transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Start Time</label>
                    <input 
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium focus:bg-white focus:border-brand transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">End Time</label>
                    <input 
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium focus:bg-white focus:border-brand transition-all outline-none"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 font-medium italic mt-1 px-1">
                  Please ensure enough time for cleanup and equipment return.
                </p>
                
                {/* Conflict Warning Indicator */}
                {(() => {
                  const sObj = new Date(`${bookingDate}T${startTime}:00`);
                  const eObj = new Date(`${endDateValue}T${endTime}:00`);
                  const conflict = state.bookings.find(b => {
                    if (b.facilityId !== selectedFacility.id || (b.status !== 'Confirmed' && b.status !== 'Pending Approval')) return false;
                    const bStart = new Date(b.startTime).getTime();
                    const bEnd = new Date(b.endTime).getTime();
                    return (sObj.getTime() < bEnd && eObj.getTime() > bStart);
                  });
                  
                  if (conflict) {
                    return (
                      <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-start space-x-3">
                        <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                        <p className="text-[10px] text-amber-700 leading-tight">
                          This slot is already reserved. You can still submit, but your request will be placed in the <span className="font-bold underline">QUEUE</span>.
                        </p>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              <div className="mt-10 flex space-x-4">
                <button
                  onClick={() => setIsBookingModalOpen(false)}
                  className="flex-1 rounded-xl border border-slate-200 py-3.5 text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all active:scale-[0.98]"
                >
                  Close
                </button>
                <button
                  onClick={confirmBooking}
                  className="flex-1 rounded-xl bg-brand py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-brand/20 hover:bg-brand/90 transition-all active:scale-[0.98]"
                >
                  Book Now
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {isFacilityFormOpen && (
        <FacilityForm
          facility={editingFacility}
          onSave={handleSaveFacility}
          onCancel={() => { setIsFacilityFormOpen(false); setEditingFacility(undefined); }}
        />
      )}

      <ConfirmationModal 
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        variant={confirmConfig.variant}
      />
    </div>
  );
};

