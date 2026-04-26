import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Calendar, Clock, MapPin, Plus, CheckCircle2, XCircle } from 'lucide-react';
import { Facility, FacilityBooking } from '../../types';

export const BookingsView: React.FC = () => {
  const { state, addBooking, cancelBooking } = useAppContext();
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [bookingPurpose, setBookingPurpose] = useState('');
  const [duration, setDuration] = useState(1); // Hours

  const handleBook = (facility: Facility) => {
    setSelectedFacility(facility);
    setIsBookingModalOpen(true);
  };

  const confirmBooking = () => {
    if (!selectedFacility || !state.currentUser) return;

    const startTime = new Date().toISOString();
    const endTime = new Date(Date.now() + duration * 3600000).toISOString();

    addBooking({
      facilityId: selectedFacility.id,
      userId: state.currentUser.id,
      startTime,
      endTime,
      purpose: bookingPurpose || 'Laboratory Work'
    });

    setIsBookingModalOpen(false);
    setSelectedFacility(null);
    setBookingPurpose('');
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Facility Bookings</h2>
          <p className="text-sm text-slate-500">Reserve laboratory zones, simulation rooms, and PC stations.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Available Facilities */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-lg font-semibold flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-brand" />
            <span>Available Facilities</span>
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {state.facilities.map(facility => {
              const isOccupied = state.bookings.some(b => b.facilityId === facility.id && b.status === 'Confirmed' && new Date(b.endTime) > new Date());
              return (
                <Card key={facility.id} className={`${isOccupied ? 'opacity-75 grayscale-[0.5]' : ''}`}>
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        facility.type === 'Room' ? 'bg-purple-100 text-purple-700' :
                        facility.type === 'Zone' ? 'bg-blue-100 text-blue-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {facility.type}
                      </span>
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
                    <h4 className="font-bold text-slate-900 mb-1">{facility.name}</h4>
                    <p className="text-xs text-slate-500 mb-4">{facility.lab} • Capacity: {facility.capacity}</p>
                    
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

        {/* Your Reservations */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-brand" />
            <span>Active Reservations</span>
          </h3>
          <div className="space-y-4">
            {state.bookings.filter(b => b.status === 'Confirmed' || b.status === 'Completed').length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
                <Calendar className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                <p className="text-xs text-slate-400">No active reservations found.</p>
              </div>
            ) : (
              state.bookings
                .filter(b => b.status === 'Confirmed')
                .map(booking => {
                  const facility = state.facilities.find(f => f.id === booking.facilityId);
                  const user = state.users.find(u => u.id === booking.userId);
                  return (
                    <Card key={booking.id} className="border-l-4 border-l-brand">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-bold text-slate-900 text-sm">{facility?.name}</div>
                          <button 
                            onClick={() => cancelBooking(booking.id)}
                            className="text-xs text-red-500 hover:underline"
                          >
                            Cancel
                          </button>
                        </div>
                        <div className="space-y-2 text-xs text-slate-600">
                          <div className="flex items-center">
                            <Clock className="w-3 h-3 mr-2 text-slate-400" />
                            {new Date(booking.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(booking.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                          <div className="flex items-center">
                            <CheckCircle2 className="w-3 h-3 mr-2 text-slate-400" />
                            Bkd by: {user?.name} ({user?.role})
                          </div>
                        </div>
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
                <label className="text-sm font-medium text-slate-700">Duration (Hours)</label>
                <div className="flex items-center space-x-4">
                  {[1, 2, 4, 8].map(h => (
                    <button
                      key={h}
                      onClick={() => setDuration(h)}
                      className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${
                        duration === h ? 'bg-brand text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {h}h
                    </button>
                  ))}
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
    </div>
  );
};
