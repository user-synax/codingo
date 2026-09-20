"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

/* Minimal shadcn-style Sheet (right side only for the mobile nav).
   Open/close motion lives in globals.css (.sheet-overlay /
   .sheet-content-right): panel-reveal tokens, 400ms open /
   350ms close with cross-blur, plus a reduced-motion guard. */

function Sheet({ ...props }) {
  return <Dialog.Root data-slot="sheet" {...props} />;
}

function SheetTrigger({ ...props }) {
  return <Dialog.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose({ ...props }) {
  return <Dialog.Close data-slot="sheet-close" {...props} />;
}

function SheetPortal({ ...props }) {
  return <Dialog.Portal data-slot="sheet-portal" {...props} />;
}

function SheetOverlay({ className, ...props }) {
  return (
    <Dialog.Overlay
      data-slot="sheet-overlay"
      className={cn("sheet-overlay fixed inset-0 z-50 bg-night-ink/60", className)}
      {...props}
    />
  );
}

const sheetVariants = cva("fixed z-50 flex flex-col bg-paper-white", {
  variants: {
    side: {
      right:
        "sheet-content-right inset-y-0 right-0 h-full w-[300px] border-l-2 border-l-faded-gray sm:w-[360px]",
    },
  },
  defaultVariants: {
    side: "right",
  },
});

function SheetContent({ className, children, side = "right", ...props }) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <Dialog.Content
        data-slot="sheet-content"
        className={cn(sheetVariants({ side }), className)}
        {...props}
      >
        {children}
        <SheetClose
          aria-label="Close menu"
          className="absolute top-4 right-4 rounded-[12px] p-2 text-pencil-gray transition-colors duration-[var(--duration-fast)] ease-[var(--ease-smooth-out)] hover:text-charcoal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spark-blue"
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
            <path d="M5 5l10 10M15 5L5 15" />
          </svg>
        </SheetClose>
      </Dialog.Content>
    </SheetPortal>
  );
}

function SheetTitle({ className, ...props }) {
  return (
    <Dialog.Title
      data-slot="sheet-title"
      className={cn("font-feather text-xl font-black text-eager-green", className)}
      {...props}
    />
  );
}

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetTitle };
