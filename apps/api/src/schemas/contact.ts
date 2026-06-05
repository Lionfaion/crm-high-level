import { z } from "zod";

export const contactSchema = z.object({
  firstName:    z.string().min(1).max(100),
  lastName:     z.string().max(100).optional(),
  email:        z.string().email().optional().or(z.literal("")),
  phone:        z.string().max(30).optional(),
  company:      z.string().max(200).optional(),
  website:      z.string().url().optional().or(z.literal("")),
  address:      z.string().max(300).optional(),
  city:         z.string().max(100).optional(),
  state:        z.string().max(100).optional(),
  country:      z.string().max(100).optional(),
  status:       z.enum(["LEAD", "PROSPECT", "CUSTOMER", "CHURNED"]).optional(),
  tags:         z.array(z.string()).optional(),
  customFields: z.record(z.unknown()).optional(),
});

export const contactUpdateSchema = contactSchema.partial();

export const contactQuerySchema = z.object({
  search:   z.string().optional(),
  status:   z.enum(["LEAD", "PROSPECT", "CUSTOMER", "CHURNED"]).optional(),
  tag:      z.string().optional(),
  page:     z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(25),
});

export type ContactInput = z.infer<typeof contactSchema>;
export type ContactQuery = z.infer<typeof contactQuerySchema>;
