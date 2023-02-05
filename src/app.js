import 'chartist/dist/index.css';
import 'chartist-plugin-tooltips-updated/dist/chartist-plugin-tooltip.css';
import { LineChart } from 'chartist';
import ChartistTooltip from 'chartist-plugin-tooltips-updated';

// Load inflation data for adjusting historical figures
//import CPIdata from './modules/FetchCPI.js';
import CPIdata from './assets/CPIdata.json';
console.log(CPIdata)

import AppealData from './assets/AppealData_20230205.json';

const startDates = [];
const amounts = [];
const chartData = {};
const inflationAdjusted = false;

function adjustForInflation (amount, fromYear, toYear) {
  fromYear = Number(fromYear);
  const lastYearInCPIdata = Math.max.apply(null, CPIdata.map(year => year.year));
  toYear = Number(toYear || lastYearInCPIdata);

  if (fromYear >= toYear) return amount;
  else {
    const fromYearData = CPIdata.find(year => year.year === fromYear);
    const latestBase = Object.keys(fromYearData).reduce((a, b) => 
      new Date(fromYearData[a]) > new Date(fromYearData[b]) ? a : b
    );
    return amount / 100 * fromYearData[latestBase];
  }
}

function processAppeals (data) {
  console.log(data);
  const filtered = data.sort((a, b) => 
    new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
  );

  for (let i = 0; i < filtered.length; i++) {
    const appeal = filtered[i];
    startDates.push(appeal.start_date.split('-')[0]);
    amounts.push(appeal.amount_requested);

    const year = new Date(appeal.start_date).getFullYear();
    const amount = parseInt(appeal.amount_funded) || parseInt(appeal.amount_requested);

    if (chartData[year]) chartData[year] = chartData[year] + amount;
    else chartData[year] = amount;
  }

  console.log(filtered)
  console.log(Object.values(chartData));
  console.log(chartData);

  new LineChart(
    '#root',
    {
      labels: Object.keys(chartData),
      series: [
        Object.values(chartData).map((value, index) => ({
          meta: Object.keys(chartData)[index],
          value: inflationAdjusted ? adjustForInflation(value, Object.keys(chartData)[index]) : value
        }))
      ]
    },
    {
      axisY: { ticks: [10000, 20000, 100000] },
      low: 0,
      showArea: true,
      plugins: [
        ChartistTooltip({
          currency: 'CHF '
        })
      ]
    }
  );
}

processAppeals(AppealData);

/*
fetch('https://goadmin.ifrc.org/api/v2/appeal/?limit=10000')
  .then(response => response.json())
  .then(data => processAppeals(data.results));
*/