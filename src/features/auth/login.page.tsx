import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginRequest } from "./api/auth.api";
import { useAuth } from "@/features/shared/context/authContext";
import { getErrorMessage } from "@/features/shared/api/client";
import { notifyError, notifySuccess } from "@/features/shared/utils/notify";

export default function LoginPage() {
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const [phone, setPhone] = useState("9000000000");
  const [password, setPassword] = useState("DemoPassword123");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const result = await loginRequest(phone.trim(), password);
      setSession(result.accessToken, result.user);
      notifySuccess(`Welcome, ${result.user.name}`);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      notifyError(getErrorMessage(error, "Login failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block space-y-1 text-sm">
        <span className="font-medium">Phone</span>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="h-10 w-full rounded-lg border border-border px-3"
          autoComplete="username"
          required
        />
      </label>
      <label className="block space-y-1 text-sm">
        <span className="font-medium">Password</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-10 w-full rounded-lg border border-border px-3"
          autoComplete="current-password"
          required
        />
      </label>
      <button
        type="submit"
        disabled={loading}
        className="h-10 w-full rounded-lg bg-primary text-sm font-medium text-primary-foreground disabled:opacity-60"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-center text-xs text-muted-foreground">
        Demo admin: 9000000000 / DemoPassword123
      </p>
    </form>
  );
}
