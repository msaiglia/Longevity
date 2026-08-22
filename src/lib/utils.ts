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

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

export const categoryLabel: Record<string, string> = {
  allenamento: "Allenamento",
  nutrizione: "Nutrizione",
  prevenzione: "Prevenzione",
  recupero: "Recupero",
  novita: "Novità",
};

export function readingTimeMinutes(body: string): number {
  const words = body.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}
