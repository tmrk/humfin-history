#!/usr/bin/env node
// Regenerates src/cached/CPIdata.json from the Swiss Federal Statistical
// Office's CPI indexation table ("Landesindex der Konsumentenpreise,
// Indexierungstabelle", asset cc-d-05.02.08, the source already referenced
// in the README). The sheet "Index_y" holds annual average indices on every
// original base series (June 1914, August 1939, ..., December 2020); the
// column keys of CPIdata.json are those base dates in ISO format.
//
// Usage: npm run update-cpi

import { inflateRawSync } from 'node:zlib';
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ASSET_URL = 'https://dam-api.bfs.admin.ch/hub/api/dam/assets/orderNr:cc-d-05.02.08/master';
const SHEET_NAME = 'Index_y';
const OUTPUT_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..', 'src', 'cached', 'CPIdata.json'
);

// --- minimal .xlsx (zip) reading -------------------------------------------

const findEndOfCentralDirectory = (buffer) => {
  for (let i = buffer.length - 22; i >= Math.max(0, buffer.length - 65558); i--) {
    if (buffer.readUInt32LE(i) === 0x06054b50) return i;
  }
  throw new Error('Not a zip file (end of central directory not found)');
};

const readZipEntries = (buffer) => {
  const eocd = findEndOfCentralDirectory(buffer);
  const entryCount = buffer.readUInt16LE(eocd + 10);
  let offset = buffer.readUInt32LE(eocd + 16);
  const entries = new Map();
  for (let i = 0; i < entryCount; i++) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) {
      throw new Error('Corrupt zip central directory');
    }
    const method = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localHeaderOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.toString('utf8', offset + 46, offset + 46 + nameLength);
    entries.set(name, { method, compressedSize, localHeaderOffset });
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
};

const readZipFile = (buffer, entries, name) => {
  const entry = entries.get(name);
  if (!entry) throw new Error(`${name} not found in the xlsx file`);
  const { method, compressedSize, localHeaderOffset } = entry;
  const nameLength = buffer.readUInt16LE(localHeaderOffset + 26);
  const extraLength = buffer.readUInt16LE(localHeaderOffset + 28);
  const start = localHeaderOffset + 30 + nameLength + extraLength;
  const data = buffer.subarray(start, start + compressedSize);
  if (method === 0) return data.toString('utf8');
  if (method === 8) return inflateRawSync(data).toString('utf8');
  throw new Error(`Unsupported zip compression method ${method} for ${name}`);
};

// --- minimal worksheet parsing ---------------------------------------------

const decodeXml = (text) => text
  .replace(/<[^>]+>/g, '')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/&apos;/g, "'").replace(/&amp;/g, '&');

const parseSharedStrings = (xml) =>
  [...xml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map(match => decodeXml(match[1]));

// Resolve the worksheet path of a sheet name via the workbook relationships
const findSheetPath = (workbookXml, relsXml, sheetName) => {
  const sheetMatch = [...workbookXml.matchAll(/<sheet[^>]*\/?>/g)]
    .map(m => m[0])
    .find(tag => tag.includes(`name="${sheetName}"`));
  if (!sheetMatch) throw new Error(`Sheet ${sheetName} not found in workbook`);
  const relId = sheetMatch.match(/r:id="([^"]+)"/)[1];
  const rel = [...relsXml.matchAll(/<Relationship[^>]*\/?>/g)]
    .map(m => m[0])
    .find(tag => tag.includes(`Id="${relId}"`));
  const target = rel.match(/Target="([^"]+)"/)[1];
  return target.startsWith('/') ? target.slice(1) : `xl/${target}`;
};

const parseSheetRows = (xml, sharedStrings) => {
  const rows = [];
  for (const rowMatch of xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
    const cells = {};
    const cellPattern = /<c r="([A-Z]+)\d+"(?:[^>]*t="(\w+)")?[^>]*>(?:<v>([^<]*)<\/v>)?/g;
    for (const cellMatch of rowMatch[1].matchAll(cellPattern)) {
      const [, column, type, value] = cellMatch;
      if (value === undefined) continue;
      cells[column] = type === 's' ? sharedStrings[Number(value)] : value;
    }
    rows.push(cells);
  }
  return rows;
};

const excelSerialToIsoDate = (serial) =>
  new Date(Date.UTC(1899, 11, 30) + Number(serial) * 86400000)
    .toISOString().slice(0, 10);

const roundIndex = (value) => Math.round(Number(value) * 10000) / 10000;

// --- main ------------------------------------------------------------------

console.log(`Fetching ${ASSET_URL}`);
const response = await fetch(ASSET_URL);
if (!response.ok) throw new Error(`Download failed with HTTP ${response.status}`);
const buffer = Buffer.from(await response.arrayBuffer());
console.log(`Downloaded ${buffer.length} bytes`);

const entries = readZipEntries(buffer);
const sharedStrings = parseSharedStrings(readZipFile(buffer, entries, 'xl/sharedStrings.xml'));
const sheetPath = findSheetPath(
  readZipFile(buffer, entries, 'xl/workbook.xml'),
  readZipFile(buffer, entries, 'xl/_rels/workbook.xml.rels'),
  SHEET_NAME
);
const rows = parseSheetRows(readZipFile(buffer, entries, sheetPath), sharedStrings);

// The header row holds the base dates of each series as Excel serial numbers
// (e.g. 5266 -> 1914-06-01); data rows have a four-digit year in column A.
const headerRow = rows.find(cells =>
  Object.entries(cells).some(([column, value]) => column !== 'A' && /^\d{4,6}$/.test(value))
  && !/^\d{4}$/.test(cells.A ?? ''));
const baseDates = Object.fromEntries(
  Object.entries(headerRow)
    .filter(([column, value]) => column !== 'A' && column !== 'M' && /^\d+$/.test(value))
    .map(([column, value]) => [column, excelSerialToIsoDate(value)])
);
if (!Object.values(baseDates).includes('1914-06-01')) {
  throw new Error('Unexpected sheet layout: 1914-06-01 base series not found');
}

const data = rows
  .filter(cells => /^\d{4}$/.test(cells.A ?? ''))
  .map(cells => {
    const entry = { year: Number(cells.A) };
    for (const [column, baseDate] of Object.entries(baseDates)) {
      if (cells[column] !== undefined) entry[baseDate] = roundIndex(cells[column]);
    }
    return entry;
  });

if (data.length < 100 || data[0].year !== 1914) {
  throw new Error(`Unexpected data extracted (${data.length} rows, first year ${data[0]?.year})`);
}

// Sanity check against the current file: existing values must not change
if (existsSync(OUTPUT_PATH)) {
  const previous = JSON.parse(readFileSync(OUTPUT_PATH, 'utf8'));
  const next = new Map(data.map(entry => [entry.year, entry]));
  for (const oldEntry of previous) {
    const newEntry = next.get(oldEntry.year);
    if (!newEntry) throw new Error(`Year ${oldEntry.year} disappeared from the source`);
    for (const [key, value] of Object.entries(oldEntry)) {
      if (key === 'year') continue;
      if (newEntry[key] === undefined || Math.abs(newEntry[key] - value) > 0.06) {
        throw new Error(
          `Value changed for ${oldEntry.year} ${key}: ${value} -> ${newEntry[key]} (revise manually)`
        );
      }
    }
  }
}

const json = '[\n' + data.map(entry => '  ' + JSON.stringify(entry)).join(',\n') + '\n]\n';
writeFileSync(OUTPUT_PATH, json);
console.log(`Wrote ${data.length} years (${data[0].year}-${data[data.length - 1].year}) to ${OUTPUT_PATH}`);
