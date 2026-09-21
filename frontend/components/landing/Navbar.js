import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/BrandLogo";
import { MobileMenu } from "@/components/landing/MobileMenu";

/* Sticky landing navbar (server component). Interactive bits live
   in MobileMenu, the only client component on the landing page. */

export const NAV_LINKS = [
  { label: "Docs", href: "/docs" },
  { label: "Learn", href: "#learn" },
  { label: "Community", href: "#community" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-faded-gray bg-paper-white">
      <div className="mx-auto flex h-[64px] w-full max-w-[1200px] items-center justify-between px-4 sm:px-6">
        <BrandLogo size={32} wordmarkSize="text-[28px]" priority />

        {/* Desktop */}
        <nav aria-label="Primary" className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="nav-link font-codingo-sans text-nav-label leading-nav-label font-bold tracking-nav-label text-pencil-gray uppercase"
            >
              {link.label}
            </Link>
          ))}
          <Button variant="outline" size="sm" href="/login">
            Log in
          </Button>
          <Button variant="primary" size="sm" href="/signup">
            Get started
          </Button>
        </nav>

        {/* Mobile */}
        <div className="md:hidden">
          <MobileMenu links={NAV_LINKS} />
        </div>
      </div>
    </header>
  );
}
