/* Structural validator for data-authored courses.

   Run with `bun run seed:validate` (no database needed). It checks the invariant
   the frontend exercise components rely on, so an authoring slip is caught here
   instead of by a learner:

     - multiple_choice: correctIndex matches, is in range, options unique
     - fill_blank:      exactly one ___ marker, answer present in options
     - predict_output:  snippet present, answer present in options
     - arrange:         order is a permutation matching the listed blocks
     - ai_prompt:       checklist lengths match, solution all true, context present

   Add new data-driven CourseSpec imports to COURSE_SPECS below. */

import type { CourseSpec } from "./courses/types.js";
import { pythonFromZero } from "./courses/pythonFromZero.js";

const COURSE_SPECS: CourseSpec[] = [pythonFromZero];

let failed = false;

for (const spec of COURSE_SPECS) {
  const problems: string[] = [];
  let lessons = 0;
  let exercises = 0;

  for (const unit of spec.units) {
    for (const lesson of unit.lessons) {
      lessons += 1;
      lesson.exercises.forEach((ex, index) => {
        exercises += 1;
        const where = `${spec.slug} | ${unit.title} / ${lesson.title} / #${index} (${ex.type})`;
        const content = ex.content as Record<string, any>;
        const solution = ex.solution as Record<string, any>;

        if (!ex.prompt?.trim()) problems.push(`${where}: empty prompt`);
        if (!ex.explanation?.trim()) problems.push(`${where}: empty explanation`);
        if (!Array.isArray(ex.hints) || ex.hints.length === 0) problems.push(`${where}: no hints`);

        if (ex.type === "multiple_choice") {
          const options = content.options;
          if (!Array.isArray(options) || options.length < 2) problems.push(`${where}: needs 2+ options`);
          else if (new Set(options).size !== options.length) problems.push(`${where}: duplicate options`);
          if (content.correctIndex !== solution.correctIndex) problems.push(`${where}: correctIndex mismatch`);
          if (!(content.correctIndex >= 0 && content.correctIndex < (options?.length ?? 0))) {
            problems.push(`${where}: correctIndex out of range`);
          }
        }

        if (ex.type === "fill_blank") {
          const code: string = content.code ?? "";
          const markers = code.split("___").length - 1;
          if (markers !== 1) problems.push(`${where}: expected exactly one ___ marker, found ${markers}`);
          if (!Array.isArray(content.options)) problems.push(`${where}: missing options`);
          else {
            if (new Set(content.options).size !== content.options.length) problems.push(`${where}: duplicate options`);
            if (!content.options.includes(solution.answer)) {
              problems.push(`${where}: answer ${JSON.stringify(solution.answer)} is not among the options`);
            }
          }
        }

        if (ex.type === "predict_output") {
          if (!content.snippet?.trim()) problems.push(`${where}: empty snippet`);
          const options = content.options;
          if (!Array.isArray(options)) problems.push(`${where}: missing options`);
          else {
            if (new Set(options).size !== options.length) problems.push(`${where}: duplicate options`);
            if (!options.includes(solution.answer)) {
              problems.push(`${where}: answer ${JSON.stringify(solution.answer)} is not among the options`);
            }
          }
        }

        if (ex.type === "arrange") {
          const blocks = content.blocks;
          if (!Array.isArray(blocks) || blocks.length < 2) problems.push(`${where}: needs 2+ blocks`);
          const order = solution.order;
          if (!Array.isArray(order)) problems.push(`${where}: missing order`);
          else {
            const identity = blocks.map((_: unknown, i: number) => i);
            if (JSON.stringify(order) !== JSON.stringify(identity)) {
              problems.push(`${where}: order must be the identity permutation of the listed blocks`);
            }
          }
        }

        if (ex.type === "ai_prompt") {
          const checklist = content.checklist;
          if (!Array.isArray(checklist) || checklist.length === 0) problems.push(`${where}: missing checklist`);
          if (!Array.isArray(solution.checklist) || solution.checklist.length !== (checklist?.length ?? 0)) {
            problems.push(`${where}: solution.checklist length must match content.checklist`);
          } else if (!solution.checklist.every((c: unknown) => c === true)) {
            problems.push(`${where}: solution.checklist must be all true`);
          }
          if (!content.scenario?.trim()) problems.push(`${where}: missing scenario`);
          if (!content.aiTask?.trim()) problems.push(`${where}: missing aiTask`);
          if (!content.exampleAnswer?.trim()) problems.push(`${where}: missing exampleAnswer`);
        }

        if (ex.type === "fix_bug" || ex.type === "write_code") {
          problems.push(`${where}: code-runner types are not gradeable in this course yet`);
        }
      });
    }
  }

  console.log(`${spec.slug}: ${spec.units.length} units, ${lessons} lessons, ${exercises} exercises`);
  if (problems.length) {
    failed = true;
    console.log(`  ${problems.length} problem(s):`);
    for (const problem of problems) console.log(`    - ${problem}`);
  }
}

if (failed) process.exit(1);
console.log("All course data is structurally valid.");
