import { z } from "zod";

export const pipelineSchema = z.object({
  name: z.string().min(1).max(200),
});

export const stageSchema = z.object({
  name:     z.string().min(1).max(200),
  position: z.number().int().min(0),
  color:    z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export const opportunitySchema = z.object({
  name:      z.string().min(1).max(300),
  contactId: z.string().uuid(),
  stageId:   z.string().uuid(),
  ownerId:   z.string().uuid().optional(),
  value:     z.number().nonnegative().optional(),
  status:    z.enum(["OPEN","WON","LOST","ABANDONED"]).optional(),
  closeDate: z.string().datetime().optional(),
  notes:     z.string().optional(),
});

export const moveOpportunitySchema = z.object({
  stageId: z.string().uuid(),
});
