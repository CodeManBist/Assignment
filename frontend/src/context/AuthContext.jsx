import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { getToken, setToken, registerUnauthorizedHandler } from "../api/client.js";
import * as authApi from "../api/reconciliation.js";

const AuthContext = createContext(null);

const EMAIL_KEY = "reconciliation_email";

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => getToken());
  const [email, setEmail] = useState(() => localStorage.getItem(EMAIL_KEY) || "");

  const logout = useCallback(() => {
    setToken(null);
    localStorage.removeItem(EMAIL_KEY);
    setTokenState(null);
    setEmail("");
  }, []);

  useEffect(() => {
    // If the API ever hands back a 401, treat the session as over
    // everywhere at once rather than per-screen.
    registerUnauthorizedHandler(logout);
  }, [logout]);

  const doLogin = useCallback(async (emailInput, password) => {
    const data = await authApi.login(emailInput, password);
    setToken(data.access_token);
    localStorage.setItem(EMAIL_KEY, emailInput);
    setTokenState(data.access_token);
    setEmail(emailInput);
  }, []);

  const doSignup = useCallback(async (emailInput, password) => {
    const data = await authApi.signup(emailInput, password);
    setToken(data.access_token);
    localStorage.setItem(EMAIL_KEY, emailInput);
    setTokenState(data.access_token);
    setEmail(emailInput);
  }, []);

  const value = useMemo(
    () => ({ token, email, isAuthenticated: !!token, login: doLogin, signup: doSignup, logout }),
    [token, email, doLogin, doSignup, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
