import { z } from "zod";

export const registerSchema = z.object({
  firstName: z.string().trim().min(1, "Il nome è obbligatorio"),
  lastName: z.string().trim().min(1, "Il cognome è obbligatorio"),
  email: z.string().trim().email("Email non valida"),
  phone: z
    .string()
    .trim()
    .min(6, "Numero di telefono non valido")
    .max(20, "Numero di telefono non valido"),
  password: z.string().min(8, "La password deve avere almeno 8 caratteri"),
});

export const createSlotSchema = z
  .object({
    date: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    startTime: z.string().min(1, "Seleziona un orario di inizio"),
    endTime: z.string().min(1, "Seleziona un orario di fine"),
    capacity: z.coerce.number().int().min(1, "La capienza deve essere almeno 1"),
    notes: z.string().trim().max(280).optional(),
    cancelWindowHours: z.coerce.number().int().min(0).max(72).default(2),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: "L'orario di fine deve essere dopo l'inizio",
    path: ["endTime"],
  });

export const sendMessageSchema = z.object({
  title: z.string().trim().min(1, "Il titolo è obbligatorio").max(120),
  body: z.string().trim().min(1, "Il testo è obbligatorio").max(2000),
  priority: z.enum(["info", "important", "urgent"]),
  audience: z.enum(["all", "single"]),
  userId: z.string().uuid().optional(),
  notifyByEmail: z.boolean().default(false),
  expiresAt: z.string().optional(),
});

export const feedbackSchema = z.object({
  bookingId: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(500).optional(),
});
