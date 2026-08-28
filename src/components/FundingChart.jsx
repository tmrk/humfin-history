import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { FIRST_YEAR_WITH_FUNDING_DATA } from '../lib/appeals';
import { lastYearInCPIdata } from '../lib/inflation';
import { formatAmount, formatCompact } from '../lib/format';
import { EVENT_COLOR, FUNDED_COLOR, REQUESTED_COLOR } from '../lib/colors';

const AREA_ANIMATION = {
  animationDuration: 700,
  animationEasing: 'ease-in-out',
  animationMatchBy: (point) => point.payload.year,
  isAnimationActive: 'auto',
};

const AXIS_TICK = {
  fill: 'rgba(243, 238, 232, 0.55)',
  fontSize: 11,
  fontFamily: '"Noto Sans Mono", monospace',
};

const useIsNarrow = () => {
  const [narrow, setNarrow] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches
  );
  useEffect(() => {
    const query = window.matchMedia('(max-width: 640px)');
    const onChange = (event) => setNarrow(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);
  return narrow;
};

// Small clickable marker rendered in the top margin, above each event line.
// Recharts injects `viewBox` ({ x, y } of the reference line's top end).
const EventPin = ({ viewBox, event, index, active, onSelect }) => {
  const x = viewBox?.x ?? 0;
  const y = (viewBox?.y ?? 0) - (index % 2 === 0 ? 12 : 28);
  return (
    <g
      transform={`translate(${x}, ${y})`}
      onClick={() => onSelect(active ? null : event.id)}
      onMouseEnter={() => onSelect(event.id)}
      style={{ cursor: 'pointer' }}
    >
      <title>{`${event.span ? `${event.span[0]}–${event.span[1]}` : event.year} · ${event.label}`}</title>
      <circle r={13} fill="transparent" />
      <circle
        r={active ? 6 : 4.5}
        fill={active ? EVENT_COLOR : '#131015'}
        stroke={active ? EVENT_COLOR : 'rgba(240, 228, 66, 0.75)'}
        strokeWidth={1.5}
      />
    </g>
  );
};

const ChartTooltip = ({ active, payload, label, inflationAdjusted, substitutePre1994 }) => {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  const appealsOfYear = row.appeals || [];
  const magnitude = (appeal) =>
    Math.max(Number(appeal.amount_requested) || 0, Number(appeal.amount_funded) || 0);
  const largest = appealsOfYear.reduce(
    (best, appeal) => (!best || magnitude(appeal) > magnitude(best) ? appeal : best),
    null
  );
  const unit = inflationAdjusted ? `${lastYearInCPIdata} CHF` : 'CHF';
  const preCutoff = label < FIRST_YEAR_WITH_FUNDING_DATA;

  return (
    <div className="tip">
      <p className="tip__year">{label}</p>
      {payload.map((entry) => (
        <p className="tip__row" key={entry.dataKey}>
          <span className="tip__name">
            <span className="tip__dot" style={{ background: entry.color }} />
            {entry.name}
            {entry.dataKey === 'amountFundedDisplayed' && preCutoff && substitutePre1994
              ? '*'
              : ''}
          </span>
          <span className="tip__val">
            {formatAmount(entry.value)} {unit}
          </span>
        </p>
      ))}
      <p className="tip__meta">
        {appealsOfYear.length.toLocaleString('en-GB')} appeal{appealsOfYear.length === 1 ? '' : 's'}
        {largest ? ` · largest: ${largest.name.trim()} (${largest.country?.name ?? 'unknown'})` : ''}
      </p>
      {preCutoff && substitutePre1994 ? (
        <p className="tip__meta tip__meta--note">
          * requested shown; no funding records before {FIRST_YEAR_WITH_FUNDING_DATA}
        </p>
      ) : null}
    </div>
  );
};

function FundingChart({
  data,
  events,
  showFunded,
  showRequested,
  substitutePre1994,
  showEvents,
  selectedEventId,
  onSelectEvent,
  inflationAdjusted,
}) {
  const narrow = useIsNarrow();
  const displayedData = useMemo(
    () =>
      data.map((row) => ({
        ...row,
        amountFundedDisplayed: substitutePre1994
          ? row.amountFundedAndRequestedPre1994
          : row.amountFunded,
      })),
    [data, substitutePre1994]
  );

  const firstYear = displayedData[0].year;
  const lastYear = displayedData[displayedData.length - 1].year;
  const step = narrow ? 20 : 10;
  const ticks = [];
  for (let year = Math.ceil(firstYear / step) * step; year <= lastYear; year += step) {
    ticks.push(year);
  }

  // On narrow screens the pins would collide in the dense 2004-2023 cluster,
  // so the rail below the chart is the event browser there and the chart only
  // marks the selected event.
  const eventMarks = showEvents
    ? events.flatMap((event, index) => {
        const active = event.id === selectedEventId;
        const marks = [];
        if (event.span) {
          marks.push(
            <ReferenceArea
              key={`${event.id}-span`}
              x1={event.span[0]}
              x2={event.span[1]}
              fill={active ? 'rgba(240, 228, 66, 0.1)' : 'rgba(240, 228, 66, 0.04)'}
              strokeOpacity={0}
            />
          );
        }
        if (narrow && !active) return marks;
        marks.push(
          <ReferenceLine
            key={event.id}
            x={event.year}
            stroke={active ? EVENT_COLOR : 'rgba(240, 228, 66, 0.32)'}
            strokeDasharray={active ? '0' : '2 5'}
            label={
              narrow ? undefined : (
                <EventPin event={event} index={index} active={active} onSelect={onSelectEvent} />
              )
            }
          />
        );
        return marks;
      })
    : null;

  return (
    <ResponsiveContainer>
      <AreaChart data={displayedData} margin={{ top: 44, right: 10, left: 4, bottom: 2 }}>
        <defs>
          <linearGradient id="gradFunded" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={FUNDED_COLOR} stopOpacity={0.5} />
            <stop offset="100%" stopColor={FUNDED_COLOR} stopOpacity={0.04} />
          </linearGradient>
          <linearGradient id="gradRequested" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={REQUESTED_COLOR} stopOpacity={0.26} />
            <stop offset="100%" stopColor={REQUESTED_COLOR} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="rgba(243, 238, 232, 0.07)" />
        <XAxis dataKey="year" ticks={ticks} tick={AXIS_TICK} axisLine={false} tickLine={false} />
        <YAxis
          tickFormatter={formatCompact}
          width={46}
          tick={AXIS_TICK}
          axisLine={false}
          tickLine={false}
        />
        {/* Faint marker where real funding records begin (1994). */}
        <ReferenceLine
          x={FIRST_YEAR_WITH_FUNDING_DATA}
          stroke="rgba(243, 238, 232, 0.2)"
          strokeDasharray="4 4"
        />
        {showRequested ? (
          <Area
            id="requested-area"
            type="monotone"
            dataKey="amountRequested"
            name="Requested"
            stroke={REQUESTED_COLOR}
            strokeWidth={2}
            fill="url(#gradRequested)"
            activeDot={{ r: 4 }}
            {...AREA_ANIMATION}
          />
        ) : null}
        {showFunded ? (
          <Area
            id="funded-area"
            type="monotone"
            dataKey="amountFundedDisplayed"
            name="Funded"
            stroke={FUNDED_COLOR}
            strokeWidth={2}
            fill="url(#gradFunded)"
            activeDot={{ r: 4 }}
            {...AREA_ANIMATION}
          />
        ) : null}
        {eventMarks}
        <Tooltip
          content={
            <ChartTooltip
              inflationAdjusted={inflationAdjusted}
              substitutePre1994={substitutePre1994}
            />
          }
          cursor={{ stroke: 'rgba(243, 238, 232, 0.3)', strokeDasharray: '2 4' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export default FundingChart;
