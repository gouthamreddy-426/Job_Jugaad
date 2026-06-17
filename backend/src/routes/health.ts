import { Router } from "express";
import { healthCheck } from "../controllers/health.controller.js";

const router = Router();
router.get("/healthz", healthCheck);

export default router;
