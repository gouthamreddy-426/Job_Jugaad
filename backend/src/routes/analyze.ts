import { Router } from "express";
import { analyze } from "../controllers/analyze.controller.js";
import { optionalAuth } from "../middleware/auth.js";

const router = Router();
router.post("/analyze", optionalAuth, analyze);

export default router;
