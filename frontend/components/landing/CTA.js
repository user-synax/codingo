/* Bottom CTA section — final conversion push before footer.
   Server component. Centered text on white canvas with two
   buttons matching hero. */

import { Button } from "@/components/ui/button";

export function CTA() {
  return (
    <section className="bg-paper-white">
      <div className="mx-auto w-full max-w-[1200px] px-4 py-20 text-center sm:px-6 md:py-28">
        <h2 className="font-feather text-[32px] leading-[1.2] font-black tracking-[-0.02em] text-eager-green sm:text-[40px] md:text-[48px]">
          ready to start coding?
        </h2>
        <p className="mx-auto mt-4 max-w-[480px] font-codingo-sans text-body leading-body font-medium text-pencil-gray">
          Join Codingo and start your programming journey today.
          No credit card. No ads. Just code.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button variant="primary" href="/signup">
            Get started — it&apos;s free
          </Button>
          <Button variant="outline" href="/login">
            I already have an account
          </Button>
        </div>
      </div>
    </section>
  );
}
