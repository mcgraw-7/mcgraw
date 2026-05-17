import type { NextApiRequest, NextApiResponse } from 'next';
import { getLeads, getStats } from '../../lib/store';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const key = req.headers['x-dashboard-key'];
  if (!process.env.DASHBOARD_KEY || key !== process.env.DASHBOARD_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  return res.status(200).json({ stats: getStats(), leads: getLeads() });
}
