import { Router } from "express";
import { Course } from "../models/Course.js";
import { Unit } from "../models/Unit.js";
import { Lesson } from "../models/Lesson.js";

const router = Router();

// GET /api/courses — list courses with unit/lesson counts
router.get("/", async (_req, res) => {
  const courses = await Course.find().sort({ order: 1 }).lean();
  const result = [];
  for (const c of courses) {
    const units = await Unit.find({ courseId: c._id }).sort({ order: 1 }).lean();
    const unitsWithLessons = [];
    for (const u of units) {
      const lessons = await Lesson.find({ unitId: u._id }).sort({ order: 1 }).lean();
      unitsWithLessons.push({ ...u, lessons });
    }
    result.push({ ...c, units: unitsWithLessons });
  }
  return res.json({ courses: result });
});

// GET /api/courses/:courseId/units — alt
router.get("/:courseId/units", async (req, res) => {
  const { courseId } = req.params;
  const units = await Unit.find({ courseId }).sort({ order: 1 }).lean();
  const withLessons = [];
  for (const u of units) {
    const lessons = await Lesson.find({ unitId: u._id }).sort({ order: 1 }).lean();
    withLessons.push({ ...u, lessons });
  }
  return res.json({ units: withLessons });
});

export default router;
