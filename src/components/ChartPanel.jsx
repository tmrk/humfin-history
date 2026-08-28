import { useMemo, useState } from 'react';
import Events from '../events.json';
import FundingChart from './FundingChart';
import { EVENT_COLOR, FUNDED_COLOR, REQUESTED_COLOR } from '../lib/colors';
import EventRail from './EventRail';
import { adjustRowsForInflation, FIRST_YEAR_WITH_FUNDING_DATA } from '../lib/appeals';
import { lastYearInCPIdata } from '../lib/inflation';

function ChartPanel({ yearlyTotals, error, onRetry }) {
  const [inflationAdjusted, setInflationAdjusted] = useState(true);
  const [showFunded, setShowFunded] = useState(true);
  const [showRequested, setShowRequested] = useState(true);
  const [substitutePre1994, setSubstitutePre1994] = useState(true);
  const [showEvents, setShowEvents] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState(null);

  const chartData = useMemo(
    () => (inflationAdjusted ? adjustRowsForInflation(yearlyTotals) : yearlyTotals),
    [yearlyTotals, inflationAdjusted]
  );

  return (
    <section className="section" id="chart">
      <p className="section__eyebrow">The chart</p>
      <h2>A century of asking, thirty years of answers</h2>
      <p className="section__dek">
        Every appeal since 1919, summed by the year it started.{' '}
        <strong style={{ color: 'var(--red-text)', fontWeight: 500 }}>Red</strong> is money
        given, <strong style={{ color: REQUESTED_COLOR, fontWeight: 500 }}>blue</strong> is
        money asked for. Amounts are shown in {lastYearInCPIdata} francs by default, so a
        1923 appeal and a 2023 appeal can be compared honestly. The dots mark the crises
        behind the spikes: tap one, or browse the timeline below the chart.
      </p>

      <div className="chart-panel">
        <div className="chart-controls">
          <div className="chip-row" role="group" aria-label="Chart series">
            <button
              type="button"
              className="chip"
              aria-pressed={showFunded}
              disabled={!chartData.length}
              onClick={() => setShowFunded(!showFunded)}
            >
              <span className="chip__dot" style={{ background: FUNDED_COLOR }} />
              Funded
            </button>
            <button
              type="button"
              className="chip"
              aria-pressed={showRequested}
              disabled={!chartData.length}
              onClick={() => setShowRequested(!showRequested)}
            >
              <span className="chip__dot" style={{ background: REQUESTED_COLOR }} />
              Requested
            </button>
            <button
              type="button"
              className="chip"
              aria-pressed={showEvents}
              disabled={!chartData.length}
              onClick={() => {
                setShowEvents(!showEvents);
                setSelectedEventId(null);
              }}
            >
              <span className="chip__dot" style={{ background: EVENT_COLOR }} />
              Timeline events
            </button>
          </div>
          <div className="seg" role="group" aria-label="Currency basis">
            <button
              type="button"
              className="seg__btn"
              aria-pressed={!inflationAdjusted}
              disabled={!chartData.length}
              onClick={() => setInflationAdjusted(false)}
            >
              Nominal
            </button>
            <button
              type="button"
              className="seg__btn"
              aria-pressed={inflationAdjusted}
              disabled={!chartData.length}
              onClick={() => setInflationAdjusted(true)}
            >
              {lastYearInCPIdata} francs
            </button>
          </div>
        </div>

        <div className="chart-body">
          {chartData.length ? (
            <FundingChart
              data={chartData}
              events={Events}
              showFunded={showFunded}
              showRequested={showRequested}
              substitutePre1994={substitutePre1994}
              showEvents={showEvents}
              selectedEventId={selectedEventId}
              onSelectEvent={setSelectedEventId}
              inflationAdjusted={inflationAdjusted}
            />
          ) : (
            <div className="chart-wait">
              {error ? (
                <>
                  <p className="chart-wait__caption">
                    Could not fetch appeal data from IFRC GO ({error.message}).
                  </p>
                  <button type="button" className="chart-wait__retry" onClick={onRetry}>
                    Try again
                  </button>
                </>
              ) : (
                <>
                  <div className="chart-wait__bars" aria-hidden="true">
                    <span /><span /><span /><span /><span />
                  </div>
                  <p className="chart-wait__caption">
                    Fetching 4,200+ appeals from IFRC GO. This usually takes a few seconds.
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        {showFunded && chartData.length ? (
          <p className="chart-note">
            <span className="chart-note__flag">Note</span>
            <span>
              GO holds no funding records before {FIRST_YEAR_WITH_FUNDING_DATA}, so{' '}
              {substitutePre1994
                ? 'the red series shows the amount requested for those years.'
                : 'the red series drops to the recorded zeros for those years.'}{' '}
              <button
                type="button"
                className="chart-note__toggle"
                onClick={() => setSubstitutePre1994(!substitutePre1994)}
              >
                {substitutePre1994 ? 'Show the recorded zeros' : 'Substitute requested amounts'}
              </button>
            </span>
          </p>
        ) : null}

        {showEvents && chartData.length ? (
          <EventRail
            events={Events}
            selectedEventId={selectedEventId}
            onSelect={setSelectedEventId}
          />
        ) : null}
      </div>
    </section>
  );
}

export default ChartPanel;
