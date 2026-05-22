export interface User {
  id: number;
  name: string;
  email: string;
}

const STORAGE_KEY = "prelegal:user";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function storeUser(user: User): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function clearStoredUser(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}

export async function fakeLogin(name: string, email: string): Promise<User> {
  const res = await fetch(`${API_BASE}/api/auth/fake-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(detail || `Login failed (${res.status})`);
  }
  return res.json() as Promise<User>;
}
