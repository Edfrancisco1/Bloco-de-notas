import { describe, expect, it } from 'vitest';
import { addDays, daysBetween, isIsoDate, maxIsoDate, todayIn } from '@/lib/calculations/dates';
import { deadlineFor, valuationFreshness } from '@/lib/calculations/status';

describe('datas de calendário', () => {
  it('conta dias entre datas, incluindo anos bissextos', () => {
    expect(daysBetween('2026-10-30', '2026-11-06')).toBe(7);
    expect(daysBetween('2028-02-28', '2028-03-01')).toBe(2);
    expect(daysBetween('2026-11-06', '2026-10-30')).toBe(-7);
  });

  it('soma dias e valida datas', () => {
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02');
    expect(isIsoDate('2026-02-29')).toBe(false);
    expect(isIsoDate('2028-02-29')).toBe(true);
    expect(isIsoDate('30/10/2026')).toBe(false);
  });

  it('calcula "hoje" no fuso de Luanda', () => {
    // 23:30 UTC já é dia seguinte em Luanda (UTC+1).
    expect(todayIn('Africa/Luanda', new Date('2026-10-30T23:30:00Z'))).toBe('2026-10-31');
    expect(todayIn('Africa/Luanda', new Date('2026-10-30T22:30:00Z'))).toBe('2026-10-30');
  });

  it('encontra a data mais recente', () => {
    expect(maxIsoDate(['2026-01-01', null, '2026-03-01', undefined])).toBe('2026-03-01');
    expect(maxIsoDate([])).toBeNull();
  });
});

describe('estado das avaliações', () => {
  it('distingue sem avaliação, atual e desatualizada (> 30 dias)', () => {
    expect(valuationFreshness(null, '2026-10-30')).toEqual({ state: 'missing', ageDays: null });
    expect(valuationFreshness('2026-09-30', '2026-10-30')).toEqual({ state: 'fresh', ageDays: 30 });
    expect(valuationFreshness('2026-09-29', '2026-10-30')).toEqual({ state: 'stale', ageDays: 31 });
  });
});

describe('proximidade de prazos', () => {
  it('marca 30, 7 e 1 dia, hoje e vencidos', () => {
    const today = '2026-10-30';
    expect(deadlineFor('2026-10-29', today).level).toBe('overdue');
    expect(deadlineFor('2026-10-30', today).level).toBe('today');
    expect(deadlineFor('2026-10-31', today).level).toBe('d1');
    expect(deadlineFor('2026-11-06', today)).toEqual({ daysLeft: 7, level: 'd7' });
    expect(deadlineFor('2026-11-29', today).level).toBe('d30');
    expect(deadlineFor('2026-12-30', today).level).toBe('later');
  });
});
