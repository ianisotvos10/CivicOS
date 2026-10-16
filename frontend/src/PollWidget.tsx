import React, { useState, useEffect } from 'react';
import { BarChart2, CheckCircle2, Loader2 } from 'lucide-react';
import { Poll } from './types';

interface PollWidgetProps {
  citizenCnp: string;
}

export default function PollWidget({ citizenCnp }: PollWidgetProps): React.ReactElement {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [voting, setVoting] = useState<Record<string, boolean>>({});
  const [voted, setVoted] = useState<Record<string, number>>({});

  const loadPolls = (): void => {
    setLoading(true);
    fetch('/api/v1/polls')
      .then(r => r.json())
      .then((data: Poll[]) => {
        setPolls(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadPolls();
  }, []);

  const handleVote = async (pollId: string, optionIndex: number): Promise<void> => {
    if (voting[pollId] || voted[pollId] !== undefined) return;
    setVoting(v => ({ ...v, [pollId]: true }));
    try {
      const r = await fetch(`/api/v1/polls/${pollId}/vote?citizenCnp=${citizenCnp}&optionIndex=${optionIndex}`, { method: 'POST' });
      if (r.ok) {
        setVoted(v => ({ ...v, [pollId]: optionIndex }));
        loadPolls(); // refresh counts
      } else {
        const msg = await r.text();
        alert(msg);
      }
    } finally {
      setVoting(v => ({ ...v, [pollId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-400 py-4">
        <Loader2 size={16} className="animate-spin" /> <span className="text-sm">Se încarcă sondajele...</span>
      </div>
    );
  }

  if (!polls.length) {
    return (
      <div className="text-center py-8 text-gray-400">
        <BarChart2 size={32} className="mx-auto mb-2 opacity-30" />
        <p className="text-sm">Nu există sondaje active momentan.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {polls.map(poll => {
        const total = poll.totalVotes || 0;
        const hasVoted = voted[poll.id] !== undefined;
        return (
          <div key={poll.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2 mb-3">
              <h4 className="font-semibold text-gray-800 text-sm">{poll.question}</h4>
              <span className="flex-shrink-0 text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">{total} voturi</span>
            </div>
            <div className="space-y-2">
              {poll.options.map((option, idx) => {
                const count = (poll.voteCounts && poll.voteCounts[idx]) ? poll.voteCounts[idx] : 0;
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                const isMyVote = voted[poll.id] === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => !hasVoted && handleVote(poll.id, idx)}
                    disabled={hasVoted || Boolean(voting[poll.id])}
                    className={`w-full text-left rounded-lg border transition overflow-hidden ${
                      hasVoted ? 'cursor-default' : 'hover:border-blue-400 cursor-pointer'
                    } ${isMyVote ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                  >
                    <div className="relative px-3 py-2">
                      {hasVoted && (
                        <div className="absolute inset-0 bg-blue-100 opacity-40 rounded-lg" style={{ width: `${pct}%` }} />
                      )}
                      <div className="relative flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {isMyVote && <CheckCircle2 size={14} className="text-blue-600 flex-shrink-0" />}
                          <span className="text-sm text-gray-700">{option}</span>
                        </div>
                        {hasVoted && <span className="text-xs font-bold text-gray-500">{pct}%</span>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            {hasVoted && <p className="text-xs text-green-600 mt-2 flex items-center gap-1"><CheckCircle2 size={12} /> Vot înregistrat!</p>}
          </div>
        );
      })}
    </div>
  );
}
