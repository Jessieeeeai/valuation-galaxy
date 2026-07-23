// 估值星系 · EDGAR 数据抓取器（在 GitHub Actions 里运行）
// 逐公司拉取 SEC companyfacts，裁剪为估值引擎所需科目，写入 data/facts/<TICKER>.json
import { readFileSync, writeFileSync, mkdirSync } from 'fs';

const UA = 'ValuationGalaxy/1.0 research tool (contact: giantcutie999@gmail.com)';
const TAGS = [
  'RevenueFromContractWithCustomerExcludingAssessedTax', 'Revenues', 'SalesRevenueNet', 'RevenueFromContractWithCustomerIncludingAssessedTax', 'RevenuesNetOfInterestExpense',
  'NetIncomeLoss',
  'NetCashProvidedByUsedInOperatingActivities', 'NetCashProvidedByUsedInOperatingActivitiesContinuingOperations',
  'PaymentsToAcquirePropertyPlantAndEquipment', 'PaymentsToAcquirePropertyAndEquipmentAndIntangibleAssets', 'PaymentsToAcquireProductiveAssets', 'PaymentsToAcquirePropertyPlantAndEquipmentAndIntangibleAssets',
  'GrossProfit', 'OperatingIncomeLoss', 'ShareBasedCompensation',
  'WeightedAverageNumberOfDilutedSharesOutstanding',
  'Assets', 'LiabilitiesCurrent', 'InventoryNet', 'LongTermDebtNoncurrent', 'LongTermDebt', 'CashAndCashEquivalentsAtCarryingValue'
];

const universe = JSON.parse(readFileSync('scripts/universe.json', 'utf8'));
mkdirSync('data/facts', { recursive: true });

const sleep = ms => new Promise(r => setTimeout(r, ms));
const ok = [], fail = [];

for (const c of universe) {
  if (!c.cik) { fail.push({ ticker: c.ticker, err: 'no CIK (IFRS/foreign filer)' }); continue; }
  const cik = String(c.cik).padStart(10, '0');
  const url = `https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`;
  let done = false;
  for (let attempt = 0; attempt < 3 && !done; attempt++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': 'application/json' } });
      if (r.status === 429 || r.status === 403) { await sleep(3000 * (attempt + 1)); continue; }
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const j = await r.json();
      const out = { ticker: c.ticker, entityName: j.entityName, cik: j.cik, fetched: new Date().toISOString().slice(0, 10), facts: {} };
      if (j.facts && j.facts['us-gaap']) {
        const keep = {};
        for (const t of TAGS) if (j.facts['us-gaap'][t]) keep[t] = j.facts['us-gaap'][t];
        out.facts['us-gaap'] = keep;
      }
      if (j.facts && j.facts['ifrs-full']) out.facts['ifrs-full'] = { _stripped: true };
      writeFileSync(`data/facts/${c.ticker}.json`, JSON.stringify(out));
      ok.push(c.ticker); done = true;
    } catch (e) {
      if (attempt === 2) fail.push({ ticker: c.ticker, err: String(e.message || e) });
      else await sleep(2000);
    }
  }
  await sleep(150); // SEC 限速礼貌间隔（官方允许 10 req/s，这里远低于）
}

writeFileSync('data/manifest.json', JSON.stringify({
  updated: new Date().toISOString(),
  count: ok.length,
  tickers: ok,
  failed: fail
}, null, 1));

console.log(`done: ${ok.length} ok, ${fail.length} failed`);
if (fail.length) console.log(JSON.stringify(fail, null, 1));
if (ok.length < universe.length * 0.5) { console.error('too many failures'); process.exit(1); }
