# Humanitarian Finance History

This page displays a line chart showing how much funds (in Swiss Franc) have been used for humanitarian response since 1919, adjusted for inflation.

Although only one data source is used (i.e. the appeals data exposed by the [IFRC GO API](https://goadmin.ifrc.org/docs/#api-v2-appeal-list)), it is still indicative of historical trends given the Red Cross Movement's long-standing presence in humanitarian reponse, and this is the only currently available dataset dating all the way back to the aftermath of World War I. 

(For modern datasets that include much more aspects of aid funding, see the 
[International Aid Transparency Initiative](https://github.com/IATI).)

To adjust for inflation, the CPI data published by the [Federal Statistical Office of Switzerland](https://www.bfs.admin.ch/asset/de/cc-d-05.02.08) is used.

Read more about this project here: 

* https://x.com/tmarki/status/1707340356226810195
* https://medium.com/@tmarki/how-much-are-we-really-spending-on-disaster-response-8f6eb9d5da33

## Methodology and limitations

* Every appeal in GO (DREF, Emergency Appeal, International Appeal, Forecast Based Action) is counted in the calendar year of its start date, using the CHF amounts recorded in the database. Multi-year operations are not spread over their duration, which is probably why 1940–1944 show no activity while 1939 and 1945 spike.
* Funding coverage (`amount_funded`) only exists from 1994 onwards; every earlier appeal has it recorded as zero. The "Show requested as funded (pre-1994)" switch substitutes requested amounts for those years — bear in mind that more may have been requested than donors actually covered.
* All DREF records between 1997 and 2003 carry zero amounts in GO, so funding from that period is underrepresented.
* Inflation adjustment chains the Swiss CPI's original base series (going back to June 1914) and expresses amounts in the francs of the latest year covered by the bundled index (currently 2025). Regenerate the index cache from the FSO source with `npm run update-cpi`.
* This is a single-source dataset: it reflects the funding history of the Red Cross Red Crescent Movement's international emergency operations, not total global humanitarian spending.

## Demo

https://tmrk.github.io/humfin-history/

## Development

Requires Node.js 20.19 or newer.

```sh
npm install
npm start        # dev server (Vite)
npm test         # unit tests (Vitest)
npm run build    # production build to dist/
npm run preview  # serve the production build locally
npm run deploy   # publish dist/ to the gh-pages branch
```

## Planned

* Add currency conversion
* Improve design (incl. mobile responsiveness)
* Restructure code