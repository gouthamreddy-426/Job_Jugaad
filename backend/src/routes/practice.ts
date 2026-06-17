import { Router } from "express";
import { generatePractice } from "../controllers/practice.controller.js";

const router = Router();
router.post("/practice", generatePractice);

export default router;
