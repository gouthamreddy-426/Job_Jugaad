import express from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { logger } from "./lib/logger.js";
import router from "./routes/index.js";

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:4173",
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.some((o) => o === origin) ||
        /\.vercel\.app$/.test(origin) ||
        /\.replit\.dev$/.test(origin) ||
        /\.replit\.app$/.test(origin) ||
        process.env.NODE_ENV === "development"
      ) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req: (req) => ({ method: req.method, url: req.url?.split("?")[0] }),
      res: (res) => ({ statusCode: res.statusCode }),
    },
  })
);

app.use(express.json({ limit: "4mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
