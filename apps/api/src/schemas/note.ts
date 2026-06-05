import { z } from "zod";

export const noteSchema = z.object({
  body:          z.string().min(1).max(5000),
  contactId:     z.string().uuid().optional(),
  opportunityId: z.string().uuid().optional(),
}).refine((d) => d.contactId || d.opportunityId, {
  message: "Either contactId or opportunityId is required",
});

export const noteUpdateSchema = z.object({ body: z.string().min(1).max(5000) });
