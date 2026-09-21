"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CountrySelect } from "@/components/onboarding/CountrySelect";
import { LanguageGrid } from "@/components/onboarding/LanguageGrid";
import { patchOnboarding, API_BASE } from "@/lib/api";
import { uploadAvatar } from "@/lib/appwrite";
import { DEFAULT_COUNTRY } from "@/lib/countries";

export function OnboardingWizard({ user }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  // Step 1: profile
  const [displayName, setDisplayName] = useState(user?.name ?? user?.username ?? "");
  // Google signups arrive with a temp `google_user_*` username — they pick a real one here.
  const needsUsername = user?.needsUsername === true;
  const [username, setUsername] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar ?? null);

  // Step 2: details
  const [age, setAge] = useState(user?.age ? String(user.age) : "");
  const [country, setCountry] = useState(user?.country ?? DEFAULT_COUNTRY.name);
  const [countryCode, setCountryCode] = useState(user?.countryCode ?? DEFAULT_COUNTRY.code);

  // Step 3: language
  const [language, setLanguage] = useState(user?.language ?? "javascript");

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const initials = useMemo(() => (displayName?.[0] ?? user?.username?.[0] ?? "?").toUpperCase(), [displayName, user]);

  function validateStep(s) {
    const e = {};
    if (s === 1) {
      if (!displayName.trim()) e.displayName = "Display name is required.";
      else if (displayName.trim().length < 2) e.displayName = "At least 2 characters.";
      else if (displayName.trim().length > 50) e.displayName = "At most 50 characters.";
      if (needsUsername) {
        const u = username.trim();
        if (!u) e.username = "Username is required.";
        else if (u.length < 3) e.username = "At least 3 characters.";
        else if (u.length > 30) e.username = "At most 30 characters.";
        else if (!/^[a-zA-Z0-9_.-]+$/.test(u)) e.username = "Letters, numbers, _ . - only.";
      }
    }
    if (s === 2) {
      const n = Number(age);
      if (!age.trim()) e.age = "Age is required.";
      else if (!Number.isInteger(n)) e.age = "Age must be a whole number.";
      else if (n < 13) e.age = "You must be at least 13.";
      else if (n > 80) e.age = "At most 80.";
      if (!country) e.country = "Country is required.";
    }
    if (s === 3) {
      if (!language) e.language = "Pick a language.";
      else if (language !== "javascript") e.language = "JavaScript is the only track for now.";
    }
    return e;
  }

  function next() {
    const e = validateStep(step);
    setErrors(e);
    if (Object.keys(e).length) return;
    setServerError(null);
    if (step < totalSteps) setStep((s) => s + 1);
  }

  function back() {
    setErrors({});
    setServerError(null);
    if (step > 1) setStep((s) => s - 1);
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
  }

  async function handleSubmit() {
    const e1 = validateStep(1);
    const e2 = validateStep(2);
    const e3 = validateStep(3);
    const all = { ...e1, ...e2, ...e3 };
    setErrors(all);
    if (Object.keys(all).length) {
      const firstFail = e1 && Object.keys(e1).length ? 1 : e2 && Object.keys(e2).length ? 2 : 3;
      setStep(firstFail);
      return;
    }
    setSubmitting(true);
    setServerError(null);
    try {
      let avatarUrl = avatarPreview && avatarPreview.startsWith("http") ? avatarPreview : null;
      // If a new file was picked, try Appwrite upload (stub returns null until env set)
      if (avatarFile) {
        const uploaded = await uploadAvatar(avatarFile);
        if (uploaded) avatarUrl = uploaded;
        // If Appwrite not configured, we just send no avatar — backend keeps existing
      }

      const payload = {
        name: displayName.trim(),
        age: Number(age),
        country,
        countryCode,
        language,
        ...(avatarUrl ? { avatar: avatarUrl } : {}),
        ...(needsUsername ? { username: username.trim() } : {}),
      };

      const { res, data } = await patchOnboarding(payload);
      if (!res.ok) {
        const fieldErrors = data?.errors ?? {};
        if (Object.keys(fieldErrors).length) setErrors((prev) => ({ ...prev, ...fieldErrors }));
        setServerError(data?.message ?? "Something went wrong.");
        // jump to step with first field error
        if (fieldErrors.displayName || fieldErrors.name || fieldErrors.username) setStep(1);
        else if (fieldErrors.age || fieldErrors.country) setStep(2);
        else if (fieldErrors.language) setStep(3);
        return;
      }
      router.push("/app");
      router.refresh();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Network error. Is the backend at " + API_BASE + "?");
    } finally {
      setSubmitting(false);
    }
  }

  const progressPct = Math.round((step / totalSteps) * 100);

  return (
    <div className="auth-card w-full max-w-[560px] rounded-[12px] border-2 border-faded-gray bg-paper-white p-[28px] sm:p-[40px]">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <p className="font-codingo-sans text-[12px] font-bold uppercase tracking-[0.053em] text-pencil-gray">
            Step {step} of {totalSteps}
          </p>
          <p className="font-codingo-sans text-[12px] font-bold text-pencil-gray">{progressPct}%</p>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-faded-gray/30">
          <div className="h-full rounded-full bg-eager-green transition-all duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)]" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="mt-3 flex justify-center gap-1.5">
          {[1, 2, 3].map((i) => (
            <span key={i} className={i === step ? "h-2 w-6 rounded-full bg-eager-green" : i < step ? "h-2 w-6 rounded-full bg-eager-green/40" : "h-2 w-2 rounded-full bg-faded-gray/60"} aria-hidden="true" />
          ))}
        </div>
      </div>

      {step === 1 ? (
        <div className="flex flex-col gap-6">
          <div className="text-center">
            <h1 className="font-codingo-sans text-[28px] font-bold leading-[1.2] text-charcoal sm:text-[32px]">Create your profile</h1>
            <p className="mt-2 font-codingo-sans text-[15px] font-medium leading-[1.4] text-pencil-gray">How should the community see you? You can change this later.</p>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="flex h-[96px] w-[96px] items-center justify-center overflow-hidden rounded-[24px] border-2 border-faded-gray bg-paper-white">
                {avatarPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarPreview} alt="Avatar preview" className="h-full w-full object-cover" />
                ) : (
                  <span className="font-codingo-sans text-[32px] font-black leading-none text-charcoal">{initials}</span>
                )}
              </div>
              <label className="absolute -bottom-2 -right-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-paper-white bg-charcoal text-paper-white transition-colors hover:bg-night-ink focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-spark-blue">
                <input type="file" accept="image/*" className="sr-only" onChange={handleAvatarChange} aria-label="Choose avatar photo" />
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M14.5 4a2.5 2.5 0 0 0-3.5 0l-7 7a2.5 2.5 0 0 0 0 3.5l7 7a2.5 2.5 0 0 0 3.5 0l7-7a2.5 2.5 0 0 0 0-3.5l-7-7z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </label>
            </div>
            <p className="max-w-[360px] text-center font-codingo-sans text-[13px] font-medium leading-[1.4] text-pencil-gray">
              Avatar stored via Appwrite when you add env vars — for now we keep it local. Tap the badge to pick a photo.
            </p>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-[12px] border-2 border-faded-gray bg-paper-white px-4 py-2 font-codingo-sans text-[13px] font-bold text-charcoal hover:border-charcoal">
              <input type="file" accept="image/*" className="sr-only" onChange={handleAvatarChange} />
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Choose photo
            </label>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="onboarding-name">Display name</Label>
            <Input
              id="onboarding-name"
              placeholder="e.g. Alex"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              aria-invalid={errors.displayName ? "true" : undefined}
              aria-describedby={errors.displayName ? "onboarding-name-error" : undefined}
            />
            {errors.displayName ? (
              <p id="onboarding-name-error" className="font-codingo-sans text-[13px] font-medium leading-[1.23] text-destructive">
                {errors.displayName}
              </p>
            ) : needsUsername ? (
              <p className="font-codingo-sans text-[13px] font-medium leading-[1.23] text-pencil-gray">This is your public name. Pick your username below.</p>
            ) : (
              <p className="font-codingo-sans text-[13px] font-medium leading-[1.23] text-pencil-gray">This is your public name. Username @{user?.username} stays private.</p>
            )}
          </div>

          {needsUsername ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="onboarding-username">Username</Label>
              <Input
                id="onboarding-username"
                autoComplete="username"
                placeholder="e.g. alex_codes"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                aria-invalid={errors.username ? "true" : undefined}
                aria-describedby={errors.username ? "onboarding-username-error" : undefined}
              />
              {errors.username ? (
                <p id="onboarding-username-error" className="font-codingo-sans text-[13px] font-medium leading-[1.23] text-destructive">
                  {errors.username}
                </p>
              ) : (
                <p className="font-codingo-sans text-[13px] font-medium leading-[1.23] text-pencil-gray">Unique, 3–30 chars. Letters, numbers, _ . - only.</p>
              )}
            </div>
          ) : null}
        </div>
      ) : null}

      {step === 2 ? (
        <div className="flex flex-col gap-6">
          <div className="text-center">
            <h1 className="font-codingo-sans text-[28px] font-bold leading-[1.2] text-charcoal sm:text-[32px]">A bit about you</h1>
            <p className="mt-2 font-codingo-sans text-[15px] font-medium leading-[1.4] text-pencil-gray">Helps us personalize your path. You can update it later in settings.</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="onboarding-age">Age</Label>
            <Input
              id="onboarding-age"
              type="number"
              inputMode="numeric"
              min={13}
              max={80}
              placeholder="e.g. 19"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              aria-invalid={errors.age ? "true" : undefined}
              aria-describedby={errors.age ? "onboarding-age-error" : undefined}
            />
            {errors.age ? (
              <p id="onboarding-age-error" className="font-codingo-sans text-[13px] font-medium leading-[1.23] text-destructive">
                {errors.age}
              </p>
            ) : (
              <p className="font-codingo-sans text-[13px] font-medium leading-[1.23] text-pencil-gray">13 — 80. For learners under 18 we keep content age-appropriate.</p>
            )}
          </div>

          <CountrySelect
            value={country}
            onChange={(c) => {
              setCountry(c.name);
              setCountryCode(c.code);
            }}
            invalid={Boolean(errors.country)}
            errorId={errors.country ? "onboarding-country-error" : undefined}
          />
          {errors.country ? (
            <p id="onboarding-country-error" className="-mt-3 font-codingo-sans text-[13px] font-medium leading-[1.23] text-destructive">
              {errors.country}
            </p>
          ) : null}
        </div>
      ) : null}

      {step === 3 ? (
        <div className="flex flex-col gap-6">
          <div className="text-center">
            <h1 className="font-codingo-sans text-[28px] font-bold leading-[1.2] text-charcoal sm:text-[32px]">What do you want to learn?</h1>
            <p className="mt-2 font-codingo-sans text-[15px] font-medium leading-[1.4] text-pencil-gray">Pick your track. For now JavaScript is ready — more languages coming soon.</p>
          </div>

          <LanguageGrid value={language} onChange={setLanguage} />
          {errors.language ? (
            <p className="font-codingo-sans text-[13px] font-medium leading-[1.23] text-destructive">{errors.language}</p>
          ) : null}
        </div>
      ) : null}

      {serverError ? (
        <p role="alert" className="mt-6 rounded-[12px] border-2 border-destructive/30 bg-destructive/10 px-4 py-3 text-center font-codingo-sans text-[13px] font-medium leading-[1.23] text-destructive">
          {serverError}
        </p>
      ) : null}

      <div className="mt-8 flex gap-3">
        {step > 1 ? (
          <Button type="button" variant="outline" onClick={back} className="flex-1 bg-paper-white">
            Back
          </Button>
        ) : (
          <div className="flex-1" aria-hidden="true" />
        )}
        {step < totalSteps ? (
          <Button type="button" variant="primary" onClick={next} className="flex-1">
            Next
          </Button>
        ) : (
          <Button type="button" variant="primary" onClick={handleSubmit} disabled={submitting} className="flex-1">
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
                  <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                </svg>
                Saving…
              </span>
            ) : (
              "Finish"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
