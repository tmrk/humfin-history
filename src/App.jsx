import { useEffect, useMemo, useState } from 'react';
import Hero from './components/Hero';
import ChartPanel from './components/ChartPanel';
import Methodology from './components/Methodology';
import Ledger from './components/Ledger';
import Footer from './components/Footer';
import { APPEALS_API_URL, dedupeAppeals, aggregateByYear } from './lib/appeals';
import { readCachedAppeals, writeCachedAppeals } from './lib/appealsCache';

function App() {
  const [initialAppeals] = useState(readCachedAppeals);
  const [appeals, setAppeals] = useState(initialAppeals);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (initialAppeals && attempt === 0) return undefined;

    const controller = new AbortController();
    fetch(APPEALS_API_URL, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`IFRC GO API responded with HTTP ${response.status}`);
        return response.json();
      })
      .then((data) => {
        const nextAppeals = dedupeAppeals(data.results);
        writeCachedAppeals(nextAppeals);
        setAppeals(nextAppeals);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err);
      });
    return () => controller.abort();
  }, [attempt, initialAppeals]);

  const yearlyTotals = useMemo(() => (appeals ? aggregateByYear(appeals) : []), [appeals]);

  return (
    <>
      <Hero appeals={appeals} yearlyTotals={yearlyTotals} />
      <main>
        <ChartPanel
          yearlyTotals={yearlyTotals}
          error={error}
          onRetry={() => {
            setError(null);
            setAttempt((n) => n + 1);
          }}
        />
        <Methodology />
        <Ledger appeals={appeals} />
      </main>
      <Footer />
    </>
  );
}

export default App;
