import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
    const existingAdmin = await prisma.admin.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingAdmin) {
      return res.status(409).json({ error: 'Bu e-posta adresi zaten kullanılıyor' });
    }

    // Create admin
    const admin = await prisma.admin.create({
      data: {
        email: email.toLowerCase().trim(),
        password, // TODO: Hash password in production!
        businessName: businessName.trim(),
        phone: phone.trim(),
        isActive: true,
      },
    });

    // Create branch
    const branch = await prisma.branch.create({
      data: {
        name: branchName.trim(),
        code: `BR${Date.now().toString().slice(-6)}`,
        address: branchAddress?.trim() || 'Adres bilgisi girilmedi',
        phone: branchPhone?.trim() || phone.trim(),
        isActive: true,
        adminId: admin.id,
      },
    });

    // Create default categories
    const baseCategories = [
      { name: 'Yiyecek', description: 'Yiyecek ürünleri', showInPOS: true, sortOrder: 1 },
      { name: 'İçecek', description: 'İçecek ürünleri', showInPOS: true, sortOrder: 2 },
      { name: 'Tatlı', description: 'Tatlı ürünleri', showInPOS: true, sortOrder: 3 },
      { name: 'Kahvaltı', description: 'Kahvaltı ürünleri', showInPOS: true, sortOrder: 4 },
    ];

    await Promise.all(
      baseCategories.map((cat) =>
        prisma.category.create({
          data: {
            ...cat,
            adminId: admin.id,
            branchId: branch.id,
          },
        })
      )
    );

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
        businessName: admin.businessName,
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
  } finally {
    await prisma.$disconnect();
  }
}
