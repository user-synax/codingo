import { cn } from "@/lib/utils";

export function Label({ className, ...props }) {
  return (
    <label
      data-slot="label"
      className={cn(
        "font-codingo-sans text-[14px] font-bold leading-[1.4] text-charcoal",
        className,
      )}
      {...props}
    />
  );
}
