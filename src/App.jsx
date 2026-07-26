import { useEffect, useMemo, useState } from 'react';
import Hero from './components/Hero';
import ChartPanel from './components/ChartPanel';
import Methodology from './components/Methodology';
import Ledger from './components/Ledger';
import Footer from './components/Footer';
import { APPEALS_API_URL, dedupeAppeals, aggregateByYear } from './lib/appeals';

function App() {
  const [appeals, setAppeals] = useState(null);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetch(APPEALS_API_URL, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`IFRC GO API responded with HTTP ${response.status}`);
        return response.json();
      })
      .then((data) => setAppeals(dedupeAppeals(data.results)))
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err);
      });
    return () => controller.abort();
  }, [attempt]);

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
