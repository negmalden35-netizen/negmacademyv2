import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  subtitle,
  size = "md",
}: {
  className?: string;
  subtitle?: string;
  size?: "sm" | "md" | "lg";
}) {
  const box = size === "lg" ? "size-14" : size === "sm" ? "size-9" : "size-11";
  const title = size === "lg" ? "text-3xl" : size === "sm" ? "text-lg" : "text-xl";
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className={cn("gold-gradient grid place-items-center rounded-2xl shadow-soft", box)}>
        <Star className="size-1/2 fill-gold-foreground text-gold-foreground" />
      </div>
      <div className="leading-tight">
        <p className={cn("font-black tracking-tight", title)}>نجم</p>
        {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
      </div>
    </div>
  );
}

export function PoweredBy({ className }: { className?: string }) {
  return (
    <p className={cn("text-center text-xs text-muted-foreground", className)}>Powered by NEGM</p>
  );
}
