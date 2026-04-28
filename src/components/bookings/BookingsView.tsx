import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Calendar, Clock, MapPin, Plus, CheckCircle2, XCircle, Edit2, Trash2, Info, Layers } from 'lucide-react';
import { Facility, FacilityBooking } from '../../types';
import { FacilityForm } from './FacilityForm';
import { ConfirmationModal } from '../ui/ConfirmationModal';
import { QRCodeSVG } from 'qrcode.react';

export const BookingsView: React.FC = () => {
  const { state, addBooking, cancelBooking, approveBooking, rejectBooking, addFacility, updateFacility, deleteFacility } = useAppContext();
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [bookingPurpose, setBookingPurpose] = useState('');
  const [duration, setDuration] = useState(1);
  const [durationUnit, setDurationUnit] = useState<'Hours' | 'Days' | 'Weeks' | 'Months' | 'Years'>('Hours');

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

  const handleBook = (facility: Facility) => {
    setSelectedFacility(facility);
    setIsBookingModalOpen(true);
  };

  const getDurationLabel = (val: number, unit: string) => {
    return `${val} ${val === 1 ? unit.slice(0, -1) : unit}`;
  };

  const confirmBooking = () => {
    if (!selectedFacility || !state.currentUser) return;

    setConfirmConfig({
      isOpen: true,
      title: 'Confirm Reservation',
      message: `Do you want to book ${selectedFacility.name} for ${getDurationLabel(duration, durationUnit)} for ${bookingPurpose || 'Laboratory Work'}?`,
      variant: 'info',
      onConfirm: () => {
        const startTime = new Date().toISOString();
        let ms = duration * 3600000; // Default hours
        if (durationUnit === 'Days') ms = duration * 24 * 3600000;
        else if (durationUnit === 'Weeks') ms = duration * 7 * 24 * 3600000;
        else if (durationUnit === 'Months') ms = duration * 30 * 24 * 3600000;
        else if (durationUnit === 'Years') ms = duration * 365 * 24 * 3600000;

        const endTime = new Date(Date.now() + ms).toISOString();

        addBooking({
          facilityId: selectedFacility.id,
          userId: state.currentUser!.id,
          startTime,
          endTime,
          purpose: bookingPurpose || 'Laboratory Work'
        });

        setIsBookingModalOpen(false);
        setSelectedFacility(null);
        setBookingPurpose('');
        setDuration(1);
        setDurationUnit('Hours');
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Facility</h2>
          <p className="text-sm text-slate-500">Reserve laboratory zones, simulation rooms, and PC stations.</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setIsFacilityFormOpen(true)}
            className="flex items-center justify-center rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-brand/90 transition-all active:scale-95"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Facility
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Available Facilities */}
        <div className="lg:col-span-2 space-y-6">
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {state.facilities
              .filter(facility => {
                const isOccupied = state.bookings.some(b => b.facilityId === facility.id && b.status === 'Confirmed' && new Date(b.endTime) > new Date());
                const isAdmin = state.currentUser?.role === 'Admin';
                
                const matchesLocation = locationFilter === 'All' || facility.location === locationFilter;
                
                // If it's occupied and you're not an admin, don't show it as available to book
                return (isAdmin || !isOccupied) && matchesLocation;
              })
              .map(facility => {
                const isOccupied = state.bookings.some(b => b.facilityId === facility.id && b.status === 'Confirmed' && new Date(b.endTime) > new Date());
                return (
                  <Card key={facility.id} className={`${isOccupied ? 'opacity-75 grayscale-[0.5]' : ''} group relative overflow-hidden`}>
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
                      <div className="flex items-center space-x-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          facility.type === 'Room' ? 'bg-purple-100 text-purple-700' :
                          facility.type === 'Zone' ? 'bg-blue-100 text-blue-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>
                          {facility.type}
                        </span>
                      </div>
                      {isOccupied ? (
                        <span className="text-[10px] font-bold text-red-500 flex items-center">
                          <XCircle className="w-3 h-3 mr-1" /> OCCUPIED
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-500 flex items-center">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> AVAILABLE
                        </span>
                      )}
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
                      <p className="text-[11px] text-slate-500 leading-relaxed mb-3 line-clamp-2 italic">
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
                          <span className="truncate max-w-[100px]">{facility.amenities[0]}{facility.amenities.length > 1 ? ` +${facility.amenities.length - 1}` : ''}</span>
                        </div>
                      )}
                    </div>
                    
                    <button
                      disabled={isOccupied}
                      onClick={() => handleBook(facility)}
                      className={`w-full rounded-lg py-2 text-xs font-bold transition-all ${
                        isOccupied 
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                          : 'bg-brand text-white shadow-sm hover:bg-brand/90 active:scale-[0.98]'
                      }`}
                    >
                      {isOccupied ? 'Reserved' : 'Book Now'}
                    </button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Reservations Section */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-brand" />
            <span>Reservations</span>
          </h3>

          <div className="space-y-4">
            {/* Pending Approvals (Dean Only) */}
            {isDean && state.bookings.filter(b => b.status === 'Pending Approval').length > 0 && (
              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 px-2 py-1 rounded w-fit">Needs Approval</h4>
                {state.bookings.filter(b => b.status === 'Pending Approval').map(booking => {
                  const facility = state.facilities.find(f => f.id === booking.facilityId);
                  const user = state.users.find(u => u.id === booking.userId);
                  return (
                    <Card key={booking.id} className="border-l-4 border-l-amber-500 shadow-sm">
                      <CardContent className="p-4 space-y-3">
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{facility?.name}</div>
                          <div className="text-[10px] text-slate-500 font-medium">Requested by {user?.name}</div>
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
            {state.bookings.filter(b => b.userId === state.currentUser?.id && (b.status === 'Confirmed' || b.status === 'Pending Approval')).length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center bg-slate-50/50">
                <Calendar className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">No active reservations.</p>
              </div>
            ) : (
              state.bookings
                .filter(b => b.userId === state.currentUser?.id && (b.status === 'Confirmed' || b.status === 'Pending Approval'))
                .map(booking => {
                  const facility = state.facilities.find(f => f.id === booking.facilityId);
                  const statusColors = {
                    'Pending Approval': 'border-l-amber-500',
                    'Confirmed': 'border-l-brand',
                  };
                  return (
                    <Card key={booking.id} className={`border-l-4 ${statusColors[booking.status as 'Pending Approval' | 'Confirmed']} shadow-sm`}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-bold text-slate-900 text-sm">{facility?.name}</div>
                          <div className={`text-[9px] font-black uppercase tracking-tighter ${booking.status === 'Confirmed' ? 'text-brand' : 'text-amber-500'}`}>{booking.status}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center text-[10px] font-bold text-slate-600">
                            <Clock className="w-3 h-3 mr-1 text-slate-400" />
                            {new Date(booking.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(booking.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium italic">{booking.purpose}</p>
                        </div>
                        {booking.status === 'Pending Approval' && (
                           <button 
                             onClick={() => cancelBooking(booking.id)}
                             className="mt-3 text-[9px] font-bold text-red-500 hover:text-red-600 flex items-center uppercase tracking-tighter"
                           >
                             <Trash2 className="w-2.5 h-2.5 mr-1" /> Withdraw Request
                           </button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
            )}
          </div>
        </div>

      </div>

      {/* Booking Modal */}
      {isBookingModalOpen && selectedFacility && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Book {selectedFacility.name}</h3>
            <p className="text-sm text-slate-500 mb-6">Enter details for your laboratory reservation.</p>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Purpose of Reservation</label>
                <input
                  type="text"
                  value={bookingPurpose}
                  onChange={(e) => setBookingPurpose(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  placeholder="e.g. Research, Project Development"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Duration</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    min="1"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
                    className="w-20 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                  <select
                    value={durationUnit}
                    onChange={(e) => setDurationUnit(e.target.value as any)}
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  >
                    <option value="Hours">Hours</option>
                    <option value="Days">Days</option>
                    <option value="Weeks">Weeks</option>
                    <option value="Months">Months</option>
                    <option value="Years">Years</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-8 flex space-x-4">
              <button
                onClick={() => setIsBookingModalOpen(false)}
                className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmBooking}
                className="flex-1 rounded-lg bg-brand py-2.5 text-sm font-bold text-white shadow-md hover:bg-brand/90"
              >
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      )}

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
