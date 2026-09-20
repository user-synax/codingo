import { Button } from "@/components/ui/button";
import { HeroIllustration } from "@/components/landing/HeroIllustration";

/* Landing hero (server component). Two columns from md up (text
   left, illustration right); stacked with text first on mobile.
   Entrance is a staggered blurred rise (.hero-reveal--N in
   globals.css, from transitions-dev 18-texts-reveal tokens) that
   plays on mount with no client JS. */

export function Hero() {
  return (
    <section className="bg-paper-white">
      <div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 items-center gap-10 px-4 py-20 sm:px-6 md:grid-cols-2 md:py-28 lg:gap-[64px]">
        <div className="flex max-w-[480px] flex-col items-start gap-6">
          <h1 className="hero-reveal hero-reveal--1 font-feather text-[40px] leading-[1.2] font-black tracking-[-0.02em] text-eager-green sm:text-[48px] lg:text-[64px]">
            Learn to code. Free. Fun. Together.
          </h1>
          <p className="hero-reveal hero-reveal--2 font-codingo-sans text-[17px] leading-[1.18] font-medium text-pencil-gray">
            Bite-sized lessons, real code in your browser, and a community that
            helps you get unstuck.
          </p>
          <div className="hero-reveal hero-reveal--3 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            {/* TODO: point to /signup and /login once auth ships (PRD milestone 1). */}
            <Button variant="primary" href="#get-started">
              Get started
            </Button>
            <Button variant="outline" href="#login">
              I already have an account
            </Button>
          </div>
        </div>
        <div className="hero-reveal hero-reveal--4 flex justify-center md:justify-end">
          <HeroIllustration className="h-auto w-full max-w-[440px]" />
        </div>
      </div>
    </section>
  );
}
