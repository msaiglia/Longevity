import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

const dateFmt = new Intl.DateTimeFormat("it-IT", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

const timeFmt = new Intl.DateTimeFormat("it-IT", {
  hour: "2-digit",
  minute: "2-digit",
});

export function formatSlotDate(d: Date) {
  const s = dateFmt.format(d);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatSlotTime(start: Date, end: Date) {
  return `${timeFmt.format(start)} – ${timeFmt.format(end)}`;
}

export function formatDateTimeLabel(start: Date, end: Date) {
  return `${formatSlotDate(start)}, ${formatSlotTime(start, end)}`;
}

export function isPast(d: Date) {
  return d.getTime() < Date.now();
}
