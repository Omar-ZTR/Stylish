export interface CalendarBooking {
  id: string;
  title: string;
  customer: string;
  service: string;
  date: string;
  startTime: string;
  endTime: string;
  color: string;
}

export interface PositionedBooking {
  booking: CalendarBooking;
  lane: number;
  laneCount: number;
}

export const HOUR_HEIGHT = 64;

export function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function dateFromKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(date: Date, amount: number): Date {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  result.setDate(result.getDate() + amount);
  return result;
}

export function startOfWeek(date: Date): Date {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const mondayOffset = (result.getDay() + 6) % 7;
  result.setDate(result.getDate() - mondayOffset);
  return result;
}

export function timeToMinutes(value: string): number | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

export function formatTime(value: string): string {
  const minutes = timeToMinutes(value);
  if (minutes === null) return value;
  const hour = Math.floor(minutes / 60);
  const suffix = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}:${String(minutes % 60).padStart(2, "0")} ${suffix}`;
}

export function formatDateRange(start: Date, end: Date): string {
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${start.toLocaleDateString(undefined, { month: "long" })} ${start.getDate()}–${end.getDate()}, ${start.getFullYear()}`;
  }
  return `${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${end.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
}

export function createSampleBookings(today: Date, openTime = "09:00", closeTime = "19:00"): CalendarBooking[] {
  const baseDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const date = (offset: number) => dateKey(addDays(baseDay, offset));
  const opening = timeToMinutes(openTime) ?? 9 * 60;
  const closing = timeToMinutes(closeTime) ?? 19 * 60;
  const duration = Math.max(30, Math.min(60, closing - opening));
  const slot = (offset: number) => {
    const start = opening + Math.min(offset, Math.max(0, closing - opening - duration));
    const toTime = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
    return { startTime: toTime(start), endTime: toTime(start + duration) };
  };
  const first = slot(60);
  const overlapping = slot(90);
  const midday = slot(180);
  const afternoon = slot(300);
  const late = slot(420);
  return [
    { id: "sample-1", title: "Fade & beard", customer: "Adam Ben Ali", service: "Skin fade + beard trim", date: date(0), ...first, color: "#4285F4" },
    { id: "sample-2", title: "Classic cut", customer: "Sami Trabelsi", service: "Classic haircut", date: date(0), ...overlapping, color: "#34A853" },
    { id: "sample-3", title: "Haircut", customer: "Youssef Mansour", service: "Haircut & styling", date: date(0), ...midday, color: "#A142F4" },
    { id: "sample-4", title: "Beard trim", customer: "Karim Gharbi", service: "Beard shaping", date: date(1), ...first, color: "#F9AB00" },
    { id: "sample-5", title: "Full grooming", customer: "Mehdi Kacem", service: "Haircut + hot towel shave", date: date(2), ...midday, color: "#EA4335" },
    { id: "sample-6", title: "Skin fade", customer: "Anis Jaziri", service: "Skin fade", date: date(3), ...afternoon, color: "#12A594" },
    { id: "sample-7", title: "Kids haircut", customer: "Rayan Haddad", service: "Kids haircut", date: date(5), ...midday, color: "#E52592" },
    { id: "sample-8", title: "Cut & style", customer: "Nizar Ben Salem", service: "Cut and styling", date: date(6), ...late, color: "#5E6AD2" },
  ];
}

export function layoutOverlappingBookings(bookings: CalendarBooking[]): PositionedBooking[] {
  const validBookings = bookings
    .map((booking) => ({
      booking,
      start: timeToMinutes(booking.startTime),
      end: timeToMinutes(booking.endTime),
    }))
    .filter((item): item is typeof item & { start: number; end: number } =>
      item.start !== null && item.end !== null && item.end > item.start,
    )
    .sort((a, b) => a.start - b.start || b.end - a.end);

  const positioned: PositionedBooking[] = [];
  let cluster: typeof validBookings = [];
  let clusterEnd = -1;

  const finishCluster = () => {
    const laneEnds: number[] = [];
    const clusterPositions: { booking: CalendarBooking; lane: number }[] = [];
    for (const item of cluster) {
      let lane = laneEnds.findIndex((end) => end <= item.start);
      if (lane === -1) lane = laneEnds.length;
      laneEnds[lane] = item.end;
      clusterPositions.push({ booking: item.booking, lane });
    }
    for (const item of clusterPositions) {
      positioned.push({ ...item, laneCount: laneEnds.length });
    }
    cluster = [];
    clusterEnd = -1;
  };

  for (const item of validBookings) {
    if (cluster.length > 0 && item.start >= clusterEnd) finishCluster();
    cluster.push(item);
    clusterEnd = Math.max(clusterEnd, item.end);
  }
  if (cluster.length > 0) finishCluster();

  return positioned;
}

export function createBookingId(): string {
  return `booking-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
