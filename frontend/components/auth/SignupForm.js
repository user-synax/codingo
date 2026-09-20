"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleIcon } from "@/components/auth/GoogleIcon";
import { registerUser, API_BASE } from "@/lib/api";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function EyeIcon({ off }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {off ? (
        <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.1A11 11 0 0 1 12 5c7 0 10 7 10 7a14 14 0 0 1-2.3 3.3M14.1 14.1A3 3 0 0 1 9.9 9.9M7.3 9.7A14 14 0 0 0 2 12s3 7 10 7a11 11 0 0 0 4.2-.8" />
      ) : (
        <>
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );
}

export function SignupForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [googleNote, setGoogleNote] = useState(null);

  function validate(next = { username, email, password, confirm }) {
    const e = {};
    const u = next.username.trim();
    if (!u) e.username = "Username is required.";
    else if (u.length < 3) e.username = "At least 3 characters.";
    else if (!/^[a-zA-Z0-9_.-]+$/.test(u)) e.username = "Letters, numbers, _ . - only.";

    if (!next.email.trim()) e.email = "Email is required.";
    else if (!EMAIL_RE.test(next.email.trim())) e.email = "Enter a valid email.";

    if (!next.password) e.password = "Password is required.";
    else if (next.password.length < 6) e.password = "At least 6 characters.";

    if (!next.confirm) e.confirm = "Confirm your password.";
    else if (next.confirm !== next.password) e.confirm = "Passwords don't match.";
    return e;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    setTouched({ username: true, email: true, password: true, confirm: true });
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    setServerError(null);
    setDone(false);
    setGoogleNote(null);

    try {
      const { res, data } = await registerUser({
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      if (!res.ok) {
        const fieldErrors = data?.errors ?? {};
        const msg = data?.message ?? "Something went wrong.";
        if (Object.keys(fieldErrors).length) {
          setErrors((prev) => ({ ...prev, ...fieldErrors }));
          setTouched((s) => ({
            ...s,
            ...Object.fromEntries(Object.keys(fieldErrors).map((k) => [k, true])),
          }));
        }
        // Show banner if generic or if field errors don't fully explain
        if (!Object.keys(fieldErrors).length) {
          setServerError(msg);
        } else if (msg && msg !== "Validation failed." && !fieldErrors.username && !fieldErrors.email) {
          setServerError(msg);
        } else if (fieldErrors.username || fieldErrors.email) {
          // inline already covers it; also surface generic if 409 message is more helpful?
          // keep banner hidden to avoid double - field inline is enough
        } else {
          setServerError(msg);
        }
        return;
      }

      setDone(true);
      window.setTimeout(() => {
        router.push("/onboarding");
        router.refresh();
      }, 600);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error. Is the backend running at " + API_BASE + "?";
      setServerError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const err = (k) => (touched[k] ? errors[k] : undefined);

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {/* Username */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="signup-username">Username</Label>
        <Input
          id="signup-username"
          autoComplete="username"
          placeholder="codingo_learner"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            if (touched.username) setErrors(validate({ username: e.target.value, email, password, confirm }));
          }}
          onBlur={() => {
            setTouched((s) => ({ ...s, username: true }));
            setErrors(validate({ username, email, password, confirm }));
          }}
          aria-invalid={err("username") ? "true" : undefined}
          aria-describedby={err("username") ? "signup-username-error" : undefined}
        />
        {err("username") ? (
          <p id="signup-username-error" className="font-codingo-sans text-[13px] font-medium leading-[1.23] text-destructive">
            {err("username")}
          </p>
        ) : null}
      </div>

      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="signup-email">Email</Label>
        <Input
          id="signup-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (touched.email) setErrors(validate({ username, email: e.target.value, password, confirm }));
          }}
          onBlur={() => {
            setTouched((s) => ({ ...s, email: true }));
            setErrors(validate());
          }}
          aria-invalid={err("email") ? "true" : undefined}
          aria-describedby={err("email") ? "signup-email-error" : undefined}
        />
        {err("email") ? (
          <p id="signup-email-error" className="font-codingo-sans text-[13px] font-medium leading-[1.23] text-destructive">
            {err("email")}
          </p>
        ) : null}
      </div>

      {/* Password */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="signup-password">Password</Label>
        <div className="relative">
          <Input
            id="signup-password"
            type={showPw ? "text" : "password"}
            autoComplete="new-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (touched.password || touched.confirm)
                setErrors(validate({ username, email, password: e.target.value, confirm }));
            }}
            onBlur={() => {
              setTouched((s) => ({ ...s, password: true }));
              setErrors(validate());
            }}
            aria-invalid={err("password") ? "true" : undefined}
            aria-describedby={err("password") ? "signup-password-error" : undefined}
            className="pr-11"
          />
          <button
            type="button"
            aria-label={showPw ? "Hide password" : "Show password"}
            aria-pressed={showPw}
            onClick={() => setShowPw((v) => !v)}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-[12px] text-pencil-gray transition-colors duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] hover:text-charcoal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spark-blue"
          >
            <EyeIcon off={showPw} />
          </button>
        </div>
        {err("password") ? (
          <p id="signup-password-error" className="font-codingo-sans text-[13px] font-medium leading-[1.23] text-destructive">
            {err("password")}
          </p>
        ) : (
          <p className="font-codingo-sans text-[13px] font-medium leading-[1.23] text-pencil-gray">At least 6 characters.</p>
        )}
      </div>

      {/* Confirm */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="signup-confirm">Confirm password</Label>
        <div className="relative">
          <Input
            id="signup-confirm"
            type={showConfirm ? "text" : "password"}
            autoComplete="new-password"
            placeholder="••••••••"
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value);
              if (touched.confirm) setErrors(validate({ username, email, password, confirm: e.target.value }));
            }}
            onBlur={() => {
              setTouched((s) => ({ ...s, confirm: true }));
              setErrors(validate());
            }}
            aria-invalid={err("confirm") ? "true" : undefined}
            aria-describedby={err("confirm") ? "signup-confirm-error" : undefined}
            className="pr-11"
          />
          <button
            type="button"
            aria-label={showConfirm ? "Hide password" : "Show password"}
            aria-pressed={showConfirm}
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-[12px] text-pencil-gray transition-colors duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] hover:text-charcoal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spark-blue"
          >
            <EyeIcon off={showConfirm} />
          </button>
        </div>
        {err("confirm") ? (
          <p id="signup-confirm-error" className="font-codingo-sans text-[13px] font-medium leading-[1.23] text-destructive">
            {err("confirm")}
          </p>
        ) : null}
      </div>

      <p className="font-codingo-sans text-[13px] font-medium leading-[1.23] text-pencil-gray">
        By creating an account you agree to our{" "}
        <a href="#" className="font-bold text-spark-blue hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spark-blue">
          Terms
        </a>{" "}
        and{" "}
        <a href="#" className="font-bold text-spark-blue hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spark-blue">
          Privacy Policy
        </a>
        .
      </p>

      {serverError ? (
        <p role="alert" className="rounded-[12px] border-2 border-destructive/30 bg-destructive/10 px-4 py-3 text-center font-codingo-sans text-[13px] font-medium leading-[1.23] text-destructive">
          {serverError}
        </p>
      ) : null}

      <Button type="submit" variant="primary" disabled={submitting} className="w-full">
        {submitting ? (
          <span className="inline-flex items-center gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
              <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            </svg>
            Creating account…
          </span>
        ) : (
          "Create account"
        )}
      </Button>

      {done ? (
        <p
          role="status"
          aria-live="polite"
          className="rounded-[12px] border-2 border-faded-gray bg-storybook-green px-4 py-3 text-center font-codingo-sans text-[13px] font-medium leading-[1.23] text-charcoal"
        >
          Account created — taking you to onboarding…
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-faded-gray/60" aria-hidden="true" />
        <span className="font-codingo-sans text-[13px] font-bold uppercase tracking-[0.053em] text-pencil-gray">or</span>
        <div className="h-px flex-1 bg-faded-gray/60" aria-hidden="true" />
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full bg-paper-white"
        onClick={async () => {
          setGoogleNote(null);
          setServerError(null);
          try {
            const { data } = await (await import("@/lib/api")).apiFetch("/api/auth/google");
            setGoogleNote(data?.message ?? "Google OAuth not configured yet.");
          } catch {
            setGoogleNote("Google OAuth not configured yet. Use email/password for now.");
          }
        }}
      >
        <GoogleIcon />
        Continue with Google
      </Button>
      {googleNote ? (
        <p role="status" className="rounded-[12px] border-2 border-faded-gray bg-paper-white px-4 py-2 text-center font-codingo-sans text-[13px] font-medium leading-[1.23] text-pencil-gray">
          {googleNote}
        </p>
      ) : null}

      <p className="text-center font-codingo-sans text-[14px] font-medium leading-[1.4] text-pencil-gray">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-bold text-spark-blue transition-colors duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spark-blue"
        >
          Log in
        </Link>
      </p>
    </form>
  );
}
