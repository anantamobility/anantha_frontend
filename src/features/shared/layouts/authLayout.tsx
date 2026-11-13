import { Outlet } from "react-router-dom";
import { BrandLogo } from "@/features/shared/components/common";

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#25644b] via-[#2264a7] to-[#449dd6] p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-card p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <BrandLogo variant="full" className="mx-auto w-56" />
          <p className="mt-3 text-sm text-muted-foreground">
            Vehicle rental operations
          </p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
