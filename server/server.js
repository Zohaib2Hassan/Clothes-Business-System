import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import { errorHandler } from './middleware/errorMiddleware.js';
import { websiteRouter } from './middleware/website.js';
import { fileURLToPath } from 'node:url';

import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import saleRoutes from './routes/saleRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import businessRoutes from './routes/businessRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import posRoutes from './routes/posRoutes.js';
import { getTransporter } from './services/emailService.js';

dotenv.config();


const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:8082', 'http://127.0.0.1:8082', ...(process.env.CORS_ORIGINS || '').split(',').map((origin) => origin.trim()).filter(Boolean)],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.get('/api', (req, res) => {
  res.send('API is running...');
});

// @desc    Send verification OTP code
// @route   POST /send-code
// @access  Public
app.post('/send-code', async (req, res) => {
  try {
    const { userEmail } = req.body;
    if (!userEmail) {
      return res.status(400).json({ success: false, message: 'userEmail is required' });
    }

    // Generate random 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    const transporter = getTransporter();
    if (!transporter) {
      return res.status(500).json({ success: false, message: 'Email credentials not configured in server' });
    }

    await transporter.sendMail({
      from: `"Verification" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: 'Your Verification Code',
      text: `Your verification code is: ${code}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; max-width: 480px;">
          <h2 style="color: #111827; margin-bottom: 8px;">Your Verification Code</h2>
          <p style="color: #4b5563; font-size: 14px;">Use the 6-digit verification code below to verify your email:</p>
          <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #166534;">${code}</span>
          </div>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 16px;">This code will expire in 10 minutes. If you did not request this code, you can safely ignore this email.</p>
        </div>
      `,
    });

    console.log(`[POST /send-code] Successfully sent verification code ${code} to ${userEmail}`);

    res.json({
      success: true,
      message: 'Verification code sent successfully!',
      code,
    });
  } catch (error) {
    console.error('[POST /send-code] Error sending verification email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send verification code email',
      error: error.message,
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/pos', posRoutes);

if (process.env.SERVE_WEB === 'true') {
  app.use(websiteRouter(fileURLToPath(new URL('../dist/', import.meta.url))));
}

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use by another process.`);
      } else {
        console.error('Server listen error:', err);
      }
      process.exit(1);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
// Server reloaded for dashboard stats update
