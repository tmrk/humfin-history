const CARDS = [
  {
    kicker: 'The source',
    title: 'One archive, one century',
    body: 'Everything here comes from a single dataset: the appeals of the International Federation of Red Cross and Red Crescent Societies, recorded in its GO platform back to 1919. It is a proxy for the world’s appetite for humanitarian giving, not a tally of all humanitarian spending.',
  },
  {
    kicker: 'The two lines',
    title: 'Asked is not given',
    body: '“Requested” is what an appeal asked for at launch; “funded” is what donors actually contributed. The gap between the two is the story of most years, though about a hundred appeals in the record were funded beyond their ask.',
  },
  {
    kicker: 'Before 1994',
    title: 'A century of asks, thirty years of answers',
    body: 'GO records what donors gave only from 1994 onwards; every earlier appeal carries a zero. By default the chart substitutes the requested amount for those years; bear in mind that donors may have covered less than what was asked.',
  },
  {
    kicker: 'The gaps',
    title: 'Silences in the ledger',
    body: 'Appeals are counted under the year they started, so multi-year wartime operations sit entirely in 1939 and the years 1940–44 look empty. All DREF grants between 1997 and 2003 carry zero amounts in GO, so that period is underrepresented too.',
  },
  {
    kicker: 'The francs',
    title: 'What “2025 francs” means',
    body: 'Appeals are denominated in Swiss francs, so amounts are adjusted with the Swiss consumer price index, chained across its base series back to 1914. That measures Swiss purchasing power, a deliberate simplification kept consistent across the whole century.',
  },
  {
    kicker: 'The instruments',
    title: 'DREF and Emergency Appeals',
    body: 'Small and medium disasters are funded from the Disaster Response Emergency Fund (DREF); large and complex crises get a full Emergency Appeal to donors. Both are counted here, alongside the older International Appeals.',
  },
];

function Methodology() {
  return (
    <section className="section" id="method">
      <p className="section__eyebrow">How to read it</p>
      <h2>An honest chart needs footnotes</h2>
      <p className="section__dek">
        This page makes strong visual claims from imperfect historical records. These six
        caveats keep the claims honest.
      </p>
      <div className="cards">
        {CARDS.map((card) => (
          <article className="card" key={card.kicker}>
            <p className="card__kicker">{card.kicker}</p>
            <h3>{card.title}</h3>
            <p>{card.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default Methodology;
