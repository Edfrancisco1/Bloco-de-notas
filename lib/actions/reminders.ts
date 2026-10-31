'use server';

import { revalidatePath } from 'next/cache';
import { addDays, todayIn } from '@/lib/calculations/dates';
import { getOnboardedRepository } from '@/lib/data';
import { reminderSchema } from '@/lib/validations/schemas';
import type { z } from 'zod';
import { type ActionResult, failure, invalid, ok } from './result';

export async function createReminderAction(
  input: z.input<typeof reminderSchema>,
): Promise<ActionResult> {
  const parsed = reminderSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const repo = await getOnboardedRepository();
  try {
    await repo.createReminder(parsed.data);
  } catch (error) {
    return failure(error);
  }
  revalidatePath('/app', 'layout');
  return ok();
}

/** Concluir, cancelar, reabrir ou adiar (por defeito, uma semana a partir de hoje). */
export async function updateReminderAction(
  id: string,
  change: 'done' | 'cancel' | 'reopen' | 'snooze',
  snoozeDays = 7,
): Promise<ActionResult> {
  const repo = await getOnboardedRepository();
  try {
    if (change === 'snooze') {
      const profile = await repo.getProfile();
      await repo.setReminderStatus(id, 'snoozed', addDays(todayIn(profile.timezone), snoozeDays));
    } else {
      await repo.setReminderStatus(
        id,
        change === 'done' ? 'done' : change === 'cancel' ? 'cancelled' : 'pending',
      );
    }
  } catch (error) {
    return failure(error);
  }
  revalidatePath('/app', 'layout');
  return ok();
}
