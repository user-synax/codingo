import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata = {
  title: "Forgot password — Codingo",
};

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Forgot password?"
      description="UI preview — enter your email and we'll pretend to send a reset link."
    >
      <form noValidate className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="forgot-email">Email</Label>
          <Input id="forgot-email" type="email" autoComplete="email" placeholder="you@example.com" />
        </div>
        <Button variant="primary" className="w-full">
          Send reset link
        </Button>
        <p className="text-center font-codingo-sans text-[14px] font-medium leading-[1.4] text-pencil-gray">
          Remembered it?{" "}
          <Link href="/login" className="font-bold text-spark-blue hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spark-blue">
            Back to log in
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
