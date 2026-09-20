/* Profile settings form — avatar upload (Appwrite via backend), name,
   bio, country, timezone, and privacy toggle. Optimistic-feeling:
   instant preview, inline errors, success state. No emoji. */
"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Check, Eye, EyeOff, Loader2 } from "lucide-react";
import { CountrySelect } from "@/components/onboarding/CountrySelect";
import { UserAvatar } from "@/components/app/UserAvatar";
import { TIMEZONES } from "@/lib/timezones";
import { updateMe, uploadAvatarFile } from "@/lib/api";
import { Label } from "@/components/ui/label";

export function SettingsForm({ user }) {
  const router = useRouter();
  const fileRef = useRef(null);
  const [avatar, setAvatar] = useState(user?.avatar ?? null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [name, setName] = useState(user?.name ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [country, setCountry] = useState(user?.country ?? "");
  const [countryCode, setCountryCode] = useState(user?.countryCode ?? "");
  const [timezone, setTimezone] = useState(user?.timezone ?? "Asia/Kolkata");
  const [isPrivate, setIsPrivate] = useState(Boolean(user?.isPrivate));
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null); // { ok, message }

  function pickFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploadError("");
    if (!/^image\/(jpeg|png|webp|gif)$/.test(f.type)) {
      setUploadError("Only JPEG, PNG, WebP or GIF images work.");
      return;
    }
    if (f.size > 2 * 1024 * 1024) {
      setUploadError("Keep it under 2MB.");
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(f));
    uploadNow(f);
  }

  async function uploadNow(f) {
    setUploading(true);
    setUploadError("");
    try {
      const { ok, data } = await uploadAvatarFile(f);
      if (!ok) {
        setUploadError(data?.message ?? "Upload failed — check Appwrite setup, or try again.");
        return;
      }
      if (typeof data.avatar !== "string" || !data.avatar) {
        setUploadError("Upload failed — bad response from server. Try again.");
        return;
      }
      setAvatar(data.avatar);
      setPreview(null);
    } catch {
      setUploadError("Upload failed — is the backend running?");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    if (saving) return;
    const nextErrors = {};
    if (name.trim().length < 2) nextErrors.name = "Name needs at least 2 characters.";
    if (bio.trim().length > 160) nextErrors.bio = "Bio must be 160 characters or less.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    setStatus(null);
    try {
      const { ok, data } = await updateMe({
        name: name.trim(),
        bio: bio.trim() || null,
        country: country || null,
        countryCode: countryCode || null,
        timezone,
        avatar,
        isPrivate,
      });
      if (!ok) {
        if (data?.errors) setErrors(data.errors);
        setStatus({ ok: false, message: data?.message ?? "Couldn't save. Try again." });
        return;
      }
      setStatus({ ok: true, message: "Profile saved — your public page is live." });
      router.refresh();
    } catch {
      setStatus({ ok: false, message: "Network error. Is the backend running?" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-5">
      {/* Avatar */}
      <div className="rounded-[16px] border-2 border-faded-gray bg-paper-white p-5">
        <h2 className="font-codingo-sans text-[15px] font-bold leading-[1.3] text-charcoal">Photo</h2>
        <div className="mt-3 flex items-center gap-4">
          <UserAvatar
            src={preview ?? avatar}
            name={name}
            username={user?.username}
            boxClass="h-[72px] w-[72px] rounded-[16px] text-[26px]"
          />
          <div className="min-w-0">
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={pickFile} className="hidden" aria-label="Choose a profile photo" />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-1.5 rounded-[12px] border-2 border-faded-gray bg-paper-white px-4 py-2 font-codingo-sans text-[13px] font-bold leading-none text-charcoal transition-colors hover:border-charcoal disabled:opacity-60"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.4} aria-hidden="true" /> : <Camera className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />}
                {uploading ? "Uploading…" : preview || avatar ? "Change photo" : "Upload photo"}
              </button>
              {avatar || preview ? (
                <button
                  type="button"
                  onClick={() => {
                    if (preview) URL.revokeObjectURL(preview);
                    setPreview(null);
                    setAvatar(null);
                  }}
                  className="rounded-[12px] px-3 py-2 font-codingo-sans text-[13px] font-bold leading-none text-pencil-gray hover:text-charcoal"
                >
                  Remove
                </button>
              ) : null}
            </div>
            <p className="mt-1.5 font-codingo-sans text-[12px] font-medium leading-[1.4] text-pencil-gray">
              JPEG, PNG, WebP or GIF · under 2MB · stored securely in Appwrite.
            </p>
            {uploadError ? (
              <p className="mt-1 font-codingo-sans text-[12px] font-bold text-[#e03131]" role="alert">
                {uploadError}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {/* Identity */}
      <div className="rounded-[16px] border-2 border-faded-gray bg-paper-white p-5">
        <h2 className="font-codingo-sans text-[15px] font-bold leading-[1.3] text-charcoal">Identity</h2>
        <div className="mt-3 flex flex-col gap-4">
          <div>
            <Label htmlFor="settings-username">Username</Label>
            <input
              id="settings-username"
              value={`@${user?.username ?? ""}`}
              disabled
              readOnly
              title="Usernames can't be changed — your public link stays stable."
              className="mt-1.5 h-[44px] w-full cursor-not-allowed rounded-[12px] border-2 border-faded-gray bg-faded-gray/15 px-4 font-codingo-sans text-[15px] font-bold text-pencil-gray outline-none"
            />
            <p className="mt-1 font-codingo-sans text-[12px] font-medium text-pencil-gray">
              Locked — your public link codingo.synax.me/u/{user?.username} never breaks.
            </p>
          </div>
          <div>
            <Label htmlFor="settings-name">Display name</Label>
            <input
              id="settings-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              placeholder="Your name"
              className="mt-1.5 h-[44px] w-full rounded-[12px] border-2 border-faded-gray bg-paper-white px-4 font-codingo-sans text-[15px] font-medium text-charcoal outline-none transition-colors placeholder:text-pencil-gray/60 focus:border-spark-blue"
            />
            {errors.name ? (
              <p className="mt-1 font-codingo-sans text-[12px] font-bold text-[#e03131]" role="alert">
                {errors.name}
              </p>
            ) : null}
          </div>
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="settings-bio">Bio</Label>
              <span className="font-codingo-sans text-[12px] font-bold text-pencil-gray">{bio.trim().length}/160</span>
            </div>
            <textarea
              id="settings-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={160}
              rows={2}
              placeholder="One line about you — what are you learning?"
              className="mt-1.5 w-full resize-y rounded-[12px] border-2 border-faded-gray bg-paper-white px-4 py-2.5 font-codingo-sans text-[15px] font-medium leading-[1.45] text-charcoal outline-none transition-colors placeholder:text-pencil-gray/60 focus:border-spark-blue"
            />
            {errors.bio ? (
              <p className="mt-1 font-codingo-sans text-[12px] font-bold text-[#e03131]" role="alert">
                {errors.bio}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {/* Region */}
      <div className="rounded-[16px] border-2 border-faded-gray bg-paper-white p-5">
        <h2 className="font-codingo-sans text-[15px] font-bold leading-[1.3] text-charcoal">Region</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <CountrySelect
            value={country}
            onChange={(c) => {
              setCountry(c.name);
              setCountryCode(c.code);
            }}
          />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="settings-timezone">Timezone</Label>
            <select
              id="settings-timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="h-[44px] w-full rounded-[12px] border-2 border-faded-gray bg-paper-white px-4 font-codingo-sans text-[15px] font-medium text-charcoal outline-none transition-colors focus:border-spark-blue"
            >
              {TIMEZONES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
              {!TIMEZONES.some((t) => t.value === timezone) ? <option value={timezone}>{timezone}</option> : null}
            </select>
            <p className="font-codingo-sans text-[12px] font-medium text-pencil-gray">Streaks are counted in this timezone.</p>
          </div>
        </div>
      </div>

      {/* Privacy */}
      <div className="rounded-[16px] border-2 border-faded-gray bg-paper-white p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#e6f4ff] text-spark-blue" aria-hidden="true">
            {isPrivate ? <EyeOff className="h-5 w-5" strokeWidth={2.2} /> : <Eye className="h-5 w-5" strokeWidth={2.2} />}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-codingo-sans text-[15px] font-bold leading-[1.3] text-charcoal">Private profile</h2>
            <p className="font-codingo-sans text-[13px] font-medium leading-[1.4] text-pencil-gray">
              {isPrivate ? "Your /u/ page shows only your name — stats stay hidden." : "Anyone can see your showcase stats on your /u/ page."}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isPrivate}
            aria-label="Private profile"
            onClick={() => setIsPrivate((v) => !v)}
            className={
              isPrivate
                ? "relative h-[28px] w-[50px] shrink-0 rounded-full bg-charcoal transition-colors duration-[var(--duration-fast)]"
                : "relative h-[28px] w-[50px] shrink-0 rounded-full bg-faded-gray/40 transition-colors duration-[var(--duration-fast)]"
            }
          >
            <span
              aria-hidden="true"
              className={
                isPrivate
                  ? "absolute left-[24px] top-[3px] h-[22px] w-[22px] rounded-full bg-paper-white transition-all duration-[var(--duration-fast)]"
                  : "absolute left-[3px] top-[3px] h-[22px] w-[22px] rounded-full bg-paper-white transition-all duration-[var(--duration-fast)]"
              }
            />
          </button>
        </div>
      </div>

      {status ? (
        <p
          role={status.ok ? "status" : "alert"}
          className={
            status.ok
              ? "inline-flex items-center gap-1.5 rounded-[12px] border-2 border-eager-green bg-storybook-green px-4 py-3 font-codingo-sans text-[13px] font-bold text-charcoal"
              : "rounded-[12px] border-2 border-[#e03131] bg-paper-white px-4 py-3 font-codingo-sans text-[13px] font-bold text-[#e03131]"
          }
        >
          {status.ok ? <Check className="h-4 w-4" strokeWidth={2.6} aria-hidden="true" /> : null}
          {status.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={saving || uploading}
        className="codingo-btn codingo-btn-primary rounded-[12px] border-2 border-eager-green bg-eager-green px-6 py-3 font-codingo-sans text-[15px] font-bold uppercase leading-[1.33] tracking-[0.053em] text-paper-white hover:brightness-95 disabled:opacity-60 sm:self-start"
      >
        {saving ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
