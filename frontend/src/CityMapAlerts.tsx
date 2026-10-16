import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { AlertTriangle, Droplet, Zap, TrafficCone, Loader2 } from 'lucide-react';
import L from 'leaflet';
import { CityAlert } from './types';

interface CityMapAlertsProps {
  isAdmin: boolean;
}

interface AlertIconConfig {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  label: string;
}

const ALERT_ICONS: Record<string, AlertIconConfig> = {
  WATER: { icon: Droplet, color: '#3b82f6', label: 'Avarie Apă' },
  ELECTRICITY: { icon: Zap, color: '#eab308', label: 'Avarie Curent' },
  ROAD: { icon: TrafficCone, color: '#ef4444', label: 'Drum Închis' },
  EVENT: { icon: AlertTriangle, color: '#8b5cf6', label: 'Eveniment' }
};

// SVG Icon generator for Leaflet
const createCustomIcon = (type: string): L.DivIcon => {
  const cfg = ALERT_ICONS[type] || ALERT_ICONS.EVENT;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="${cfg.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

interface MapEventsProps {
  onClick: (e: L.LeafletMouseEvent) => void;
}

function MapEvents({ onClick }: MapEventsProps): null {
  useMapEvents({ click: onClick });
  return null;
}

export default function CityMapAlerts({ isAdmin }: CityMapAlertsProps): React.ReactElement {
  const [alerts, setAlerts] = useState<CityAlert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Stari pt modul de adaugare (Admin)
  const [addingAlert, setAddingAlert] = useState<boolean>(false);
  const [tempMarker, setTempMarker] = useState<{ lat: number; lng: number } | null>(null);
  const [newAlertForm, setNewAlertForm] = useState<{ title: string; description: string; type: string }>({ title: '', description: '', type: 'ROAD' });

  const loadAlerts = (): void => {
    setLoading(true);
    fetch('/api/v1/alerts')
      .then(r => r.json())
      .then((data: CityAlert[]) => {
        setAlerts(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const handleMapClick = (e: L.LeafletMouseEvent): void => {
    if (!isAdmin || !addingAlert) return;
    setTempMarker({ lat: e.latlng.lat, lng: e.latlng.lng });
  };

  const handleSubmitAlert = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!tempMarker) return;
    try {
      await fetch('/api/v1/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newAlertForm,
          latitude: tempMarker.lat,
          longitude: tempMarker.lng
        })
      });
      setAddingAlert(false);
      setTempMarker(null);
      setNewAlertForm({ title: '', description: '', type: 'ROAD' });
      loadAlerts();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="text-gray-400 py-4 flex items-center gap-2">
        <Loader2 className="animate-spin" size={16}/> Se încarcă harta...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[500px] border border-gray-200 rounded-xl overflow-hidden relative shadow-sm">
      
      {isAdmin && (
        <div className="absolute top-4 right-4 z-[400] bg-white p-3 rounded-xl shadow-lg border border-gray-200 max-w-sm w-[300px]">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-bold text-sm">Mod Administrator</h4>
            <button 
              onClick={() => { setAddingAlert(!addingAlert); setTempMarker(null); }}
              className={`text-xs px-2 py-1 rounded font-bold transition ${addingAlert ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}
            >
              {addingAlert ? 'Anulează' : '+ Adaugă Alertă'}
            </button>
          </div>
          
          {addingAlert && !tempMarker && (
            <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded border border-blue-100">Click pe hartă pentru a plasa punctul avariat/blocat.</p>
          )}

          {addingAlert && tempMarker && (
            <form onSubmit={handleSubmitAlert} className="space-y-2 mt-2">
              <input required value={newAlertForm.title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAlertForm({ ...newAlertForm, title: e.target.value })} placeholder="Titlu alertă..." className="w-full text-sm border rounded p-1.5" />
              <textarea required value={newAlertForm.description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewAlertForm({ ...newAlertForm, description: e.target.value })} placeholder="Descriere scurta..." className="w-full text-sm border rounded p-1.5" rows={2} />
              <select value={newAlertForm.type} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewAlertForm({ ...newAlertForm, type: e.target.value })} className="w-full text-sm border rounded p-1.5">
                {Object.keys(ALERT_ICONS).map(k => <option key={k} value={k}>{ALERT_ICONS[k].label}</option>)}
              </select>
              <button type="submit" className="w-full bg-blue-600 text-white font-bold rounded py-1.5 text-sm">Salvează Alerta</button>
            </form>
          )}
        </div>
      )}

      <MapContainer center={[46.77, 23.59]} zoom={13} style={{ height: '100%', width: '100%', zIndex: 10 }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapEvents onClick={handleMapClick} />
        
        {alerts
          .filter(a => a.latitude != null && a.longitude != null && !isNaN(Number(a.latitude)) && !isNaN(Number(a.longitude)))
          .map(a => (
            <Marker key={a.id} position={[Number(a.latitude), Number(a.longitude)]} icon={createCustomIcon(a.type)}>
            <Popup>
              <div className="min-w-[150px]">
                <strong className="block text-gray-900">{a.title}</strong>
                <span className="text-xs text-gray-500 block mb-1">{ALERT_ICONS[a.type]?.label}</span>
                <p className="text-sm text-gray-700">{a.description}</p>
                <span className="text-[10px] text-gray-400 mt-2 block">{new Date(a.createdAt).toLocaleString('ro-RO')}</span>
              </div>
            </Popup>
          </Marker>
        ))}

        {tempMarker && (
          <Marker position={[tempMarker.lat, tempMarker.lng]} icon={createCustomIcon(newAlertForm.type)} opacity={0.6} />
        )}
      </MapContainer>
    </div>
  );
}
