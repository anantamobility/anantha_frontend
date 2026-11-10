import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-card p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <p className="text-2xl font-semibold text-foreground">Anantha</p>
          <p className="text-sm text-muted-foreground">Vehicle rental operations</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
