import type { NextApiRequest, NextApiResponse } from 'next';
import { addLead } from '../../lib/store';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, email, message = '', source = 'automate' } = req.body ?? {};

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  const lead = addLead({ name, email, message, source });

  // Send email via Resend if API key is configured
  if (process.env.RESEND_API_KEY) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'mcgraw.io <noreply@mcgraw.io>',
        to: ['michael@mcgraw.io'],
        subject: `New lead — ${name} (${source})`,
        text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}\nSource: ${source}\nTime: ${lead.createdAt}`,
      }),
    });
  }

  return res.status(200).json({ success: true, id: lead.id });
}
