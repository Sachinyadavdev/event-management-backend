import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import helmet from "helmet";
import pool from "./config/database.js";
import errorHandler from "./middleware/errorHandler.js";

// Load env vars
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false // Disable CSP to allow images
}));

// CORS middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Body parser middleware with increased limit for base64 image uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection failed:', err);
  } else {
    console.log('✅ Database connected successfully');
  }
});

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));
app.use('/uploads/speakers', express.static('uploads/speakers'));
app.use('/uploads/banners', express.static('uploads/banners'));
app.use('/uploads/sponsors', express.static('uploads/sponsors'));

// Routes
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import eventRoutes from "./routes/events.js";
import registrationRoutes from "./routes/registrations.js";
import notificationRoutes from "./routes/notifications.js";
import miscRoutes from "./routes/misc.js";
import indexRoutes from "./routes/index.js";
import uploadRoutes from "./routes/upload.js";

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api", miscRoutes);
app.use("/api", indexRoutes);

// Health check route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "ISACA Silicon Valley Backend API",
    version: "1.0.0",
    status: "running"
  });
});

// Error handler middleware (must be last)
app.use(errorHandler);

// Handle unhandled routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
