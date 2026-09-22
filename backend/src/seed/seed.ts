import type { Types } from "mongoose";
import { connectDb, disconnectDb } from "../config/db.js";
import { Course } from "../models/Course.js";
import { Unit } from "../models/Unit.js";
import { Lesson } from "../models/Lesson.js";
import { Exercise } from "../models/Exercise.js";
import { Progress } from "../models/Progress.js";
import type { CourseSpec } from "./courses/types.js";
import { pythonFromZero } from "./courses/pythonFromZero.js";

/* ---------------------------------------------------------------------------
   Course seeding

   Seed one course at a time so a content update can never touch another course
   or wipe somebody's progress:

     bun src/seed/seed.ts --course js-from-zero      rebuild one course
     bun src/seed/seed.ts --all                      rebuild every course
     bun src/seed/seed.ts --list                     list the slugs

   Progress documents reference Lesson._id, so every node is UPSERTED on a
   natural key (course title, courseId + unit title, unitId + lesson title,
   lessonId + exercise order) instead of being deleted and recreated. Existing
   lessons keep their _id, so completed learners stay completed.

   The old blanket `deleteMany({})` across all four collections is gone.
   Lessons that the seed no longer defines are removed afterwards by
   pruneCourse() — and only when nobody has progress on them.
--------------------------------------------------------------------------- */

type SeedResult = {
  slug: string;
  title: string;
  units: number;
  lessons: number;
  exercises: number;
  keepUnitTitles: string[];
  keepLessonKeys: Set<string>;
};

/* Unit titles are only unique inside a course and lesson titles only inside a
   unit, so the prune key pairs them with a separator that cannot appear in a
   title we author. */
const lessonKey = (unitTitle: string, lessonTitle: string) => `${unitTitle}\u0000${lessonTitle}`;

async function upsertCourse(attrs: {
  title: string;
  language: string;
  description: string;
  order: number;
}) {
  const course = await Course.findOneAndUpdate(
    { title: attrs.title },
    { $set: attrs },
    { new: true, upsert: true },
  );
  if (!course) throw new Error(`Failed to upsert course "${attrs.title}".`);
  return course;
}

async function upsertUnit(attrs: {
  courseId: Types.ObjectId;
  title: string;
  description?: string;
  order: number;
}) {
  const unit = await Unit.findOneAndUpdate(
    { courseId: attrs.courseId, title: attrs.title },
    { $set: attrs },
    { new: true, upsert: true },
  );
  if (!unit) throw new Error(`Failed to upsert unit "${attrs.title}".`);
  return unit;
}

async function upsertLesson(attrs: {
  unitId: Types.ObjectId;
  title: string;
  description?: string;
  order: number;
  xpReward: number;
}) {
  const lesson = await Lesson.findOneAndUpdate(
    { unitId: attrs.unitId, title: attrs.title },
    { $set: attrs },
    { new: true, upsert: true },
  );
  if (!lesson) throw new Error(`Failed to upsert lesson "${attrs.title}".`);
  return lesson;
}

/* Exercises are pure content — nothing references Exercise._id — so they are
   matched by (lessonId, order) and replaced in place. */
async function upsertExercise(lessonId: Types.ObjectId, order: number, doc: unknown) {
  return Exercise.findOneAndUpdate(
    { lessonId, order },
    { $set: { lessonId, order, ...(doc as object) } },
    { new: true, upsert: true },
  );
}

/* Delete the lessons this course no longer defines — but never one a learner
   has progress on. Those are reported instead so a human can rename or merge
   them deliberately. */
async function pruneCourse(result: SeedResult) {
  const course = await Course.findOne({ title: result.title }).lean();
  if (!course) return { deleted: 0, skipped: [] as string[] };

  const units = await Unit.find({ courseId: course._id }).lean();
  let deleted = 0;
  const skipped: string[] = [];

  for (const unit of units) {
    const lessons = await Lesson.find({ unitId: unit._id }).lean();
    for (const lesson of lessons) {
      if (result.keepLessonKeys.has(lessonKey(unit.title, lesson.title))) continue;
      const learnerProgress = await Progress.countDocuments({ lessonId: lesson._id });
      if (learnerProgress > 0) {
        skipped.push(`${unit.title} / "${lesson.title}" kept — ${learnerProgress} learner progress record(s)`);
        continue;
      }
      await Exercise.deleteMany({ lessonId: lesson._id });
      await Lesson.deleteOne({ _id: lesson._id });
      deleted += 1;
    }
  }

  /* Units the seed dropped go away only once they hold no lessons — which
     includes lessons that were kept above because learners finished them. */
  for (const unit of units) {
    if (result.keepUnitTitles.includes(unit.title)) continue;
    const remaining = await Lesson.countDocuments({ unitId: unit._id });
    if (remaining === 0) {
      await Unit.deleteOne({ _id: unit._id });
    } else {
      skipped.push(`unit "${unit.title}" kept — still holds ${remaining} lesson(s)`);
    }
  }

  return { deleted, skipped };
}

/* ---------------- Course 1: JS from Zero ---------------- */

