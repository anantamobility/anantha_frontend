import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { setApiAuthHandlers } from "@/features/shared/api/apiClient";

export type AuthUser = {
  name: string;
  email?: string | null;
  phoneNumber: string;
  role: string;
  status: string;
};

type AuthContextValue = {
  accessToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  setSession: (token: string, user: AuthUser) => void;
  clearSession: () => void;
};

const STORAGE_KEY = "anantha.auth";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredSession(): { accessToken: string; user: AuthUser } | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { accessToken?: string; user?: AuthUser };
    if (!parsed.accessToken || !parsed.user) return null;
    return { accessToken: parsed.accessToken, user: parsed.user };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const stored = readStoredSession();
  const [accessToken, setAccessTokenState] = useState<string | null>(
    stored?.accessToken ?? null,
  );
  const [user, setUser] = useState<AuthUser | null>(stored?.user ?? null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const tokenRef = useRef<string | null>(stored?.accessToken ?? null);

  const setAccessToken = useCallback((token: string | null) => {
    tokenRef.current = token;
    setAccessTokenState(token);
  }, []);

  const clearSession = useCallback(() => {
    tokenRef.current = null;
    setAccessTokenState(null);
    setUser(null);
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  const setSession = useCallback((token: string, nextUser: AuthUser) => {
    tokenRef.current = token;
    setAccessTokenState(token);
    setUser(nextUser);
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ accessToken: token, user: nextUser }),
    );
  }, []);

  useEffect(() => {
    setApiAuthHandlers({
      getAccessToken: () => tokenRef.current,
      setAccessToken: (token) => {
        tokenRef.current = token;
        setAccessTokenState(token);
        if (!token) {
          setUser(null);
          sessionStorage.removeItem(STORAGE_KEY);
          return;
        }
        const current = readStoredSession();
        if (current?.user) {
          sessionStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ accessToken: token, user: current.user }),
          );
        }
      },
      onAuthFailure: () => {
        clearSession();
        if (window.location.pathname !== "/login") {
          window.location.assign("/login");
        }
      },
    });
    setIsBootstrapping(false);
  }, [clearSession, setAccessToken]);

  const value = useMemo<AuthContextValue>(
    () => ({
      accessToken,
      user,
      isAuthenticated: Boolean(accessToken && user),
      isBootstrapping,
      setSession,
      clearSession,
    }),
    [accessToken, user, isBootstrapping, setSession, clearSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
