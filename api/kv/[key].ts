import type { VercelRequest, VercelResponse } from '@vercel/node';

// Supabase REST API configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lvciqbweooripjmltxwh.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2Y2lxYndlb29yaXBqbWx0eHdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzODU3NTUsImV4cCI6MjA3ODk2MTc1NX0.MNifk5ItkD276Dhih5PT3Lw4wCrTckA6ZyYR6iAy--k';

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
      // Set value in Supabase - two-step upsert
      const { value } = req.body;
      console.log('[KV API] Upserting key:', key);

      try {
        // Step 1: Check if key exists
        const checkResponse = await fetch(`${SUPABASE_URL}/rest/v1/kv_storage?key=eq.${key}&select=id`, {
          method: 'GET',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
        });

        const existing = await checkResponse.json();
        const keyExists = Array.isArray(existing) && existing.length > 0;
        
        console.log('[KV API] Key exists:', keyExists);

        if (keyExists) {
          // Step 2a: UPDATE existing record
          const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/kv_storage?key=eq.${key}`, {
            method: 'PATCH',
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation',
            },
            body: JSON.stringify({ value }),
          });

          if (!updateResponse.ok) {
            const errorText = await updateResponse.text();
            console.error('[KV API] Update failed:', updateResponse.status, errorText);
            return res.status(500).json({ error: 'Update failed', details: errorText });
          }

          console.log('[KV API] Update success');
        } else {
          // Step 2b: INSERT new record
          const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/kv_storage`, {
            method: 'POST',
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation',
            },
            body: JSON.stringify({ key, value }),
          });

          if (!insertResponse.ok) {
            const errorText = await insertResponse.text();
            console.error('[KV API] Insert failed:', insertResponse.status, errorText);
            return res.status(500).json({ error: 'Insert failed', details: errorText });
          }

          console.log('[KV API] Insert success');
        }

        return res.status(200).json({ success: true, value });
      } catch (fetchError) {
        console.error('[KV API] Fetch error:', fetchError);
        return res.status(500).json({ 
          error: 'Network error', 
          message: fetchError instanceof Error ? fetchError.message : 'Unknown error' 
        });
      }
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
