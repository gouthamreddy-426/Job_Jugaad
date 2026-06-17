import { Router } from "express";
import { getUserAnalyses } from "../controllers/analyses.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/analyses", requireAuth, getUserAnalyses);

export default router;
