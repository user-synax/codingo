"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { loginUser, googleSignIn, API_BASE } from "@/lib/api";

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
        <>
          <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.1A11 11 0 0 1 12 5c7 0 10 7 10 7a14 14 0 0 1-2.3 3.3M14.1 14.1A3 3 0 0 1 9.9 9.9M7.3 9.7A14 14 0 0 0 2 12s3 7 10 7a11 11 0 0 0 4.2-.8" />
        </>
      ) : (
        <>
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );
}

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [googleNote, setGoogleNote] = useState(null);

  function validate(next = { email, password }) {
    const e = {};
    if (!next.email.trim()) e.email = "Email is required.";
    else if (!EMAIL_RE.test(next.email.trim())) e.email = "Enter a valid email.";
    if (!next.password) e.password = "Password is required.";
    else if (next.password.length < 6) e.password = "Password must be at least 6 characters.";
    return e;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    setTouched({ email: true, password: true });
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    setServerError(null);
    setDone(false);
    setGoogleNote(null);

    try {
      const { res, data } = await loginUser({
        email: email.trim().toLowerCase(),
        password,
      });

      if (!res.ok) {
        const fieldErrors = data?.errors ?? {};
        const msg = data?.message ?? "Something went wrong.";
        // Merge field errors into inline errors
        if (Object.keys(fieldErrors).length) {
          setErrors((prev) => ({ ...prev, ...fieldErrors }));
          setTouched((s) => ({
            ...s,
            ...Object.fromEntries(Object.keys(fieldErrors).map((k) => [k, true])),
          }));
        }
        // If no field errors, show banner. If both, show banner too.
        if (!Object.keys(fieldErrors).length || msg !== "Validation failed.") {
          // Avoid duplicate banner when field error already explains it and msg is generic
          const hasFieldMsg = fieldErrors.email || fieldErrors.password;
          if (!hasFieldMsg || msg !== "Invalid email or password.") {
            setServerError(msg);
          } else if (fieldErrors.password && msg === "Invalid email or password.") {
            // backend sends same msg for both fields; surface it once inline via password field
            // keep serverError null to avoid double
          } else {
            setServerError(msg);
          }
        } else {
          // Validation failed with field errors — no banner needed unless generic
          if (msg && msg !== "Validation failed.") setServerError(msg);
        }
        return;
      }

      setDone(true);
      const needsOnboarding = data?.user && !data.user.onboardingCompleted;
      window.setTimeout(() => {
        router.push(needsOnboarding ? "/onboarding" : "/app");
        router.refresh();
      }, 600);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error. Is the backend running at " + API_BASE + "?";
      setServerError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const emailErr = touched.email ? errors.email : undefined;
  const pwErr = touched.password ? errors.password : undefined;

  async function handleGoogleSuccess(credentialResponse) {
    setGoogleNote(null);
    setServerError(null);
    const credential = credentialResponse?.credential;
    if (!credential) {
      setGoogleNote("Google sign-in failed. Try again.");
      return;
    }
    try {
      const { res, data } = await googleSignIn({ credential });
      if (!res.ok) {
        setServerError(data?.message ?? "Google sign-in failed. Try again.");
        return;
      }
      setDone(true);
      const needsOnboarding = data?.user && !data.user.onboardingCompleted;
      window.setTimeout(() => {
        router.push(needsOnboarding ? "/onboarding" : "/app");
        router.refresh();
      }, 600);
    } catch {
      setServerError("Network error. Is the backend running at " + API_BASE + "?");
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="login-email">Email</Label>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (touched.email) setErrors(validate({ email: e.target.value, password }));
          }}
          onBlur={() => {
            setTouched((s) => ({ ...s, email: true }));
            setErrors(validate({ email, password }));
          }}
          aria-invalid={emailErr ? "true" : undefined}
          aria-describedby={emailErr ? "login-email-error" : undefined}
        />
        {emailErr ? (
          <p id="login-email-error" className="font-codingo-sans text-[13px] font-medium leading-[1.23] text-destructive">
            {emailErr}
          </p>
        ) : null}
      </div>

      {/* Password */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="login-password">Password</Label>
          <Link
            href="/forgot-password"
            className="font-codingo-sans text-[13px] font-bold leading-[1.23] text-spark-blue transition-colors duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spark-blue"
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <Input
            id="login-password"
            type={showPw ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (touched.password) setErrors(validate({ email, password: e.target.value }));
            }}
            onBlur={() => {
              setTouched((s) => ({ ...s, password: true }));
              setErrors(validate());
            }}
            aria-invalid={pwErr ? "true" : undefined}
            aria-describedby={pwErr ? "login-password-error" : undefined}
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
        {pwErr ? (
          <p id="login-password-error" className="font-codingo-sans text-[13px] font-medium leading-[1.23] text-destructive">
            {pwErr}
          </p>
        ) : null}
      </div>

      {/* Remember */}
      <label className="flex cursor-pointer items-center gap-2 font-codingo-sans text-[14px] font-medium leading-[1.4] text-charcoal select-none">
        <input
          type="checkbox"
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
          className="h-[18px] w-[18px] shrink-0 rounded-[4px] border-2 border-faded-gray bg-paper-white accent-eager-green outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spark-blue"
        />
        Remember me
      </label>

      {/* Server error banner */}
      {serverError ? (
        <p role="alert" className="rounded-[12px] border-2 border-destructive/30 bg-destructive/10 px-4 py-3 text-center font-codingo-sans text-[13px] font-medium leading-[1.23] text-destructive">
          {serverError}
        </p>
      ) : null}

      {/* Submit — primary green with 4px Deep Leaf edge */}
      <Button type="submit" variant="primary" disabled={submitting} className="w-full">
        {submitting ? (
          <span className="inline-flex items-center gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
              <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            </svg>
            Signing in…
          </span>
        ) : (
          "Log in"
        )}
      </Button>

      {done ? (
        <p
          role="status"
          aria-live="polite"
          className="rounded-[12px] border-2 border-faded-gray bg-storybook-green px-4 py-3 text-center font-codingo-sans text-[13px] font-medium leading-[1.23] text-charcoal"
        >
          Logged in — redirecting…
        </p>
      ) : null}

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-faded-gray/60" aria-hidden="true" />
        <span className="font-codingo-sans text-[13px] font-bold uppercase tracking-[0.053em] text-pencil-gray">or</span>
        <div className="h-px flex-1 bg-faded-gray/60" aria-hidden="true" />
      </div>

      {/* Google — official button; ID token verified by the backend */}
      <GoogleSignInButton
        onSuccess={handleGoogleSuccess}
        onError={() => setGoogleNote("Google sign-in failed. Try again.")}
      />
      {googleNote ? (
        <p role="status" className="rounded-[12px] border-2 border-faded-gray bg-paper-white px-4 py-2 text-center font-codingo-sans text-[13px] font-medium leading-[1.23] text-pencil-gray">
          {googleNote}
        </p>
      ) : null}

      <p className="text-center font-codingo-sans text-[14px] font-medium leading-[1.4] text-pencil-gray">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="font-bold text-spark-blue transition-colors duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spark-blue"
        >
          Sign up
        </Link>
      </p>
    </form>
  );
}
