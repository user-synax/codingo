import { AuthCard } from "@/components/auth/AuthCard";
import { SignupForm } from "@/components/auth/SignupForm";

export const metadata = {
  title: "Sign up — Codingo",
  description: "Create your Codingo account — free, fun, together.",
};

export default function SignupPage() {
  return (
    <AuthCard title="Create account" description="Join Codingo — learn to code free, fun, together.">
      <SignupForm />
    </AuthCard>
  );
}
