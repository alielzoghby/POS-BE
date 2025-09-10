import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import prisma from './utils/prismaClient.js';
import router from './routes/index.js';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import bcrypt from 'bcryptjs';

dotenv.config();
const app = express();

prisma
  .$connect()
  .then(async () => {
    console.log('Connected to PostgreSQL database');

    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@admin.com' },
    });

    if (!adminUser) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await prisma.user.create({
        data: {
          first_name: 'Admin',
          last_name: 'User',
          email: 'admin@admin.com',
          password: hashedPassword,
          role: 'ADMIN',
        },
      });
      console.log('Admin user created with email admin@admin.com and password admin123');
    } else {
      console.log('Admin user already exists');
    }
  })
  .catch((error) => {
    console.error('Error connecting to database:', error);
  });

const PORT = process.env.PORT || 3000;

// Load Swagger JSON dynamically
const swaggerDocument = JSON.parse(fs.readFileSync('./swagger-output.json', 'utf-8'));

// Middleware
const whitelist = ['http://localhost:4200', 'https://pos-system-two-jet.vercel.app'];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || whitelist.includes(origin)) {
      callback(null, origin);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));

app.use((req, res, next) => {
  res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade'); // Referrer Policy
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploads
app.use('/api/uploads', express.static('uploads'));

// Swagger documentation route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Basic routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to http://localhost:3000/usersFreelance API' });
});

// API routes
app.use('/api/', router);

// Error Handling
app.use((err, _req, res, _next) => {
  console.error('Error:', err);
  res.status(500).json({ message: 'Internal Server Error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to see the app`);
  console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
});

export default app;
