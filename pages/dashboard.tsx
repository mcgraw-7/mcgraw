import { useState, useEffect, useCallback } from 'react';
import React from 'react';

interface Lead {
  id: string;
  name: string;
  email: string;
  message: string;
  source: string;
  createdAt: string;
}

interface Stats {
  total: number;
  today: number;
  thisWeek: number;
}

export default function Dashboard() {
  const [key, setKey] = useState('');
  const [keyInput, setKeyInput] = useState('');
  const [error, setError] = useState('');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchData = useCallback(async (dashKey: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/leads', {
        headers: { 'x-dashboard-key': dashKey },
      });
      if (res.status === 401) {
        setError('Invalid dashboard key.');
        setKey('');
        setLoading(false);
        return;
      }
      const data = await res.json();
      setStats(data.stats);
      setLeads(data.leads);
      setLastRefresh(new Date());
    } catch {
      setError('Failed to load dashboard data.');
    }
    setLoading(false);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setKey(keyInput);
    fetchData(keyInput);
  };

  useEffect(() => {
    if (!key) return;
    const interval = setInterval(() => fetchData(key), 30000);
    return () => clearInterval(interval);
  }, [key, fetchData]);

  if (!key) {
    return (
      <main className="min-h-screen bg-gray-950 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-white mb-2 text-center">mcgraw.io dashboard</h1>
          <p className="text-gray-400 text-sm text-center mb-8">Enter your dashboard key to continue.</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="Dashboard key"
              className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              className="w-full px-4 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold transition-colors"
            >
              Enter
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">mcgraw.io / leads</h1>
            {lastRefresh && (
              <p className="text-xs text-gray-500 mt-1">
                Last refreshed: {lastRefresh.toLocaleTimeString()} &mdash; auto-updates every 30s
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => fetchData(key)}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm text-gray-300 transition-colors disabled:opacity-50"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              onClick={() => { setKey(''); setKeyInput(''); setLeads([]); setStats(null); }}
              className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm text-gray-300 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-5">
              <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Total Leads</div>
              <div className="text-4xl font-bold text-white">{stats.total}</div>
            </div>
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-5">
              <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Today</div>
              <div className="text-4xl font-bold text-green-400">{stats.today}</div>
            </div>
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-5">
              <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">This Week</div>
              <div className="text-4xl font-bold text-green-400">{stats.thisWeek}</div>
            </div>
          </div>
        )}

        {/* Lead table */}
        <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="text-lg font-semibold">Recent Leads</h2>
          </div>
          {leads.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              {loading ? 'Loading...' : 'No leads yet. CTA clicks will appear here.'}
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {leads.map((lead) => (
                <div key={lead.id} className="px-6 py-4 grid grid-cols-1 sm:grid-cols-4 gap-2 text-sm">
                  <div>
                    <div className="font-semibold text-white">{lead.name}</div>
                    <div className="text-gray-400">{lead.source}</div>
                  </div>
                  <div className="sm:col-span-1">
                    <a href={`mailto:${lead.email}`} className="text-green-400 hover:text-green-300 transition-colors">
                      {lead.email}
                    </a>
                  </div>
                  <div className="text-gray-300 sm:col-span-1 truncate">{lead.message || '—'}</div>
                  <div className="text-gray-500 text-xs sm:text-right">
                    {new Date(lead.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
