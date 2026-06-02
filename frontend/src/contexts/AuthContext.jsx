import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/client.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("medalert_token"));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    let ignore = false;

    const loadUser = async () => {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data } = await api.get("/auth/me");
        if (!ignore) {
          setUser(data.user);
        }
      } catch {
        localStorage.removeItem("medalert_token");
        if (!ignore) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadUser();

    return () => {
      ignore = true;
    };
  }, [token]);

  const persistSession = (payload) => {
    localStorage.setItem("medalert_token", payload.token);
    setToken(payload.token);
    setUser(payload.user);
  };

  const login = async (values) => {
    const { data } = await api.post("/auth/login", values);
    persistSession(data);
    return data.user;
  };

  const register = async (values) => {
    const { data } = await api.post("/auth/register", values);
    persistSession(data);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("medalert_token");
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthenticated: Boolean(token && user),
      login,
      register,
      logout,
      saveSession: persistSession,
      setUser
    }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};
