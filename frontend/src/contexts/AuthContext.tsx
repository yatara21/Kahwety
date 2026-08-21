import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { api } from "@/lib/axios";
import type { User, AuthTokens, LoginRequest, GoogleLoginRequest } from "@/types";
import { hasPagePermission } from "@/utils/permissions";

interface AuthContextType {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  googleLogin: (data: GoogleLoginRequest) => Promise<void>;
  logout: () => void;
  hasPermission: (page: string) => boolean;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function loadUser(): User | null {
  try {
    const stored = localStorage.getItem("user");
    if (stored) {
      return JSON.parse(stored) as User;
    }
  } catch {
    return null;
  }
  return null;
}

function loadTokens(): AuthTokens | null {
  try {
    const accessToken = localStorage.getItem("access_token");
    const refreshToken = localStorage.getItem("refresh_token");
    if (accessToken && refreshToken) {
      const user = loadUser();
      return {
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: "bearer",
        expires_in: 3600,
        user: user!,
      };
    }
  } catch {
    return null;
  }
  return null;
}

function storeTokens(tokens: AuthTokens) {
  localStorage.setItem("access_token", tokens.access_token);
  localStorage.setItem("refresh_token", tokens.refresh_token);
  localStorage.setItem("user", JSON.stringify(tokens.user));
}

function clearStorage() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(loadUser);
  const [tokens, setTokens] = useState<AuthTokens | null>(loadTokens);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!tokens;

  useEffect(() => {
    const init = async () => {
      const storedToken = localStorage.getItem("access_token");
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const me = await api.get<User>("/auth/me");
        setUser(me);
        localStorage.setItem("user", JSON.stringify(me));
        const existingTokens = loadTokens();
        if (existingTokens) {
          setTokens({ ...existingTokens, user: me });
        }
      } catch {
        clearStorage();
        setUser(null);
        setTokens(null);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  const login = useCallback(async (data: LoginRequest) => {
    const response = await api.post<AuthTokens>("/auth/login", data);
    storeTokens(response);
    setTokens(response);
    setUser(response.user);
  }, []);

  const googleLogin = useCallback(async (data: GoogleLoginRequest) => {
    const response = await api.post<AuthTokens>("/auth/google", data);
    storeTokens(response);
    setTokens(response);
    setUser(response.user);
  }, []);

  const logout = useCallback(() => {
    clearStorage();
    setUser(null);
    setTokens(null);
    window.location.href = "/login";
  }, []);

  const hasPermission = useCallback(
    (page: string) => {
      return hasPagePermission(user, page);
    },
    [user]
  );

  const handleSetUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        tokens,
        isAuthenticated,
        isLoading,
        login,
        googleLogin,
        logout,
        hasPermission,
        setUser: handleSetUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
