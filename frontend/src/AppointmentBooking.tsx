import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle2, Loader2, X, CalendarCheck } from 'lucide-react';
import { CitizenUser, Appointment } from './types';

interface AppointmentBookingProps {
  citizen: CitizenUser;
}

interface AvailableSlot {
  time: string;
  available: boolean;
}

const PURPOSES: string[] = [
  'Depunere documente', 'Informații taxe și impozite', 'Autorizație de construire',
  'Certificate și adeverințe', 'Asistență socială', 'Altele'
];

function getNextWeekDays(count: number = 7): Date[] {
  const days: Date[] = [];
  const d = new Date();
  d.setDate(d.getDate() + 1); // start tomorrow
  while (days.length < count) {
    if (d.getDay() !== 0 && d.getDay() !== 6) { // skip weekends
      days.push(new Date(d));
    }
    d.setDate(d.getDate() + 1);
  }
  return days;
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString('ro-RO', { weekday: 'short', day: 'numeric', month: 'short' });
}

function toISO(d: Date): string {
  return d.toISOString().split('T')[0];
}

export default function AppointmentBooking({ citizen }: AppointmentBookingProps): React.ReactElement {
  const [weekDays] = useState<Date[]>(getNextWeekDays(5));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [purpose, setPurpose] = useState<string>(PURPOSES[0]);
  const [booking, setBooking] = useState<boolean>(false);
  const [confirmed, setConfirmed] = useState<Appointment | null>(null);
  const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    if (citizen?.cnp) {
      fetch(`/api/v1/appointments/citizen/${citizen.cnp}`)
        .then(r => r.json())
        .then((data: Appointment[]) => setMyAppointments(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
  }, [citizen, confirmed]);

  const handleSelectDate = async (day: Date): Promise<void> => {
    setSelectedDate(day);
    setSelectedSlot(null);
    setConfirmed(null);
    setLoadingSlots(true);
    try {
      const r = await fetch(`/api/v1/appointments/available?date=${toISO(day)}`);
      const data: { slots?: AvailableSlot[] } = await r.json();
      setSlots(data.slots || []);
    } catch {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleBook = async (): Promise<void> => {
    if (!selectedSlot || !selectedDate) return;
    setBooking(true);
    try {
      const citizenDisplayName = citizen.prenume && citizen.nume ? `${citizen.prenume} ${citizen.nume}` : citizen.name || 'Cetățean';
      const r = await fetch('/api/v1/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          citizenCnp: citizen.cnp,
          citizenName: citizenDisplayName,
          appointmentDate: toISO(selectedDate),
          timeSlot: selectedSlot,
          purpose,
        })
      });
      if (r.ok) {
        const data: Appointment = await r.json();
        setConfirmed(data);
        setSelectedDate(null);
        setSlots([]);
        setSelectedSlot(null);
      } else {
        alert(await r.text());
      }
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Confirmarea programarii */}
      {confirmed && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
          <CheckCircle2 size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-green-800">Programare confirmată!</p>
            <p className="text-sm text-green-700 mt-1">{confirmed.appointmentDate} ora {confirmed.timeSlot} — {confirmed.purpose}</p>
          </div>
          <button onClick={() => setConfirmed(null)} className="ml-auto text-green-400 hover:text-green-600"><X size={16} /></button>
        </div>
      )}

      {/* Selector zile */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Calendar size={16} /> Alege data</h4>
        <div className="flex gap-2 flex-wrap">
          {weekDays.map((day, i) => (
            <button key={i} onClick={() => handleSelectDate(day)}
              className={`px-3 py-2 rounded-lg border text-sm font-medium transition ${
                selectedDate && toISO(selectedDate) === toISO(day)
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-blue-400'
              }`}>
              {fmtDate(day)}
            </button>
          ))}
        </div>
      </div>

      {/* Sloturi */}
      {selectedDate && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Clock size={16} /> Ore disponibile — {fmtDate(selectedDate)}</h4>
          {loadingSlots ? (
            <div className="flex items-center gap-2 text-gray-400"><Loader2 size={16} className="animate-spin" /> Se verifică disponibilitatea...</div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {slots.map(s => (
                <button key={s.time} disabled={!s.available}
                  onClick={() => s.available && setSelectedSlot(s.time)}
                  className={`py-2 rounded-lg border text-sm font-medium transition ${
                    !s.available ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed' :
                    selectedSlot === s.time ? 'bg-blue-600 text-white border-blue-600' :
                    'bg-white border-gray-200 text-gray-700 hover:border-blue-400'
                  }`}>
                  {s.time}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Scopul si buton */}
      {selectedSlot && (
        <div className="space-y-3">
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1 block">Scopul vizitei</label>
            <select value={purpose} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPurpose(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-blue-500">
              {PURPOSES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <button onClick={handleBook} disabled={booking}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {booking ? <><Loader2 size={16} className="animate-spin" /> Se rezervă...</> : <><CalendarCheck size={16} /> Confirmă programarea</>}
          </button>
        </div>
      )}

      {/* Programarile mele */}
      {myAppointments.filter(a => a.status !== 'CANCELLED').length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Programările mele</h4>
          <div className="space-y-2">
            {myAppointments.filter(a => a.status !== 'CANCELLED').map(a => (
              <div key={a.id} className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                <CalendarCheck size={16} className="text-blue-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{a.appointmentDate} ora {a.timeSlot}</p>
                  <p className="text-xs text-gray-500">{a.purpose}</p>
                </div>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Confirmat</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
