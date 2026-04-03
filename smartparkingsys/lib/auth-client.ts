"use client";

export const AUTH_TOKEN_KEY = "token";
export const AUTH_ROLE_KEY = "role";

export type ClientRole = "admin" | "user";

export function getStoredToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

export function getStoredRole() {
  if (typeof window === "undefined") {
    return null;
  }

  const role = window.localStorage.getItem(AUTH_ROLE_KEY);

  if (role === "admin" || role === "user") {
    return role;
  }

  return null;
}

export function setAuthSession(token: string, role: ClientRole) {
  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  window.localStorage.setItem(AUTH_ROLE_KEY, role);
  window.dispatchEvent(new Event("auth-state-changed"));
}

export function clearAuthSession() {
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
  window.localStorage.removeItem(AUTH_ROLE_KEY);
  window.dispatchEvent(new Event("auth-state-changed"));
}
