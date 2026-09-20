/* JS code runner — runs in a dedicated Web Worker.
   Captures console.log, enforces 10KB output cap. Timeout is enforced
   by the main thread terminating the worker, so infinite loops are handled. */

// Keep output cap as per PRD (10KB)
const OUTPUT_LIMIT = 10 * 1024;

self.onmessage = (e) => {
  const { id, code } = e.data;
  let output = "";
  let error = null;

  const originalLog = console.log;
  const originalErr = console.error;

  const push = (...args) => {
    const line = args
      .map((a) => {
        if (typeof a === "string") return a;
        if (a === null) return "null";
        if (a === undefined) return "undefined";
        try {
          return typeof a === "object" ? JSON.stringify(a) : String(a);
        } catch {
          return String(a);
        }
      })
      .join(" ");
    output += line + "\n";
    if (output.length > OUTPUT_LIMIT) output = output.slice(0, OUTPUT_LIMIT);
  };

  console.log = push;
  // also capture console.error to output for learner visibility
  console.error = push;

  try {
    // Wrap in Function to avoid leaking worker scope, run as script
    const fn = new Function(code);
    fn();
  } catch (err) {
    error = err && err.message ? err.message : String(err);
  } finally {
    console.log = originalLog;
    console.error = originalErr;
  }

  self.postMessage({ id, output: output.trim(), error });
};
