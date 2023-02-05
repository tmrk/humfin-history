const ExcelJS = require('exceljs');

const CPI_FSO_XLSX = 'https://dam-api.bfs.admin.ch/hub/api/dam/assets/23925507/master';

const workbookToJSON = workbook => {
  const cpiDataPerYear = workbook.worksheets.find(sheet => sheet.name === 'Index_y');
  const headerRowNumber = 4;
  const firstRowNumber = 5;
  const lastRowNumber = cpiDataPerYear.lastRow.number - 1;
  const lastColumnNumber = cpiDataPerYear.lastColumn.number - 1;
  const columnsData = cpiDataPerYear.columns.filter(column => column.number <= lastColumnNumber);
  let rows = [];

  for (let i = 0; i < columnsData.length; i++) {
    const column = columnsData[i];
    const header = column.values[headerRowNumber];

    if (header.toString().includes('Date')) {
      rows = column.values.map(year => ({ year: year }));
    } else for (let j = firstRowNumber; j < lastRowNumber; j++) {
      const headerString = header.toISOString().split('T')[0];
      rows[j][headerString] = column.values[j];
    }
  }
  return rows.slice(firstRowNumber, lastRowNumber);
};

async function loadBlob(blob) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(blob);
  return workbook;
}

async function fetchXLSX (url) {
  const response = await fetch(url)
    .then(response => response.body)
    .then(stream => {
      const reader = stream.getReader();
      return new ReadableStream({
        start(controller) {
          return pump();
          function pump() {
            return reader.read().then(({ done, value }) => {
              if (done) {
                controller.close();
                return;
              }
              controller.enqueue(value);
              return pump();
            });
          }
        }
      });
    })
    .then(stream => new Response(stream))
    .then(response => response.blob())
    .then(blob => loadBlob(blob));
  return response;
}

const CPIdata = fetchXLSX(CPI_FSO_XLSX)
  .then(workbook => workbookToJSON(workbook))

export default CPIdata;