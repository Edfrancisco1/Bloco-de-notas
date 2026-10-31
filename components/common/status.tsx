import { AlertCircle, CalendarClock, Clock3 } from 'lucide-react';
import type { Deadline, Freshness } from '@/lib/calculations/status';
import { investmentStatusLabel } from '@/lib/domain/labels';
import type { InvestmentStatus } from '@/lib/domain/types';
import { formatDueIn } from '@/lib/formatters/dates';
import { Badge } from '@/components/ui/badge';

/** Estado da avaliação: só aparece quando falta ou está desatualizada. */
export function FreshnessBadge({ freshness }: { freshness: Freshness }) {
  if (freshness.state === 'missing') {
    return (
      <Badge tone="marker">
        <AlertCircle aria-hidden strokeWidth={2} />
        Sem avaliação
      </Badge>
    );
  }
  if (freshness.state === 'stale') {
    return (
      <Badge tone="marker">
        <Clock3 aria-hidden strokeWidth={2} />
        Desatualizado
      </Badge>
    );
  }
  return null;
}

/** Proximidade de prazo com as referências de 30, 7 e 1 dia. */
export function DeadlineBadge({ deadline }: { deadline: Deadline | null }) {
  if (!deadline || deadline.level === 'later') return null;
  if (deadline.level === 'overdue') {
    return (
      <Badge tone="negative">
        <AlertCircle aria-hidden strokeWidth={2} />
        {formatDueIn(deadline.daysLeft)}
      </Badge>
    );
  }
  const urgent = deadline.level !== 'd30';
  return (
    <Badge tone={urgent ? 'marker' : 'outline'}>
      <CalendarClock aria-hidden strokeWidth={2} />
      {formatDueIn(deadline.daysLeft)}
    </Badge>
  );
}

export function InvestmentStatusBadge({ status }: { status: InvestmentStatus }) {
  if (status === 'active') return null;
  return (
    <Badge tone={status === 'archived' ? 'outline' : 'neutral'}>
      {investmentStatusLabel[status]}
    </Badge>
  );
}
