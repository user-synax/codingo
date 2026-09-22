/* Shared shape for data-driven courses.

   A course authored as data is just one file here plus one entry in
   COURSE_SEEDS in seed.ts — the runner walks units/lessons/exercises in array
   order, so orders are positional and can never drift out of sync. */

export type ExerciseType =
  | "multiple_choice"
  | "fill_blank"
  | "arrange"
  | "predict_output"
  | "fix_bug"
  | "write_code"
  | "ai_prompt";

export type ExerciseSpec = {
  type: ExerciseType;
  prompt: string;
  content: Record<string, unknown>;
  solution: Record<string, unknown>;
  explanation: string;
  hints: string[];
};

export type LessonSpec = {
  title: string;
  description: string;
  xpReward: number;
  exercises: ExerciseSpec[];
};

export type UnitSpec = {
  title: string;
  description: string;
  lessons: LessonSpec[];
};

export type CourseSpec = {
  slug: string;
  course: { title: string; language: string; description: string; order: number };
  units: UnitSpec[];
};
