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
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'E-posta ve şifre gerekli' });
    }

    // Find admin
    const admin = await prisma.admin.findUnique({
      where: { 
        email: email.toLowerCase().trim(),
      },
    });

    if (!admin || admin.password !== password || !admin.isActive) {
      return res.status(401).json({ error: 'Geçersiz e-posta veya şifre' });
    }

    // Find admin's branches
    const branches = await prisma.branch.findMany({
      where: {
        adminId: admin.id,
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

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
        userName: admin.businessName,
        loginTime: new Date().toISOString(),
      },
      admin: {
        id: admin.id,
        email: admin.email,
        businessName: admin.businessName,
        phone: admin.phone,
      },
      branches: branches.map(b => ({
        id: b.id,
        name: b.name,
        code: b.code,
        address: b.address,
        phone: b.phone,
      })),
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      error: 'Giriş işlemi sırasında bir hata oluştu',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    await prisma.$disconnect();
  }
}
