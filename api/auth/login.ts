import type { VercelRequest, VercelResponse } from '@vercel/node';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lvciqbweooripjmltxwh.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2Y2lxYndlb29yaXBqbWx0eHdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzODU3NTUsImV4cCI6MjA3ODk2MTc1NX0.MNifk5ItkD276Dhih5PT3Lw4wCrTckA6ZyYR6iAy--k';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'E-posta ve şifre gerekli' });
    }

    // Find admin via Supabase REST API
    const adminResponse = await fetch(`${SUPABASE_URL}/rest/v1/admins?email=eq.${email.toLowerCase().trim()}&select=*`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    if (!adminResponse.ok) {
      return res.status(500).json({ error: 'Veritabanı hatası' });
    }

    const admins = await adminResponse.json();
    const admin = admins[0];

    if (!admin || admin.password !== password || !admin.is_active) {
      return res.status(401).json({ error: 'Geçersiz e-posta veya şifre' });
    }

    // Find admin's branches
    const branchesResponse = await fetch(`${SUPABASE_URL}/rest/v1/branches?admin_id=eq.${admin.id}&is_active=eq.true&order=name.asc&select=*`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    if (!branchesResponse.ok) {
      return res.status(500).json({ error: 'Şube bilgileri alınamadı' });
    }

    const branches = await branchesResponse.json();

    if (branches.length === 0) {
      return res.status(403).json({ error: 'Aktif şubeniz bulunmuyor' });
    }

    // Return session data with first branch
    return res.status(200).json({
      success: true,
      session: {
        adminId: admin.id,
        branchId: branches[0].id,
        userRole: 'owner',
        userName: admin.business_name,
        loginTime: new Date().toISOString(),
      },
      admin: {
        id: admin.id,
        email: admin.email,
        businessName: admin.business_name,
        phone: admin.phone,
      },
      branches: branches.map((b: any) => ({
        id: b.id,
        name: b.name,
        code: b.code,
        address: b.address,
        phone: b.phone,
        isActive: b.is_active,
        adminId: b.admin_id,
      })),
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      error: 'Giriş işlemi sırasında bir hata oluştu',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
