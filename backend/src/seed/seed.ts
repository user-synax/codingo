import { connectDb, disconnectDb } from "../config/db.js";
import { Course } from "../models/Course.js";
import { Unit } from "../models/Unit.js";
import { Lesson } from "../models/Lesson.js";
import { Exercise } from "../models/Exercise.js";

async function main() {
  await connectDb();

  // Clean existing course data (keep users)
  await Exercise.deleteMany({});
  await Lesson.deleteMany({});
  await Unit.deleteMany({});
  await Course.deleteMany({});

  const course = await Course.create({
    title: "JavaScript Basics",
    language: "javascript",
    description: "Learn JavaScript from scratch — variables, loops, functions.",
    order: 0,
  });

  const unit = await Unit.create({
    courseId: course._id,
    title: "Unit 1 — Fundamentals",
    description: "Variables, loops, functions",
    order: 0,
  });

  // Lesson 1 — Variables
  const l1 = await Lesson.create({ unitId: unit._id, title: "Variables & Types", description: "let, const, types", order: 0, xpReward: 10 });
  // Lesson 2 — Loops
  const l2 = await Lesson.create({ unitId: unit._id, title: "Loops", description: "for and while", order: 1, xpReward: 10 });
  // Lesson 3 — Functions
  const l3 = await Lesson.create({ unitId: unit._id, title: "Functions", description: "declare and call", order: 2, xpReward: 15 });

  // Helper to create 5 exercises per lesson covering all 6 types across the course
  const mk = async (lessonId: unknown, order: number, doc: unknown) =>
    Exercise.create({ lessonId, order, ...(doc as object) });

  // L1 exercises
  await mk(l1._id, 0, {
    type: "multiple_choice",
    prompt: "Which keyword declares a block-scoped variable that can be reassigned?",
    content: { options: ["var", "let", "const", "int"], correctIndex: 1 },
    solution: { correctIndex: 1 },
    explanation: "let is block-scoped and reassignable; const is not reassignable; var is function-scoped.",
    hints: ["Think about scope — block vs function."],
  });
  await mk(l1._id, 1, {
    type: "fill_blank",
    prompt: "Fill the blank to create a constant named PI with value 3.14",
    content: { code: "___ PI = 3.14;", blank: "const", options: ["const", "let", "var"] },
    solution: { answer: "const" },
    explanation: "Constants use const and cannot be reassigned.",
    hints: ["Constants can't change — which keyword enforces that?"],
  });
  await mk(l1._id, 2, {
    type: "arrange",
    prompt: "Arrange the lines to log numbers 1 to 3",
    content: { blocks: ["for (let i=1; i<=3; i++) {", "  console.log(i);", "}"] },
    solution: { order: [0, 1, 2] },
    explanation: "The loop header comes first, then the body, then the closing brace.",
    hints: ["The for (...) header must be on top."],
  });
  await mk(l1._id, 3, {
    type: "predict_output",
    prompt: "What will this log?",
    content: { snippet: "let x = 2;\n x += 3;\n console.log(x);", options: ["2", "5", "3", "23"] },
    solution: { answer: "5" },
    explanation: "x starts 2, then +=3 makes 5.",
    hints: ["+= means add and assign."],
  });
  await mk(l1._id, 4, {
    type: "write_code",
    prompt: "Write a function double(n) that returns n * 2. Call it with 5 and log the result.",
    content: { starterCode: "function double(n) {\n  // return n*2\n}\nconsole.log(double(5));", tests: [{ expected: "10" }] },
    solution: { code: "function double(n){return n*2}\nconsole.log(double(5));" },
    explanation: "double should return n*2; calling with 5 logs 10.",
    hints: ["Return, don't just compute."],
  });

  // L2 — Loops (covers fix_bug + write_code + choice etc.)
  await mk(l2._id, 0, {
    type: "multiple_choice",
    prompt: "How many times will this loop run? for(let i=0;i<3;i++) {}",
    content: { options: ["2", "3", "4", "infinite"], correctIndex: 1 },
    solution: { correctIndex: 1 },
    explanation: "i=0,1,2 — three iterations.",
    hints: ["i goes 0 to <3."],
  });
  await mk(l2._id, 1, {
    type: "fix_bug",
    prompt: "Fix the bug so it logs 0 1 2 (each on new line)",
    content: {
      code: "for (let i=0; i<3; i--) {\n  console.log(i);\n}",
      tests: [{ expected: "0\n1\n2" }],
    },
    solution: { fixed: "for (let i=0; i<3; i++) {\n  console.log(i);\n}" },
    explanation: "i-- decrements — should be i++.",
    hints: ["Which direction should i move?"],
  });
  await mk(l2._id, 2, {
    type: "fill_blank",
    prompt: "Complete the while condition to loop while n > 0",
    content: { code: "while (___) {\n  n--;\n}", blank: "n > 0", options: ["n > 0", "n < 0", "n == 0"] },
    solution: { answer: "n > 0" },
    explanation: "Keep looping while n is positive.",
    hints: ["The loop stops when n is no longer >0."],
  });
  await mk(l2._id, 3, {
    type: "predict_output",
    prompt: "What does this log?",
    content: { snippet: "let s=0;\nfor(let i=1;i<=3;i++) s+=i;\n console.log(s);", options: ["3", "6", "9", "12"] },
    solution: { answer: "6" },
    explanation: "1+2+3 = 6.",
    hints: ["Add each i to s."],
  });
  await mk(l2._id, 4, {
    type: "write_code",
    prompt: "Write code to log numbers 0 to 4 using a for loop.",
    content: { starterCode: "for (let i=0; ___; ___) {\n  console.log(i);\n}", tests: [{ expected: "0\n1\n2\n3\n4" }] },
    solution: { code: "for(let i=0;i<5;i++){console.log(i);}" },
    explanation: "Loop i from 0 while i<5.",
    hints: ["Stop when i reaches 5."],
  });

  // L3 — Functions
  await mk(l3._id, 0, {
    type: "arrange",
    prompt: "Order to call a function after declaring it",
    content: { blocks: ["function greet(name){ return 'Hi ' + name; }", "let msg = greet('Ava');", "console.log(msg);"] },
    solution: { order: [0, 1, 2] },
    explanation: "Declare, then call, then log.",
    hints: ["Declaration first."],
  });
  await mk(l3._id, 1, {
    type: "multiple_choice",
    prompt: "What does `return` do inside a function?",
    content: { options: ["Prints to console", "Stops and gives a value", "Creates a variable", "Loops"], correctIndex: 1 },
    solution: { correctIndex: 1 },
    explanation: "return exits the function and provides a value.",
    hints: ["It's about giving back."],
  });
  await mk(l3._id, 2, {
    type: "predict_output",
    prompt: "Predict:",
    content: { snippet: "function add(a,b){return a+b;}\nconsole.log(add(2,3));", options: ["23", "5", "undefined", "NaN"] },
    solution: { answer: "5" },
    explanation: "2+3 =5.",
    hints: ["Add the args."],
  });
  await mk(l3._id, 3, {
    type: "fix_bug",
    prompt: "Fix it to return the sum — should log 5",
    content: {
      code: "function sum(a,b){\n  a + b;\n}\nconsole.log(sum(2,3));",
      tests: [{ expected: "5" }],
    },
    solution: { fixed: "function sum(a,b){\n  return a + b;\n}\nconsole.log(sum(2,3));" },
    explanation: "Need return, not just expression.",
    hints: ["The function computes but doesn't return."],
  });
  await mk(l3._id, 4, {
    type: "write_code",
    prompt: "Write function isEven(n) that returns true if n is even, else false. Test with 4.",
    content: { starterCode: "function isEven(n){\n  // return n%2===0\n}\nconsole.log(isEven(4));", tests: [{ expected: "true" }] },
    solution: { code: "function isEven(n){return n%2===0} console.log(isEven(4));" },
    explanation: "Even means n%2===0.",
    hints: ["Use % 2."],
  });

  console.log(`Seeded course ${course.title} with 3 lessons, 15 exercises.`);
  await disconnectDb();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
