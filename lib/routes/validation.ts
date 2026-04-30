import { z } from "zod";

const iataCode = z
  .string()
  .length(3)
  .regex(/^[A-Z]{3}$/, "Must be a 3-letter IATA code (uppercase)");

export const createRouteSchema = z
  .object({
    origin: iataCode,
    destination: iataCode,
    date_from: z.string().date(),
    date_to: z.string().date(),
  })
  .refine((d) => new Date(d.date_to) >= new Date(d.date_from), {
    message: "date_to must be on or after date_from",
    path: ["date_to"],
  });

export const updateRouteDatesSchema = z
  .object({
    date_from: z.string().date(),
    date_to: z.string().date(),
  })
  .refine((d) => new Date(d.date_to) >= new Date(d.date_from), {
    message: "date_to must be on or after date_from",
    path: ["date_to"],
  });
