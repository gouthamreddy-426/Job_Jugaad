import { Router } from "express";
import healthRouter from "./health.js";
import analyzeRouter from "./analyze.js";
import practiceRouter from "./practice.js";
import analysesRouter from "./analyses.js";

const router = Router();

router.use(healthRouter);
router.use(analyzeRouter);
router.use(practiceRouter);
router.use(analysesRouter);

export default router;
