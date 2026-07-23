import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  clearSession,
  getSessionUser,
  loginUser,
  registerUser,
  updateSessionUser,
} from "../services/authService";
import { AuthContext } from "./authStore";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const logoutRequestRef = useRef(null);

  const logout = useCallback(async () => {
    if (!logoutRequestRef.current) {
      logoutRequestRef.current = clearSession()
        .catch(() => null)
        .finally(() => {
          setUser(null);
          logoutRequestRef.current = null;
        });
    }
    await logoutRequestRef.current;
  }, []);

  useEffect(() => {
    let active = true;
    const restore = async () => {
      try {
        const sessionUser = await getSessionUser();
        if (active) setUser(sessionUser);
      } catch {
        if (active) logout();
      } finally {
        if (active) setIsLoading(false);
      }
    };
    restore();
    window.addEventListener("wasi:session-expired", logout);
    return () => {
      active = false;
      window.removeEventListener("wasi:session-expired", logout);
    };
  }, [logout]);

  const login = useCallback(async (credentials) => {
    const nextUser = await loginUser(credentials);
    setUser(nextUser);
    return nextUser;
  }, []);

  const register = useCallback(async (data) => {
    const nextUser = await registerUser(data);
    setUser(nextUser);
    return nextUser;
  }, []);

  const updateUser = useCallback(async (data) => {
    const nextUser = await updateSessionUser(data);
    setUser(nextUser);
    return nextUser;
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      logout,
      register,
      updateUser,
    }),
    [isLoading, login, logout, register, updateUser, user],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
