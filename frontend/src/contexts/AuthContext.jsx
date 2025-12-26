import { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import { AuthContext } from "./auth";

export const AuthProvider = ({ children, theme, setTheme }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem("token"));

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  }, []);

  const verifyToken = useCallback(async () => {
    try {
      const response = await api.get("/auth/me");
      setUser(response.data.user);
    } catch (error) {
      console.error("Token verification failed:", error);
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    if (token) {
      verifyToken();
    } else {
      setLoading(false);
    }
  }, [token, verifyToken]);

  const login = async (email, password) => {
    const response = await api.post("/auth/login", { email, password });
    const { token, user } = response.data;

    localStorage.setItem("token", token);
    setToken(token);
    setUser(user);

    return response.data;
  };

  const register = async (username, email, password) => {
    const response = await api.post("/auth/register", {
      username,
      email,
      password,
    });
    const { token, user } = response.data;

    localStorage.setItem("token", token);
    setToken(token);
    setUser(user);

    return response.data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        theme,
        setTheme,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
