"use client";

/* Pluggable code runner — JS via Web Worker, Python stub via Pyodide (lazy).
   PRD 5.3: timeout + output cap, language-pluggable for future. */

const OUTPUT_LIMIT = 10 * 1024;
const DEFAULT_TIMEOUT = 2000;

let workerUrl = null;
function getWorker() {
  if (typeof window === "undefined") return null;
  if (workerUrl) return workerUrl;
  // Next.js turbopack handles new URL(..., import.meta.url) for workers
  try {
    workerUrl = new URL("../../workers/jsRunner.worker.js", import.meta.url);
    return workerUrl;
  } catch {
    return null;
  }
}

let seq = 0;

/**
 * Run JS code in a sandboxed Worker.
 * @param {string} code
 * @param {{timeout?:number, language?:string}} opts
 * @returns {Promise<{output:string, error:string|null, timedOut:boolean, truncated:boolean}>}
 */
export function runJS(code, opts = {}) {
  const timeout = opts.timeout ?? DEFAULT_TIMEOUT;
  return new Promise((resolve) => {
    const id = String(seq++);
    let settled = false;
    let worker = null;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      try {
        worker?.terminate();
      } catch {}
      resolve({ output: "", error: "Execution timed out (2s). Check for infinite loops.", timedOut: true, truncated: false });
    }, timeout);

    try {
      const url = getWorker();
      if (!url) throw new Error("Worker not available");
      worker = new Worker(url);
    } catch (err) {
      clearTimeout(timer);
      // Fallback: run in main thread (not sandboxed) if Worker fails — still capture
      let output = "";
      let error = null;
      const orig = console.log;
      console.log = (...a) => {
        output += a.map((x) => (typeof x === "string" ? x : JSON.stringify(x))).join(" ") + "\n";
      };
      try {
        new Function(code)();
      } catch (e) {
        error = e?.message ?? String(e);
      }
      console.log = orig;
      if (output.length > OUTPUT_LIMIT) output = output.slice(0, OUTPUT_LIMIT);
      resolve({ output: output.trim(), error, timedOut: false, truncated: output.length >= OUTPUT_LIMIT });
      return;
    }

    worker.onmessage = (e) => {
      if (e.data.id !== id) return;
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      worker.terminate();
      const { output, error } = e.data;
      resolve({
        output: output ?? "",
        error: error ?? null,
        timedOut: false,
        truncated: (output?.length ?? 0) >= OUTPUT_LIMIT,
      });
    };

    worker.onerror = (e) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        worker.terminate();
      } catch {}
      resolve({ output: "", error: e.message || "Worker error", timedOut: false, truncated: false });
    };

    worker.postMessage({ id, code });
  });
}

/**
 * Main runner — picks adapter by language.
 * For now only javascript is real; python returns a stub that would lazy-load Pyodide.
 */
export async function runCode({ code, language = "javascript", timeout = DEFAULT_TIMEOUT }) {
  const lang = String(language).toLowerCase();
  if (lang === "python" || lang === "py") {
    return {
      output: "",
      error: "Python runner not yet loaded. Pyodide will be lazy-loaded on first Python lesson.",
      timedOut: false,
      truncated: false,
      notImplemented: true,
    };
  }
  // Default: javascript
  return runJS(code, { timeout });
}

/**
 * Compare output against expected for test cases.
 * Normalizes trailing newline / whitespace like typical judge.
 */
export function compareOutput(actual, expected) {
  const norm = (s) => String(s ?? "").trim().replace(/\r\n/g, "\n");
  return norm(actual) === norm(expected);
}