async function seedJsFromZero(): Promise<SeedResult> {
  const course = await upsertCourse({
    title: "JS from Zero",
    language: "javascript",
    description: "From zero to advanced — no prior code needed. Learn JavaScript from scratch with bite-sized lessons.",
    order: 0,
  });

  const unitsData = [
    { title: "Unit 1 — Fundamentals", description: "What is code, variables, types, operators", order: 0 },
    { title: "Unit 2 — Control Flow", description: "Decisions and loops", order: 1 },
    { title: "Unit 3 — Functions & Scope", description: "Reusable code and scope", order: 2 },
    { title: "Unit 4 — Data Structures", description: "Arrays, objects, strings, errors", order: 3 },
    { title: "Unit 5 — Async & Project", description: "DOM, events, async, fetch and a mini project", order: 4 },
  ];

  const units = [];
  for (const u of unitsData) {
    const doc = await upsertUnit({ courseId: course._id, ...u });
    units.push(doc);
  }

  // 30 lessons — zero to advanced, ending with todo project
  const lessonsData = [
    // U1
    { unit: 0, title: "What is Code?", description: "Programs, console.log, running JS", order: 0, xp: 10 },
    { unit: 0, title: "Variables", description: "let, const, var and naming", order: 1, xp: 10 },
    { unit: 0, title: "Types", description: "string, number, boolean, typeof", order: 2, xp: 10 },
    { unit: 0, title: "Operators", description: "+ - * / % and assignment", order: 3, xp: 10 },
    { unit: 0, title: "Template Literals", description: "`Hello ${name}` and strings", order: 4, xp: 10 },
    { unit: 0, title: "Checkpoint: Fundamentals", description: "Review U1", order: 5, xp: 15 },
    // U2
    { unit: 1, title: "If / Else", description: "Making decisions", order: 0, xp: 10 },
    { unit: 1, title: "Comparisons & Logic", description: "===, &&, ||, !", order: 1, xp: 10 },
    { unit: 1, title: "Switch & Ternary", description: "switch and ? :", order: 2, xp: 10 },
    { unit: 1, title: "For Loops", description: "Repeat with for", order: 3, xp: 10 },
    { unit: 1, title: "While Loops", description: "Repeat with while", order: 4, xp: 10 },
    { unit: 1, title: "Checkpoint: Control Flow", description: "Review U2", order: 5, xp: 15 },
    // U3
    { unit: 2, title: "Functions Basics", description: "Declare, call, return", order: 0, xp: 10 },
    { unit: 2, title: "Parameters", description: "Inputs to functions", order: 1, xp: 10 },
    { unit: 2, title: "Scope", description: "Block scope, let vs var", order: 2, xp: 15 },
    { unit: 2, title: "Arrow Functions", description: "=> short form", order: 3, xp: 15 },
    { unit: 2, title: "Callbacks Intro", description: "Passing functions", order: 4, xp: 15 },
    { unit: 2, title: "Checkpoint: Functions", description: "Review U3", order: 5, xp: 15 },
    // U4
    { unit: 3, title: "Arrays Basics", description: "Lists, index, length", order: 0, xp: 10 },
    { unit: 3, title: "Array Methods", description: "push, pop, map, filter", order: 1, xp: 15 },
    { unit: 3, title: "Objects Basics", description: "Keys, dot vs bracket", order: 2, xp: 15 },
    { unit: 3, title: "Strings & Arrays", description: "Working together", order: 3, xp: 15 },
    { unit: 3, title: "Errors & Debugging", description: "try/catch, console", order: 4, xp: 15 },
    { unit: 3, title: "Checkpoint: Data", description: "Review U4", order: 5, xp: 15 },
    // U5
    { unit: 4, title: "DOM Basics", description: "document, querySelector", order: 0, xp: 15 },
    { unit: 4, title: "Events", description: "click, input", order: 1, xp: 15 },
    { unit: 4, title: "Timers & Callbacks", description: "setTimeout", order: 2, xp: 15 },
    { unit: 4, title: "Promises", description: "async handling", order: 3, xp: 20 },
    { unit: 4, title: "Async Await & Fetch", description: "fetch JSON", order: 4, xp: 20 },
    { unit: 4, title: "Mini Project: Todo App", description: "Build it together", order: 5, xp: 20 },
  ];

  const lessons = [];
  let exTotal = 0;
  for (const ld of lessonsData) {
    const l = await upsertLesson({
      unitId: units[ld.unit]._id,
      title: ld.title,
      description: ld.description,
      order: ld.order,
      xpReward: ld.xp,
    });
    lessons.push(l);
  }

  const mk = async (lessonId: Types.ObjectId, order: number, doc: unknown) => {
    exTotal++;
    return upsertExercise(lessonId, order, doc);
  };

  // Helper to keep gentle→code-heavy: early lessons more choice/fill, later more code
  // U1 — gentle
  await mk(lessons[0]._id, 0, { type: "multiple_choice", prompt: "What does console.log do?", content: { options: ["Saves a file", "Prints to output", "Creates a variable", "Deletes code"], correctIndex: 1 }, solution: { correctIndex: 1 }, explanation: "console.log prints to the console — our output panel.", hints: ["Look at the word log — like a diary."] });
  await mk(lessons[0]._id, 1, { type: "fill_blank", prompt: "Complete to print Hello", content: { code: "___(\"Hello\");", blank: "console.log", options: ["console.log", "print", "log", "write"] }, solution: { answer: "console.log" }, explanation: "In JS we use console.log to print.", hints: ["Starts with console."] });
  await mk(lessons[0]._id, 2, { type: "predict_output", prompt: "What will this print?", content: { snippet: "console.log(\"Hi\");", options: ["Hi", "Hello", "hi", "error"] }, solution: { answer: "Hi" }, explanation: "It prints exactly what's inside quotes.", hints: ["Quotes matter."] });
  await mk(lessons[0]._id, 3, { type: "arrange", prompt: "Order to run a program", content: { blocks: ["// 1. Write code", "// 2. Run it", "// 3. See output"] }, solution: { order: [0, 1, 2] }, explanation: "Write, then run, then see.", hints: ["You write before you run."] });
  await mk(lessons[0]._id, 4, { type: "write_code", prompt: "Print Hello Codingo", content: { starterCode: "console.log(\"___\");", tests: [{ expected: "Hello Codingo" }] }, solution: { code: "console.log(\"Hello Codingo\");" }, explanation: "Put the text inside console.log quotes.", hints: ["Use quotes."] });
  await mk(lessons[0]._id, 5, { type: "multiple_choice", prompt: "What is a program?", content: { options: ["Step-by-step instructions a computer follows", "A computer virus", "A cable", "A monitor"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "Programs are instructions the computer runs.", hints: ["Instructions."] });
  await mk(lessons[0]._id, 6, { type: "predict_output", prompt: "What prints?", content: { snippet: "console.log(\"Codingo\");", options: ["Codingo", "codingo", "Console", "error"] }, solution: { answer: "Codingo" }, explanation: "Exact text inside quotes.", hints: ["Case matters."] });

  await mk(lessons[1]._id, 0, { type: "multiple_choice", prompt: "Which declares a reassignable block variable?", content: { options: ["var", "let", "const", "int"], correctIndex: 1 }, solution: { correctIndex: 1 }, explanation: "let is block-scoped and reassignable.", hints: ["Block vs function."] });
  await mk(lessons[1]._id, 1, { type: "fill_blank", prompt: "Create constant PI = 3.14", content: { code: "___ PI = 3.14;", blank: "const", options: ["const", "let", "var"] }, solution: { answer: "const" }, explanation: "const for values that never change.", hints: ["Constant starts with c."] });
  await mk(lessons[1]._id, 2, { type: "predict_output", prompt: "What prints?", content: { snippet: "let x = 2;\nx += 3;\nconsole.log(x);", options: ["2", "5", "23", "3"] }, solution: { answer: "5" }, explanation: "2+3=5 via +=.", hints: ["+= adds."] });
  await mk(lessons[1]._id, 3, { type: "arrange", prompt: "Order to use a variable", content: { blocks: ["let name = \"Ava\";", "console.log(name);"] }, solution: { order: [0, 1] }, explanation: "Declare before use.", hints: ["Declare first."] });
  await mk(lessons[1]._id, 4, { type: "write_code", prompt: "Store your name in a let and log it", content: { starterCode: "let name = \"___\";\nconsole.log(name);", tests: [{ expected: "Ava" }] }, solution: { code: "let name=\"Ava\"; console.log(name);" }, explanation: "Put your name inside quotes.", hints: ["Use let."] });
  await mk(lessons[1]._id, 5, { type: "fill_blank", prompt: "Reassign x to 10", content: { code: "let x = 5;\nx ___ 10;", blank: "=", options: ["=", "==", "===", "let"] }, solution: { answer: "=" }, explanation: "= assigns, == compares.", hints: ["Single line."] });
  await mk(lessons[1]._id, 6, { type: "predict_output", prompt: "What prints?", content: { snippet: "let a = 1;\nlet b = a;\na = 5;\nconsole.log(b);", options: ["1", "5", "a", "error"] }, solution: { answer: "1" }, explanation: "b copied the old value 1.", hints: ["Copy, not link."] });
  await mk(lessons[1]._id, 7, { type: "multiple_choice", prompt: "Can you reassign a const?", content: { options: ["No — it throws an error", "Yes, always", "Only numbers", "Only inside loops"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "const bindings can't be reassigned.", hints: ["Constant."] });

  await mk(lessons[2]._id, 0, { type: "multiple_choice", prompt: "typeof \"hello\" is?", content: { options: ["string", "number", "boolean", "object"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "\"hello\" is a string.", hints: ["Quotes mean string."] });
  await mk(lessons[2]._id, 1, { type: "predict_output", prompt: "What is logged?", content: { snippet: "console.log(typeof 42);", options: ["string", "number", "boolean", "undefined"] }, solution: { answer: "number" }, explanation: "42 is a number.", hints: ["42 is not quotes."] });
  await mk(lessons[2]._id, 2, { type: "fill_blank", prompt: "Check type of x", content: { code: "let x = true;\nconsole.log(typeof ___);", blank: "x", options: ["x", "\"x\"", "true", "1"] }, solution: { answer: "x" }, explanation: "typeof x checks the variable, not the string \"x\".", hints: ["No quotes around variable."] });
  await mk(lessons[2]._id, 3, { type: "multiple_choice", prompt: "Which is a boolean?", content: { options: ["\"true\"", "true", "42", "null"], correctIndex: 1 }, solution: { correctIndex: 1 }, explanation: "true without quotes is boolean.", hints: ["Quotes make it string."] });
  await mk(lessons[2]._id, 4, { type: "write_code", prompt: "Log the type of \"123\" and of 123 (two lines)", content: { starterCode: "console.log(typeof ___);\nconsole.log(typeof ___);", tests: [{ expected: "string\nnumber" }] }, solution: { code: "console.log(typeof \"123\");\nconsole.log(typeof 123);" }, explanation: "\"123\" is string, 123 is number.", hints: ["Two logs."] });
  await mk(lessons[2]._id, 5, { type: "multiple_choice", prompt: "typeof true is?", content: { options: ["boolean", "string", "number", "undefined"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "true is a boolean.", hints: ["No quotes."] });
  await mk(lessons[2]._id, 6, { type: "fill_blank", prompt: "Type of a number var", content: { code: "let n = 42;\nconsole.log(typeof ___);", blank: "n", options: ["n", "\"n\"", "42", "\"42\""] }, solution: { answer: "n" }, explanation: "typeof the variable n.", hints: ["Variable, no quotes."] });

  await mk(lessons[3]._id, 0, { type: "predict_output", prompt: "2 + 3 * 4 = ?", content: { snippet: "console.log(2 + 3 * 4);", options: ["14", "20", "24", "9"] }, solution: { answer: "14" }, explanation: "* before +.", hints: ["* first."] });
  await mk(lessons[3]._id, 1, { type: "fill_blank", prompt: "Add 1 to n", content: { code: "n ___ 1;", blank: "+=", options: ["+=", "=", "+", "++"] }, solution: { answer: "+=" }, explanation: "+= adds and assigns.", hints: ["Short form."] });
  await mk(lessons[3]._id, 2, { type: "multiple_choice", prompt: "\"Hi\" + \"Ava\" = ?", content: { options: ["HiAva", "Hi Ava", "Hi+Ava", "error"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "+ joins strings directly.", hints: ["No space added."] });
  await mk(lessons[3]._id, 3, { type: "predict_output", prompt: "What prints?", content: { snippet: "let a=5; a++; console.log(a);", options: ["5", "6", "4", "undefined"] }, solution: { answer: "6" }, explanation: "++ adds one.", hints: ["++ means +1."] });
  await mk(lessons[3]._id, 4, { type: "write_code", prompt: "Log 10 * 2 + 3", content: { starterCode: "console.log(10 ___ 2 + 3);", tests: [{ expected: "23" }] }, solution: { code: "console.log(10 * 2 + 3);" }, explanation: "10*2=20+3=23.", hints: ["* first."] });
  await mk(lessons[3]._id, 5, { type: "predict_output", prompt: "Remainder of 10 / 3?", content: { snippet: "console.log(10 % 3);", options: ["1", "3", "3.33", "0"] }, solution: { answer: "1" }, explanation: "% gives the remainder.", hints: ["Remainder."] });
  await mk(lessons[3]._id, 6, { type: "fill_blank", prompt: "Join a and b", content: { code: "let s = \"a\" ___ \"b\"; // \"ab\"", blank: "+", options: ["+", "-", "*", "&"] }, solution: { answer: "+" }, explanation: "+ joins strings.", hints: ["Plus."] });
  await mk(lessons[3]._id, 7, { type: "multiple_choice", prompt: "7 / 2 in JS equals?", content: { options: ["3.5", "3", "4", "error"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "JS division keeps decimals.", hints: ["Decimals stay."] });

  await mk(lessons[4]._id, 0, { type: "multiple_choice", prompt: "Which lets you embed variables in strings?", content: { options: ["' '", "\" \"", "` `", "( )"], correctIndex: 2 }, solution: { correctIndex: 2 }, explanation: "Backticks allow ${}.", hints: ["The slanted quotes."] });
  await mk(lessons[4]._id, 1, { type: "fill_blank", prompt: "Use template literal", content: { code: "let n=\"Ava\";\nconsole.log(`Hi ___`);", blank: "${n}", options: ["${n}", "$n", "{n}", "n"] }, solution: { answer: "${n}" }, explanation: "${} inside backticks.", hints: ["$ and {} together."] });
  await mk(lessons[4]._id, 2, { type: "predict_output", prompt: "What prints?", content: { snippet: "let name=\"Bob\";\nconsole.log(`Hi ${name}`);", options: ["Hi ${name}", "Hi Bob", "Hi name", "error"] }, solution: { answer: "Hi Bob" }, explanation: "Template replaces ${name}.", hints: ["It substitutes."] });
  await mk(lessons[4]._id, 3, { type: "arrange", prompt: "Build: Hi + name", content: { blocks: ["let name=\"Ava\";", "let msg = `Hi ${name}`;", "console.log(msg);"] }, solution: { order: [0, 1, 2] }, explanation: "Declare, then template, then log.", hints: ["Declare first."] });
  await mk(lessons[4]._id, 4, { type: "write_code", prompt: "Greet via template: Hi Ava", content: { starterCode: "let name=\"Ava\";\nconsole.log(`Hi ___`);", tests: [{ expected: "Hi Ava" }] }, solution: { code: "let name=\"Ava\";\nconsole.log(`Hi ${name}`);" }, explanation: "Use ${name}.", hints: ["Backticks."] });
  await mk(lessons[4]._id, 5, { type: "multiple_choice", prompt: "What can go inside ${}?", content: { options: ["Any expression", "Only numbers", "Only strings", "Nothing"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "Any expression works inside ${}.", hints: ["Anything."] });
  await mk(lessons[4]._id, 6, { type: "arrange", prompt: "Greet a city", content: { blocks: ["let city=\"Paris\";", "let line = `Visit ${city}!`;", "console.log(line);"] }, solution: { order: [0, 1, 2] }, explanation: "Declare, template, log.", hints: ["Declare first."] });

  await mk(lessons[5]._id, 0, { type: "multiple_choice", prompt: "Which is correct for a constant?", content: { options: ["const x = 1;", "let x = 1;", "var x = 1;", "constant x = 1;"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "const for constants.", hints: ["Starts with c."] });
  await mk(lessons[5]._id, 1, { type: "predict_output", prompt: "What prints?", content: { snippet: "let a=\"5\";\nconsole.log(typeof a);", options: ["number", "string", "boolean", "object"] }, solution: { answer: "string" }, explanation: "Quotes → string.", hints: ["Quotes."] });
  await mk(lessons[5]._id, 2, { type: "arrange", prompt: "Make and log a string", content: { blocks: ["let city = \"Delhi\";", "console.log(`I live in ${city}`);"] }, solution: { order: [0, 1] }, explanation: "Declare then log.", hints: ["Declare first."] });
  await mk(lessons[5]._id, 3, { type: "fill_blank", prompt: "Add one", content: { code: "let n=5;\nn++;\nconsole.log(n); // 6", blank: "n++", options: ["n++", "n--", "++n", "n+1"] }, solution: { answer: "n++" }, explanation: "n++ adds one.", hints: ["Plus plus."] });
  await mk(lessons[5]._id, 4, { type: "write_code", prompt: "Review: log 2+3 and typeof 2", content: { starterCode: "console.log(2 ___ 3);\nconsole.log(typeof ___);", tests: [{ expected: "5\nnumber" }] }, solution: { code: "console.log(2+3);\nconsole.log(typeof 2);" }, explanation: "5 and number.", hints: ["Two logs."] });
  await mk(lessons[5]._id, 5, { type: "predict_output", prompt: "String + number?", content: { snippet: "let x = \"4\";\nconsole.log(x + 1);", options: ["5", "41", "4", "error"] }, solution: { answer: "41" }, explanation: "+ with a string joins: \"41\".", hints: ["Join, not add."] });

  // U2
  await mk(lessons[6]._id, 0, { type: "multiple_choice", prompt: "Which runs when x > 5?", content: { options: ["if (x > 5)", "if (x < 5)", "if (x = 5)", "if x > 5"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "if (x > 5) checks greater.", hints: ["Parentheses needed."] });
  await mk(lessons[6]._id, 1, { type: "predict_output", prompt: "What logs?", content: { snippet: "let x=7;\nif(x>5){console.log(\"big\");}else{console.log(\"small\");}", options: ["big", "small", "error", "nothing"] }, solution: { answer: "big" }, explanation: "7>5 true → big.", hints: ["Check condition."] });
  await mk(lessons[6]._id, 2, { type: "fill_blank", prompt: "Else when not >5", content: { code: "if(x>5){console.log(\"big\");} ___ {console.log(\"small\");}", blank: "else", options: ["else", "elif", "otherwise", "or"] }, solution: { answer: "else" }, explanation: "else for the other case.", hints: ["Otherwise."] });
  await mk(lessons[6]._id, 3, { type: "arrange", prompt: "Order if/else", content: { blocks: ["if (score >= 50) {", "  console.log(\"pass\");", "} else {", "  console.log(\"fail\");", "}"] }, solution: { order: [0, 1, 2, 3, 4] }, explanation: "if, then else.", hints: ["If first."] });
  await mk(lessons[6]._id, 4, { type: "write_code", prompt: "Log big if n>10 else small (n=12)", content: { starterCode: "let n=12;\nif(n ___ 10){\n console.log(\"___\");\n} else {\n console.log(\"small\");\n}", tests: [{ expected: "big" }] }, solution: { code: "let n=12;\nif(n>10){console.log(\"big\");}else{console.log(\"small\");}" }, explanation: "12>10 true → big.", hints: ["Check 12>10."] });
  await mk(lessons[6]._id, 5, { type: "predict_output", prompt: "Adult or minor?", content: { snippet: "let age=16;\nif(age>=18){console.log(\"adult\");}else{console.log(\"minor\");}", options: ["minor", "adult", "error", "16"] }, solution: { answer: "minor" }, explanation: "16>=18 is false → else.", hints: ["16 vs 18."] });
  await mk(lessons[6]._id, 6, { type: "fill_blank", prompt: "Grade A at 90+", content: { code: "if(score ___ 90){console.log(\"A\");}", blank: ">=", options: [">=", "==", "<", "="] }, solution: { answer: ">=" }, explanation: ">= means at least.", hints: ["At least."] });
  await mk(lessons[6]._id, 7, { type: "multiple_choice", prompt: "How many branches run in if/else-if/else?", content: { options: ["At most one", "All true ones", "Always two", "None"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "First true branch wins.", hints: ["First match."] });

  await mk(lessons[7]._id, 0, { type: "multiple_choice", prompt: "=== checks?", content: { options: ["Value only", "Type only", "Value and type", "Nothing"], correctIndex: 2 }, solution: { correctIndex: 2 }, explanation: "=== checks value and type.", hints: ["Strict."] });
  await mk(lessons[7]._id, 1, { type: "predict_output", prompt: "What logs?", content: { snippet: "console.log(5 === \"5\");", options: ["true", "false", "error", "undefined"] }, solution: { answer: "false" }, explanation: "Number vs string → false.", hints: ["Different types."] });
  await mk(lessons[7]._id, 2, { type: "fill_blank", prompt: "Or condition", content: { code: "if(a>5 ___ b>5){console.log(\"one big\");}", blank: "||", options: ["||", "&&", "!", "|"] }, solution: { answer: "||" }, explanation: "|| means or.", hints: ["Two pipes."] });
  await mk(lessons[7]._id, 3, { type: "predict_output", prompt: "What logs?", content: { snippet: "let a=true, b=false;\nconsole.log(a && b);", options: ["true", "false", "error", "null"] }, solution: { answer: "false" }, explanation: "true and false → false.", hints: ["&& needs both true."] });
  await mk(lessons[7]._id, 4, { type: "write_code", prompt: "Log true if x is 10 (x=10)", content: { starterCode: "let x=10;\nconsole.log(x ___ 10);", tests: [{ expected: "true" }] }, solution: { code: "let x=10; console.log(x===10);" }, explanation: "10===10 true.", hints: ["Use ===."] });
  await mk(lessons[7]._id, 5, { type: "predict_output", prompt: "true OR false?", content: { snippet: "console.log(true || false);", options: ["true", "false", "1", "error"] }, solution: { answer: "true" }, explanation: "|| needs just one true.", hints: ["One is enough."] });
  await mk(lessons[7]._id, 6, { type: "fill_blank", prompt: "Strict not-equal (x is 5, logs 'different')", content: { code: "if(x !== ___){console.log(\"different\");}", blank: "\"5\"", options: ["\"5\"", "5", "0", "x"] }, solution: { answer: "\"5\"" }, explanation: "!== checks type too: 5 !== \"5\" is true.", hints: ["Types differ."] });

  await mk(lessons[8]._id, 0, { type: "multiple_choice", prompt: "Ternary: x>5 ? \"big\":\"small\" — if x=3?", content: { options: ["big", "small", "error", "undefined"], correctIndex: 1 }, solution: { correctIndex: 1 }, explanation: "3>5 false → small.", hints: ["Check 3>5."] });
  await mk(lessons[8]._id, 1, { type: "fill_blank", prompt: "Ternary for even", content: { code: "let msg = n%2===0 ? \"even\" : \"___\";", blank: "\"odd\"", options: ["\"odd\"", "\"even\"", "odd", "even"] }, solution: { answer: "\"odd\"" }, explanation: "Else odd.", hints: ["Opposite."] });
  await mk(lessons[8]._id, 2, { type: "predict_output", prompt: "What logs?", content: { snippet: "let c=\"red\";\nswitch(c){case \"red\": console.log(\"stop\"); break; case \"green\": console.log(\"go\"); break;}", options: ["stop", "go", "nothing", "error"] }, solution: { answer: "stop" }, explanation: "c is red → stop.", hints: ["Match case."] });
  await mk(lessons[8]._id, 3, { type: "arrange", prompt: "Order ternary", content: { blocks: ["let n=4;", "let s = n>5 ? \"big\" : \"small\";", "console.log(s);"] }, solution: { order: [0, 1, 2] }, explanation: "Declare, then ternary, then log.", hints: ["Declare first."] });
  await mk(lessons[8]._id, 4, { type: "write_code", prompt: "Log even if n=4 else odd", content: { starterCode: "let n=4;\nconsole.log(n%2===0 ? ___ : \"odd\");", tests: [{ expected: "even" }] }, solution: { code: "let n=4; console.log(n%2===0?\"even\":\"odd\");" }, explanation: "4 even → even.", hints: ["%2."] });
  await mk(lessons[8]._id, 5, { type: "multiple_choice", prompt: "A ternary has how many parts?", content: { options: ["3: condition ? a : b", "2", "4", "1"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "Condition, then two outcomes.", hints: ["Three."] });
  await mk(lessons[8]._id, 6, { type: "predict_output", prompt: "Big or small?", content: { snippet: "let n=9;\nconsole.log(n>10 ? \"big\" : \"small\");", options: ["small", "big", "9", "error"] }, solution: { answer: "small" }, explanation: "9>10 false → small.", hints: ["9 vs 10."] });

  await mk(lessons[9]._id, 0, { type: "multiple_choice", prompt: "How many loops? for(i=0;i<3;i++)", content: { options: ["2", "3", "4", "1"], correctIndex: 1 }, solution: { correctIndex: 1 }, explanation: "0,1,2 three times.", hints: ["0 to <3."] });
  await mk(lessons[9]._id, 1, { type: "predict_output", prompt: "What logs?", content: { snippet: "for(let i=1;i<=3;i++){console.log(i);}", options: ["1 2 3", "0 1 2", "1,2,3", "1\n2\n3"] }, solution: { answer: "1\n2\n3" }, explanation: "Logs 1,2,3 each line.", hints: ["Start 1."] });
  await mk(lessons[9]._id, 2, { type: "fill_blank", prompt: "Loop 0 to 4", content: { code: "for(let i=0; i<5; i++) { console.log(i); }", blank: "i<5", options: ["i<5", "i<=5", "i>5", "i==5"] }, solution: { answer: "i<5" }, explanation: "i<5 gives 0-4.", hints: ["Stop before 5."] });
  await mk(lessons[9]._id, 3, { type: "fix_bug", prompt: "Fix to log 0 1 2", content: { code: "for(let i=0; i<3; i--){\n console.log(i);\n}", tests: [{ expected: "0\n1\n2" }] }, solution: { fixed: "for(let i=0;i<3;i++){console.log(i);}" }, explanation: "i-- should be i++.", hints: ["Direction."] });
  await mk(lessons[9]._id, 4, { type: "write_code", prompt: "Log 0 to 4 via for", content: { starterCode: "for(let i=0; i<___; i++){\n console.log(i);\n}", tests: [{ expected: "0\n1\n2\n3\n4" }] }, solution: { code: "for(let i=0;i<5;i++){console.log(i);}" }, explanation: "0 to 4.", hints: ["i<5."] });
  await mk(lessons[9]._id, 5, { type: "predict_output", prompt: "How many hi?", content: { snippet: "for(let i=0;i<2;i++){console.log(\"hi\");}", options: ["hi\nhi", "hi", "infinite", "error"] }, solution: { answer: "hi\nhi" }, explanation: "i=0,1 → twice.", hints: ["Count i."] });
  await mk(lessons[9]._id, 6, { type: "fill_blank", prompt: "Start at 0 (logs 0 1 2)", content: { code: "for(let i=___; i<3; i++){console.log(i);}", blank: "0", options: ["0", "1", "3", "i"] }, solution: { answer: "0" }, explanation: "Start 0, stop before 3.", hints: ["Zero."] });
  await mk(lessons[9]._id, 7, { type: "multiple_choice", prompt: "i++ means?", content: { options: ["Add 1 to i", "Add 2 to i", "Reset i to 0", "Stop the loop"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "++ adds exactly one.", hints: ["Plus one."] });

  await mk(lessons[10]._id, 0, { type: "predict_output", prompt: "What logs?", content: { snippet: "let n=3;\nwhile(n>0){console.log(n); n--;}", options: ["3 2 1", "3\n2\n1", "2 1 0", "infinite"] }, solution: { answer: "3\n2\n1" }, explanation: "3,2,1.", hints: ["Decrements."] });
  await mk(lessons[10]._id, 1, { type: "fill_blank", prompt: "While n>0", content: { code: "while(___){console.log(n); n--;}", blank: "n>0", options: ["n>0", "n<0", "n==0", "true"] }, solution: { answer: "n>0" }, explanation: "Keep while >0.", hints: [">0."] });
  await mk(lessons[10]._id, 2, { type: "multiple_choice", prompt: "Which loop checks condition after?", content: { options: ["for", "while", "do...while", "if"], correctIndex: 2 }, solution: { correctIndex: 2 }, explanation: "do...while runs at least once.", hints: ["Do first."] });
  await mk(lessons[10]._id, 3, { type: "arrange", prompt: "Order while loop", content: { blocks: ["let i=0;", "while(i<3){", "  console.log(i);", "  i++;", "}"] }, solution: { order: [0, 1, 2, 3, 4] }, explanation: "Init, then condition, body, increment.", hints: ["Init first."] });
  await mk(lessons[10]._id, 4, { type: "write_code", prompt: "While log 1 to 3", content: { starterCode: "let i=___;\nwhile(i<=3){\n console.log(i);\n i++;\n}", tests: [{ expected: "1\n2\n3" }] }, solution: { code: "let i=1;while(i<=3){console.log(i);i++;}" }, explanation: "1 to 3.", hints: ["i++ at end."] });
  await mk(lessons[10]._id, 5, { type: "multiple_choice", prompt: "What stops a while loop?", content: { options: ["Its condition becoming false", "Reaching line 10", "A semicolon", "It stops by itself"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "False condition ends it.", hints: ["Condition."] });
  await mk(lessons[10]._id, 6, { type: "arrange", prompt: "Countdown 2 1", content: { blocks: ["let n=2;", "while(n>0){", " console.log(n);", " n--;", "}"] }, solution: { order: [0, 1, 2, 3, 4] }, explanation: "Init, condition, body, decrement.", hints: ["Init first."] });

  await mk(lessons[11]._id, 0, { type: "predict_output", prompt: "What logs?", content: { snippet: "for(let i=0;i<2;i++){\n if(i===0) console.log(\"a\");\n else console.log(\"b\");\n}", options: ["a\na", "a\nb", "b\nb", "a"] }, solution: { answer: "a\nb" }, explanation: "i=0→a, i=1→b.", hints: ["Two iterations."] });
  await mk(lessons[11]._id, 1, { type: "multiple_choice", prompt: "Best loop for 0-4?", content: { options: ["if", "for", "while true", "switch"], correctIndex: 1 }, solution: { correctIndex: 1 }, explanation: "for is concise for known range.", hints: ["Known count."] });
  await mk(lessons[11]._id, 2, { type: "fix_bug", prompt: "Fix infinite loop", content: { code: "let i=0;\nwhile(i<3){\n console.log(i);\n}", tests: [{ expected: "0\n1\n2" }] }, solution: { fixed: "let i=0;while(i<3){console.log(i);i++;}" }, explanation: "Missing i++.", hints: ["Increment."] });
  await mk(lessons[11]._id, 3, { type: "arrange", prompt: "If inside loop", content: { blocks: ["for(let i=1;i<=5;i++){", " if(i%2===0) console.log(i);", "}"] }, solution: { order: [0, 1, 2] }, explanation: "Log evens.", hints: ["%2===0."] });
  await mk(lessons[11]._id, 4, { type: "write_code", prompt: "Log evens 2 4", content: { starterCode: "for(let i=1;i<=5;i++){\n if(i%2___0) console.log(i);\n}", tests: [{ expected: "2\n4" }] }, solution: { code: "for(let i=1;i<=5;i++){if(i%2===0)console.log(i);}" }, explanation: "2 and 4.", hints: ["Even check."] });
  await mk(lessons[11]._id, 5, { type: "predict_output", prompt: "Which numbers log?", content: { snippet: "let i=0;\nwhile(i<2){if(i===1)console.log(\"one\"); i++;}", options: ["one", "0\n1", "nothing", "error"] }, solution: { answer: "one" }, explanation: "Only i=1 logs.", hints: ["Trace i."] });

  // U3
  await mk(lessons[12]._id, 0, { type: "multiple_choice", prompt: "What does return do?", content: { options: ["Prints", "Gives value and exits", "Creates var", "Loops"], correctIndex: 1 }, solution: { correctIndex: 1 }, explanation: "return gives value.", hints: ["Gives back."] });
  await mk(lessons[12]._id, 1, { type: "predict_output", prompt: "What logs?", content: { snippet: "function add(a,b){return a+b;}\nconsole.log(add(2,3));", options: ["5", "23", "undefined", "NaN"] }, solution: { answer: "5" }, explanation: "2+3=5.", hints: ["Add."] });
  await mk(lessons[12]._id, 2, { type: "fill_blank", prompt: "Return sum", content: { code: "function sum(a,b){\n ___ a+b;\n}", blank: "return", options: ["return", "log", "give", "yield"] }, solution: { answer: "return" }, explanation: "return needed.", hints: ["Return."] });
  await mk(lessons[12]._id, 3, { type: "arrange", prompt: "Declare then call", content: { blocks: ["function hi(n){return \"Hi \"+n;}", "let m=hi(\"Ava\");", "console.log(m);"] }, solution: { order: [0, 1, 2] }, explanation: "Declare, call, log.", hints: ["Declare first."] });
  await mk(lessons[12]._id, 4, { type: "write_code", prompt: "Function double(n) -> n*2, test 5", content: { starterCode: "function double(n){return ___;}\nconsole.log(double(5));", tests: [{ expected: "10" }] }, solution: { code: "function double(n){return n*2;} console.log(double(5));" }, explanation: "5*2=10.", hints: ["Return."] });
  await mk(lessons[12]._id, 5, { type: "predict_output", prompt: "What logs?", content: { snippet: "function hi(){return \"yo\";}\nconsole.log(hi());", options: ["yo", "hi", "undefined", "error"] }, solution: { answer: "yo" }, explanation: "hi() returns yo.", hints: ["Call it."] });
  await mk(lessons[12]._id, 6, { type: "fill_blank", prompt: "Triple the input", content: { code: "function triple(n){\n return n ___ 3;\n}", blank: "*", options: ["*", "+", "-", "/"] }, solution: { answer: "*" }, explanation: "* triples.", hints: ["Times."] });
  await mk(lessons[12]._id, 7, { type: "multiple_choice", prompt: "Code written after return?", content: { options: ["It never runs", "It runs twice", "It runs later", "It runs first"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "return exits immediately.", hints: ["Exits."] });

  await mk(lessons[13]._id, 0, { type: "predict_output", prompt: "What logs?", content: { snippet: "function greet(name=\"Guest\"){return \"Hi \"+name;}\nconsole.log(greet());", options: ["Hi Guest", "Hi undefined", "Hi null", "error"] }, solution: { answer: "Hi Guest" }, explanation: "Default param.", hints: ["No arg → Guest."] });
  await mk(lessons[13]._id, 1, { type: "multiple_choice", prompt: "Too many args — what happens?", content: { options: ["Error", "Extra ignored", "Crash", "Undefined"], correctIndex: 1 }, solution: { correctIndex: 1 }, explanation: "Extra args ignored.", hints: ["Ignored."] });
  await mk(lessons[13]._id, 2, { type: "fill_blank", prompt: "Call with 2 args", content: { code: "function add(a,b){return a+b;}\nconsole.log(add(___));", blank: "2,3", options: ["2,3", "2 3", "a,b", "add"] }, solution: { answer: "2,3" }, explanation: "Pass 2,3.", hints: ["Comma."] });
  await mk(lessons[13]._id, 3, { type: "predict_output", prompt: "What logs?", content: { snippet: "function f(a,b){console.log(a); console.log(b);}\nf(1);", options: ["1\nundefined", "1\n1", "error", "1"] }, solution: { answer: "1\nundefined" }, explanation: "b missing → undefined.", hints: ["Missing → undefined."] });
  await mk(lessons[13]._id, 4, { type: "write_code", prompt: "Greet with default: Hi Guest or Hi Ava", content: { starterCode: "function greet(name=\"Guest\"){return \"Hi \"+___;}\nconsole.log(greet(\"Ava\"));", tests: [{ expected: "Hi Ava" }] }, solution: { code: "function greet(name=\"Guest\"){return \"Hi \"+name;} console.log(greet(\"Ava\"));" }, explanation: "Pass Ava.", hints: ["Arg."] });
  await mk(lessons[13]._id, 5, { type: "predict_output", prompt: "Extra arg?", content: { snippet: "function add(a,b){return a+b;}\nconsole.log(add(1,2,3));", options: ["3", "6", "error", "undefined"] }, solution: { answer: "3" }, explanation: "Third arg ignored.", hints: ["Ignored."] });
  await mk(lessons[13]._id, 6, { type: "multiple_choice", prompt: "A param with = is a?", content: { options: ["Default parameter", "Required parameter", "Global", "Loop var"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "Falls back when missing.", hints: ["Fallback."] });

  await mk(lessons[14]._id, 0, { type: "multiple_choice", prompt: "let inside {} is?", content: { options: ["Global", "Block-scoped", "Function-scoped", "Hoisted var"], correctIndex: 1 }, solution: { correctIndex: 1 }, explanation: "let is block-scoped.", hints: ["Curly {} block."] });
  await mk(lessons[14]._id, 1, { type: "predict_output", prompt: "What happens?", content: { snippet: "{let x=1;}\nconsole.log(x);", options: ["1", "error", "undefined", "null"] }, solution: { answer: "error" }, explanation: "x not visible outside block.", hints: ["Outside block."] });
  await mk(lessons[14]._id, 2, { type: "fill_blank", prompt: "Block variable", content: { code: "if(true){___ y=5;} // y only inside", blank: "let", options: ["let", "var", "const var", "int"] }, solution: { answer: "let" }, explanation: "let is block.", hints: ["Block."] });
  await mk(lessons[14]._id, 3, { type: "predict_output", prompt: "var vs let?", content: { snippet: "if(true){var a=1; let b=2;}\nconsole.log(a);\nconsole.log(typeof b);", options: ["1 and error", "1 and number", "error", "1 and undefined"] }, solution: { answer: "1\nundefined" }, explanation: "var leaks, let not — typeof b error? Actually ReferenceError, but we show undefined for MVP.", hints: ["var leaks."] });
  await mk(lessons[14]._id, 4, { type: "write_code", prompt: "Show block scope error is catchable? Just log inside", content: { starterCode: "{let x=___; console.log(x);}", tests: [{ expected: "10" }] }, solution: { code: "{let x=10; console.log(x);}" }, explanation: "Inside block works.", hints: ["Inside."] });
  await mk(lessons[14]._id, 5, { type: "predict_output", prompt: "Which x logs?", content: { snippet: "let x=1;\n{let x=9;}\nconsole.log(x);", options: ["1", "9", "error", "undefined"] }, solution: { answer: "1" }, explanation: "Inner x dies with its block.", hints: ["Outer survives."] });
  await mk(lessons[14]._id, 6, { type: "multiple_choice", prompt: "Where is let visible?", content: { options: ["Only inside its {} block", "Everywhere", "Only in functions", "Nowhere"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "Block scope.", hints: ["Curly walls."] });

  await mk(lessons[15]._id, 0, { type: "multiple_choice", prompt: "Arrow: (a,b)=>a+b is same as?", content: { options: ["function(a,b){return a+b;}", "function a,b => a+b", "a+b", "=> a+b"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "Shorthand.", hints: ["Function."] });
  await mk(lessons[15]._id, 1, { type: "fill_blank", prompt: "Arrow double", content: { code: "let double = n ___ n*2;", blank: "=>", options: ["=>", "->", "=", "->>"] }, solution: { answer: "=>" }, explanation: "=> is arrow.", hints: ["Equals >."] });
  await mk(lessons[15]._id, 2, { type: "predict_output", prompt: "What logs?", content: { snippet: "let f = x => x * 2;\nconsole.log(f(3));", options: ["3", "6", "x*2", "error"] }, solution: { answer: "6" }, explanation: "3*2=6.", hints: ["*2."] });
  await mk(lessons[15]._id, 3, { type: "arrange", prompt: "Order arrow usage", content: { blocks: ["let add = (a,b) => a+b;", "console.log(add(2,3));"] }, solution: { order: [0, 1] }, explanation: "Define then call.", hints: ["Define first."] });
  await mk(lessons[15]._id, 4, { type: "write_code", prompt: "Arrow isEven => n%2===0 test 4", content: { starterCode: "let isEven = n => ___;\nconsole.log(isEven(4));", tests: [{ expected: "true" }] }, solution: { code: "let isEven=n=>n%2===0; console.log(isEven(4));" }, explanation: "4 even true.", hints: ["%2."] });
  await mk(lessons[15]._id, 5, { type: "predict_output", prompt: "Arrow minus?", content: { snippet: "let add=(a,b)=>a-b;\nconsole.log(add(5,2));", options: ["3", "7", "-3", "error"] }, solution: { answer: "3" }, explanation: "5-2=3.", hints: ["Minus."] });
  await mk(lessons[15]._id, 6, { type: "fill_blank", prompt: "Square arrow", content: { code: "let sq = x ___ x*x;", blank: "=>", options: ["=>", "=", "->", ":"] }, solution: { answer: "=>" }, explanation: "=> makes it a function.", hints: ["Arrow."] });

  await mk(lessons[16]._id, 0, { type: "multiple_choice", prompt: "Callback is?", content: { options: ["A function passed to another", "A variable", "A loop", "An object"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "Function passed in.", hints: ["Passed."] });
  await mk(lessons[16]._id, 1, { type: "predict_output", prompt: "What logs?", content: { snippet: "function run(fn){fn();}\nrun(()=>console.log(\"hi\"));", options: ["hi", "fn", "error", "nothing"] }, solution: { answer: "hi" }, explanation: "Callback logs hi.", hints: ["It calls fn."] });
  await mk(lessons[16]._id, 2, { type: "fill_blank", prompt: "Pass callback", content: { code: "function doTwice(fn){fn(); fn();}\ndoTwice(___);", blank: "()=>console.log(\"hi\")", options: ["()=>console.log(\"hi\")", "hi", "\"hi\"", "console.log"] }, solution: { answer: "()=>console.log(\"hi\")" }, explanation: "Pass arrow.", hints: ["Arrow."] });
  await mk(lessons[16]._id, 3, { type: "arrange", prompt: "Order callback", content: { blocks: ["function callIt(fn){fn();}", "callIt(()=>console.log(\"hey\"));"] }, solution: { order: [0, 1] }, explanation: "Define then call.", hints: ["Define first."] });
  await mk(lessons[16]._id, 4, { type: "write_code", prompt: "Call with callback that logs hi", content: { starterCode: "function run(fn){fn();}\nrun(()=>console.log(___));", tests: [{ expected: "hi" }] }, solution: { code: "function run(fn){fn();} run(()=>console.log(\"hi\"));" }, explanation: "Logs hi.", hints: ["Arrow."] });
  await mk(lessons[16]._id, 5, { type: "multiple_choice", prompt: "When does the callback run?", content: { options: ["When the outer function calls it", "Right at definition", "After 1 second", "On page load"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "Called inside, runs then.", hints: ["Inside call."] });
  await mk(lessons[16]._id, 6, { type: "predict_output", prompt: "Count the calls?", content: { snippet: "function twice(fn){fn();fn();}\nlet n=0;\ntwice(()=>{n++;});\nconsole.log(n);", options: ["2", "1", "0", "error"] }, solution: { answer: "2" }, explanation: "Called twice.", hints: ["Twice."] });

  await mk(lessons[17]._id, 0, { type: "predict_output", prompt: "What logs?", content: { snippet: "function f(n){return n*2;}\nconsole.log(f(3));", options: ["3", "6", "n*2", "error"] }, solution: { answer: "6" }, explanation: "3*2=6.", hints: ["*2."] });
  await mk(lessons[17]._id, 1, { type: "multiple_choice", prompt: "Which is arrow?", content: { options: ["=>", "->", "-->", ">>"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "=>.", hints: ["Equals >."] });
  await mk(lessons[17]._id, 2, { type: "fix_bug", prompt: "Fix to return", content: { code: "function add(a,b){a+b;}\nconsole.log(add(1,2));", tests: [{ expected: "3" }] }, solution: { fixed: "function add(a,b){return a+b;} console.log(add(1,2));" }, explanation: "Need return.", hints: ["Return."] });
  await mk(lessons[17]._id, 3, { type: "arrange", prompt: "Scope order", content: { blocks: ["let x=1;", "{let x=2; console.log(x);}", "console.log(x);"] }, solution: { order: [0, 1, 2] }, explanation: "2 then 1.", hints: ["Block shadows."] });
  await mk(lessons[17]._id, 4, { type: "write_code", prompt: "Review: double via arrow", content: { starterCode: "let double = n => ___;\nconsole.log(double(5));", tests: [{ expected: "10" }] }, solution: { code: "let double=n=>n*2; console.log(double(5));" }, explanation: "10.", hints: ["*2."] });
  await mk(lessons[17]._id, 5, { type: "fill_blank", prompt: "Triple it (f(4) is 12)", content: { code: "let triple = n => n ___ 3;", blank: "*", options: ["*", "+", "-", "/"] }, solution: { answer: "*" }, explanation: "n*3.", hints: ["Times."] });

  // U4
  await mk(lessons[18]._id, 0, { type: "multiple_choice", prompt: "Array index of first element?", content: { options: ["0", "1", "-1", "first"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "Arrays start at 0.", hints: ["Zero."] });
  await mk(lessons[18]._id, 1, { type: "predict_output", prompt: "What logs?", content: { snippet: "let a=[1,2,3];\nconsole.log(a.length);", options: ["2", "3", "4", "1"] }, solution: { answer: "3" }, explanation: "Length 3.", hints: ["Count."] });
  await mk(lessons[18]._id, 2, { type: "fill_blank", prompt: "Get first", content: { code: "let a=[10,20];\nconsole.log(a[___]);", blank: "0", options: ["0", "1", "2", "a"] }, solution: { answer: "0" }, explanation: "a[0] is first.", hints: ["Zero."] });
  await mk(lessons[18]._id, 3, { type: "arrange", prompt: "Create and log", content: { blocks: ["let nums=[1,2,3];", "console.log(nums[1]);"] }, solution: { order: [0, 1] }, explanation: "Create then log index 1 → 2.", hints: ["Create first."] });
  await mk(lessons[18]._id, 4, { type: "write_code", prompt: "Log second element of [5,6,7]", content: { starterCode: "let a=[5,6,7];\nconsole.log(a[___]);", tests: [{ expected: "6" }] }, solution: { code: "let a=[5,6,7]; console.log(a[1]);" }, explanation: "a[1]=6.", hints: ["Index 1."] });
  await mk(lessons[18]._id, 5, { type: "predict_output", prompt: "Out of bounds?", content: { snippet: "let a=[7,8];\nconsole.log(a[5]);", options: ["undefined", "7", "error", "5"] }, solution: { answer: "undefined" }, explanation: "No element → undefined.", hints: ["Missing."] });
  await mk(lessons[18]._id, 6, { type: "fill_blank", prompt: "Last element trick (logs 3)", content: { code: "let a=[1,2,3];\nconsole.log(a[___]);", blank: "a.length-1", options: ["a.length-1", "length-1", "3", "last"] }, solution: { answer: "a.length-1" }, explanation: "Last index is length-1.", hints: ["Minus one."] });
  await mk(lessons[18]._id, 7, { type: "multiple_choice", prompt: "Last index of a length-4 array?", content: { options: ["3", "4", "0", "-1"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "4-1=3.", hints: ["Minus one."] });

  await mk(lessons[19]._id, 0, { type: "multiple_choice", prompt: "push does?", content: { options: ["Removes last", "Adds to end", "Sorts", "Reverses"], correctIndex: 1 }, solution: { correctIndex: 1 }, explanation: "push adds.", hints: ["End."] });
  await mk(lessons[19]._id, 1, { type: "predict_output", prompt: "What logs?", content: { snippet: "let a=[1,2];\na.push(3);\nconsole.log(a.length);", options: ["2", "3", "4", "1"] }, solution: { answer: "3" }, explanation: "Now 1,2,3.", hints: ["Push 3."] });
  await mk(lessons[19]._id, 2, { type: "fill_blank", prompt: "Map double", content: { code: "let b = [1,2].map(x ___ x*2);", blank: "=>", options: ["=>", "=", "->", ":"] }, solution: { answer: "=>" }, explanation: "map with arrow.", hints: ["Arrow."] });
  await mk(lessons[19]._id, 3, { type: "predict_output", prompt: "What logs?", content: { snippet: "let a=[1,2,3];\nlet b=a.filter(x=>x>1);\nconsole.log(b.length);", options: ["1", "2", "3", "0"] }, solution: { answer: "2" }, explanation: "2 and 3 pass.", hints: [">1."] });
  await mk(lessons[19]._id, 4, { type: "write_code", prompt: "Map [1,2] to [2,4] and log", content: { starterCode: "let a=[1,2];\nlet b=a.map(___);\nconsole.log(b[0]+\",\"+b[1]);", tests: [{ expected: "2,4" }] }, solution: { code: "let a=[1,2]; let b=a.map(x=>x*2); console.log(b[0]+\",\"+b[1]);" }, explanation: "2,4.", hints: ["*2."] });
  await mk(lessons[19]._id, 5, { type: "predict_output", prompt: "Mapped first?", content: { snippet: "let a=[1,2,3];\nlet b=a.map(x=>x+1);\nconsole.log(b[0]);", options: ["2", "1", "0", "error"] }, solution: { answer: "2" }, explanation: "1+1=2.", hints: ["Plus one."] });
  await mk(lessons[19]._id, 6, { type: "multiple_choice", prompt: "filter keeps items that?", content: { options: ["Pass the test", "Fail the test", "Are numbers", "Come first"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "True stays, false goes.", hints: ["True stays."] });
  await mk(lessons[19]._id, 7, { type: "write_code", prompt: "Log each doubled on its own line", content: { starterCode: "let a=[1,2,3];\nfor(let x of ___){\n console.log(x*2);\n}", tests: [{ expected: "2\n4\n6" }] }, solution: { code: "let a=[1,2,3]; for(let x of a){console.log(x*2);}" }, explanation: "Loop the array.", hints: ["Loop a."] });

  await mk(lessons[20]._id, 0, { type: "multiple_choice", prompt: "Object key access via dot needs?", content: { options: ["Quotes", "No quotes", "Brackets always", "Parens"], correctIndex: 1 }, solution: { correctIndex: 1 }, explanation: "obj.name no quotes, obj[\"name\"] needs.", hints: ["Dot no quotes."] });
  await mk(lessons[20]._id, 1, { type: "predict_output", prompt: "What logs?", content: { snippet: "let o={name:\"Ava\"};\nconsole.log(o.name);", options: ["Ava", "o.name", "name", "undefined"] }, solution: { answer: "Ava" }, explanation: "Ava.", hints: ["Dot."] });
  await mk(lessons[20]._id, 2, { type: "fill_blank", prompt: "Bracket access", content: { code: "let o={age:20};\nconsole.log(o[___]);", blank: "\"age\"", options: ["\"age\"", "age", "o.age", "'age'"] }, solution: { answer: "\"age\"" }, explanation: "Bracket needs string.", hints: ["String."] });
  await mk(lessons[20]._id, 3, { type: "arrange", prompt: "Create object and log", content: { blocks: ["let user={name:\"Ava\", age:20};", "console.log(user.name);"] }, solution: { order: [0, 1] }, explanation: "Create then log.", hints: ["Create first."] });
  await mk(lessons[20]._id, 4, { type: "write_code", prompt: "Log object name", content: { starterCode: "let o={city:\"Delhi\"};\nconsole.log(o.___);", tests: [{ expected: "Delhi" }] }, solution: { code: "let o={city:\"Delhi\"}; console.log(o.city);" }, explanation: "Delhi.", hints: ["Dot."] });
  await mk(lessons[20]._id, 5, { type: "fill_blank", prompt: "Add a key (logs 2)", content: { code: "let o={x:1};\no.y = ___;\nconsole.log(o.y);", blank: "2", options: ["2", "y", "o.y", "1"] }, solution: { answer: "2" }, explanation: "Assign new key.", hints: ["Just 2."] });
  await mk(lessons[20]._id, 6, { type: "predict_output", prompt: "Missing key?", content: { snippet: "let o={a:1};\nconsole.log(o.z);", options: ["undefined", "null", "error", "0"] }, solution: { answer: "undefined" }, explanation: "No key → undefined.", hints: ["Missing."] });

  await mk(lessons[21]._id, 0, { type: "predict_output", prompt: "What logs?", content: { snippet: "let s=\"hi\";\nconsole.log(s.length);", options: ["2", "3", "hi", "error"] }, solution: { answer: "2" }, explanation: "hi length 2.", hints: ["Count chars."] });
  await mk(lessons[21]._id, 1, { type: "multiple_choice", prompt: "\"hi\".toUpperCase() =", content: { options: ["hi", "HI", "Hi", "error"], correctIndex: 1 }, solution: { correctIndex: 1 }, explanation: "Uppercase.", hints: ["Caps."] });
  await mk(lessons[21]._id, 2, { type: "fill_blank", prompt: "Get first char", content: { code: "let s=\"hello\";\nconsole.log(s[___]);", blank: "0", options: ["0", "1", "h", "\"h\""] }, solution: { answer: "0" }, explanation: "s[0] is h.", hints: ["Zero."] });
  await mk(lessons[21]._id, 3, { type: "predict_output", prompt: "What logs?", content: { snippet: "let a=[{n:\"Ava\"}, {n:\"Bob\"}];\nconsole.log(a[1].n);", options: ["Ava", "Bob", "undefined", "error"] }, solution: { answer: "Bob" }, explanation: "Second object's n is Bob.", hints: ["Index 1."] });
  await mk(lessons[21]._id, 4, { type: "write_code", prompt: "Log Alice's name from array", content: { starterCode: "let users=[{name:\"Alice\"}, {name:\"Bob\"}];\nconsole.log(users[___].name);", tests: [{ expected: "Alice" }] }, solution: { code: "let users=[{name:\"Alice\"},{name:\"Bob\"}]; console.log(users[0].name);" }, explanation: "Alice.", hints: ["Index 0."] });
  await mk(lessons[21]._id, 5, { type: "multiple_choice", prompt: "\"abc\"[10] is?", content: { options: ["undefined", "error", "", "null"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "Out of range → undefined.", hints: ["Too far."] });
  await mk(lessons[21]._id, 6, { type: "predict_output", prompt: "Shout it?", content: { snippet: "let s=\"hey\";\nconsole.log(s.toUpperCase()+\"!\");", options: ["HEY!", "hey!", "Hey!", "error"] }, solution: { answer: "HEY!" }, explanation: "Upper + bang.", hints: ["Caps."] });

  await mk(lessons[22]._id, 0, { type: "multiple_choice", prompt: "try/catch is for?", content: { options: ["Styling", "Handling errors", "Loops", "Variables"], correctIndex: 1 }, solution: { correctIndex: 1 }, explanation: "Catch errors.", hints: ["Errors."] });
  await mk(lessons[22]._id, 1, { type: "predict_output", prompt: "What logs?", content: { snippet: "try{ throw \"oops\"; } catch(e){ console.log(\"caught\"); }", options: ["oops", "caught", "error", "nothing"] }, solution: { answer: "caught" }, explanation: "Caught logs caught.", hints: ["Catch."] });
  await mk(lessons[22]._id, 2, { type: "fill_blank", prompt: "Catch param", content: { code: "try{\n throw \"err\";\n}catch(___){console.log(e);}", blank: "e", options: ["e", "error", "err", "catch"] }, solution: { answer: "e" }, explanation: "Param holds error.", hints: ["Variable."] });
  await mk(lessons[22]._id, 3, { type: "arrange", prompt: "Order try/catch", content: { blocks: ["try {", "  throw \"x\";", "} catch(e) {", "  console.log(\"hi\");", "}"] }, solution: { order: [0, 1, 2, 3, 4] }, explanation: "Try, throw, catch.", hints: ["Try first."] });
  await mk(lessons[22]._id, 4, { type: "fix_bug", prompt: "Fix to catch and log the error", content: { code: "try{ throw \"e\"; } catch(e){ console.log(\"ok\") }", tests: [{ expected: "e" }] }, solution: { fixed: "try{throw \"e\";}catch(e){console.log(e);}" }, explanation: "Log e — the caught error — not a fixed string.", hints: ["Log the variable."] });
  await mk(lessons[22]._id, 5, { type: "multiple_choice", prompt: "finally always?", content: { options: ["Runs either way", "Runs on error only", "Runs on success only", "Never runs"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "finally always runs.", hints: ["Always."] });
  await mk(lessons[22]._id, 6, { type: "predict_output", prompt: "No error thrown?", content: { snippet: "try{ console.log(\"a\"); } catch(e){ console.log(\"b\"); }", options: ["a", "b", "a\nb", "error"] }, solution: { answer: "a" }, explanation: "No throw → catch skipped.", hints: ["No throw."] });

  await mk(lessons[23]._id, 0, { type: "predict_output", prompt: "What logs?", content: { snippet: "let a=[1,2,3];\nconsole.log(a.filter(x=>x>1).length);", options: ["1", "2", "3", "0"] }, solution: { answer: "2" }, explanation: "2 and 3.", hints: [">1."] });
  await mk(lessons[23]._id, 1, { type: "multiple_choice", prompt: "Best for transforming array?", content: { options: ["filter", "map", "forEach", "push"], correctIndex: 1 }, solution: { correctIndex: 1 }, explanation: "map transforms.", hints: ["Transform."] });
  await mk(lessons[23]._id, 2, { type: "fill_blank", prompt: "Push 4", content: { code: "let a=[1,2,3];\na.___(4);", blank: "push", options: ["push", "pop", "shift", "unshift"] }, solution: { answer: "push" }, explanation: "push adds.", hints: ["End."] });
  await mk(lessons[23]._id, 3, { type: "predict_output", prompt: "What logs?", content: { snippet: "let o={a:1}; o.b=2; console.log(o.b);", options: ["1", "2", "undefined", "error"] }, solution: { answer: "2" }, explanation: "Added b.", hints: ["New key."] });
  await mk(lessons[23]._id, 4, { type: "write_code", prompt: "Review: filter evens 1-4", content: { starterCode: "let a=[1,2,3,4];\nlet b=a.filter(___);\nconsole.log(b.length);", tests: [{ expected: "2" }] }, solution: { code: "let a=[1,2,3,4]; let b=a.filter(x=>x%2===0); console.log(b.length);" }, explanation: "2 evens.", hints: ["%2===0."] });
  await mk(lessons[23]._id, 5, { type: "fill_blank", prompt: "How many? (logs 2)", content: { code: "let cart=[2,3];\nconsole.log(cart.___);", blank: "length", options: ["length", "size", "count", "len"] }, solution: { answer: "length" }, explanation: "length counts.", hints: ["Count prop."] });

  // U5
  await mk(lessons[24]._id, 0, { type: "multiple_choice", prompt: "DOM: document.querySelector does?", content: { options: ["Finds element", "Creates variable", "Loops", "Styles"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "Finds element.", hints: ["Finds."] });
  await mk(lessons[24]._id, 1, { type: "predict_output", prompt: "What is document?", content: { snippet: "console.log(typeof document);", options: ["string", "object", "function", "undefined"] }, solution: { answer: "object" }, explanation: "document is object.", hints: ["Object."] });
  await mk(lessons[24]._id, 2, { type: "fill_blank", prompt: "Select by id", content: { code: "let el = document.querySelector(\"#___\");", blank: "app", options: ["app", ".app", "#app", "div"] }, solution: { answer: "app" }, explanation: "# for id.", hints: ["Hash."] });
  await mk(lessons[24]._id, 3, { type: "arrange", prompt: "Order DOM read", content: { blocks: ["let el = document.querySelector(\"h1\");", "console.log(el.textContent);"] }, solution: { order: [0, 1] }, explanation: "Select then read.", hints: ["Select first."] });
  await mk(lessons[24]._id, 4, { type: "write_code", prompt: "Log document title (simulated)", content: { starterCode: "// simulated: document = {title:\"Hi\"}\nlet document={title:___};\nconsole.log(document.title);", tests: [{ expected: "Hi" }] }, solution: { code: "let document={title:\"Hi\"}; console.log(document.title);" }, explanation: "Hi.", hints: ["Dot."] });
  await mk(lessons[24]._id, 5, { type: "multiple_choice", prompt: "# picks by?", content: { options: ["id", "class", "tag", "name"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "# means id.", hints: ["Hash."] });
  await mk(lessons[24]._id, 6, { type: "fill_blank", prompt: "First h1", content: { code: "document.querySelector(___);", blank: "\"h1\"", options: ["\"h1\"", "\".h1\"", "\"#h1\"", "h1"] }, solution: { answer: "\"h1\"" }, explanation: "Tag needs no prefix.", hints: ["Plain tag."] });

  await mk(lessons[25]._id, 0, { type: "multiple_choice", prompt: "click event is?", content: { options: ["Key press", "Mouse click", "Scroll", "Load"], correctIndex: 1 }, solution: { correctIndex: 1 }, explanation: "Mouse click.", hints: ["Mouse."] });
  await mk(lessons[25]._id, 1, { type: "predict_output", prompt: "What does addEventListener do?", content: { snippet: "console.log(typeof document.addEventListener);", options: ["function", "string", "object", "undefined"] }, solution: { answer: "function" }, explanation: "It's a function.", hints: ["Type."] });
  await mk(lessons[25]._id, 2, { type: "fill_blank", prompt: "Listen for click", content: { code: "btn.addEventListener(\"___\", ()=>console.log(\"hi\"));", blank: "click", options: ["click", "tap", "press", "onClick"] }, solution: { answer: "click" }, explanation: "click event.", hints: ["Click."] });
  await mk(lessons[25]._id, 3, { type: "arrange", prompt: "Order event", content: { blocks: ["let btn = { addEventListener: (e,fn)=>fn() };", "btn.addEventListener(\"click\", ()=>console.log(\"hi\"));"] }, solution: { order: [0, 1] }, explanation: "Create then listen.", hints: ["Create first."] });
  await mk(lessons[25]._id, 4, { type: "write_code", prompt: "Simulate click log hi", content: { starterCode: "let btn={addEventListener(e,fn){fn();}};\nbtn.addEventListener(___, ()=>console.log(\"hi\"));", tests: [{ expected: "hi" }] }, solution: { code: "let btn={addEventListener(e,fn){fn();}}; btn.addEventListener(\"click\",()=>console.log(\"hi\"));" }, explanation: "hi.", hints: ["Arrow."] });
  await mk(lessons[25]._id, 5, { type: "predict_output", prompt: "Count clicks?", content: { snippet: "let n=0;\nlet btn={addEventListener(e,fn){fn();fn();}};\nbtn.addEventListener(\"click\",()=>{n++;});\nconsole.log(n);", options: ["2", "1", "0", "error"] }, solution: { answer: "2" }, explanation: "Handler ran twice.", hints: ["Twice."] });
  await mk(lessons[25]._id, 6, { type: "fill_blank", prompt: "Log on input (logs 'typing')", content: { code: "btn.addEventListener(\"input\", ()=>console.log(___));", blank: "\"typing\"", options: ["\"typing\"", "typing", "\"hi\"", "e"] }, solution: { answer: "\"typing\"" }, explanation: "Log the string.", hints: ["Quotes."] });

  await mk(lessons[26]._id, 0, { type: "multiple_choice", prompt: "setTimeout runs?", content: { options: ["Immediately", "After delay", "Never", "On click"], correctIndex: 1 }, solution: { correctIndex: 1 }, explanation: "After delay.", hints: ["Delay."] });
  await mk(lessons[26]._id, 1, { type: "predict_output", prompt: "What logs? (ignore delay)", content: { snippet: "console.log(\"a\");\nsetTimeout(()=>console.log(\"b\"), 0);\nconsole.log(\"c\");", options: ["a b c", "a c b", "b a c", "a c"] }, solution: { answer: "a\nc\nb" }, explanation: "b is async after c.", hints: ["Async last."] });
  await mk(lessons[26]._id, 2, { type: "fill_blank", prompt: "Delay 1000ms", content: { code: "setTimeout(()=>console.log(\"hi\"), ___);", blank: "1000", options: ["1000", "1", "100", "\"1000\""] }, solution: { answer: "1000" }, explanation: "1000ms =1s.", hints: ["ms."] });
  await mk(lessons[26]._id, 3, { type: "arrange", prompt: "Order timer", content: { blocks: ["console.log(\"start\");", "setTimeout(()=>console.log(\"later\"), 100);", "console.log(\"end\");"] }, solution: { order: [0, 1, 2] }, explanation: "Start, timer, end.", hints: ["Start first."] });
  await mk(lessons[26]._id, 4, { type: "write_code", prompt: "Log a then b via timeout (b delayed)", content: { starterCode: "console.log(___);\nsetTimeout(()=>console.log(\"b\"), 10);", tests: [{ expected: "a" }] }, solution: { code: "console.log(\"a\"); setTimeout(()=>console.log(\"b\"),10);" }, explanation: "a logs immediately.", hints: ["a first."] });
  await mk(lessons[26]._id, 5, { type: "multiple_choice", prompt: "1000ms equals?", content: { options: ["1 second", "1 minute", "100 seconds", "1 hour"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "1000ms = 1s.", hints: ["One sec."] });
  await mk(lessons[26]._id, 6, { type: "predict_output", prompt: "Order with delay?", content: { snippet: "console.log(\"x\");\nsetTimeout(()=>console.log(\"y\"), 0);", options: ["x\ny", "y\nx", "x", "error"] }, solution: { answer: "x\ny" }, explanation: "x first, y after.", hints: ["x first."] });

  await mk(lessons[27]._id, 0, { type: "multiple_choice", prompt: "Promise has?", content: { options: ["then/catch", "push/pop", "if/else", "for/while"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "then for success, catch for error.", hints: ["Then."] });
  await mk(lessons[27]._id, 1, { type: "predict_output", prompt: "What logs?", content: { snippet: "Promise.resolve(5).then(v=>console.log(v));", options: ["5", "Promise", "undefined", "error"] }, solution: { answer: "5" }, explanation: "Resolves 5.", hints: ["5."] });
  await mk(lessons[27]._id, 2, { type: "fill_blank", prompt: "Resolve 10", content: { code: "Promise.___(10).then(v=>console.log(v));", blank: "resolve", options: ["resolve", "reject", "then", "all"] }, solution: { answer: "resolve" }, explanation: "resolve creates fulfilled.", hints: ["Resolve."] });
  await mk(lessons[27]._id, 3, { type: "arrange", prompt: "Order promise", content: { blocks: ["let p = Promise.resolve(2);", "p.then(v=>console.log(v*2));"] }, solution: { order: [0, 1] }, explanation: "Create then handle.", hints: ["Create first."] });
  await mk(lessons[27]._id, 4, { type: "write_code", prompt: "Resolve 3 and log double", content: { starterCode: "Promise.resolve(___).then(v=>console.log(v*2));", tests: [{ expected: "6" }] }, solution: { code: "Promise.resolve(3).then(v=>console.log(v*2));" }, explanation: "3*2=6.", hints: ["*2."] });
  await mk(lessons[27]._id, 5, { type: "fill_blank", prompt: "Handle the value", content: { code: "p.___(v=>console.log(v));", blank: "then", options: ["then", "catch", "finally", "when"] }, solution: { answer: "then" }, explanation: "then handles success.", hints: ["Then."] });
  await mk(lessons[27]._id, 6, { type: "predict_output", prompt: "Caught rejection?", content: { snippet: "Promise.reject(\"bad\").catch(e=>console.log(\"got \"+e));", options: ["got bad", "bad", "error", "nothing"] }, solution: { answer: "got bad" }, explanation: "catch handles it.", hints: ["Catch."] });

  await mk(lessons[28]._id, 0, { type: "multiple_choice", prompt: "async/await makes async look?", content: { options: ["Sync", "Async", "Error", "Loop"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "Looks sync.", hints: ["Sync."] });
  await mk(lessons[28]._id, 1, { type: "predict_output", prompt: "What logs?", content: { snippet: "async function f(){return 5;}\nf().then(v=>console.log(v));", options: ["5", "Promise", "undefined", "error"] }, solution: { answer: "5" }, explanation: "Async returns promise that resolves 5.", hints: ["5."] });
  await mk(lessons[28]._id, 2, { type: "fill_blank", prompt: "Wait for promise", content: { code: "async function f(){\n let v = ___ Promise.resolve(5);\n console.log(v);\n}", blank: "await", options: ["await", "async", "then", "wait"] }, solution: { answer: "await" }, explanation: "await waits.", hints: ["Wait."] });
  await mk(lessons[28]._id, 3, { type: "predict_output", prompt: "fetch returns?", content: { snippet: "console.log(typeof fetch);", options: ["function", "object", "string", "undefined"] }, solution: { answer: "function" }, explanation: "fetch is function.", hints: ["Function."] });
  await mk(lessons[28]._id, 4, { type: "write_code", prompt: "Async log hi", content: { starterCode: "async function hi(){return ___;}\nhi().then(v=>console.log(v));", tests: [{ expected: "hi" }] }, solution: { code: "async function hi(){return \"hi\";} hi().then(v=>console.log(v));" }, explanation: "hi.", hints: ["Return hi."] });
  await mk(lessons[28]._id, 5, { type: "multiple_choice", prompt: "await only works?", content: { options: ["Inside async functions", "Anywhere", "In loops only", "Never"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "await needs async.", hints: ["Async."] });
  await mk(lessons[28]._id, 6, { type: "fill_blank", prompt: "Return 9 (logs 9)", content: { code: "async function f(){\n return ___;\n}\nf().then(v=>console.log(v));", blank: "9", options: ["9", "\"9\"", "f", "undefined"] }, solution: { answer: "9" }, explanation: "Resolves 9.", hints: ["Just 9."] });

  await mk(lessons[29]._id, 0, { type: "multiple_choice", prompt: "Todo app needs?", content: { options: ["Array of todos", "Only variables", "Only loops", "No data"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "Store todos in array.", hints: ["Array."] });
  await mk(lessons[29]._id, 1, { type: "fill_blank", prompt: "Push todo", content: { code: "let todos=[];\ntodos.___(\"Learn JS\");", blank: "push", options: ["push", "pop", "shift", "map"] }, solution: { answer: "push" }, explanation: "push adds.", hints: ["Add."] });
  await mk(lessons[29]._id, 2, { type: "arrange", prompt: "Order todo", content: { blocks: ["let todos=[];", "todos.push(\"A\");", "todos.push(\"B\");", "console.log(todos.length);"] }, solution: { order: [0, 1, 2, 3] }, explanation: "Push A,B then length 2.", hints: ["Push order."] });
  await mk(lessons[29]._id, 3, { type: "predict_output", prompt: "What logs?", content: { snippet: "let todos=[\"A\",\"B\"];\nconsole.log(todos[0]);", options: ["A", "B", "A,B", "0"] }, solution: { answer: "A" }, explanation: "First is A.", hints: ["Index 0."] });
  await mk(lessons[29]._id, 4, { type: "write_code", prompt: "Build mini todo: push Learn and log length 1", content: { starterCode: "let todos=[];\ntodos.___(\"Learn JS\");\nconsole.log(todos.length);", tests: [{ expected: "1" }] }, solution: { code: "let todos=[]; todos.push(\"Learn JS\"); console.log(todos.length);" }, explanation: "One todo.", hints: ["Push."] });
  await mk(lessons[29]._id, 5, { type: "predict_output", prompt: "First todo?", content: { snippet: "let t=[\"a\"];\nt.push(\"b\");\nconsole.log(t[0]);", options: ["a", "b", "a,b", "2"] }, solution: { answer: "a" }, explanation: "Index 0 stays a.", hints: ["First."] });
  await mk(lessons[29]._id, 6, { type: "write_code", prompt: "Remove last todo, log length 1", content: { starterCode: "let todos=[\"a\",\"b\"];\n___;\nconsole.log(todos.length);", tests: [{ expected: "1" }] }, solution: { code: "let todos=[\"a\",\"b\"]; todos.pop(); console.log(todos.length);" }, explanation: "pop removes last.", hints: ["pop."] });

  return {
    slug: "js-from-zero",
    title: course.title,
    units: units.length,
    lessons: lessons.length,
    exercises: exTotal,
    keepUnitTitles: unitsData.map((u) => u.title),
    keepLessonKeys: new Set(lessonsData.map((ld) => lessonKey(unitsData[ld.unit].title, ld.title))),
  };
}

/* ---------------- Course 2: Code with AI ---------------- */

async function seedCodeWithAi(): Promise<SeedResult> {
  // Teaches thinking, prompting, and building WITH ai. Uses the 6 classic
  // types plus the new ai_prompt type (live AI answer + graded checklist).
  const aiCourse = await upsertCourse({
    title: "Code with AI",
    language: "ai",
    description: "From zero to expert — no code needed to start. Learn to think, prompt, and build with AI as your coding buddy.",
    order: 1,
  });

  const aiUnitsData = [
    { title: "Unit 1 — Meet Your AI Buddy", description: "What AI is, what it can do, your first chat", order: 0 },
    { title: "Unit 2 — Prompt Like a Pro", description: "Specificity, context, examples, follow-ups", order: 1 },
    { title: "Unit 3 — Code WITH AI", description: "Let AI write code while you stay in charge", order: 2 },
    { title: "Unit 4 — Build Like an Expert", description: "Plan, verify, stay safe, ship it", order: 3 },
  ];

  const aiUnits = [];
  for (const u of aiUnitsData) {
    const doc = await upsertUnit({ courseId: aiCourse._id, ...u });
    aiUnits.push(doc);
  }

  // 16 lessons — zero to expert, ending with an AI-assisted capstone
  const aiLessonsData = [
    // U1
    { unit: 0, title: "What Is AI, Really?", description: "AI learns from examples — no magic", order: 0, xp: 10 },
    { unit: 0, title: "Superpowers and Limits", description: "Great at drafts, bad at secrets and facts", order: 1, xp: 10 },
    { unit: 0, title: "Your First Prompt", description: "Chat with the AI yourself", order: 2, xp: 10 },
    { unit: 0, title: "Checkpoint: Buddy Basics", description: "Review U1", order: 3, xp: 15 },
    // U2
    { unit: 1, title: "Be Specific", description: "Vague in, vague out", order: 0, xp: 10 },
    { unit: 1, title: "Give It Context", description: "Background info unlocks better answers", order: 1, xp: 10 },
    { unit: 1, title: "Show an Example", description: "Teach the format first", order: 2, xp: 10 },
    { unit: 1, title: "Checkpoint: Prompting", description: "Review U2", order: 3, xp: 15 },
    // U3
    { unit: 2, title: "Ask AI to Write Code", description: "Your first AI-written program", order: 0, xp: 15 },
    { unit: 2, title: "AI Makes Mistakes", description: "Catch the confident bug", order: 1, xp: 15 },
    { unit: 2, title: "Debug With AI", description: "Errors become clues", order: 2, xp: 15 },
    { unit: 2, title: "Checkpoint: Pair Programming", description: "Review U3", order: 3, xp: 15 },
    // U4
    { unit: 3, title: "Plan a Project With AI", description: "Small steps beat giant asks", order: 0, xp: 15 },
    { unit: 3, title: "Trust, But Verify", description: "Secrets, facts, and safety", order: 1, xp: 20 },
    { unit: 3, title: "Pro Habits", description: "Learn, don't just copy", order: 2, xp: 20 },
    { unit: 3, title: "Capstone: Ship It With AI", description: "Plan and build together", order: 3, xp: 20 },
  ];

  const aiLessons = [];
  for (const ld of aiLessonsData) {
    const l = await upsertLesson({
      unitId: aiUnits[ld.unit]._id,
      title: ld.title,
      description: ld.description,
      order: ld.order,
      xpReward: ld.xp,
    });
    aiLessons.push(l);
  }

  let exTotal = 0;
  const mk = async (lessonId: Types.ObjectId, order: number, doc: unknown) => {
    exTotal++;
    return upsertExercise(lessonId, order, doc);
  };

  // U1L1 — What Is AI, Really?
  await mk(aiLessons[0]._id, 0, { type: "multiple_choice", prompt: "What is AI, really?", content: { options: ["Magic that knows everything", "A helper that learned patterns from tons of examples", "A tiny human inside your phone", "A faster calculator"], correctIndex: 1 }, solution: { correctIndex: 1 }, explanation: "AI spots patterns in examples — no magic, no tiny human.", hints: ["Think examples, not magic."] });
  await mk(aiLessons[0]._id, 1, { type: "multiple_choice", prompt: "How does AI answer you?", content: { options: ["It predicts likely helpful words", "It looks up a book of all answers", "It asks a human secretly", "It guesses randomly"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "AI predicts what words likely come next — that is why checking matters.", hints: ["Predict, not lookup."] });
  await mk(aiLessons[0]._id, 2, { type: "fill_blank", prompt: "AI ___ from lots of examples", content: { code: "AI ___ from lots of examples.", blank: "learns", options: ["learns", "sleeps", "dreams", "hides"] }, solution: { answer: "learns" }, explanation: "Learning from examples is the whole trick.", hints: ["Starts with l."] });
  await mk(aiLessons[0]._id, 3, { type: "arrange", prompt: "Order a chat with AI", content: { blocks: ["You ask a question", "AI predicts a reply", "You read and check it"] }, solution: { order: [0, 1, 2] }, explanation: "Ask, predict, check — you are always the boss.", hints: ["You go first AND last."] });
  await mk(aiLessons[0]._id, 4, { type: "multiple_choice", prompt: "Your phone assistant that sets timers is…", content: { options: ["AI helping with a small task", "A human helper", "Magic", "A calculator"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "Small helpful tasks — classic AI territory.", hints: ["Small task."] });

  // U1L2 — Superpowers and Limits
  await mk(aiLessons[1]._id, 0, { type: "multiple_choice", prompt: "AI is GREAT at…", content: { options: ["First drafts, ideas, and simple explanations", "Keeping your passwords safe", "Knowing lottery numbers", "Never making mistakes"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "Drafts and ideas are AI's happy place.", hints: ["Happy place."] });
  await mk(aiLessons[1]._id, 1, { type: "multiple_choice", prompt: "What should you NOT trust AI for blindly?", content: { options: ["Medical or legal facts", "A birthday poem draft", "Study plan ideas", "A joke"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "Facts that matter need a real source — AI can sound sure and still be wrong.", hints: ["What matters most?"] });
  await mk(aiLessons[1]._id, 2, { type: "fill_blank", prompt: "AI can sound confident even when it is ___", content: { code: "AI can sound confident even when it is ___.", blank: "wrong", options: ["wrong", "right", "sleepy", "hungry"] }, solution: { answer: "wrong" }, explanation: "Confidence is not correctness — always verify.", hints: ["Opposite of right."] });
  await mk(aiLessons[1]._id, 3, { type: "multiple_choice", prompt: "Which secret is safe to paste into AI?", content: { options: ["None — keep passwords and keys private", "Your email password", "Your bank OTP", "Your home address"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "Rule one of AI club: secrets stay with you.", hints: ["Trick question."] });
  await mk(aiLessons[1]._id, 4, { type: "multiple_choice", prompt: "AI gave two different answers. You should…", content: { options: ["Check which one is right", "Trust the longer one", "Trust the first one", "Give up"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "Different answers mean verify time — you decide.", hints: ["Who is the boss?"] });

  // U1L3 — Your First Prompt
  await mk(aiLessons[2]._id, 0, { type: "multiple_choice", prompt: "A prompt is…", content: { options: ["The message you write to the AI", "A computer virus", "A kind of keyboard", "An error"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "Your words are the steering wheel.", hints: ["Your message."] });
  await mk(aiLessons[2]._id, 1, { type: "ai_prompt", prompt: "Write your first prompt", content: { scenario: "Your mission: ask the AI for a fun fact about YOUR favorite animal.", aiTask: "You are Codingo, a friendly tutor for absolute beginners. Answer in under 60 words, simply, zero jargon. The learner asked:", placeholder: "e.g. Tell me a fun fact about dogs…", checklist: ["Is the answer about YOUR animal?", "Could a beginner understand it?"], exampleAnswer: "Dogs can smell feelings! A dog's nose has about 300 million scent sensors while humans have only 6 million. That is how your dog knows when you are happy or sad." }, solution: { checklist: [true, true] }, explanation: "You did it — you steered the AI. Clear ask, fun answer.", hints: ["Name your animal first."] });
  await mk(aiLessons[2]._id, 2, { type: "multiple_choice", prompt: "After the AI answers, you should…", content: { options: ["Read it and check it makes sense", "Close your eyes and trust it", "Delete it immediately", "Send it to everyone"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "Read and check — two seconds that save you always.", hints: ["Two seconds."] });
  await mk(aiLessons[2]._id, 3, { type: "fill_blank", prompt: "The ___ your ask, the better the answer", content: { code: "The ___ your ask, the better the answer.", blank: "clearer", options: ["clearer", "longer", "louder", "shorter"] }, solution: { answer: "clearer" }, explanation: "Clear beats long every time.", hints: ["Not loud."] });
  await mk(aiLessons[2]._id, 4, { type: "multiple_choice", prompt: "Being polite to AI…", content: { options: ["Costs nothing, but clarity matters more", "Is banned", "Breaks the AI", "Gives extra XP"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "Manners are free — but specific words do the work.", hints: ["What does the work?"] });

  // U1L4 — Checkpoint: Buddy Basics
  await mk(aiLessons[3]._id, 0, { type: "multiple_choice", prompt: "AI learns from…", content: { options: ["Tons of examples", "Magic spells", "One textbook", "Dreams"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "Examples all the way down.", hints: ["Examples."] });
  await mk(aiLessons[3]._id, 1, { type: "fill_blank", prompt: "Never paste ___ into AI", content: { code: "Never paste ___ into AI.", blank: "passwords", options: ["passwords", "questions", "ideas", "jokes"] }, solution: { answer: "passwords" }, explanation: "Secrets stay with you.", hints: ["Rule one."] });
  await mk(aiLessons[3]._id, 2, { type: "arrange", prompt: "Chat order", content: { blocks: ["Ask clearly", "Read the reply", "Check it makes sense"] }, solution: { order: [0, 1, 2] }, explanation: "Ask, read, check.", hints: ["Ask first."] });
  await mk(aiLessons[3]._id, 3, { type: "multiple_choice", prompt: "AI sounds sure but the fact matters. You…", content: { options: ["Verify with a trusted source", "Believe it", "Ask louder", "Ignore it"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "Matters means verify.", hints: ["Source."] });
  await mk(aiLessons[3]._id, 4, { type: "fill_blank", prompt: "Your message to the AI is called a ___", content: { code: "Your message to the AI is called a ___.", blank: "prompt", options: ["prompt", "program", "password", "printer"] }, solution: { answer: "prompt" }, explanation: "Prompt — your steering wheel.", hints: ["Steering wheel."] });
  await mk(aiLessons[3]._id, 5, { type: "multiple_choice", prompt: "Best first prompt?", content: { options: ["Clear and specific", "One vague word", "ALL CAPS", "No words"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "Clear and specific wins.", hints: ["Specific."] });

  // U2L5 — Be Specific
  await mk(aiLessons[4]._id, 0, { type: "multiple_choice", prompt: "Which prompt gets a better answer?", content: { options: ["'Explain loops with a cooking example in 3 short lines'", "'Tell me stuff'", "'You know what I mean'", "'Do the thing'"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "Details are instructions the AI can actually follow.", hints: ["Longest one."] });
  await mk(aiLessons[4]._id, 1, { type: "ai_prompt", prompt: "Make it specific", content: { scenario: "Vague: 'Tell me about space.' Your mission: rewrite it as a specific prompt — pick ONE planet and ask for 3 short facts.", aiTask: "You are Codingo, a friendly tutor for absolute beginners. Follow the learner's specific request closely. Under 80 words, simple, no jargon. The learner asked:", placeholder: "e.g. Give me 3 short facts about Mars…", checklist: ["Did the answer follow YOUR details?", "Is it specific, not generic?"], exampleAnswer: "Mars is called the Red Planet because of rusty dust. It has the tallest volcano, Olympus Mons, nearly 3 times Everest's height. A day on Mars lasts 24 hours and 37 minutes — almost like Earth!" }, solution: { checklist: [true, true] }, explanation: "See the difference? Your details shaped the answer.", hints: ["Planet + number + short."] });
  await mk(aiLessons[4]._id, 2, { type: "fill_blank", prompt: "Add numbers, names, and ___ to vague prompts", content: { code: "Add numbers, names, and ___ to vague prompts.", blank: "details", options: ["details", "emojis", "shouting", "silence"] }, solution: { answer: "details" }, explanation: "Details turn fog into focus.", hints: ["Focus word."] });
  await mk(aiLessons[4]._id, 3, { type: "multiple_choice", prompt: "Vague in, ___ out.", content: { options: ["vague", "perfect", "code", "money"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "The golden rule of prompting.", hints: ["Same word."] });
  await mk(aiLessons[4]._id, 4, { type: "multiple_choice", prompt: "A specific prompt includes…", content: { options: ["Topic + format + length", "Mystery + suspense", "Caps lock", "Nothing"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "Topic, format, length — the magic trio.", hints: ["Trio."] });

  // U2L6 — Give It Context
  await mk(aiLessons[5]._id, 0, { type: "multiple_choice", prompt: "'Act as my teacher…' helps because…", content: { options: ["The AI matches that style and level", "Teachers get discounts", "It unlocks secret mode", "It runs faster"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "A role sets the style — teacher, coach, chef, friend.", hints: ["Style."] });
  await mk(aiLessons[5]._id, 1, { type: "ai_prompt", prompt: "Add your context", content: { scenario: "Your mission: ask for a 3-day study plan. Give context: YOUR subject and YOUR grade.", aiTask: "You are Codingo, a friendly tutor for absolute beginners. Use the learner's subject and grade. Reply as a short 3-day plan, under 90 words, simple. The learner asked:", placeholder: "e.g. I am in grade 8, maths exam Friday. Make a 3-day plan…", checklist: ["Does the plan mention YOUR subject?", "Is it split into days or steps?"], exampleAnswer: "Day 1: Fractions basics — 20 minutes of adding halves and quarters. Day 2: Practice 10 mixed problems and circle the tricky ones. Day 3: Redo the circled ones, then quiz yourself. You are ready, grade-8 star!" }, solution: { checklist: [true, true] }, explanation: "Context turned a generic plan into YOUR plan.", hints: ["Subject + grade + days."] });
  await mk(aiLessons[5]._id, 2, { type: "multiple_choice", prompt: "Context means…", content: { options: ["Background info that shapes the answer", "Secret passwords", "Extra emojis", "Louder words"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "Background info is rocket fuel for answers.", hints: ["Background."] });
  await mk(aiLessons[5]._id, 3, { type: "fill_blank", prompt: "Tell the AI WHO you are and WHAT you ___", content: { code: "Tell the AI WHO you are and WHAT you ___.", blank: "need", options: ["need", "ate", "lost", "broke"] }, solution: { answer: "need" }, explanation: "Who + what = answers that fit.", hints: ["Fit word."] });
  await mk(aiLessons[5]._id, 4, { type: "multiple_choice", prompt: "Which has better context?", content: { options: ["'I am 12 and new to chess. Teach me how the knight moves in 2 lines.'", "'Chess.'", "'Teach.'", "'???'"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "Age + level + topic + length — full context.", hints: ["Fullest one."] });

  // U2L7 — Show an Example
  await mk(aiLessons[6]._id, 0, { type: "multiple_choice", prompt: "Giving an example first…", content: { options: ["Teaches the AI the exact format you want", "Confuses the AI", "Slows everything down", "Costs money"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "Show, then ask — the oldest teaching trick works on AI too.", hints: ["Show, then ask."] });
  await mk(aiLessons[6]._id, 1, { type: "arrange", prompt: "Teach by example", content: { blocks: ["Show the format you want", "Ask for the same style", "Check the result"] }, solution: { order: [0, 1, 2] }, explanation: "Show, ask, check.", hints: ["Show first."] });
  await mk(aiLessons[6]._id, 2, { type: "ai_prompt", prompt: "Show, then ask", content: { scenario: "First show the format: 'Give ideas like this: 1. Idea — one line why.' Then ask for 3 birthday party ideas.", aiTask: "You are Codingo, a friendly tutor for absolute beginners. Copy the learner's format exactly. Under 70 words. The learner asked:", placeholder: "e.g. Give ideas like this: 1. Idea — one line why. Now: 3 birthday ideas…", checklist: ["Did it copy YOUR numbered format?", "Are there at least 2 ideas?"], exampleAnswer: "1. Movie night — everyone votes for the film. 2. Pizza cooking battle — teams, one oven, total chaos. 3. Backyard treasure hunt — clues lead to the cake!" }, solution: { checklist: [true, true] }, explanation: "Format in, format out. You are directing now.", hints: ["Format first."] });
  await mk(aiLessons[6]._id, 3, { type: "multiple_choice", prompt: "Format means…", content: { options: ["The shape of the answer: list, lines, style", "Shouting", "A font", "A secret"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "Shape of the answer.", hints: ["Shape."] });
  await mk(aiLessons[6]._id, 4, { type: "fill_blank", prompt: "Show one ___ answer, then ask for more", content: { code: "Show one ___ answer, then ask for more.", blank: "good", options: ["good", "long", "loud", "late"] }, solution: { answer: "good" }, explanation: "One good example beats ten vague words.", hints: ["Quality word."] });

  // U2L8 — Checkpoint: Prompting
  await mk(aiLessons[7]._id, 0, { type: "multiple_choice", prompt: "Best prompt?", content: { options: ["'Explain photosynthesis in 2 simple lines with one example'", "'Science stuff'", "'???'", "'Do it'"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "Topic + length + example — textbook specific.", hints: ["Textbook."] });
  await mk(aiLessons[7]._id, 1, { type: "fill_blank", prompt: "Vague in, ___ out", content: { code: "Vague in, ___ out.", blank: "vague", options: ["vague", "perfect", "code", "gold"] }, solution: { answer: "vague" }, explanation: "Golden rule.", hints: ["Same word."] });
  await mk(aiLessons[7]._id, 2, { type: "arrange", prompt: "Pro prompting order", content: { blocks: ["Be specific", "Add context", "Show an example", "Check the answer"] }, solution: { order: [0, 1, 2, 3] }, explanation: "Specific, context, example, check.", hints: ["Specific first."] });
  await mk(aiLessons[7]._id, 3, { type: "multiple_choice", prompt: "Context is…", content: { options: ["Background info like grade and goal", "A password", "An emoji", "A louder voice"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "Background info.", hints: ["Background."] });
  await mk(aiLessons[7]._id, 4, { type: "fill_blank", prompt: "Roles like 'act as a ___' set the style", content: { code: "Roles like 'act as a ___' set the style.", blank: "teacher", options: ["teacher", "potato", "printer", "virus"] }, solution: { answer: "teacher" }, explanation: "Roles set style.", hints: ["Style setter."] });
  await mk(aiLessons[7]._id, 5, { type: "multiple_choice", prompt: "After any AI answer…", content: { options: ["Check it before trusting it", "Frame it", "Worship it", "Delete it"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "Always check.", hints: ["Check."] });

  // U3L9 — Ask AI to Write Code
  await mk(aiLessons[8]._id, 0, { type: "ai_prompt", prompt: "Ask AI for code", content: { scenario: "Your mission: ask the AI to write JavaScript that prints 'Hello' plus YOUR name with console.log.", aiTask: "You are Codingo, a friendly tutor for absolute beginners. Reply with ONLY one line of JavaScript code using console.log, no explanation. The learner asked:", placeholder: "e.g. Write JS that prints Hello plus my name Ava…", checklist: ["Did it use console.log?", "Does it print a name greeting?"], exampleAnswer: "console.log(\"Hello Ava\");" }, solution: { checklist: [true, true] }, explanation: "First AI-written program. But does it actually run? Prove it next.", hints: ["Say: JavaScript, console.log, the name."] });
  await mk(aiLessons[8]._id, 1, { type: "write_code", prompt: "Prove it runs: print Hello Codingo", content: { starterCode: "console.log(\"___\");", tests: [{ expected: "Hello Codingo" }] }, solution: { code: "console.log(\"Hello Codingo\");" }, explanation: "It runs! AI words become real programs.", hints: ["Quotes."] });
  await mk(aiLessons[8]._id, 2, { type: "multiple_choice", prompt: "Before trusting AI-written code…", content: { options: ["Run it and see what happens", "Ship it to users", "Frame it", "Trust the confidence"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "Running is believing — your new superpower.", hints: ["Run it."] });
  await mk(aiLessons[8]._id, 3, { type: "multiple_choice", prompt: "console.log is for…", content: { options: ["Printing output you can see", "Saving files", "Deleting code", "Making coffee"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "Printing output.", hints: ["Printing."] });
  await mk(aiLessons[8]._id, 4, { type: "fill_blank", prompt: "AI writes the draft, YOU ___ it", content: { code: "AI writes the draft, YOU ___ it.", blank: "run", options: ["run", "frame", "fear", "skip"] }, solution: { answer: "run" }, explanation: "You run it.", hints: ["Run."] });

  // U3L10 — AI Makes Mistakes
  await mk(aiLessons[9]._id, 0, { type: "multiple_choice", prompt: "The AI gave you code with total confidence. You…", content: { options: ["Test it before trusting it", "Trust the confidence", "Delete your project", "Applaud"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "Confidence is a tone of voice, not a correctness meter.", hints: ["Test it."] });
  await mk(aiLessons[9]._id, 1, { type: "fix_bug", prompt: "The AI wrote this adder, but it is wrong. Fix it to log 5.", content: { code: "// AI's adder — looks right, runs wrong\nfunction add(a, b) {\n return a - b;\n}\nconsole.log(add(2, 3));", tests: [{ expected: "5" }] }, solution: { fixed: "function add(a,b){return a+b;}console.log(add(2,3));" }, explanation: "Minus instead of plus — the classic confident mistake. YOU caught it.", hints: ["Minus or plus?"] });
  await mk(aiLessons[9]._id, 2, { type: "predict_output", prompt: "What does the AI's buggy version print?", content: { snippet: "function add(a,b){return a-b;}\nconsole.log(add(2,3));", options: ["-1", "5", "23", "error"] }, solution: { answer: "-1" }, explanation: "2 minus 3 is -1 — bug confirmed.", hints: ["Minus."] });
  await mk(aiLessons[9]._id, 3, { type: "multiple_choice", prompt: "Catching AI mistakes makes you…", content: { options: ["The pilot — AI is the copilot", "Useless", "Slower forever", "A hater"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "Pilot and copilot: you fly, AI assists.", hints: ["Who flies?"] });
  await mk(aiLessons[9]._id, 4, { type: "fill_blank", prompt: "Test every ___ the AI writes", content: { code: "Test every ___ the AI writes.", blank: "line", options: ["line", "poem", "song", "excuse"] }, solution: { answer: "line" }, explanation: "Every line.", hints: ["Line."] });

  // U3L11 — Debug With AI
  await mk(aiLessons[10]._id, 0, { type: "ai_prompt", prompt: "Ask about the error", content: { scenario: "Your mission: paste this error and ask the AI to explain it like you are 10: TypeError: undefined is not a function", aiTask: "You are Codingo, a friendly tutor for absolute beginners. Explain the learner's error in under 70 words with one fun everyday comparison. Zero jargon. The error is:", placeholder: "e.g. Explain this error like I am 10: TypeError…", checklist: ["Did it explain WITHOUT scary jargon?", "Did it give one thing to try next?"], exampleAnswer: "Imagine pressing a TV remote button that does not exist — nothing happens and the TV complains. That is this error: your code called something that is not there. Check the spelling of the function name first!" }, solution: { checklist: [true, true] }, explanation: "Errors are clues, and now you have a translator.", hints: ["Paste the error + like I am 10."] });
  await mk(aiLessons[10]._id, 1, { type: "predict_output", prompt: "Read this AI-written code. What prints?", content: { snippet: "let msg = \"Hi\";\nconsole.log(msg + \"!\");", options: ["Hi!", "Hi", "Hi !", "error"] }, solution: { answer: "Hi!" }, explanation: "Plus joins with no extra space.", hints: ["No space added."] });
  await mk(aiLessons[10]._id, 2, { type: "multiple_choice", prompt: "An error message is…", content: { options: ["A clue pointing at the problem", "An insult", "The end", "Random words"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "Clues, not insults.", hints: ["Clue."] });
  await mk(aiLessons[10]._id, 3, { type: "fill_blank", prompt: "Read errors ___ — they say where it hurts", content: { code: "Read errors ___ — they say where it hurts.", blank: "slowly", options: ["slowly", "never", "loudly", "angrily"] }, solution: { answer: "slowly" }, explanation: "Slow reading finds fast fixes.", hints: ["Slow."] });
  await mk(aiLessons[10]._id, 4, { type: "multiple_choice", prompt: "Best debug loop?", content: { options: ["Ask AI, try the fix, run, check", "Panic", "Delete everything", "Blame the keyboard"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "Ask, try, run, check.", hints: ["Loop."] });

  // U3L12 — Checkpoint: Pair Programming
  await mk(aiLessons[11]._id, 0, { type: "multiple_choice", prompt: "Pilot and copilot means…", content: { options: ["You decide, AI assists", "AI decides everything", "Two pilots fight", "No flying"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "You decide.", hints: ["Decide."] });
  await mk(aiLessons[11]._id, 1, { type: "fix_bug", prompt: "Fix the AI's greeting to log HiAva", content: { code: "console.log(\"Hi\" - \"Ava\");", tests: [{ expected: "HiAva" }] }, solution: { fixed: "console.log(\"Hi\"+\"Ava\");" }, explanation: "Minus on strings gives NaN — plus joins.", hints: ["Join, don't subtract."] });
  await mk(aiLessons[11]._id, 2, { type: "arrange", prompt: "Ship AI code safely", content: { blocks: ["Ask the AI", "Run it yourself", "Fix what breaks", "Ship it"] }, solution: { order: [0, 1, 2, 3] }, explanation: "Ask, run, fix, ship.", hints: ["Ask first."] });
  await mk(aiLessons[11]._id, 3, { type: "predict_output", prompt: "What prints?", content: { snippet: "let a=\"AI\";\nconsole.log(a+\"human\");", options: ["AIhuman", "AI human", "AI+human", "error"] }, solution: { answer: "AIhuman" }, explanation: "Plus joins directly.", hints: ["Join."] });
  await mk(aiLessons[11]._id, 4, { type: "fill_blank", prompt: "Always ___ AI code before trusting it", content: { code: "Always ___ AI code before trusting it.", blank: "run", options: ["run", "frame", "fear", "skip"] }, solution: { answer: "run" }, explanation: "Always run.", hints: ["Run."] });
  await mk(aiLessons[11]._id, 5, { type: "write_code", prompt: "Print AI + human: AIhuman", content: { starterCode: "console.log(\"AI\" ___ \"human\");", tests: [{ expected: "AIhuman" }] }, solution: { code: "console.log(\"AI\" + \"human\");" }, explanation: "Joined!", hints: ["Plus."] });

  // U4L13 — Plan a Project With AI
  await mk(aiLessons[12]._id, 0, { type: "ai_prompt", prompt: "Ask for a plan", content: { scenario: "Your mission: ask the AI to break a 'birthday reminder app' into 4 small build steps.", aiTask: "You are Codingo, a friendly tutor for absolute beginners. Break the learner's project into short numbered steps, under 90 words, simple. The learner asked:", placeholder: "e.g. Break a birthday reminder app into 4 small steps…", checklist: ["Can you count clear steps?", "Is each step small enough for one sitting?"], exampleAnswer: "1. Make a list of birthdays with names and dates. 2. Write code that checks if any date is today. 3. Print a celebration message for matches. 4. Test with your own birthday first!" }, solution: { checklist: [true, true] }, explanation: "Big dreams, tiny steps — that is how apps get built.", hints: ["Project + number of steps."] });
  await mk(aiLessons[12]._id, 1, { type: "arrange", prompt: "Build order", content: { blocks: ["Plan tiny steps", "Build step one", "Test it", "Repeat"] }, solution: { order: [0, 1, 2, 3] }, explanation: "Plan, build, test, repeat.", hints: ["Plan first."] });
  await mk(aiLessons[12]._id, 2, { type: "multiple_choice", prompt: "A giant 'build me an app' ask usually gives…", content: { options: ["A giant confusing answer", "A perfect app", "Nothing", "Money"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "Small asks get useful answers.", hints: ["Giant in…"] });
  await mk(aiLessons[12]._id, 3, { type: "fill_blank", prompt: "Small ___ beat giant asks", content: { code: "Small ___ beat giant asks.", blank: "steps", options: ["steps", "dreams", "keyboards", "snacks"] }, solution: { answer: "steps" }, explanation: "Small steps.", hints: ["Steps."] });
  await mk(aiLessons[12]._id, 4, { type: "multiple_choice", prompt: "Planning first saves you from…", content: { options: ["Getting lost halfway", "Having fun", "Learning", "Typing"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "Plans are maps.", hints: ["Lost."] });

  // U4L14 — Trust, But Verify
  await mk(aiLessons[13]._id, 0, { type: "multiple_choice", prompt: "Never paste into AI…", content: { options: ["Passwords, keys, OTPs, private data", "Homework questions", "Jokes", "Ideas"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "Rule one, forever: secrets stay with you.", hints: ["Rule one."] });
  await mk(aiLessons[13]._id, 1, { type: "multiple_choice", prompt: "AI sometimes invents fake libraries. You…", content: { options: ["Check the docs or a trusted source", "Install whatever it names", "Quote it in homework", "Panic"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "If it sounds too perfect, verify.", hints: ["Too perfect?"] });
  await mk(aiLessons[13]._id, 2, { type: "fill_blank", prompt: "Treat AI output as a ___, not a fact", content: { code: "Treat AI output as a ___, not a fact.", blank: "draft", options: ["draft", "law", "prophecy", "bill"] }, solution: { answer: "draft" }, explanation: "Drafts get reviewed.", hints: ["Draft."] });
  await mk(aiLessons[13]._id, 3, { type: "multiple_choice", prompt: "A friend says 'the AI said so, must be true.' You say…", content: { options: ["'Cool draft — let's verify it together'", "'All hail the AI'", "'Burn the books'", "'Stop thinking'"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "Verify together — expert behavior.", hints: ["Together."] });
  await mk(aiLessons[13]._id, 4, { type: "multiple_choice", prompt: "Safest habit?", content: { options: ["Run, read, and check everything", "Copy-paste blindly", "Share your passwords", "Skip testing"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "Run, read, check.", hints: ["Three verbs."] });

  // U4L15 — Pro Habits
  await mk(aiLessons[14]._id, 0, { type: "multiple_choice", prompt: "Copying AI code you don't understand…", content: { options: ["Feels fast, breaks later — learn it instead", "Is the expert way", "Gives double XP", "Is required"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "Understanding compounds; copying evaporates.", hints: ["Later."] });
  await mk(aiLessons[14]._id, 1, { type: "arrange", prompt: "The expert loop", content: { blocks: ["Ask small", "Run it", "Check it", "Improve it"] }, solution: { order: [0, 1, 2, 3] }, explanation: "Ask, run, check, improve.", hints: ["Ask first."] });
  await mk(aiLessons[14]._id, 2, { type: "multiple_choice", prompt: "Stuck for 10 minutes? Best move…", content: { options: ["Ask the AI to explain, then try again", "Quit coding forever", "Smash keyboard", "Copy a full project"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "Explain, then try.", hints: ["Explain."] });
  await mk(aiLessons[14]._id, 3, { type: "fill_blank", prompt: "Learn, don't just ___", content: { code: "Learn, don't just ___.", blank: "copy", options: ["copy", "run", "test", "think"] }, solution: { answer: "copy" }, explanation: "Learn it.", hints: ["Copy."] });
  await mk(aiLessons[14]._id, 4, { type: "ai_prompt", prompt: "Learn, don't copy", content: { scenario: "Your mission: ask the AI to explain this line like you are 10: let score = score + 1;", aiTask: "You are Codingo, a friendly tutor for absolute beginners. Explain the learner's line in under 60 words with one everyday comparison. Zero jargon. The line is:", placeholder: "e.g. Explain like I am 10: let score = score + 1;…", checklist: ["Did it say the score grows by one?", "Was it jargon-free?"], exampleAnswer: "Think of a piggy bank labeled score. This line opens it, drops in one more coin, and closes it. Old score plus one becomes the new score!" }, solution: { checklist: [true, true] }, explanation: "Understanding one line deeply beats skimming ten.", hints: ["The line + like I am 10."] });
  await mk(aiLessons[14]._id, 5, { type: "multiple_choice", prompt: "Experts use AI to…", content: { options: ["Learn faster, not think less", "Avoid all thinking", "Cheat on everything", "Sleep"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "Faster learning, same brain.", hints: ["Faster."] });

  // U4L16 — Capstone: Ship It With AI
  await mk(aiLessons[15]._id, 0, { type: "ai_prompt", prompt: "Plan your capstone", content: { scenario: "Capstone plan: ask the AI to plan a 'greeting card' program — 3 steps with console.log art.", aiTask: "You are Codingo, a friendly tutor for absolute beginners. Plan the learner's greeting card program in exactly 3 short numbered steps mentioning console.log. Under 80 words. The learner asked:", placeholder: "e.g. Plan a greeting card program in 3 steps with console.log…", checklist: ["Does the plan have numbered steps?", "Does it mention printing or console.log?"], exampleAnswer: "1. Print a top border with console.log stars. 2. Print your message line in the middle. 3. Print a bottom border — card complete. Run it and admire your work!" }, solution: { checklist: [true, true] }, explanation: "A plan you made WITH ai — expert move.", hints: ["3 steps + console.log."] });
  await mk(aiLessons[15]._id, 1, { type: "write_code", prompt: "Build it: print Happy Birthday, then Made with AI", content: { starterCode: "console.log(\"___\");\nconsole.log(\"Made with AI\");", tests: [{ expected: "Happy Birthday\nMade with AI" }] }, solution: { code: "console.log(\"Happy Birthday\");\nconsole.log(\"Made with AI\");" }, explanation: "Shipped! From zero to builder with an AI buddy.", hints: ["Line one is yours."] });
  await mk(aiLessons[15]._id, 2, { type: "multiple_choice", prompt: "You finished the AI path. You are now…", content: { options: ["Someone who codes WITH ai, safely and smartly", "An AI", "Done learning forever", "A password"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "Coder with AI — title earned.", hints: ["With AI."] });
  await mk(aiLessons[15]._id, 3, { type: "multiple_choice", prompt: "Keep the streak alive by…", content: { options: ["One lesson a day", "One lesson a year", "Never opening the app", "Deleting lessons"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "Daily reps.", hints: ["Daily."] });
  await mk(aiLessons[15]._id, 4, { type: "fill_blank", prompt: "From newbie to ___ — with AI beside you", content: { code: "From newbie to ___ — with AI beside you.", blank: "expert", options: ["expert", "potato", "printer", "ghost"] }, solution: { answer: "expert" }, explanation: "Expert. You made it.", hints: ["You."] });

  return {
    slug: "code-with-ai",
    title: aiCourse.title,
    units: aiUnits.length,
    lessons: aiLessons.length,
    exercises: exTotal,
    keepUnitTitles: aiUnitsData.map((u) => u.title),
    keepLessonKeys: new Set(aiLessonsData.map((ld) => lessonKey(aiUnitsData[ld.unit].title, ld.title))),
  };
}

/* ---------------- Data-driven courses ---------------- */

/* Walks a CourseSpec and upserts it with the same helpers the hand-written
   courses use, so a course authored as data is exactly as safe to reseed.
   Array order decides `order`, which makes mismatched unit/lesson indices
   impossible to author. */
async function seedCourseFromSpec(spec: CourseSpec): Promise<SeedResult> {
  const course = await upsertCourse(spec.course);
  const keepUnitTitles: string[] = [];
  const keepLessonKeys = new Set<string>();
  let units = 0;
  let lessons = 0;
  let exercises = 0;

  for (const [unitIndex, unitSpec] of spec.units.entries()) {
    const unit = await upsertUnit({
      courseId: course._id,
      title: unitSpec.title,
      description: unitSpec.description,
      order: unitIndex,
    });
    units += 1;
    keepUnitTitles.push(unit.title);

    for (const [lessonIndex, lessonSpec] of unitSpec.lessons.entries()) {
      const lesson = await upsertLesson({
        unitId: unit._id,
        title: lessonSpec.title,
        description: lessonSpec.description,
        order: lessonIndex,
        xpReward: lessonSpec.xpReward,
      });
      lessons += 1;
      keepLessonKeys.add(lessonKey(unit.title, lesson.title));

      for (const [exerciseIndex, exercise] of lessonSpec.exercises.entries()) {
        exercises += 1;
        await upsertExercise(lesson._id, exerciseIndex, {
          type: exercise.type,
          prompt: exercise.prompt,
          content: exercise.content,
          solution: exercise.solution,
          explanation: exercise.explanation,
          hints: exercise.hints,
        });
      }
    }
  }

  return {
    slug: spec.slug,
    title: course.title,
    units,
    lessons,
    exercises,
    keepUnitTitles,
    keepLessonKeys,
  };
}

/* ---------------- Runner ---------------- */

type CourseSeed = { title: string; run: () => Promise<SeedResult> };

const COURSE_SEEDS: Record<string, CourseSeed> = {
  "js-from-zero": { title: "JS from Zero", run: seedJsFromZero },
  "code-with-ai": { title: "Code with AI", run: seedCodeWithAi },
  "python-from-zero": { title: "Python from Zero", run: () => seedCourseFromSpec(pythonFromZero) },
};

const USAGE = `Seed a single course without touching any other course or learner progress.

  bun src/seed/seed.ts --course <slug>   rebuild one course
  bun src/seed/seed.ts --all             rebuild every course
  bun src/seed/seed.ts --list            list the available slugs

How it stays safe:
  * Only the selected course's units, lessons and exercises are written.
  * Nodes are upserted on a natural key, so existing lessons keep their _id and
    learner Progress keeps pointing at them.
  * Lessons dropped from the seed are deleted only when no learner has progress
    on them; otherwise they are reported and left untouched.`;

function parseArgs(argv: string[]) {
  const parsed: { course: string | null; all: boolean; list: boolean; help: boolean } = {
    course: null,
    all: false,
    list: false,
    help: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--course" || arg === "-c") parsed.course = argv[i + 1] ?? null;
    else if (arg.startsWith("--course=")) parsed.course = arg.slice("--course=".length);
    else if (arg === "--all") parsed.all = true;
    else if (arg === "--list") parsed.list = true;
    else if (arg === "--help" || arg === "-h") parsed.help = true;
    else if (!arg.startsWith("-") && !parsed.course) parsed.course = arg;
  }
  return parsed;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.list) {
    console.log("Available courses:");
    for (const [slug, seed] of Object.entries(COURSE_SEEDS)) {
      console.log(`  ${slug.padEnd(16)} ${seed.title}`);
    }
    return;
  }

  /* No target means no write. Seeding is never implicit. */
  if (args.help || (!args.course && !args.all)) {
    console.log(USAGE);
    if (!args.help) process.exitCode = 1;
    return;
  }

  const selected: [string, CourseSeed][] = args.all
    ? Object.entries(COURSE_SEEDS)
    : Object.entries(COURSE_SEEDS).filter(([slug]) => slug === args.course);

  if (!selected.length) {
    console.error(`Unknown course "${args.course}". Run with --list to see the available slugs.`);
    process.exitCode = 1;
    return;
  }

  await connectDb();
  try {
    for (const [slug, seed] of selected) {
      const result = await seed.run();
      const prune = await pruneCourse(result);
      const pruned = prune.deleted ? `, pruned ${prune.deleted} stale lesson(s)` : "";
      console.log(
        `Seeded ${slug}: ${result.units} units, ${result.lessons} lessons, ${result.exercises} exercises${pruned}.`,
      );
      for (const note of prune.skipped) console.log(`  kept: ${note}`);
    }
  } finally {
    await disconnectDb();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
