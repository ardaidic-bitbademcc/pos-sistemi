import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

// Health Check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// ==================== EMPLOYEES ROUTES ====================

// GET all employees
app.get('/api/employees', async (req: Request, res: Response) => {
  try {
    const { branchId, adminId } = req.query;
    
    const employees = await prisma.employee.findMany({
      where: {
        ...(branchId && { branchId: branchId as string }),
        ...(adminId && { adminId: adminId as string }),
      },
      include: {
        branch: true,
      },
      orderBy: { fullName: 'asc' },
    });
    
    res.json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// GET single employee
app.get('/api/employees/:id', async (req: Request, res: Response) => {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: req.params.id },
      include: {
        branch: true,
        admin: {
          select: { id: true, businessName: true, email: true },
        },
      },
    });
    
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    res.json(employee);
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ error: 'Failed to fetch employee' });
  }
});

// POST create employee
app.post('/api/employees', async (req: Request, res: Response) => {
  try {
    const employee = await prisma.employee.create({
      data: req.body,
      include: { branch: true },
    });
    
    res.status(201).json(employee);
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ error: 'Failed to create employee' });
  }
});

// PUT update employee
app.put('/api/employees/:id', async (req: Request, res: Response) => {
  try {
    const employee = await prisma.employee.update({
      where: { id: req.params.id },
      data: req.body,
      include: { branch: true },
    });
    
    res.json(employee);
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ error: 'Failed to update employee' });
  }
});

// DELETE employee
app.delete('/api/employees/:id', async (req: Request, res: Response) => {
  try {
    await prisma.employee.delete({
      where: { id: req.params.id },
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ error: 'Failed to delete employee' });
  }
});

// ==================== BRANCHES ROUTES ====================

app.get('/api/branches', async (req: Request, res: Response) => {
  try {
    const branches = await prisma.branch.findMany({
      where: req.query.adminId ? { adminId: req.query.adminId as string } : {},
      orderBy: { name: 'asc' },
    });
    res.json(branches);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch branches' });
  }
});

app.get('/api/branches/:id', async (req: Request, res: Response) => {
  try {
    const branch = await prisma.branch.findUnique({
      where: { id: req.params.id },
      include: {
        employees: true,
        _count: {
          select: {
            employees: true,
            sales: true,
          },
        },
      },
    });
    
    if (!branch) {
      return res.status(404).json({ error: 'Branch not found' });
    }
    
    res.json(branch);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch branch' });
  }
});

app.post('/api/branches', async (req: Request, res: Response) => {
  try {
    const branch = await prisma.branch.create({ data: req.body });
    res.status(201).json(branch);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create branch' });
  }
});

app.put('/api/branches/:id', async (req: Request, res: Response) => {
  try {
    const branch = await prisma.branch.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(branch);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update branch' });
  }
});

app.delete('/api/branches/:id', async (req: Request, res: Response) => {
  try {
    await prisma.branch.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete branch' });
  }
});

// ==================== ADMINS ROUTES ====================

app.get('/api/admins', async (req: Request, res: Response) => {
  try {
    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        email: true,
        businessName: true,
        phone: true,
        createdAt: true,
        isActive: true,
        // Password'ü döndürme!
      },
    });
    res.json(admins);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch admins' });
  }
});

app.post('/api/admins/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    const admin = await prisma.admin.findUnique({
      where: { email },
    });
    
    if (!admin || admin.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Production'da JWT token kullanın!
    const { password: _, ...adminData } = admin;
    res.json(adminData);
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 API docs: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
