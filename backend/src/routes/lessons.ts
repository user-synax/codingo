import { Router } from "express";
import { Lesson } from "../models/Lesson.js";
import { Exercise } from "../models/Exercise.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// GET /api/lessons/:id — lesson with exercises (ordered), auth required to hide solutions later
router.get("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const lesson = await Lesson.findById(id).lean();
  if (!lesson) return res.status(404).json({ message: "Lesson not found." });
  const exercises = await Exercise.find({ lessonId: lesson._id }).sort({ order: 1 }).lean();
  // For MVP we send full exercise including solution — frontend will use it for instant feedback
  // Later we can strip solution and verify server-side before awarding XP
  return res.json({ lesson, exercises });
});

export default router;
