import { z } from 'zod';

export const waitlistSchema = z.object({
  fullName: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  country: z.string().trim().max(80).optional().or(z.literal('')),
  company: z.string().trim().max(120).optional().or(z.literal('')),
  walletAddress: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .refine((v) => !v || /^0x[a-fA-F0-9]{40}$/.test(v), 'Invalid wallet address'),
  role: z.enum(['developer', 'partner', 'investor', 'community']).optional(),
  interests: z.array(z.string()).optional(),
  referralCode: z.string().trim().max(64).optional().or(z.literal('')),
  turnstileToken: z.string().optional(),
});

export type WaitlistInput = z.infer<typeof waitlistSchema>;
