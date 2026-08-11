import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  changeSessionPassword,
  clearSession,
  confirmAuthenticatedSession,
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
  const sessionVersionRef = useRef(0);

  const logout = useCallback(async () => {
    if (!logoutRequestRef.current) {
      const logoutVersion = ++sessionVersionRef.current;
      logoutRequestRef.current = clearSession()
        .catch(() => null)
        .finally(() => {
          if (logoutVersion === sessionVersionRef.current) {
            setUser(null);
            setIsLoading(false);
          }
          logoutRequestRef.current = null;
        });
    }
    await logoutRequestRef.current;
  }, []);

  useEffect(() => {
    let active = true;
    const restoreVersion = sessionVersionRef.current;
    const restore = async () => {
      try {
        const sessionUser = await getSessionUser();
        if (active && restoreVersion === sessionVersionRef.current) {
          setUser(sessionUser);
        }
      } catch (error) {
        if (
          active
          && restoreVersion === sessionVersionRef.current
          && [401, 403].includes(error?.status)
        ) {
          await logout();
        }
      } finally {
        if (active && restoreVersion === sessionVersionRef.current) {
          setIsLoading(false);
        }
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
    const loginVersion = ++sessionVersionRef.current;
    try {
      const nextUser = await loginUser(credentials);
      if (loginVersion === sessionVersionRef.current) {
        setUser(nextUser);
        setIsLoading(false);
      }
      return nextUser;
    } catch (error) {
      if (loginVersion === sessionVersionRef.current) setIsLoading(false);
      throw error;
    }
  }, []);

  const adoptSession = useCallback(async (result) => {
    const adoptionVersion = ++sessionVersionRef.current;
    try {
      const nextUser = await confirmAuthenticatedSession(result);
      if (adoptionVersion === sessionVersionRef.current) {
        setUser(nextUser);
        setIsLoading(false);
      }
      return nextUser;
    } catch (error) {
      if (adoptionVersion === sessionVersionRef.current) setIsLoading(false);
      throw error;
    }
  }, []);

  const register = useCallback(async (data) => {
    const registerVersion = ++sessionVersionRef.current;
    try {
      const nextUser = await registerUser(data);
      if (registerVersion === sessionVersionRef.current) {
        setUser(nextUser);
        setIsLoading(false);
      }
      return nextUser;
    } catch (error) {
      if (registerVersion === sessionVersionRef.current) setIsLoading(false);
      throw error;
    }
  }, []);

  const updateUser = useCallback(async (data) => {
    const nextUser = await updateSessionUser(data);
    setUser(nextUser);
    return nextUser;
  }, []);

  const changePassword = useCallback(async (data) => {
    const changeVersion = ++sessionVersionRef.current;
    const result = await changeSessionPassword(data);
    if (changeVersion === sessionVersionRef.current) {
      setUser(result.user);
      setIsLoading(false);
    }
    return result;
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      adoptSession,
      changePassword,
      login,
      logout,
      register,
      updateUser,
    }),
    [adoptSession, changePassword, isLoading, login, logout, register, updateUser, user],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
