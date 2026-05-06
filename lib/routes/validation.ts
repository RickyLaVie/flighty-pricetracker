import { z } from "zod";

const iataCode = z
  .string()
  .length(3)
  .regex(/^[A-Z]{3}$/, "Must be a 3-letter IATA code (uppercase)");

export const updateRouteDatesSchema = z
  .object({
    date_from: z.string().date(),
    date_to: z.string().date(),
  })
  .refine((d) => new Date(d.date_to) >= new Date(d.date_from), {
    message: "date_to must be on or after date_from",
    path: ["date_to"],
  });

export const updateRouteSchema = z
  .object({
    date_from: z.string().date().optional(),
    date_to: z.string().date().optional(),
    exclude_budget_airlines: z.boolean().optional(),
    require_checked_baggage: z.boolean().optional(),
    is_round_trip: z.boolean().optional(),
  })
  .refine(
    (d) =>
      !d.date_from || !d.date_to || new Date(d.date_to) >= new Date(d.date_from),
    { message: "date_to must be on or after date_from", path: ["date_to"] }
  );

export const createRouteSchema = z
  .object({
    origin: iataCode,
    destination: iataCode,
    date_from: z.string().date(),
    date_to: z.string().date(),
    exclude_budget_airlines: z.boolean().optional().default(false),
    require_checked_baggage: z.boolean().optional().default(false),
    is_round_trip: z.boolean().optional().default(true),
  })
  .refine((d) => new Date(d.date_to) >= new Date(d.date_from), {
    message: "date_to must be on or after date_from",
    path: ["date_to"],
  });
