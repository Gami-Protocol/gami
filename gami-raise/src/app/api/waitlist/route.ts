import { NextResponse } from 'next/server';
import { z } from 'zod';

const bodySchema = z.object({
  email: z.string().email(),
  walletAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .optional(),
  intentUsd: z.number().int().positive().max(1_000_000).optional(),
  referralCode: z.string().max(64).optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid waitlist payload' }, { status: 400 });
    }

    if (!process.env.DATABASE_URL) {
      // Allow UI demos without a provisioned database.
      return NextResponse.json({
        ok: true,
        mode: 'dry-run',
        entry: parsed.data,
      });
    }

    const { prisma } = await import('@/lib/prisma');
    const entry = await prisma.waitlistEntry.upsert({
      where: { email: parsed.data.email.toLowerCase() },
      create: {
        email: parsed.data.email.toLowerCase(),
        walletAddress: parsed.data.walletAddress?.toLowerCase(),
        intentUsd: parsed.data.intentUsd,
        referralCode: parsed.data.referralCode,
        source: 'raise',
      },
      update: {
        walletAddress: parsed.data.walletAddress?.toLowerCase(),
        intentUsd: parsed.data.intentUsd,
        referralCode: parsed.data.referralCode,
      },
    });

    return NextResponse.json({ ok: true, id: entry.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Waitlist error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
