export interface Lead {
  id: string;
  name: string;
  email: string;
  message: string;
  source: string;
  createdAt: string;
}

// Module-level store — persists between requests within the same server instance.
// For production persistence, replace with Vercel KV or a database.
const leads: Lead[] = [];

export function addLead(data: Omit<Lead, 'id' | 'createdAt'>): Lead {
  const lead: Lead = {
    ...data,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
  leads.push(lead);
  return lead;
}

export function getLeads(): Lead[] {
  return [...leads].reverse();
}

export function getStats() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  return {
    total: leads.length,
    today: leads.filter((l) => l.createdAt >= todayStart).length,
    thisWeek: leads.filter((l) => l.createdAt >= weekStart).length,
  };
}
