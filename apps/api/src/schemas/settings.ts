import { z } from "zod";

export const accountSettingsSchema = z.object({
  businessName:       z.string().min(1).max(200).optional(),
  supportEmail:       z.string().email().optional().or(z.literal("")),
  supportPhone:       z.string().max(30).optional(),
  timezone:           z.string().optional(),
  currency:           z.string().length(3).optional(),
  logoUrl:            z.string().url().optional().or(z.literal("")),
  faviconUrl:         z.string().url().optional().or(z.literal("")),
  primaryColor:       z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  secondaryColor:     z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  facebookUrl:        z.string().url().optional().or(z.literal("")),
  instagramUrl:       z.string().url().optional().or(z.literal("")),
  linkedinUrl:        z.string().url().optional().or(z.literal("")),
  twitterUrl:         z.string().url().optional().or(z.literal("")),
  emailNotifications: z.boolean().optional(),
  smsNotifications:   z.boolean().optional(),
  address:            z.string().max(300).optional(),
  city:               z.string().max(100).optional(),
  state:              z.string().max(100).optional(),
  country:            z.string().max(100).optional(),
  zipCode:            z.string().max(20).optional(),
});

export type AccountSettingsInput = z.infer<typeof accountSettingsSchema>;
