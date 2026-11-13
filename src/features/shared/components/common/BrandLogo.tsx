import { cn } from "@/features/shared/utils/cn";

type BrandLogoProps = {
  variant?: "full" | "icon";
  className?: string;
};

const SRC = {
  full: "/ANANTA_Logo-01.svg",
  icon: "/Icon.svg",
} as const;

export function BrandLogo({ variant = "full", className }: BrandLogoProps) {
  return (
    <img
      src={SRC[variant]}
      alt="Ananta"
      className={cn("h-auto w-full object-contain", className)}
    />
  );
}
