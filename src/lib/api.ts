export interface User {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  createdAt: string;
}

export interface Service {
  id: string;
  barberId: string;
  name: string;
  durationMinutes: number;
  price: number;
  imageUrl?: string;
}

export interface Barber {
  id: string;
  name: string;
  logoUrl: string;
  rating: number;
  location: string;
  distanceKm: number;
  startTime: string;
  endTime: string;
  services: Service[];
}

export interface Booking {
  id: string;
  barberId: string;
  serviceIds: string[];
  bookingDate: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

const configuredUrl = process.env.EXPO_PUBLIC_API_URL;
const defaultUrl = configuredUrl ?? "http://192.168.1.7:4000";
export const API_URL = defaultUrl.replace(/\/$/, "");

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (authToken) headers.set("Authorization", `Bearer ${authToken}`);

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error ?? `Request failed with status ${response.status}`);
  }
  return body as T;
}

export const api = {
  register: (data: { fullName: string; email: string; phone?: string; password: string }) =>
    request<{ user: User; token: string }>("/api/auth/register", { method: "POST", body: JSON.stringify(data) }),
  login: (email: string, password: string) =>
    request<{ user: User; token: string }>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  me: () => request<{ user: User }>("/api/auth/me"),
  getBarbers: (params: { q?: string; city?: string; maxDistance?: number; minRating?: number } = {}) => {
    const query = new URLSearchParams();
    if (params.q) query.set("q", params.q);
    if (params.city) query.set("city", params.city);
    if (params.maxDistance) query.set("maxDistance", String(params.maxDistance));
    if (params.minRating) query.set("minRating", String(params.minRating));
    return request<{ barbers: Barber[] }>(`/api/barbers${query.toString() ? `?${query}` : ""}`);
  },
  getBarber: (id: string) => request<{ barber: Barber }>(`/api/barbers/${id}`),
  getAvailability: (id: string, date: string) => request<{ booked: { startTime: string; endTime: string }[] }>(`/api/barbers/${id}/availability?date=${encodeURIComponent(date)}`),
  getFavorites: () => request<{ barbers: Barber[] }>("/api/favorites"),
  toggleFavorite: (barberId: string) => request<{ saved: boolean }>(`/api/favorites/${barberId}`, { method: "POST" }),
  createBooking: (data: { barberId: string; serviceIds: string[]; bookingDate: string; startTime: string }) =>
    request<{ booking: Booking }>("/api/bookings", { method: "POST", body: JSON.stringify(data) }),
  getBookings: () => request<{ bookings: Booking[] }>("/api/bookings"),
  cancelBooking: (id: string) => request<{ booking: Booking }>(`/api/bookings/${id}/cancel`, { method: "PATCH" }),
  getNotifications: () => request<{ notifications: Notification[] }>("/api/notifications"),
  markNotificationRead: (id: string) => request<{ notification: Notification }>(`/api/notifications/${id}/read`, { method: "PATCH" }),
};

export default function ApiRoute() {
  return null;
}
