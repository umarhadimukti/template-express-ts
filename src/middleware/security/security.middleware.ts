import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";

export const securityMiddleware = helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'", "'unsafe-inline'"],
      "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      "img-src": ["'self'", "data:", "https://res.cloudinary.com"],
      "connect-src": ["'self'", "https://api.stripe.com"],
      "upgrade-insecure-requests": [],
    },
  },
  hidePoweredBy: true,
  referrerPolicy: { policy: "no-referrer" },
});

const allowedOrigins = [
  "https://my.domain.com",
  "http://localhost:5173",
];

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
  maxAge: 86400,
});

export const rateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});
