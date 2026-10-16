import React, { useState, useEffect } from 'react';
import { CheckCircle2, Clock, AlertCircle, XCircle, FileText, Loader2, MessageSquare } from 'lucide-react';
import { RequestEvent } from './types';

interface RequestTimelineProps {
  requestId: string;
}

interface EventConfigItem {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  label: string;
}

const EVENT_CONFIG: Record<string, EventConfigItem> = {
  SUBMITTED:     { icon: FileText,      color: 'bg-blue-100 text-blue-600',   label: 'Sesizare trimisă' },
  IN_PROGRESS:   { icon: Clock,         color: 'bg-yellow-100 text-yellow-600', label: 'În curs de rezolvare' },
  RESOLVED:      { icon: CheckCircle2,  color: 'bg-green-100 text-green-600', label: 'Rezolvată' },
  REJECTED:      { icon: XCircle,       color: 'bg-red-100 text-red-600',     label: 'Respinsă' },
  REPLY_DRAFTED: { icon: MessageSquare, color: 'bg-purple-100 text-purple-600', label: 'Răspuns oficial generat' },
};

function fmt(isoStr?: string): string {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return d.toLocaleDateString('ro-RO', { day: '2-digit', month: 'long', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
}

export default function RequestTimeline({ requestId }: RequestTimelineProps): React.ReactElement {
  const [events, setEvents] = useState<RequestEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!requestId) return;
    setLoading(true);
    fetch(`/api/v1/requests/${requestId}/events`)
      .then(r => r.json())
      .then((data: RequestEvent[]) => {
        setEvents(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [requestId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-400 py-4">
        <Loader2 size={16} className="animate-spin" /> <span className="text-sm">Se încarcă istoricul...</span>
      </div>
    );
  }

  if (!events.length) {
    return <p className="text-sm text-gray-400 py-2">Nu există evenimente înregistrate.</p>;
  }

  return (
    <div className="relative pl-6">
      {/* Linia verticală */}
      <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-gray-200" />
      <div className="space-y-4">
        {events.map((ev, idx) => {
          const cfg = EVENT_CONFIG[ev.eventType] || { icon: AlertCircle, color: 'bg-gray-100 text-gray-600', label: ev.eventType };
          const Icon = cfg.icon;
          const isLast = idx === events.length - 1;
          return (
            <div key={ev.id} className={`relative flex gap-3 ${isLast ? 'opacity-100' : 'opacity-80'}`}>
              {/* Bulina */}
              <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center z-10 ${cfg.color} shadow-sm`}>
                <Icon size={11} />
              </div>
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                  <span className="text-xs text-gray-400">{fmt(ev.createdAt)}</span>
                </div>
                {ev.description && <p className="text-xs text-gray-600 mt-0.5">{ev.description}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
