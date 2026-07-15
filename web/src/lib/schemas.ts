import { z } from "zod";

/**
 * Runtime validation schemas for server-action boundaries.
 *
 * Server actions receive arbitrary JSON from the client — TypeScript types are
 * erased at runtime and give no protection against malformed or malicious
 * payloads. These schemas validate the shape and basic constraints before any
 * DB work. Authorization (role/ownership checks) stays in the actions.
 */

const nonEmpty = (msg: string) => z.string().trim().min(1, msg);
const optionalText = z.string().trim().optional();

// ===== ORDERS =====

export const orderItemSchema = z.object({
  productId: nonEmpty("Brak identyfikatora produktu."),
  size: nonEmpty("Rozmiar jest wymagany."),
  quantity: z.number().int("Ilość musi być liczbą całkowitą.").positive("Ilość musi być większa od zera."),
  employeeId: optionalText,
  remarks: optionalText,
});

export const createOrderSchema = z.object({
  branchId: nonEmpty("Oddział jest wymagany."),
  priority: z.enum(["STANDARD", "HIGH", "CRITICAL"]),
  address: nonEmpty("Adres dostawy jest wymagany."),
  department: optionalText,
  clientRef: optionalText,
  comments: optionalText,
  items: z.array(orderItemSchema).min(1, "Zamówienie musi zawierać co najmniej jedną pozycję."),
});

// ===== EMPLOYEES =====

export const employeeSizesSchema = z.object({
  height: optionalText,
  chest: optionalText,
  waist: optionalText,
  shoes: optionalText,
  clothing: optionalText,
});

export const employeeSchema = z.object({
  employeeNr: nonEmpty("Numer pracownika jest wymagany."),
  name: nonEmpty("Imię i nazwisko jest wymagane."),
  jobTitle: nonEmpty("Stanowisko jest wymagane."),
  branchId: nonEmpty("Oddział jest wymagany."),
  address: optionalText,
  sizes: employeeSizesSchema,
  status: z.enum(["ACTIVE", "INACTIVE"]),
  rfid: z.boolean(),
  photoUrl: optionalText,
});

export const bulkEmployeeSchema = z.array(
  z.object({
    employeeNr: z.string(),
    name: z.string(),
    jobTitle: z.string(),
    height: optionalText,
    chest: optionalText,
    waist: optionalText,
    clothing: optionalText,
    shoes: optionalText,
  })
);

// ===== TICKETS =====

export const createTicketSchema = z.object({
  type: z.enum(["COMPLAINT", "EXCHANGE", "GENERAL"]),
  branchId: nonEmpty("Oddział jest wymagany."),
  orderId: optionalText,
  employeeName: optionalText,
  itemName: optionalText,
  messageText: nonEmpty("Treść zgłoszenia (wiadomość) nie może być pusta."),
  fileUrl: optionalText,
  fileName: optionalText,
  productId: optionalText,
  size: optionalText,
  newSize: optionalText,
  employeeId: optionalText,
});

// ===== HELPERS =====

/** First human-readable validation message, for surfacing in an action's `error` field. */
export function firstError(err: z.ZodError): string {
  return err.issues[0]?.message ?? "Nieprawidłowe dane wejściowe.";
}
