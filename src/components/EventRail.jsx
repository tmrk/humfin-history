import { useEffect, useRef } from 'react';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function EventRail({ events, selectedEventId, onSelect }) {
  const cardRefs = useRef({});

  useEffect(() => {
    const card = cardRefs.current[selectedEventId];
    if (card) {
      card.scrollIntoView({
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [selectedEventId]);

  return (
    <div className="rail" aria-label="Major crises on the timeline">
      {events.map((event) => (
        <button
          key={event.id}
          type="button"
          ref={(node) => {
            cardRefs.current[event.id] = node;
          }}
          className={`rail__card${event.id === selectedEventId ? ' is-active' : ''}`}
          aria-pressed={event.id === selectedEventId}
          onClick={() => onSelect(event.id === selectedEventId ? null : event.id)}
        >
          <span className="rail__year">
            {event.span ? `${event.span[0]}–${String(event.span[1]).slice(2)}` : event.year}
          </span>
          <span className="rail__title">{event.title}</span>
          <span className="rail__blurb">{event.blurb}</span>
        </button>
      ))}
    </div>
  );
}

export default EventRail;
