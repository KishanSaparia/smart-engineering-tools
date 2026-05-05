const XLSX = require('xlsx');

const input = 'C:/Data/Sample for website/SAMPLE 1/SAMPLE 1.xlsx';
const out = 'C:/Data/Sample for website/SAMPLE 1/SAMPLE_100plus_Oneline.xlsx';

const wb = XLSX.readFile(input);

const getHeaders = (name) => XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: '' })[0];
const setRows = (name, rows) => {
  const headers = getHeaders(name);
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws['!cols'] = headers.map((h) => ({ wch: Math.min(Math.max(String(h).length + 4, 20), 50) }));
  wb.Sheets[name] = ws;
};

const swgrRows = [];
for (let i = 1; i <= 4; i++) {
  swgrRows.push([
    `SWGR-${String(i).padStart(2, '0')}`, 'ELEC RM', 'NA', '480/277', 3, 4, '', '', '', '', '', '2500A', '65kA',
    'MAIN', 'SCHNEIDER', 'WL', '2500A', '65kA', '', '', '', '', '', '', '', '', 'NO', '', '', '', '',
  ]);
}

const swbdRows = [];
for (let i = 1; i <= 12; i++) {
  const fed = swgrRows[(i - 1) % 4][0];
  const amp = `${800 + (i % 3) * 400}A`;
  swbdRows.push([
    `SWBD-${String(i).padStart(2, '0')}`, '', fed, '480/277', 3, 4, '', '', '', '', '', amp, '42kA',
    'MAIN', 'SQD', 'QED', amp, '42kA', '', '', '', '', '', '', '', '', 'NO', '', '', '', '',
  ]);
}

const xfmrRows = [];
for (let i = 1; i <= 24; i++) {
  const fed = swbdRows[(i - 1) % 12][0];
  xfmrRows.push([
    `XFMR-${String(i).padStart(2, '0')}`, '', fed, `PNL-${String(i).padStart(3, '0')}-A`, '', '', '', '', '',
    480, 208, 'Delta-Star', '', 45, 5.75, 'NO', '', '', '', '',
  ]);
}

const panelRows = [];
let p = 1;
for (let i = 1; i <= 12; i++) {
  for (let s = 1; s <= 6; s++) {
    const name = `PNL-${String(p).padStart(3, '0')}-A`;
    const fed = s <= 2 ? swbdRows[i - 1][0] : `XFMR-${String(((i - 1) * 2) + ((s - 1) % 2) + 1).padStart(2, '0')}`;
    const amp = s <= 2 ? '400A' : '225A';
    const ka = s <= 2 ? '35kA' : '22kA';
    const main = s % 2 === 0 ? 'MLO' : 'MAIN';
    panelRows.push([
      name, '', fed, s <= 2 ? '480/277' : '208/120', 3, 4, '', '', '', '', '', amp, ka,
      main, main === 'MAIN' ? 'SQD' : 'NA', main === 'MAIN' ? 'J' : 'NA', main === 'MAIN' ? amp : 'NA',
      main === 'MAIN' ? ka : 'NA', '', '', '', '', '', '', '', '', 'NO', '', '', '', '',
    ]);
    p++;
    const sec = `PNL-${String(p).padStart(3, '0')}-B`;
    panelRows.push([
      sec, '', name, s <= 2 ? '480/277' : '208/120', 3, 4, '', '', '', '', '', amp, ka,
      'MLO', 'NA', 'NA', 'NA', 'NA', '', '', '', '', '', '', '', '', 'NO', '', '', '', '',
    ]);
    p++;
  }
}

while (panelRows.length < 90) {
  const idx = panelRows.length + 1;
  const parent = panelRows[Math.max(0, idx - 2)][0];
  const main = idx % 2 ? 'MAIN' : 'MLO';
  panelRows.push([
    `PNL-X${String(idx).padStart(3, '0')}`, '', parent, '208/120', 3, 4, '', '', '', '', '', '175A', '22kA',
    main, main === 'MAIN' ? 'SQD' : 'NA', main === 'MAIN' ? 'B' : 'NA', main === 'MAIN' ? '175A' : 'NA',
    main === 'MAIN' ? '22kA' : 'NA', '', '', '', '', '', '', '', '', 'NO', '', '', '', '',
  ]);
}

setRows('Switchgear', swgrRows);
setRows('Switchboard', swbdRows);
setRows('Transformer', xfmrRows);
setRows('Panel', panelRows);

const preserve = [
  'Instructions',
  'Disconnect Switch',
  'Enclosed Circuit Breaker',
  'Motor Control Center',
  'Variable Frequency Drive',
  'Motor',
  'Generator',
  'Automatic Transfer Switch',
  'Uninterruptible Power Supply',
  'Unknown Equipment',
];
for (const n of preserve) {
  if (!wb.Sheets[n]) continue;
  const headers = getHeaders(n);
  wb.Sheets[n] = XLSX.utils.aoa_to_sheet([headers]);
}

XLSX.writeFile(wb, out);
console.log(JSON.stringify({
  output: out,
  switchgear: swgrRows.length,
  switchboard: swbdRows.length,
  transformer: xfmrRows.length,
  panel: panelRows.length,
  total: swgrRows.length + swbdRows.length + xfmrRows.length + panelRows.length,
}));
