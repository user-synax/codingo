import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

/* shadcn-style Button customized to design.md.
   - primary: Eager Green fill, white text, codingo-sans 700 at
     15px uppercase with 0.0530em tracking, 12px radius. The 2px
     border matches the fill so it aligns with outline buttons.
     3D edge: 4px Deep Leaf bottom (`.codingo-btn-primary`).
   - outline: transparent fill, Spark Blue text at 14px, 2px
     Faded Gray border on top/sides. 3D edge: 4px Pale Sky
     bottom (`.codingo-btn-outline`).
   Motion (.codingo-btn in globals.css): hover shifts color only;
   press travels 2px down while the edge compresses 4px -> 2px. */

const buttonVariants = cva(
  "codingo-btn inline-flex cursor-pointer items-center justify-center gap-2 rounded-[12px] border-2 font-codingo-sans font-bold whitespace-nowrap outline-none select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spark-blue disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "codingo-btn-primary border-eager-green bg-eager-green text-nav-label leading-nav-label tracking-nav-label text-paper-white uppercase hover:brightness-95",
        outline:
          "codingo-btn-outline border-faded-gray bg-transparent text-[14px] leading-[1.4] text-spark-blue hover:border-spark-blue hover:bg-spark-blue/5",
      },
      size: {
        default: "px-4 py-2.5",
        sm: "px-3 py-1.5",
        lg: "px-6 py-3.5",
        icon: "p-2",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

function Button({ className, variant, size, href, ...props }) {
  const classes = cn(buttonVariants({ variant, size }), className);
  if (href) {
    return <a href={href} className={classes} {...props} />;
  }
  return <button type="button" className={classes} {...props} />;
}

export { Button, buttonVariants };
