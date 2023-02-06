import 'chartist/dist/index.css';
import 'chartist-plugin-tooltips-updated/dist/chartist-plugin-tooltip.css';
import { LineChart } from 'chartist';
import ChartistTooltip from 'chartist-plugin-tooltips-updated';
import { el } from 'redom';

// Load inflation data for adjusting historical figures
//import CPIdata from './modules/FetchCPI.js';
import CPIdata from './assets/CPIdata.json';

import AppealData from './assets/AppealData_20230205.json';

const inflationAdjusted = true;

const startDates = [];
const amounts = [];
const chartData = {};
const lastYearInCPIdata = Math.max.apply(null, CPIdata.map(year => year.year));

function format (number, decimals) {
  if (number) {
    let parts = parseFloat(number).toFixed(decimals).toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  } else return '0';
}

function adjustForInflation (amount, baseYear, targetYear) {
  baseYear = Number(baseYear);
  targetYear = Number(targetYear || lastYearInCPIdata);

  if (baseYear >= targetYear) return amount;
  else {
    const targetYearData = CPIdata.find(year => year.year === targetYear);
    const baseYearData = CPIdata.find(year => year.year === baseYear);
    const latestBaseIndex = Object.keys(baseYearData)
      .filter(key => key !== 'year')
      .reduce((a, b) => new Date(a) > new Date(b) ? a : b);
    return amount / baseYearData[latestBaseIndex] * targetYearData[latestBaseIndex];
  }
}

function processAppeals (data) {
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

  new LineChart(
    '#chart',
    {
      labels: Object.keys(chartData),
      series: [
        Object.values(chartData).map((value, index) => {

          const year = Object.keys(chartData)[index];
          const amount = inflationAdjusted ? adjustForInflation(value, year) : value;
          const tooltip = el('div', [
            el('div.year', year),
            el('div.meta', [
              el('div.amount', format(amount) + ' CHF'),
              el('div.info', 
                inflationAdjusted && year < lastYearInCPIdata 
                ? 'Adjusted for inflation (' + year + '–' + lastYearInCPIdata + ')' 
                : 'Original amount (' + year + ')'
              )
            ])
          ]);
                    
          return ({
            meta: tooltip.innerHTML,
            value: amount
          })
        })
      ],
      chartPadding: 20
    },
    {
      axisX: {
        labelInterpolationFnc: function(value) {
          if (value.toString().endsWith('0')) return value;
        }
      },
      axisY: {
        labelInterpolationFnc: function(value) {
          if (value >= 1000000000) return (value / 1000000000) + 'B';
          else if (value >= 1000000) return (value / 1000000) + 'M';
          else if (value >= 1000) return (value / 1000) + 'k';
        }
      },
      low: 0,
      showArea: true,
      plugins: [
        ChartistTooltip({
          anchorToPoint: false,
          metaIsHTML: true,
          appendToBody: false
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