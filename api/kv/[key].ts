import type { VercelRequest, VercelResponse } from '@vercel/node';

// Supabase REST API configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lvciqbweooripjmltxwh.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2Y2lxYndlb29yaXBqbWx0eHdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzMTM2MjUsImV4cCI6MjA1Nzg4OTYyNX0.Fz6-qMZjXqHaV-9TzdBqwsN7GV-gxE59c_rAE_H7V-k';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { key } = req.query;

  console.log('[KV API] Request:', req.method, key);

  if (typeof key !== 'string') {
    return res.status(400).json({ error: 'Invalid key' });
  }

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, apikey, authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // Get value from Supabase
      console.log('[KV API] Fetching key:', key);
      
      const response = await fetch(`${SUPABASE_URL}/rest/v1/kv_storage?key=eq.${key}`, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('[KV API] Supabase error:', response.status, await response.text());
        return res.status(500).json({ error: 'Database error' });
      }

      const records = await response.json();
      console.log('[KV API] Records found:', records.length);

      if (records.length === 0) {
        return res.status(404).json({ error: 'Key not found' });
      }

      return res.status(200).json({ value: records[0].value });
    }

    if (req.method === 'PUT' || req.method === 'POST') {
      // Set value in Supabase
      const { value } = req.body;
      console.log('[KV API] Upserting key:', key);

      const response = await fetch(`${SUPABASE_URL}/rest/v1/kv_storage`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates',
        },
        body: JSON.stringify({ key, value }),
      });

      if (!response.ok) {
        console.error('[KV API] Supabase error:', response.status, await response.text());
        return res.status(500).json({ error: 'Database error' });
      }

      const result = await response.json();
      console.log('[KV API] Upsert success');

      return res.status(200).json({ success: true, value });
    }

    if (req.method === 'DELETE') {
      // Delete value from Supabase
      console.log('[KV API] Deleting key:', key);

      const response = await fetch(`${SUPABASE_URL}/rest/v1/kv_storage?key=eq.${key}`, {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
      });

      if (!response.ok) {
        console.error('[KV API] Supabase error:', response.status, await response.text());
        return res.status(500).json({ error: 'Database error' });
      }

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('[KV API] Error:', error);
    console.error('[KV API] Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
