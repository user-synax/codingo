"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/BrandLogo";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";

/* Mobile menu: hamburger trigger + shadcn Sheet. Client-only so
   the Navbar itself can stay a server component. Panel motion
   (400ms open / 350ms close) is pure CSS in globals.css. */

export function MobileMenu({ links }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Open menu"
          aria-expanded={open}
          className="rounded-[12px] border-2 border-faded-gray p-2 text-charcoal transition-colors duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] hover:border-charcoal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spark-blue"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M3 5h14M3 10h14M3 15h14" />
          </svg>
        </button>
      </SheetTrigger>
      <SheetContent side="right" aria-describedby={undefined}>
        <div className="flex flex-col gap-6 px-6 py-6">
          <SheetTitle>
            <span className="inline-flex items-center gap-2">
              <BrandMark size={24} />
              Codingo
            </span>
          </SheetTitle>
          <nav aria-label="Mobile" className="flex flex-col gap-5">
            {links.map((link) => (
              <SheetClose key={link.label} asChild>
                <Link
                  href={link.href}
                  className="nav-link font-codingo-sans text-nav-label leading-nav-label font-bold tracking-nav-label text-pencil-gray uppercase"
                >
                  {link.label}
                </Link>
              </SheetClose>
            ))}
          </nav>
          <div className="flex flex-col gap-3">
            <SheetClose asChild>
              <Button variant="outline" href="/login" className="w-full">
                Log in
              </Button>
            </SheetClose>
            <SheetClose asChild>
              <Button variant="primary" href="/signup" className="w-full">
                Get started
              </Button>
            </SheetClose>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
