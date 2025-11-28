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
    const {
      email,
      password,
      businessName,
      phone,
      branchName,
      branchAddress,
      branchPhone,
    } = req.body;

    // Validation
    if (!email || !password || !businessName || !phone || !branchName) {
      return res.status(400).json({ 
        error: 'Zorunlu alanlar: email, password, businessName, phone, branchName' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Şifre en az 6 karakter olmalı' });
    }

    // Check if email exists
    const checkResponse = await fetch(`${SUPABASE_URL}/rest/v1/admins?email=eq.${email.toLowerCase().trim()}&select=id`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    const existing = await checkResponse.json();
    if (Array.isArray(existing) && existing.length > 0) {
      return res.status(409).json({ error: 'Bu e-posta adresi zaten kullanılıyor' });
    }

    // Create admin
    const adminResponse = await fetch(`${SUPABASE_URL}/rest/v1/admins`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        email: email.toLowerCase().trim(),
        password,
        business_name: businessName.trim(),
        phone: phone.trim(),
        is_active: true,
      }),
    });

    if (!adminResponse.ok) {
      const error = await adminResponse.text();
      return res.status(500).json({ error: 'Admin oluşturulamadı', details: error });
    }

    const adminData = await adminResponse.json();
    const admin = adminData[0];

    // Create branch
    const branchResponse = await fetch(`${SUPABASE_URL}/rest/v1/branches`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        name: branchName.trim(),
        code: `BR${Date.now().toString().slice(-6)}`,
        address: branchAddress?.trim() || 'Adres bilgisi girilmedi',
        phone: branchPhone?.trim() || phone.trim(),
        is_active: true,
        admin_id: admin.id,
      }),
    });

    if (!branchResponse.ok) {
      const error = await branchResponse.text();
      return res.status(500).json({ error: 'Şube oluşturulamadı', details: error });
    }

    const branchData = await branchResponse.json();
    const branch = branchData[0];

    // Create default categories
    const baseCategories = [
      { name: 'Yiyecek', description: 'Yiyecek ürünleri', show_in_pos: true, sort_order: 1 },
      { name: 'İçecek', description: 'İçecek ürünleri', show_in_pos: true, sort_order: 2 },
      { name: 'Tatlı', description: 'Tatlı ürünleri', show_in_pos: true, sort_order: 3 },
      { name: 'Kahvaltı', description: 'Kahvaltı ürünleri', show_in_pos: true, sort_order: 4 },
    ];

    for (const cat of baseCategories) {
      await fetch(`${SUPABASE_URL}/rest/v1/categories`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...cat,
          admin_id: admin.id,
          branch_id: branch.id,
        }),
      });
    }

    // Return session data
    return res.status(201).json({
      success: true,
      session: {
        adminId: admin.id,
        branchId: branch.id,
        userRole: 'owner',
        userName: admin.businessName,
        loginTime: new Date().toISOString(),
      },
      admin: {
        id: admin.id,
        email: admin.email,
        businessName: admin.business_name,
        phone: admin.phone,
      },
      branch: {
        id: branch.id,
        name: branch.name,
        code: branch.code,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ 
      error: 'Kayıt işlemi sırasında bir hata oluştu',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
