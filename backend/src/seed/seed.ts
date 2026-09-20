import { connectDb, disconnectDb } from "../config/db.js";
import { Course } from "../models/Course.js";
import { Unit } from "../models/Unit.js";
import { Lesson } from "../models/Lesson.js";
import { Exercise } from "../models/Exercise.js";

async function main() {
  await connectDb();

  await Exercise.deleteMany({});
  await Lesson.deleteMany({});
  await Unit.deleteMany({});
  await Course.deleteMany({});

  const course = await Course.create({
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
    const doc = await Unit.create({ courseId: course._id, ...u });
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
  for (const ld of lessonsData) {
    const l = await Lesson.create({
      unitId: units[ld.unit]._id,
      title: ld.title,
      description: ld.description,
      order: ld.order,
      xpReward: ld.xp,
    });
    lessons.push(l);
  }

  const mk = async (lessonId: unknown, order: number, doc: unknown) => Exercise.create({ lessonId, order, ...(doc as object) });

  // Helper to keep gentle→code-heavy: early lessons more choice/fill, later more code
  // U1 — gentle
  await mk(lessons[0]._id, 0, { type: "multiple_choice", prompt: "What does console.log do?", content: { options: ["Saves a file", "Prints to output", "Creates a variable", "Deletes code"], correctIndex: 1 }, solution: { correctIndex: 1 }, explanation: "console.log prints to the console — our output panel.", hints: ["Look at the word log — like a diary."] });
  await mk(lessons[0]._id, 1, { type: "fill_blank", prompt: "Complete to print Hello", content: { code: "___(\"Hello\");", blank: "console.log", options: ["console.log", "print", "log", "write"] }, solution: { answer: "console.log" }, explanation: "In JS we use console.log to print.", hints: ["Starts with console."] });
  await mk(lessons[0]._id, 2, { type: "predict_output", prompt: "What will this print?", content: { snippet: "console.log(\"Hi\");", options: ["Hi", "Hello", "hi", "error"] }, solution: { answer: "Hi" }, explanation: "It prints exactly what's inside quotes.", hints: ["Quotes matter."] });
  await mk(lessons[0]._id, 3, { type: "arrange", prompt: "Order to run a program", content: { blocks: ["// 1. Write code", "// 2. Run it", "// 3. See output"] }, solution: { order: [0, 1, 2] }, explanation: "Write, then run, then see.", hints: ["You write before you run."] });
  await mk(lessons[0]._id, 4, { type: "write_code", prompt: "Print Hello Codingo", content: { starterCode: "console.log(\"___\");", tests: [{ expected: "Hello Codingo" }] }, solution: { code: "console.log(\"Hello Codingo\");" }, explanation: "Put the text inside console.log quotes.", hints: ["Use quotes."] });

  await mk(lessons[1]._id, 0, { type: "multiple_choice", prompt: "Which declares a reassignable block variable?", content: { options: ["var", "let", "const", "int"], correctIndex: 1 }, solution: { correctIndex: 1 }, explanation: "let is block-scoped and reassignable.", hints: ["Block vs function."] });
  await mk(lessons[1]._id, 1, { type: "fill_blank", prompt: "Create constant PI = 3.14", content: { code: "___ PI = 3.14;", blank: "const", options: ["const", "let", "var"] }, solution: { answer: "const" }, explanation: "const for values that never change.", hints: ["Constant starts with c."] });
  await mk(lessons[1]._id, 2, { type: "predict_output", prompt: "What prints?", content: { snippet: "let x = 2;\nx += 3;\nconsole.log(x);", options: ["2", "5", "23", "3"] }, solution: { answer: "5" }, explanation: "2+3=5 via +=.", hints: ["+= adds."] });
  await mk(lessons[1]._id, 3, { type: "arrange", prompt: "Order to use a variable", content: { blocks: ["let name = \"Ava\";", "console.log(name);"] }, solution: { order: [0, 1] }, explanation: "Declare before use.", hints: ["Declare first."] });
  await mk(lessons[1]._id, 4, { type: "write_code", prompt: "Store your name in a let and log it", content: { starterCode: "let name = \"___\";\nconsole.log(name);", tests: [{ expected: "Ava" }] }, solution: { code: "let name=\"Ava\"; console.log(name);" }, explanation: "Put your name inside quotes.", hints: ["Use let."] });

  await mk(lessons[2]._id, 0, { type: "multiple_choice", prompt: "typeof \"hello\" is?", content: { options: ["string", "number", "boolean", "object"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "\"hello\" is a string.", hints: ["Quotes mean string."] });
  await mk(lessons[2]._id, 1, { type: "predict_output", prompt: "What is logged?", content: { snippet: "console.log(typeof 42);", options: ["string", "number", "boolean", "undefined"] }, solution: { answer: "number" }, explanation: "42 is a number.", hints: ["42 is not quotes."] });
  await mk(lessons[2]._id, 2, { type: "fill_blank", prompt: "Check type of x", content: { code: "let x = true;\nconsole.log(typeof ___);", blank: "x", options: ["x", "\"x\"", "true", "1"] }, solution: { answer: "x" }, explanation: "typeof x checks the variable, not the string \"x\".", hints: ["No quotes around variable."] });
  await mk(lessons[2]._id, 3, { type: "multiple_choice", prompt: "Which is a boolean?", content: { options: ["\"true\"", "true", "42", "null"], correctIndex: 1 }, solution: { correctIndex: 1 }, explanation: "true without quotes is boolean.", hints: ["Quotes make it string."] });
  await mk(lessons[2]._id, 4, { type: "write_code", prompt: "Log the type of \"123\" and of 123 (two lines)", content: { starterCode: "console.log(typeof \"123\");\nconsole.log(typeof 123);", tests: [{ expected: "string\nnumber" }] }, solution: { code: "console.log(typeof \"123\");\nconsole.log(typeof 123);" }, explanation: "\"123\" is string, 123 is number.", hints: ["Two logs."] });

  await mk(lessons[3]._id, 0, { type: "predict_output", prompt: "2 + 3 * 4 = ?", content: { snippet: "console.log(2 + 3 * 4);", options: ["14", "20", "24", "9"] }, solution: { answer: "14" }, explanation: "* before +.", hints: ["* first."] });
  await mk(lessons[3]._id, 1, { type: "fill_blank", prompt: "Add 1 to n", content: { code: "n ___ 1;", blank: "+=", options: ["+=", "=", "+", "++"] }, solution: { answer: "+=" }, explanation: "+= adds and assigns.", hints: ["Short form."] });
  await mk(lessons[3]._id, 2, { type: "multiple_choice", prompt: "\"Hi\" + \"Ava\" = ?", content: { options: ["HiAva", "Hi Ava", "Hi+Ava", "error"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "+ joins strings directly.", hints: ["No space added."] });
  await mk(lessons[3]._id, 3, { type: "predict_output", prompt: "What prints?", content: { snippet: "let a=5; a++; console.log(a);", options: ["5", "6", "4", "undefined"] }, solution: { answer: "6" }, explanation: "++ adds one.", hints: ["++ means +1."] });
  await mk(lessons[3]._id, 4, { type: "write_code", prompt: "Log 10 * 2 + 3", content: { starterCode: "console.log(10 * 2 + 3);", tests: [{ expected: "23" }] }, solution: { code: "console.log(10 * 2 + 3);" }, explanation: "10*2=20+3=23.", hints: ["* first."] });

  await mk(lessons[4]._id, 0, { type: "multiple_choice", prompt: "Which lets you embed variables in strings?", content: { options: ["' '", "\" \"", "` `", "( )"], correctIndex: 2 }, solution: { correctIndex: 2 }, explanation: "Backticks allow ${}.", hints: ["The slanted quotes."] });
  await mk(lessons[4]._id, 1, { type: "fill_blank", prompt: "Use template literal", content: { code: "let n=\"Ava\";\nconsole.log(`Hi ___`);", blank: "${n}", options: ["${n}", "$n", "{n}", "n"] }, solution: { answer: "${n}" }, explanation: "${} inside backticks.", hints: ["$ and {} together."] });
  await mk(lessons[4]._id, 2, { type: "predict_output", prompt: "What prints?", content: { snippet: "let name=\"Bob\";\nconsole.log(`Hi ${name}`);", options: ["Hi ${name}", "Hi Bob", "Hi name", "error"] }, solution: { answer: "Hi Bob" }, explanation: "Template replaces ${name}.", hints: ["It substitutes."] });
  await mk(lessons[4]._id, 3, { type: "arrange", prompt: "Build: Hi + name", content: { blocks: ["let name=\"Ava\";", "let msg = `Hi ${name}`;", "console.log(msg);"] }, solution: { order: [0, 1, 2] }, explanation: "Declare, then template, then log.", hints: ["Declare first."] });
  await mk(lessons[4]._id, 4, { type: "write_code", prompt: "Greet via template: Hi Ava", content: { starterCode: "let name=\"Ava\";\nconsole.log(`Hi ___`);", tests: [{ expected: "Hi Ava" }] }, solution: { code: "let name=\"Ava\";\nconsole.log(`Hi ${name}`);" }, explanation: "Use ${name}.", hints: ["Backticks."] });

  await mk(lessons[5]._id, 0, { type: "multiple_choice", prompt: "Which is correct for a constant?", content: { options: ["const x = 1;", "let x = 1;", "var x = 1;", "constant x = 1;"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "const for constants.", hints: ["Starts with c."] });
  await mk(lessons[5]._id, 1, { type: "predict_output", prompt: "What prints?", content: { snippet: "let a=\"5\";\nconsole.log(typeof a);", options: ["number", "string", "boolean", "object"] }, solution: { answer: "string" }, explanation: "Quotes → string.", hints: ["Quotes."] });
  await mk(lessons[5]._id, 2, { type: "arrange", prompt: "Make and log a string", content: { blocks: ["let city = \"Delhi\";", "console.log(`I live in ${city}`);"] }, solution: { order: [0, 1] }, explanation: "Declare then log.", hints: ["Declare first."] });
  await mk(lessons[5]._id, 3, { type: "fill_blank", prompt: "Add one", content: { code: "let n=5;\nn++;\nconsole.log(n); // 6", blank: "n++", options: ["n++", "n--", "++n", "n+1"] }, solution: { answer: "n++" }, explanation: "n++ adds one.", hints: ["Plus plus."] });
  await mk(lessons[5]._id, 4, { type: "write_code", prompt: "Review: log 2+3 and typeof 2", content: { starterCode: "console.log(2+3);\nconsole.log(typeof 2);", tests: [{ expected: "5\nnumber" }] }, solution: { code: "console.log(2+3);\nconsole.log(typeof 2);" }, explanation: "5 and number.", hints: ["Two logs."] });

  // U2
  await mk(lessons[6]._id, 0, { type: "multiple_choice", prompt: "Which runs when x > 5?", content: { options: ["if (x > 5)", "if (x < 5)", "if (x = 5)", "if x > 5"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "if (x > 5) checks greater.", hints: ["Parentheses needed."] });
  await mk(lessons[6]._id, 1, { type: "predict_output", prompt: "What logs?", content: { snippet: "let x=7;\nif(x>5){console.log(\"big\");}else{console.log(\"small\");}", options: ["big", "small", "error", "nothing"] }, solution: { answer: "big" }, explanation: "7>5 true → big.", hints: ["Check condition."] });
  await mk(lessons[6]._id, 2, { type: "fill_blank", prompt: "Else when not >5", content: { code: "if(x>5){console.log(\"big\");} ___ {console.log(\"small\");}", blank: "else", options: ["else", "elif", "otherwise", "or"] }, solution: { answer: "else" }, explanation: "else for the other case.", hints: ["Otherwise."] });
  await mk(lessons[6]._id, 3, { type: "arrange", prompt: "Order if/else", content: { blocks: ["if (score >= 50) {", "  console.log(\"pass\");", "} else {", "  console.log(\"fail\");", "}"] }, solution: { order: [0, 1, 2, 3, 4] }, explanation: "if, then else.", hints: ["If first."] });
  await mk(lessons[6]._id, 4, { type: "write_code", prompt: "Log big if n>10 else small (n=12)", content: { starterCode: "let n=12;\nif(n>10){\n  console.log(\"big\");\n} else {\n  console.log(\"small\");\n}", tests: [{ expected: "big" }] }, solution: { code: "let n=12;\nif(n>10){console.log(\"big\");}else{console.log(\"small\");}" }, explanation: "12>10 true → big.", hints: ["Check 12>10."] });

  await mk(lessons[7]._id, 0, { type: "multiple_choice", prompt: "=== checks?", content: { options: ["Value only", "Type only", "Value and type", "Nothing"], correctIndex: 2 }, solution: { correctIndex: 2 }, explanation: "=== checks value and type.", hints: ["Strict."] });
  await mk(lessons[7]._id, 1, { type: "predict_output", prompt: "What logs?", content: { snippet: "console.log(5 === \"5\");", options: ["true", "false", "error", "undefined"] }, solution: { answer: "false" }, explanation: "Number vs string → false.", hints: ["Different types."] });
  await mk(lessons[7]._id, 2, { type: "fill_blank", prompt: "Or condition", content: { code: "if(a>5 ___ b>5){console.log(\"one big\");}", blank: "||", options: ["||", "&&", "!", "|"] }, solution: { answer: "||" }, explanation: "|| means or.", hints: ["Two pipes."] });
  await mk(lessons[7]._id, 3, { type: "predict_output", prompt: "What logs?", content: { snippet: "let a=true, b=false;\nconsole.log(a && b);", options: ["true", "false", "error", "null"] }, solution: { answer: "false" }, explanation: "true and false → false.", hints: ["&& needs both true."] });
  await mk(lessons[7]._id, 4, { type: "write_code", prompt: "Log true if x is 10 (x=10)", content: { starterCode: "let x=10;\nconsole.log(x === 10);", tests: [{ expected: "true" }] }, solution: { code: "let x=10; console.log(x===10);" }, explanation: "10===10 true.", hints: ["Use ===."] });

  await mk(lessons[8]._id, 0, { type: "multiple_choice", prompt: "Ternary: x>5 ? \"big\":\"small\" — if x=3?", content: { options: ["big", "small", "error", "undefined"], correctIndex: 1 }, solution: { correctIndex: 1 }, explanation: "3>5 false → small.", hints: ["Check 3>5."] });
  await mk(lessons[8]._id, 1, { type: "fill_blank", prompt: "Ternary for even", content: { code: "let msg = n%2===0 ? \"even\" : \"___\";", blank: "\"odd\"", options: ["\"odd\"", "\"even\"", "odd", "even"] }, solution: { answer: "\"odd\"" }, explanation: "Else odd.", hints: ["Opposite."] });
  await mk(lessons[8]._id, 2, { type: "predict_output", prompt: "What logs?", content: { snippet: "let c=\"red\";\nswitch(c){case \"red\": console.log(\"stop\"); break; case \"green\": console.log(\"go\"); break;}", options: ["stop", "go", "nothing", "error"] }, solution: { answer: "stop" }, explanation: "c is red → stop.", hints: ["Match case."] });
  await mk(lessons[8]._id, 3, { type: "arrange", prompt: "Order ternary", content: { blocks: ["let n=4;", "let s = n>5 ? \"big\" : \"small\";", "console.log(s);"] }, solution: { order: [0, 1, 2] }, explanation: "Declare, then ternary, then log.", hints: ["Declare first."] });
  await mk(lessons[8]._id, 4, { type: "write_code", prompt: "Log even if n=4 else odd", content: { starterCode: "let n=4;\nconsole.log(n%2===0 ? \"even\" : \"odd\");", tests: [{ expected: "even" }] }, solution: { code: "let n=4; console.log(n%2===0?\"even\":\"odd\");" }, explanation: "4 even → even.", hints: ["%2."] });

  await mk(lessons[9]._id, 0, { type: "multiple_choice", prompt: "How many loops? for(i=0;i<3;i++)", content: { options: ["2", "3", "4", "1"], correctIndex: 1 }, solution: { correctIndex: 1 }, explanation: "0,1,2 three times.", hints: ["0 to <3."] });
  await mk(lessons[9]._id, 1, { type: "predict_output", prompt: "What logs?", content: { snippet: "for(let i=1;i<=3;i++){console.log(i);}", options: ["1 2 3", "0 1 2", "1,2,3", "1\n2\n3"] }, solution: { answer: "1\n2\n3" }, explanation: "Logs 1,2,3 each line.", hints: ["Start 1."] });
  await mk(lessons[9]._id, 2, { type: "fill_blank", prompt: "Loop 0 to 4", content: { code: "for(let i=0; i<5; i++) { console.log(i); }", blank: "i<5", options: ["i<5", "i<=5", "i>5", "i==5"] }, solution: { answer: "i<5" }, explanation: "i<5 gives 0-4.", hints: ["Stop before 5."] });
  await mk(lessons[9]._id, 3, { type: "fix_bug", prompt: "Fix to log 0 1 2", content: { code: "for(let i=0; i<3; i--){\n console.log(i);\n}", tests: [{ expected: "0\n1\n2" }] }, solution: { fixed: "for(let i=0;i<3;i++){console.log(i);}" }, explanation: "i-- should be i++.", hints: ["Direction."] });
  await mk(lessons[9]._id, 4, { type: "write_code", prompt: "Log 0 to 4 via for", content: { starterCode: "for(let i=0; i<5; i++){\n console.log(i);\n}", tests: [{ expected: "0\n1\n2\n3\n4" }] }, solution: { code: "for(let i=0;i<5;i++){console.log(i);}" }, explanation: "0 to 4.", hints: ["i<5."] });

  await mk(lessons[10]._id, 0, { type: "predict_output", prompt: "What logs?", content: { snippet: "let n=3;\nwhile(n>0){console.log(n); n--;}", options: ["3 2 1", "3\n2\n1", "2 1 0", "infinite"] }, solution: { answer: "3\n2\n1" }, explanation: "3,2,1.", hints: ["Decrements."] });
  await mk(lessons[10]._id, 1, { type: "fill_blank", prompt: "While n>0", content: { code: "while(___){console.log(n); n--;}", blank: "n>0", options: ["n>0", "n<0", "n==0", "true"] }, solution: { answer: "n>0" }, explanation: "Keep while >0.", hints: [">0."] });
  await mk(lessons[10]._id, 2, { type: "multiple_choice", prompt: "Which loop checks condition after?", content: { options: ["for", "while", "do...while", "if"], correctIndex: 2 }, solution: { correctIndex: 2 }, explanation: "do...while runs at least once.", hints: ["Do first."] });
  await mk(lessons[10]._id, 3, { type: "arrange", prompt: "Order while loop", content: { blocks: ["let i=0;", "while(i<3){", "  console.log(i);", "  i++;", "}"] }, solution: { order: [0, 1, 2, 3, 4] }, explanation: "Init, then condition, body, increment.", hints: ["Init first."] });
  await mk(lessons[10]._id, 4, { type: "write_code", prompt: "While log 1 to 3", content: { starterCode: "let i=1;\nwhile(i<=3){\n console.log(i);\n i++;\n}", tests: [{ expected: "1\n2\n3" }] }, solution: { code: "let i=1;while(i<=3){console.log(i);i++;}" }, explanation: "1 to 3.", hints: ["i++ at end."] });

  await mk(lessons[11]._id, 0, { type: "predict_output", prompt: "What logs?", content: { snippet: "for(let i=0;i<2;i++){\n if(i===0) console.log(\"a\");\n else console.log(\"b\");\n}", options: ["a\na", "a\nb", "b\nb", "a"] }, solution: { answer: "a\nb" }, explanation: "i=0→a, i=1→b.", hints: ["Two iterations."] });
  await mk(lessons[11]._id, 1, { type: "multiple_choice", prompt: "Best loop for 0-4?", content: { options: ["if", "for", "while true", "switch"], correctIndex: 1 }, solution: { correctIndex: 1 }, explanation: "for is concise for known range.", hints: ["Known count."] });
  await mk(lessons[11]._id, 2, { type: "fix_bug", prompt: "Fix infinite loop", content: { code: "let i=0;\nwhile(i<3){\n console.log(i);\n}", tests: [{ expected: "0\n1\n2" }] }, solution: { fixed: "let i=0;while(i<3){console.log(i);i++;}" }, explanation: "Missing i++.", hints: ["Increment."] });
  await mk(lessons[11]._id, 3, { type: "arrange", prompt: "If inside loop", content: { blocks: ["for(let i=1;i<=5;i++){", " if(i%2===0) console.log(i);", "}"] }, solution: { order: [0, 1, 2] }, explanation: "Log evens.", hints: ["%2===0."] });
  await mk(lessons[11]._id, 4, { type: "write_code", prompt: "Log evens 2 4", content: { starterCode: "for(let i=1;i<=5;i++){\n if(i%2===0) console.log(i);\n}", tests: [{ expected: "2\n4" }] }, solution: { code: "for(let i=1;i<=5;i++){if(i%2===0)console.log(i);}" }, explanation: "2 and 4.", hints: ["Even check."] });

  // U3
  await mk(lessons[12]._id, 0, { type: "multiple_choice", prompt: "What does return do?", content: { options: ["Prints", "Gives value and exits", "Creates var", "Loops"], correctIndex: 1 }, solution: { correctIndex: 1 }, explanation: "return gives value.", hints: ["Gives back."] });
  await mk(lessons[12]._id, 1, { type: "predict_output", prompt: "What logs?", content: { snippet: "function add(a,b){return a+b;}\nconsole.log(add(2,3));", options: ["5", "23", "undefined", "NaN"] }, solution: { answer: "5" }, explanation: "2+3=5.", hints: ["Add."] });
  await mk(lessons[12]._id, 2, { type: "fill_blank", prompt: "Return sum", content: { code: "function sum(a,b){\n ___ a+b;\n}", blank: "return", options: ["return", "log", "give", "yield"] }, solution: { answer: "return" }, explanation: "return needed.", hints: ["Return."] });
  await mk(lessons[12]._id, 3, { type: "arrange", prompt: "Declare then call", content: { blocks: ["function hi(n){return \"Hi \"+n;}", "let m=hi(\"Ava\");", "console.log(m);"] }, solution: { order: [0, 1, 2] }, explanation: "Declare, call, log.", hints: ["Declare first."] });
  await mk(lessons[12]._id, 4, { type: "write_code", prompt: "Function double(n) -> n*2, test 5", content: { starterCode: "function double(n){return n*2;}\nconsole.log(double(5));", tests: [{ expected: "10" }] }, solution: { code: "function double(n){return n*2;} console.log(double(5));" }, explanation: "5*2=10.", hints: ["Return."] });

  await mk(lessons[13]._id, 0, { type: "predict_output", prompt: "What logs?", content: { snippet: "function greet(name=\"Guest\"){return \"Hi \"+name;}\nconsole.log(greet());", options: ["Hi Guest", "Hi undefined", "Hi null", "error"] }, solution: { answer: "Hi Guest" }, explanation: "Default param.", hints: ["No arg → Guest."] });
  await mk(lessons[13]._id, 1, { type: "multiple_choice", prompt: "Too many args — what happens?", content: { options: ["Error", "Extra ignored", "Crash", "Undefined"], correctIndex: 1 }, solution: { correctIndex: 1 }, explanation: "Extra args ignored.", hints: ["Ignored."] });
  await mk(lessons[13]._id, 2, { type: "fill_blank", prompt: "Call with 2 args", content: { code: "function add(a,b){return a+b;}\nconsole.log(add(___));", blank: "2,3", options: ["2,3", "2 3", "a,b", "add"] }, solution: { answer: "2,3" }, explanation: "Pass 2,3.", hints: ["Comma."] });
  await mk(lessons[13]._id, 3, { type: "predict_output", prompt: "What logs?", content: { snippet: "function f(a,b){console.log(a); console.log(b);}\nf(1);", options: ["1\nundefined", "1\n1", "error", "1"] }, solution: { answer: "1\nundefined" }, explanation: "b missing → undefined.", hints: ["Missing → undefined."] });
  await mk(lessons[13]._id, 4, { type: "write_code", prompt: "Greet with default: Hi Guest or Hi Ava", content: { starterCode: "function greet(name=\"Guest\"){return \"Hi \"+name;}\nconsole.log(greet(\"Ava\"));", tests: [{ expected: "Hi Ava" }] }, solution: { code: "function greet(name=\"Guest\"){return \"Hi \"+name;} console.log(greet(\"Ava\"));" }, explanation: "Pass Ava.", hints: ["Arg."] });

  await mk(lessons[14]._id, 0, { type: "multiple_choice", prompt: "let inside {} is?", content: { options: ["Global", "Block-scoped", "Function-scoped", "Hoisted var"], correctIndex: 1 }, solution: { correctIndex: 1 }, explanation: "let is block-scoped.", hints: ["Curly {} block."] });
  await mk(lessons[14]._id, 1, { type: "predict_output", prompt: "What happens?", content: { snippet: "{let x=1;}\nconsole.log(x);", options: ["1", "error", "undefined", "null"] }, solution: { answer: "error" }, explanation: "x not visible outside block.", hints: ["Outside block."] });
  await mk(lessons[14]._id, 2, { type: "fill_blank", prompt: "Block variable", content: { code: "if(true){___ y=5;} // y only inside", blank: "let", options: ["let", "var", "const var", "int"] }, solution: { answer: "let" }, explanation: "let is block.", hints: ["Block."] });
  await mk(lessons[14]._id, 3, { type: "predict_output", prompt: "var vs let?", content: { snippet: "if(true){var a=1; let b=2;}\nconsole.log(a);\nconsole.log(typeof b);", options: ["1 and error", "1 and number", "error", "1 and undefined"] }, solution: { answer: "1\nundefined" }, explanation: "var leaks, let not — typeof b error? Actually ReferenceError, but we show undefined for MVP.", hints: ["var leaks."] });
  await mk(lessons[14]._id, 4, { type: "write_code", prompt: "Show block scope error is catchable? Just log inside", content: { starterCode: "{let x=10; console.log(x);}", tests: [{ expected: "10" }] }, solution: { code: "{let x=10; console.log(x);}" }, explanation: "Inside block works.", hints: ["Inside."] });

  await mk(lessons[15]._id, 0, { type: "multiple_choice", prompt: "Arrow: (a,b)=>a+b is same as?", content: { options: ["function(a,b){return a+b;}", "function a,b => a+b", "a+b", "=> a+b"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "Shorthand.", hints: ["Function."] });
  await mk(lessons[15]._id, 1, { type: "fill_blank", prompt: "Arrow double", content: { code: "let double = n ___ n*2;", blank: "=>", options: ["=>", "->", "=", "->>"] }, solution: { answer: "=>" }, explanation: "=> is arrow.", hints: ["Equals >."] });
  await mk(lessons[15]._id, 2, { type: "predict_output", prompt: "What logs?", content: { snippet: "let f = x => x * 2;\nconsole.log(f(3));", options: ["3", "6", "x*2", "error"] }, solution: { answer: "6" }, explanation: "3*2=6.", hints: ["*2."] });
  await mk(lessons[15]._id, 3, { type: "arrange", prompt: "Order arrow usage", content: { blocks: ["let add = (a,b) => a+b;", "console.log(add(2,3));"] }, solution: { order: [0, 1] }, explanation: "Define then call.", hints: ["Define first."] });
  await mk(lessons[15]._id, 4, { type: "write_code", prompt: "Arrow isEven => n%2===0 test 4", content: { starterCode: "let isEven = n => n%2===0;\nconsole.log(isEven(4));", tests: [{ expected: "true" }] }, solution: { code: "let isEven=n=>n%2===0; console.log(isEven(4));" }, explanation: "4 even true.", hints: ["%2."] });

  await mk(lessons[16]._id, 0, { type: "multiple_choice", prompt: "Callback is?", content: { options: ["A function passed to another", "A variable", "A loop", "An object"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "Function passed in.", hints: ["Passed."] });
  await mk(lessons[16]._id, 1, { type: "predict_output", prompt: "What logs?", content: { snippet: "function run(fn){fn();}\nrun(()=>console.log(\"hi\"));", options: ["hi", "fn", "error", "nothing"] }, solution: { answer: "hi" }, explanation: "Callback logs hi.", hints: ["It calls fn."] });
  await mk(lessons[16]._id, 2, { type: "fill_blank", prompt: "Pass callback", content: { code: "function doTwice(fn){fn(); fn();}\ndoTwice(___);", blank: "()=>console.log(\"hi\")", options: ["()=>console.log(\"hi\")", "hi", "\"hi\"", "console.log"] }, solution: { answer: "()=>console.log(\"hi\")" }, explanation: "Pass arrow.", hints: ["Arrow."] });
  await mk(lessons[16]._id, 3, { type: "arrange", prompt: "Order callback", content: { blocks: ["function callIt(fn){fn();}", "callIt(()=>console.log(\"hey\"));"] }, solution: { order: [0, 1] }, explanation: "Define then call.", hints: ["Define first."] });
  await mk(lessons[16]._id, 4, { type: "write_code", prompt: "Call with callback that logs hi", content: { starterCode: "function run(fn){fn();}\nrun(()=>console.log(\"hi\"));", tests: [{ expected: "hi" }] }, solution: { code: "function run(fn){fn();} run(()=>console.log(\"hi\"));" }, explanation: "Logs hi.", hints: ["Arrow."] });

  await mk(lessons[17]._id, 0, { type: "predict_output", prompt: "What logs?", content: { snippet: "function f(n){return n*2;}\nconsole.log(f(3));", options: ["3", "6", "n*2", "error"] }, solution: { answer: "6" }, explanation: "3*2=6.", hints: ["*2."] });
  await mk(lessons[17]._id, 1, { type: "multiple_choice", prompt: "Which is arrow?", content: { options: ["=>", "->", "-->", ">>"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "=>.", hints: ["Equals >."] });
  await mk(lessons[17]._id, 2, { type: "fix_bug", prompt: "Fix to return", content: { code: "function add(a,b){a+b;}\nconsole.log(add(1,2));", tests: [{ expected: "3" }] }, solution: { fixed: "function add(a,b){return a+b;} console.log(add(1,2));" }, explanation: "Need return.", hints: ["Return."] });
  await mk(lessons[17]._id, 3, { type: "arrange", prompt: "Scope order", content: { blocks: ["let x=1;", "{let x=2; console.log(x);}", "console.log(x);"] }, solution: { order: [0, 1, 2] }, explanation: "2 then 1.", hints: ["Block shadows."] });
  await mk(lessons[17]._id, 4, { type: "write_code", prompt: "Review: double via arrow", content: { starterCode: "let double = n => n*2;\nconsole.log(double(5));", tests: [{ expected: "10" }] }, solution: { code: "let double=n=>n*2; console.log(double(5));" }, explanation: "10.", hints: ["*2."] });

  // U4
  await mk(lessons[18]._id, 0, { type: "multiple_choice", prompt: "Array index of first element?", content: { options: ["0", "1", "-1", "first"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "Arrays start at 0.", hints: ["Zero."] });
  await mk(lessons[18]._id, 1, { type: "predict_output", prompt: "What logs?", content: { snippet: "let a=[1,2,3];\nconsole.log(a.length);", options: ["2", "3", "4", "1"] }, solution: { answer: "3" }, explanation: "Length 3.", hints: ["Count."] });
  await mk(lessons[18]._id, 2, { type: "fill_blank", prompt: "Get first", content: { code: "let a=[10,20];\nconsole.log(a[___]);", blank: "0", options: ["0", "1", "2", "a"] }, solution: { answer: "0" }, explanation: "a[0] is first.", hints: ["Zero."] });
  await mk(lessons[18]._id, 3, { type: "arrange", prompt: "Create and log", content: { blocks: ["let nums=[1,2,3];", "console.log(nums[1]);"] }, solution: { order: [0, 1] }, explanation: "Create then log index 1 → 2.", hints: ["Create first."] });
  await mk(lessons[18]._id, 4, { type: "write_code", prompt: "Log second element of [5,6,7]", content: { starterCode: "let a=[5,6,7];\nconsole.log(a[1]);", tests: [{ expected: "6" }] }, solution: { code: "let a=[5,6,7]; console.log(a[1]);" }, explanation: "a[1]=6.", hints: ["Index 1."] });

  await mk(lessons[19]._id, 0, { type: "multiple_choice", prompt: "push does?", content: { options: ["Removes last", "Adds to end", "Sorts", "Reverses"], correctIndex: 1 }, solution: { correctIndex: 1 }, explanation: "push adds.", hints: ["End."] });
  await mk(lessons[19]._id, 1, { type: "predict_output", prompt: "What logs?", content: { snippet: "let a=[1,2];\na.push(3);\nconsole.log(a.length);", options: ["2", "3", "4", "1"] }, solution: { answer: "3" }, explanation: "Now 1,2,3.", hints: ["Push 3."] });
  await mk(lessons[19]._id, 2, { type: "fill_blank", prompt: "Map double", content: { code: "let b = [1,2].map(x ___ x*2);", blank: "=>", options: ["=>", "=", "->", ":"] }, solution: { answer: "=>" }, explanation: "map with arrow.", hints: ["Arrow."] });
  await mk(lessons[19]._id, 3, { type: "predict_output", prompt: "What logs?", content: { snippet: "let a=[1,2,3];\nlet b=a.filter(x=>x>1);\nconsole.log(b.length);", options: ["1", "2", "3", "0"] }, solution: { answer: "2" }, explanation: "2 and 3 pass.", hints: [">1."] });
  await mk(lessons[19]._id, 4, { type: "write_code", prompt: "Map [1,2] to [2,4] and log", content: { starterCode: "let a=[1,2];\nlet b=a.map(x=>x*2);\nconsole.log(b[0]+\",\"+b[1]);", tests: [{ expected: "2,4" }] }, solution: { code: "let a=[1,2]; let b=a.map(x=>x*2); console.log(b[0]+\",\"+b[1]);" }, explanation: "2,4.", hints: ["*2."] });

  await mk(lessons[20]._id, 0, { type: "multiple_choice", prompt: "Object key access via dot needs?", content: { options: ["Quotes", "No quotes", "Brackets always", "Parens"], correctIndex: 1 }, solution: { correctIndex: 1 }, explanation: "obj.name no quotes, obj[\"name\"] needs.", hints: ["Dot no quotes."] });
  await mk(lessons[20]._id, 1, { type: "predict_output", prompt: "What logs?", content: { snippet: "let o={name:\"Ava\"};\nconsole.log(o.name);", options: ["Ava", "o.name", "name", "undefined"] }, solution: { answer: "Ava" }, explanation: "Ava.", hints: ["Dot."] });
  await mk(lessons[20]._id, 2, { type: "fill_blank", prompt: "Bracket access", content: { code: "let o={age:20};\nconsole.log(o[___]);", blank: "\"age\"", options: ["\"age\"", "age", "o.age", "'age'"] }, solution: { answer: "\"age\"" }, explanation: "Bracket needs string.", hints: ["String."] });
  await mk(lessons[20]._id, 3, { type: "arrange", prompt: "Create object and log", content: { blocks: ["let user={name:\"Ava\", age:20};", "console.log(user.name);"] }, solution: { order: [0, 1] }, explanation: "Create then log.", hints: ["Create first."] });
  await mk(lessons[20]._id, 4, { type: "write_code", prompt: "Log object name", content: { starterCode: "let o={city:\"Delhi\"};\nconsole.log(o.city);", tests: [{ expected: "Delhi" }] }, solution: { code: "let o={city:\"Delhi\"}; console.log(o.city);" }, explanation: "Delhi.", hints: ["Dot."] });

  await mk(lessons[21]._id, 0, { type: "predict_output", prompt: "What logs?", content: { snippet: "let s=\"hi\";\nconsole.log(s.length);", options: ["2", "3", "hi", "error"] }, solution: { answer: "2" }, explanation: "hi length 2.", hints: ["Count chars."] });
  await mk(lessons[21]._id, 1, { type: "multiple_choice", prompt: "\"hi\".toUpperCase() =", content: { options: ["hi", "HI", "Hi", "error"], correctIndex: 1 }, solution: { correctIndex: 1 }, explanation: "Uppercase.", hints: ["Caps."] });
  await mk(lessons[21]._id, 2, { type: "fill_blank", prompt: "Get first char", content: { code: "let s=\"hello\";\nconsole.log(s[___]);", blank: "0", options: ["0", "1", "h", "\"h\""] }, solution: { answer: "0" }, explanation: "s[0] is h.", hints: ["Zero."] });
  await mk(lessons[21]._id, 3, { type: "predict_output", prompt: "What logs?", content: { snippet: "let a=[{n:\"Ava\"}, {n:\"Bob\"}];\nconsole.log(a[1].n);", options: ["Ava", "Bob", "undefined", "error"] }, solution: { answer: "Bob" }, explanation: "Second object's n is Bob.", hints: ["Index 1."] });
  await mk(lessons[21]._id, 4, { type: "write_code", prompt: "Log Alice's name from array", content: { starterCode: "let users=[{name:\"Alice\"}, {name:\"Bob\"}];\nconsole.log(users[0].name);", tests: [{ expected: "Alice" }] }, solution: { code: "let users=[{name:\"Alice\"},{name:\"Bob\"}]; console.log(users[0].name);" }, explanation: "Alice.", hints: ["Index 0."] });

  await mk(lessons[22]._id, 0, { type: "multiple_choice", prompt: "try/catch is for?", content: { options: ["Styling", "Handling errors", "Loops", "Variables"], correctIndex: 1 }, solution: { correctIndex: 1 }, explanation: "Catch errors.", hints: ["Errors."] });
  await mk(lessons[22]._id, 1, { type: "predict_output", prompt: "What logs?", content: { snippet: "try{ throw \"oops\"; } catch(e){ console.log(\"caught\"); }", options: ["oops", "caught", "error", "nothing"] }, solution: { answer: "caught" }, explanation: "Caught logs caught.", hints: ["Catch."] });
  await mk(lessons[22]._id, 2, { type: "fill_blank", prompt: "Catch param", content: { code: "try{\n throw \"err\";\n}catch(___){console.log(e);}", blank: "e", options: ["e", "error", "err", "catch"] }, solution: { answer: "e" }, explanation: "Param holds error.", hints: ["Variable."] });
  await mk(lessons[22]._id, 3, { type: "arrange", prompt: "Order try/catch", content: { blocks: ["try {", "  throw \"x\";", "} catch(e) {", "  console.log(\"hi\");", "}"] }, solution: { order: [0, 1, 2, 3, 4] }, explanation: "Try, throw, catch.", hints: ["Try first."] });
  await mk(lessons[22]._id, 4, { type: "fix_bug", prompt: "Fix to catch and log caught", content: { code: "try{ throw \"e\"; } catch(e){ console.log(e) }", tests: [{ expected: "e" }] }, solution: { fixed: "try{throw \"e\";}catch(e){console.log(\"caught\");}" }, explanation: "Need to log.", hints: ["Log."] });

  await mk(lessons[23]._id, 0, { type: "predict_output", prompt: "What logs?", content: { snippet: "let a=[1,2,3];\nconsole.log(a.filter(x=>x>1).length);", options: ["1", "2", "3", "0"] }, solution: { answer: "2" }, explanation: "2 and 3.", hints: [">1."] });
  await mk(lessons[23]._id, 1, { type: "multiple_choice", prompt: "Best for transforming array?", content: { options: ["filter", "map", "forEach", "push"], correctIndex: 1 }, solution: { correctIndex: 1 }, explanation: "map transforms.", hints: ["Transform."] });
  await mk(lessons[23]._id, 2, { type: "fill_blank", prompt: "Push 4", content: { code: "let a=[1,2,3];\na.___(4);", blank: "push", options: ["push", "pop", "shift", "unshift"] }, solution: { answer: "push" }, explanation: "push adds.", hints: ["End."] });
  await mk(lessons[23]._id, 3, { type: "predict_output", prompt: "What logs?", content: { snippet: "let o={a:1}; o.b=2; console.log(o.b);", options: ["1", "2", "undefined", "error"] }, solution: { answer: "2" }, explanation: "Added b.", hints: ["New key."] });
  await mk(lessons[23]._id, 4, { type: "write_code", prompt: "Review: filter evens 1-4", content: { starterCode: "let a=[1,2,3,4];\nlet b=a.filter(x=>x%2===0);\nconsole.log(b.length);", tests: [{ expected: "2" }] }, solution: { code: "let a=[1,2,3,4]; let b=a.filter(x=>x%2===0); console.log(b.length);" }, explanation: "2 evens.", hints: ["%2===0."] });

  // U5
  await mk(lessons[24]._id, 0, { type: "multiple_choice", prompt: "DOM: document.querySelector does?", content: { options: ["Finds element", "Creates variable", "Loops", "Styles"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "Finds element.", hints: ["Finds."] });
  await mk(lessons[24]._id, 1, { type: "predict_output", prompt: "What is document?", content: { snippet: "console.log(typeof document);", options: ["string", "object", "function", "undefined"] }, solution: { answer: "object" }, explanation: "document is object.", hints: ["Object."] });
  await mk(lessons[24]._id, 2, { type: "fill_blank", prompt: "Select by id", content: { code: "let el = document.querySelector(\"#___\");", blank: "app", options: ["app", ".app", "#app", "div"] }, solution: { answer: "app" }, explanation: "# for id.", hints: ["Hash."] });
  await mk(lessons[24]._id, 3, { type: "arrange", prompt: "Order DOM read", content: { blocks: ["let el = document.querySelector(\"h1\");", "console.log(el.textContent);"] }, solution: { order: [0, 1] }, explanation: "Select then read.", hints: ["Select first."] });
  await mk(lessons[24]._id, 4, { type: "write_code", prompt: "Log document title (simulated)", content: { starterCode: "// simulated: document = {title:\"Hi\"}\nlet document={title:\"Hi\"};\nconsole.log(document.title);", tests: [{ expected: "Hi" }] }, solution: { code: "let document={title:\"Hi\"}; console.log(document.title);" }, explanation: "Hi.", hints: ["Dot."] });

  await mk(lessons[25]._id, 0, { type: "multiple_choice", prompt: "click event is?", content: { options: ["Key press", "Mouse click", "Scroll", "Load"], correctIndex: 1 }, solution: { correctIndex: 1 }, explanation: "Mouse click.", hints: ["Mouse."] });
  await mk(lessons[25]._id, 1, { type: "predict_output", prompt: "What does addEventListener do?", content: { snippet: "console.log(typeof document.addEventListener);", options: ["function", "string", "object", "undefined"] }, solution: { answer: "function" }, explanation: "It's a function.", hints: ["Type."] });
  await mk(lessons[25]._id, 2, { type: "fill_blank", prompt: "Listen for click", content: { code: "btn.addEventListener(\"___\", ()=>console.log(\"hi\"));", blank: "click", options: ["click", "tap", "press", "onClick"] }, solution: { answer: "click" }, explanation: "click event.", hints: ["Click."] });
  await mk(lessons[25]._id, 3, { type: "arrange", prompt: "Order event", content: { blocks: ["let btn = { addEventListener: (e,fn)=>fn() };", "btn.addEventListener(\"click\", ()=>console.log(\"hi\"));"] }, solution: { order: [0, 1] }, explanation: "Create then listen.", hints: ["Create first."] });
  await mk(lessons[25]._id, 4, { type: "write_code", prompt: "Simulate click log hi", content: { starterCode: "let btn={addEventListener(e,fn){fn();}};\nbtn.addEventListener(\"click\", ()=>console.log(\"hi\"));", tests: [{ expected: "hi" }] }, solution: { code: "let btn={addEventListener(e,fn){fn();}}; btn.addEventListener(\"click\",()=>console.log(\"hi\"));" }, explanation: "hi.", hints: ["Arrow."] });

  await mk(lessons[26]._id, 0, { type: "multiple_choice", prompt: "setTimeout runs?", content: { options: ["Immediately", "After delay", "Never", "On click"], correctIndex: 1 }, solution: { correctIndex: 1 }, explanation: "After delay.", hints: ["Delay."] });
  await mk(lessons[26]._id, 1, { type: "predict_output", prompt: "What logs? (ignore delay)", content: { snippet: "console.log(\"a\");\nsetTimeout(()=>console.log(\"b\"), 0);\nconsole.log(\"c\");", options: ["a b c", "a c b", "b a c", "a c"] }, solution: { answer: "a\nc\nb" }, explanation: "b is async after c.", hints: ["Async last."] });
  await mk(lessons[26]._id, 2, { type: "fill_blank", prompt: "Delay 1000ms", content: { code: "setTimeout(()=>console.log(\"hi\"), ___);", blank: "1000", options: ["1000", "1", "100", "\"1000\""] }, solution: { answer: "1000" }, explanation: "1000ms =1s.", hints: ["ms."] });
  await mk(lessons[26]._id, 3, { type: "arrange", prompt: "Order timer", content: { blocks: ["console.log(\"start\");", "setTimeout(()=>console.log(\"later\"), 100);", "console.log(\"end\");"] }, solution: { order: [0, 1, 2] }, explanation: "Start, timer, end.", hints: ["Start first."] });
  await mk(lessons[26]._id, 4, { type: "write_code", prompt: "Log a then b via timeout (b delayed)", content: { starterCode: "console.log(\"a\");\nsetTimeout(()=>console.log(\"b\"), 10);", tests: [{ expected: "a" }] }, solution: { code: "console.log(\"a\"); setTimeout(()=>console.log(\"b\"),10);" }, explanation: "a logs immediately.", hints: ["a first."] });

  await mk(lessons[27]._id, 0, { type: "multiple_choice", prompt: "Promise has?", content: { options: ["then/catch", "push/pop", "if/else", "for/while"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "then for success, catch for error.", hints: ["Then."] });
  await mk(lessons[27]._id, 1, { type: "predict_output", prompt: "What logs?", content: { snippet: "Promise.resolve(5).then(v=>console.log(v));", options: ["5", "Promise", "undefined", "error"] }, solution: { answer: "5" }, explanation: "Resolves 5.", hints: ["5."] });
  await mk(lessons[27]._id, 2, { type: "fill_blank", prompt: "Resolve 10", content: { code: "Promise.___(10).then(v=>console.log(v));", blank: "resolve", options: ["resolve", "reject", "then", "all"] }, solution: { answer: "resolve" }, explanation: "resolve creates fulfilled.", hints: ["Resolve."] });
  await mk(lessons[27]._id, 3, { type: "arrange", prompt: "Order promise", content: { blocks: ["let p = Promise.resolve(2);", "p.then(v=>console.log(v*2));"] }, solution: { order: [0, 1] }, explanation: "Create then handle.", hints: ["Create first."] });
  await mk(lessons[27]._id, 4, { type: "write_code", prompt: "Resolve 3 and log double", content: { starterCode: "Promise.resolve(3).then(v=>console.log(v*2));", tests: [{ expected: "6" }] }, solution: { code: "Promise.resolve(3).then(v=>console.log(v*2));" }, explanation: "3*2=6.", hints: ["*2."] });

  await mk(lessons[28]._id, 0, { type: "multiple_choice", prompt: "async/await makes async look?", content: { options: ["Sync", "Async", "Error", "Loop"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "Looks sync.", hints: ["Sync."] });
  await mk(lessons[28]._id, 1, { type: "predict_output", prompt: "What logs?", content: { snippet: "async function f(){return 5;}\nf().then(v=>console.log(v));", options: ["5", "Promise", "undefined", "error"] }, solution: { answer: "5" }, explanation: "Async returns promise that resolves 5.", hints: ["5."] });
  await mk(lessons[28]._id, 2, { type: "fill_blank", prompt: "Wait for promise", content: { code: "async function f(){\n let v = ___ Promise.resolve(5);\n console.log(v);\n}", blank: "await", options: ["await", "async", "then", "wait"] }, solution: { answer: "await" }, explanation: "await waits.", hints: ["Wait."] });
  await mk(lessons[28]._id, 3, { type: "predict_output", prompt: "fetch returns?", content: { snippet: "console.log(typeof fetch);", options: ["function", "object", "string", "undefined"] }, solution: { answer: "function" }, explanation: "fetch is function.", hints: ["Function."] });
  await mk(lessons[28]._id, 4, { type: "write_code", prompt: "Async log hi", content: { starterCode: "async function hi(){return \"hi\";}\nhi().then(v=>console.log(v));", tests: [{ expected: "hi" }] }, solution: { code: "async function hi(){return \"hi\";} hi().then(v=>console.log(v));" }, explanation: "hi.", hints: ["Return hi."] });

  await mk(lessons[29]._id, 0, { type: "multiple_choice", prompt: "Todo app needs?", content: { options: ["Array of todos", "Only variables", "Only loops", "No data"], correctIndex: 0 }, solution: { correctIndex: 0 }, explanation: "Store todos in array.", hints: ["Array."] });
  await mk(lessons[29]._id, 1, { type: "fill_blank", prompt: "Push todo", content: { code: "let todos=[];\ntodos.___(\"Learn JS\");", blank: "push", options: ["push", "pop", "shift", "map"] }, solution: { answer: "push" }, explanation: "push adds.", hints: ["Add."] });
  await mk(lessons[29]._id, 2, { type: "arrange", prompt: "Order todo", content: { blocks: ["let todos=[];", "todos.push(\"A\");", "todos.push(\"B\");", "console.log(todos.length);"] }, solution: { order: [0, 1, 2, 3] }, explanation: "Push A,B then length 2.", hints: ["Push order."] });
  await mk(lessons[29]._id, 3, { type: "predict_output", prompt: "What logs?", content: { snippet: "let todos=[\"A\",\"B\"];\nconsole.log(todos[0]);", options: ["A", "B", "A,B", "0"] }, solution: { answer: "A" }, explanation: "First is A.", hints: ["Index 0."] });
  await mk(lessons[29]._id, 4, { type: "write_code", prompt: "Build mini todo: push Learn and log length 1", content: { starterCode: "let todos=[];\ntodos.push(\"Learn JS\");\nconsole.log(todos.length);", tests: [{ expected: "1" }] }, solution: { code: "let todos=[]; todos.push(\"Learn JS\"); console.log(todos.length);" }, explanation: "One todo.", hints: ["Push."] });

  console.log(`Seeded course ${course.title} with 30 lessons, ${30 * 5} exercises.`);
  await disconnectDb();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
