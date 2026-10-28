import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
  phone: string;
  name: string;
}

interface AuthState {
  user: User | null;
  login: (phone: string, password: string) => { ok: boolean; error?: string };
  register: (phone: string, password: string, name: string) => { ok: boolean; error?: string };
  logout: () => void;
}

/** Demo users stored in localStorage under this key */
const USERS_KEY = "betrush-users";

function loadUsers(): Record<string, { password: string; name: string }> {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveUsers(users: Record<string, { password: string; name: string }>) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      login: (phone, password) => {
        const p = phone.replace(/\D/g, "").slice(-10);
        if (p.length !== 10) return { ok: false, error: "Enter valid 10-digit mobile" };
        if (!password || password.length < 4) return { ok: false, error: "Password min 4 chars" };

        const users = loadUsers();
        // Demo shortcut: any new number can login if registered; also accept demo/demo123
        if (p === "9999999999" && password === "demo123") {
          set({ user: { phone: p, name: "Demo Player" } });
          return { ok: true };
        }
        if (!users[p]) return { ok: false, error: "Account not found. Please Register." };
        if (users[p].password !== password) return { ok: false, error: "Wrong password" };
        set({ user: { phone: p, name: users[p].name || "Player" } });
        return { ok: true };
      },
      register: (phone, password, name) => {
        const p = phone.replace(/\D/g, "").slice(-10);
        if (p.length !== 10) return { ok: false, error: "Enter valid 10-digit mobile" };
        if (!password || password.length < 4) return { ok: false, error: "Password min 4 chars" };
        const users = loadUsers();
        if (users[p]) return { ok: false, error: "Number already registered. Login instead." };
        users[p] = { password, name: name.trim() || "Player" };
        saveUsers(users);
        set({ user: { phone: p, name: users[p].name } });
        return { ok: true };
      },
      logout: () => set({ user: null }),
    }),
    { name: "betrush-auth" }
  )
);
