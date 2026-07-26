import { useMemo, useState } from 'react';
import { formatAmount, formatDate } from '../lib/format';

const PAGE_SIZE = 50;

function Ledger({ appeals }) {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');
  const [page, setPage] = useState(0);

  const sorted = useMemo(
    () =>
      appeals
        ? [...appeals].sort((a, b) => new Date(b.start_date) - new Date(a.start_date))
        : [],
    [appeals]
  );

  const types = useMemo(
    () => [...new Set(sorted.map((appeal) => appeal.atype_display))].sort(),
    [sorted]
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return sorted.filter(
      (appeal) =>
        (type === 'all' || appeal.atype_display === type) &&
        (!needle ||
          `${appeal.name} ${appeal.code} ${appeal.country?.name ?? ''}`
            .toLowerCase()
            .includes(needle))
    );
  }, [sorted, query, type]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const rows = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  const rangeStart = filtered.length ? currentPage * PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min((currentPage + 1) * PAGE_SIZE, filtered.length);

  return (
    <section className="section" id="ledger">
      <p className="section__eyebrow">The ledger</p>
      <h2>Every appeal, as recorded</h2>
      <p className="section__dek">
        {appeals
          ? `All ${appeals.length.toLocaleString('en-GB')} appeals in IFRC GO, newest first, in nominal Swiss francs. Search by crisis, country or appeal code.`
          : 'The full list appears once the appeal data has loaded.'}
      </p>

      {appeals ? (
        <>
          <div className="ledger-tools">
            <input
              type="search"
              placeholder="Search crisis, country or code…"
              aria-label="Search appeals"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(0);
              }}
            />
            <select
              aria-label="Filter by appeal type"
              value={type}
              onChange={(event) => {
                setType(event.target.value);
                setPage(0);
              }}
            >
              <option value="all">All types</option>
              {types.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="table-wrap">
            {rows.length ? (
              <table className="ledger-table">
                <thead>
                  <tr>
                    <th scope="col">Start</th>
                    <th scope="col">Code</th>
                    <th scope="col">Country</th>
                    <th scope="col">Type</th>
                    <th scope="col" className="crisis">Crisis</th>
                    <th scope="col" className="num">Requested (CHF)</th>
                    <th scope="col" className="num">Funded (CHF)</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((appeal) => (
                    <tr key={appeal.id}>
                      <td>{formatDate(appeal.start_date)}</td>
                      <td>{appeal.code}</td>
                      <td>{appeal.country?.name}</td>
                      <td>{appeal.atype_display}</td>
                      <td className="crisis">{appeal.name}</td>
                      <td className="num">{formatAmount(appeal.amount_requested)}</td>
                      <td className="num">{formatAmount(appeal.amount_funded)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="ledger-empty">No appeals match this search.</p>
            )}
          </div>

          <div className="pager">
            <span>
              {rangeStart.toLocaleString('en-GB')}–{rangeEnd.toLocaleString('en-GB')} of{' '}
              {filtered.length.toLocaleString('en-GB')}
            </span>
            <div className="pager__btns">
              <button
                type="button"
                disabled={currentPage === 0}
                onClick={() => setPage(currentPage - 1)}
              >
                ← Newer
              </button>
              <button
                type="button"
                disabled={currentPage >= pageCount - 1}
                onClick={() => setPage(currentPage + 1)}
              >
                Older →
              </button>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}

export default Ledger;
