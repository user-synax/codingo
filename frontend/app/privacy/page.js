import { redirect } from "next/navigation";

/* Legacy alias — the Privacy Policy lives at /policy.
   Kept so old links and bookmarks keep working. */

export default function PrivacyPage() {
  redirect("/policy");
}
