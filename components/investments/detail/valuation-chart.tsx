'use client';

import { useEffect, useRef, useState } from 'react';
import type { DecimalString, IsoDate } from '@/lib/domain/types';
import { formatDate } from '@/lib/formatters/dates';
import { formatMoney, formatMoneyCompact } from '@/lib/formatters/money';

/**
 * Evolução das avaliações: linha de 2px, marcadores de 8px com anel de papel, grelha fina e
 * tooltip ao passar o rato ou com as setas do teclado. Os mesmos valores estão no histórico.
 * As escalas usam `number` apenas para posições no ecrã — nunca para valores mostrados.
 */
const HEIGHT = 200;
const PAD = { top: 16, right: 16, bottom: 28, left: 72 };

export function ValuationChart({ series }: { series: { date: IsoDate; value: DecimalString }[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(Math.max(280, Math.round(entry.contentRect.width)));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  if (series.length < 2) return null;

  const times = series.map((p) => Date.parse(`${p.date}T00:00:00Z`));
  const values = series.map((p) => Number(p.value));
  const minT = Math.min(...times);
  const maxT = Math.max(...times);
  let minV = Math.min(...values);
  let maxV = Math.max(...values);
  const span = maxV - minV || Math.max(maxV * 0.05, 1);
  minV -= span * 0.15;
  maxV += span * 0.15;

  const innerW = width - PAD.left - PAD.right;
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const x = (t: number) =>
    PAD.left + (maxT === minT ? innerW / 2 : ((t - minT) / (maxT - minT)) * innerW);
  const y = (v: number) => PAD.top + innerH - ((v - minV) / (maxV - minV)) * innerH;
  const points = series.map((p, i) => ({ ...p, cx: x(times[i]!), cy: y(values[i]!) }));
  const path = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.cx.toFixed(1)},${p.cy.toFixed(1)}`)
    .join(' ');
  const ticks = [0, 0.5, 1].map((f) => minV + (maxV - minV) * f);
  const current = active !== null ? points[active] : null;

  function nearest(clientX: number) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const px = clientX - rect.left;
    let best = 0;
    for (let i = 1; i < points.length; i++) {
      if (Math.abs(points[i]!.cx - px) < Math.abs(points[best]!.cx - px)) best = i;
    }
    setActive(best);
  }

  return (
    <figure className="m-0">
      <div
        ref={ref}
        role="img"
        tabIndex={0}
        aria-label={`Evolução das avaliações: de ${formatMoney(series[0]!.value)} em ${formatDate(series[0]!.date)} a ${formatMoney(series.at(-1)!.value)} em ${formatDate(series.at(-1)!.date)}. Use as setas para percorrer os pontos.`}
        className="relative rounded-md outline-offset-4"
        onPointerMove={(event) => nearest(event.clientX)}
        onPointerLeave={() => setActive(null)}
        onBlur={() => setActive(null)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
            event.preventDefault();
            const delta = event.key === 'ArrowRight' ? 1 : -1;
            setActive((i) =>
              Math.min(
                Math.max((i ?? (delta > 0 ? -1 : points.length)) + delta, 0),
                points.length - 1,
              ),
            );
          }
        }}
      >
        <svg width={width} height={HEIGHT} aria-hidden className="block overflow-visible">
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={PAD.left}
                x2={width - PAD.right}
                y1={y(t)}
                y2={y(t)}
                stroke="var(--color-rule)"
                strokeWidth={1}
              />
              <text
                x={PAD.left - 10}
                y={y(t)}
                dy="0.32em"
                textAnchor="end"
                className="fill-ink-3 text-[11px]"
              >
                {formatMoneyCompact(String(Math.round(t)) as DecimalString)}
              </text>
            </g>
          ))}
          <text x={PAD.left} y={HEIGHT - 6} className="fill-ink-3 text-[11px]">
            {formatDate(series[0]!.date)}
          </text>
          <text
            x={width - PAD.right}
            y={HEIGHT - 6}
            textAnchor="end"
            className="fill-ink-3 text-[11px]"
          >
            {formatDate(series.at(-1)!.date)}
          </text>
          {current ? (
            <line
              x1={current.cx}
              x2={current.cx}
              y1={PAD.top}
              y2={PAD.top + innerH}
              stroke="var(--color-rule-strong)"
              strokeWidth={1}
            />
          ) : null}
          <path
            d={path}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {points.map((p, i) => (
            <circle
              key={`${p.date}-${i}`}
              cx={p.cx}
              cy={p.cy}
              r={active === i ? 5.5 : 4}
              fill="var(--color-accent)"
              stroke="var(--color-paper)"
              strokeWidth={2}
            />
          ))}
        </svg>
        {current ? (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-md border border-rule bg-paper-raised px-2.5 py-1.5 text-[0.8125rem] whitespace-nowrap shadow-overlay"
            style={{
              left: Math.min(Math.max(current.cx, 90), width - 90),
              top: Math.max(current.cy - 52, 0),
            }}
          >
            <span className="block text-ink-3">{formatDate(current.date)}</span>
            <span className="font-medium text-ink figures-table">{formatMoney(current.value)}</span>
          </div>
        ) : null}
      </div>
      <figcaption className="mt-2 text-[0.8125rem] text-ink-3">
        {series.length} avaliações registadas. Os valores entre pontos são interpolados só no
        desenho.
      </figcaption>
    </figure>
  );
}
