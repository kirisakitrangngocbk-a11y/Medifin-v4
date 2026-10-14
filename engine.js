/* MEDIFIN — Toy Kingdom / Case 01
 * Data-driven screen state, evidence provenance, deterministic events and
 * outcome resolution. Player-facing views never render builder metadata.
 */

const SCHEMA_VERSION = 3;
const CONTENT_VERSION = 'case01-toy-kingdom-en-v4';
const SCORING_VERSION = 'scoring-v3';
const SIMULATION_VERSION = 'simulation-v3';
const CANONICAL_CASE_ID = 'case01';
const STORAGE_PREFIX = 'medifin-integrated-save-';

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, Number(value) || 0));
const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
const deepCopy = (value) => JSON.parse(JSON.stringify(value));
const money = (value, digits = 0) => Number(value).toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: digits });
const statusLabel = (status) => ({ CLUE: 'Clue', DISCOVERED: 'Opened', VERIFIED: 'Verified', DISPROVED: 'Disproved' }[status] || status);

const SCREEN_LABELS = ['Intake', 'Clinic', 'Case files', 'Questions', 'Financial statements', 'Final question', 'Diagnosis', 'Treatment plan', 'Timing', 'Preparation', 'Developments', 'Re-evaluation', 'Conclusion'];

const DOSSIERS = {
  'HS-A': {
    id: 'HS-A', title: 'Sales & Customer', scope: "Revenue, store traffic, and sales channels",
    summary: "Same-store sales, regional revenue, and e-commerce.",
    content: ["Consolidated same-store sales: FY2024 0.0%, FY2025 +0.9%, FY2026 -1.4%. Domestic FY2026 -1.3%; International -1.6%.", "Consolidated revenue was $11.802bn in FY2025 and $11.540bn in FY2026; e-commerce grew 11%.", "Store traffic weakened as some customers moved to online channels."], evidenceIds: ['TK-A-SSS', 'TK-A-CHANNEL'], reputation: 4
  },
  'HS-B': {
    id: 'HS-B', title: 'Stores & Investment', scope: "Store network and capital programs",
    summary: "Renovation, digital, fulfillment, supply chain, customer experience, and holiday inventory.",
    content: ["Store renovation, mobile and web, omnichannel fulfillment, supply chain, customer experience, and holiday inventory compete for capital.", "Renovation has been deferred for three consecutive years while omnichannel programs received priority.", "Several projects could improve operations, but the annual capital budget is limited."], evidenceIds: ['TK-B-CAPEX'], reputation: 3
  },
  'HS-C': {
    id: 'HS-C', title: 'Liquidity', scope: "Cash, holiday inventory, supplier terms, and debt maturities",
    summary: "FY2026 liquidity snapshot and seasonal funding needs.",
    content: ["Cash and cash equivalents were $566m; accounts and other receivables $255m; merchandise inventory $2.476bn.", "Total current assets were $3.389bn and property and equipment $3.067bn.", "Year-end cash alone does not capture retail liquidity: holiday inventory, vendor terms, and debt maturities all matter."], evidenceIds: ['TK-C-CASH', 'TK-C-SEASON'], reputation: 3
  },
  'HS-D': {
    id: 'HS-D', title: 'Capital Structure & Leverage History', scope: "Debt, interest expense, and capital transaction history",
    summary: "Current leverage and operating cash flow before the 2015 transaction.",
    content: ["Total indebtedness was about $4.8bn; secured indebtedness about $3.4bn; FY2026 Adjusted EBITDA $792m; operating earnings $460m.", "The simulated 2015 leveraged buyout was valued at $6.6bn. Refinancing, maturity extensions, and restructuring rounds followed.", "Operating cash flow before the transaction: $575m in 2012, $801m in 2013, and $746m in 2014."], evidenceIds: ['TK-D-LEVERAGE', 'TK-D-LBO'], reputation: 5
  },
  'HS-E': {
    id: 'HS-E', title: 'Product & Category Trends', scope: "Product mix and licensing cycles",
    summary: "Traditional toys, entertainment, and factors outside the company's control.",
    content: ["Domestic toy categories excluding entertainment grew 2.5% in same-store sales; consolidated categories excluding entertainment grew 1.1%.", "Entertainment and licensed categories were weaker and depended on partners' release schedules.", "A year without a major blockbuster hurt licensing more than the rest of the product range."], evidenceIds: ['TK-E-MIX', 'TK-E-LICENSING'], reputation: 3
  },
  'HS-F': {
    id: 'HS-F', title: 'Management Track Record', scope: "Initiatives and actual results over the past three years",
    summary: "Renovation, SG&A cuts, digital growth, and international debt restructuring.",
    content: ["A store renovation pilot improved local traffic but did not cover its costs; SG&A cuts reduced spending but also reduced marketing.", "A new digital and mobile app lifted e-commerce by double digits but did not offset declining store sales.", "Restructuring part of the international debt eased short-term pressure without changing overall leverage."], evidenceIds: ['TK-F-TRACK'], reputation: 2
  },
  'HS-G': {
    id: 'HS-G', title: 'Governance & Family', scope: "Ownership, family arrangements, and legal correspondence",
    summary: "A private governance file covering the Anderson family, Michael, Richard, and Houndstooth.",
    content: ["The Anderson family owns 78%; a private equity fund owns 22%. David is CEO, Michael is his younger brother, and Richard is his uncle.", "Michael has a fictional arrangement with Houndstooth Capital: if measured Adjusted EBITDA falls below $752.4m (95% of $792m), a purchase right over a designated share tranche may become exercisable.", "Richard wants to sell international assets and distribute the cash; a legal letter shows Michael prepared a plan to pressure creditors if he gains control.", "Under this case's assumed contract, Houndstooth Capital holds the exercise right over a designated 12% tranche of family shares; Michael is the consenting signatory. The right does not cover the family's entire 78% stake, and control is lost only when exercise and transfer are recorded.", "The tranche and transfer mechanism are assumptions of this simulation; they cannot be inferred from ownership percentages alone."], evidenceIds: ['TK-G-OWNERSHIP', 'TK-G-CONTRACT', 'TK-G-LETTER'], reputation: 5
  }
};

const EVIDENCE = {
  'TK-A-SSS': { id: 'TK-A-SSS', title: "Same-store sales", source: 'HS-A · Sales & Customer', acquiredAtScreen: 2, status: 'DISCOVERED', factKey: 'FY2026-SSS', text: "Consolidated FY2026 same-store sales fell 1.4% after rising 0.9% in FY2025.", relationships: { A: 'SUPPORTS', B: 'CONTEXT', C: 'CONTEXT', D: 'CONTEXT', E: 'CONTEXT', F: 'SUPPORTS' }, weight: 3 },
  'TK-A-CHANNEL': { id: 'TK-A-CHANNEL', title: "Revenue by channel", source: 'HS-A · Sales & Customer', acquiredAtScreen: 2, status: 'DISCOVERED', factKey: 'FY2026-NET-SALES', text: "E-commerce grew 11% in FY2026 while consolidated revenue fell 2.2%.", relationships: { A: 'SUPPORTS', B: 'CONTEXT', C: 'CONTEXT', D: 'CONTEXT', E: 'CONTEXT', F: 'SUPPORTS' }, weight: 3 },
  'TK-B-CAPEX': { id: 'TK-B-CAPEX', title: "Capital program list", source: 'HS-B · Stores & Investment', acquiredAtScreen: 2, status: 'DISCOVERED', text: "Renovation, mobile, fulfillment, supply chain, customer experience, and holiday inventory compete for limited capital.", relationships: { A: 'CONTEXT', B: 'SUPPORTS', C: 'CONTEXT', D: 'SUPPORTS', E: 'CONTEXT', F: 'SUPPORTS' }, weight: 3 },
  'TK-C-CASH': { id: 'TK-C-CASH', title: "Cash and current assets", source: 'HS-C · Liquidity', acquiredAtScreen: 2, status: 'DISCOVERED', factKey: 'FY2026-CASH', text: "Cash $566m; inventory $2.476bn; total current assets $3.389bn.", relationships: { A: 'CONTEXT', B: 'CONTEXT', C: 'SUPPORTS', D: 'CONTEXT', E: 'CONTEXT', F: 'SUPPORTS' }, weight: 3 },
  'TK-C-SEASON': { id: 'TK-C-SEASON', title: "Seasonal liquidity", source: 'HS-C · Liquidity', acquiredAtScreen: 2, status: 'DISCOVERED', text: "Holiday inventory, vendor terms, and debt maturities create different liquidity needs.", relationships: { A: 'CONTEXT', B: 'CONTEXT', C: 'SUPPORTS', D: 'SUPPORTS', E: 'CONTEXT', F: 'SUPPORTS' }, weight: 2 },
  'TK-D-LEVERAGE': { id: 'TK-D-LEVERAGE', title: "Current leverage", source: 'HS-D · Capital Structure', acquiredAtScreen: 2, status: 'DISCOVERED', factKey: 'FY2026-EBITDA', text: "Total indebtedness about $4.8bn, secured indebtedness about $3.4bn, EBITDA $792m.", relationships: { A: 'CONTEXT', B: 'CONTEXT', C: 'SUPPORTS', D: 'SUPPORTS', E: 'CONTEXT', F: 'SUPPORTS' }, weight: 4 },
  'TK-D-LBO': { id: 'TK-D-LBO', title: "2015 transaction history", source: 'HS-D · Capital Structure', acquiredAtScreen: 2, status: 'DISCOVERED', text: "The simulated LBO was $6.6bn; pre-transaction operating cash flow in 2012-2014 was $575m, $801m, and $746m.", relationships: { A: 'CONTEXT', B: 'CONTEXT', C: 'CONTEXT', D: 'SUPPORTS', E: 'CONTEXT', F: 'SUPPORTS' }, weight: 4 },
  'TK-E-MIX': { id: 'TK-E-MIX', title: "Toy sales excluding licensing", source: 'HS-E · Product & Category', acquiredAtScreen: 2, status: 'DISCOVERED', text: "Same-store sales excluding entertainment grew 2.5% domestically and 1.1% on a consolidated basis.", relationships: { A: 'CONTEXT', B: 'CONTEXT', C: 'CONTEXT', D: 'CONTEXT', E: 'CONTRADICTS', F: 'CONTEXT' }, weight: 3 },
  'TK-E-LICENSING': { id: 'TK-E-LICENSING', title: "Entertainment and licensing cycle", source: 'HS-E · Product & Category', acquiredAtScreen: 2, status: 'DISCOVERED', text: "Entertainment and licensed categories weakened without a major blockbuster.", relationships: { A: 'CONTEXT', B: 'CONTEXT', C: 'CONTEXT', D: 'CONTEXT', E: 'SUPPORTS', F: 'SUPPORTS' }, weight: 3 },
  'TK-F-TRACK': { id: 'TK-F-TRACK', title: "Three-year initiative results", source: 'HS-F · Management Track Record', acquiredAtScreen: 2, status: 'DISCOVERED', text: "Digital increased online sales, SG&A cuts reduced costs, and international debt maturities were extended; each addressed only part of the problem.", relationships: { A: 'CONTEXT', B: 'SUPPORTS', C: 'CONTEXT', D: 'SUPPORTS', E: 'CONTEXT', F: 'SUPPORTS' }, weight: 2 },
  'TK-G-OWNERSHIP': { id: 'TK-G-OWNERSHIP', title: "Anderson ownership", source: 'HS-G · Governance & Family', acquiredAtScreen: 2, status: 'VERIFIED', text: "The Anderson family owns 78%; a private equity fund owns 22%.", relationships: { A: 'CONTEXT', B: 'CONTEXT', C: 'CONTEXT', D: 'CONTEXT', E: 'CONTEXT', F: 'CONTEXT' }, weight: 1 },
  'TK-G-CONTRACT': { id: 'TK-G-CONTRACT', title: "Houndstooth clause", source: 'HS-G · Governance & Family', acquiredAtScreen: 2, status: 'VERIFIED', text: "The fictional contract sets measured EBITDA below $752.4m as the threshold for a purchase right over a designated 12% family share tranche. Houndstooth holds the exercise right; it does not cover the full 78% family stake.", relationships: { A: 'CONTEXT', B: 'CONTEXT', C: 'CONTEXT', D: 'CONTEXT', E: 'CONTEXT', F: 'CONTEXT' }, weight: 2 },
  'TK-G-LETTER': { id: 'TK-G-LETTER', title: "Family legal letter", source: 'HS-G · Governance & Family', acquiredAtScreen: 2, status: 'VERIFIED', text: "Michael prepared a scenario to pressure creditors; Richard wants to sell international assets and distribute cash.", relationships: { A: 'CONTEXT', B: 'CONTEXT', C: 'CONTEXT', D: 'CONTEXT', E: 'CONTEXT', F: 'CONTEXT' }, weight: 2 },
  'TK-FS-INCOME': { id: 'TK-FS-INCOME', title: "Consolidated income statement", source: 'Complete financial statements - Screen 4', acquiredAtScreen: 4, status: 'VERIFIED', factKey: 'FY2026-NET-SALES', text: "Net sales FY2024-FY2026: $12.361bn, $11.802bn, $11.540bn; operating earnings: $191m, $378m, $460m; FY2026 net loss attributable: -$36m.", relationships: { A: 'SUPPORTS', B: 'CONTEXT', C: 'CONTEXT', D: 'SUPPORTS', E: 'CONTEXT', F: 'SUPPORTS' }, weight: 4 },
  'TK-FS-BALANCE': { id: 'TK-FS-BALANCE', title: "FY2026 balance sheet", source: 'Complete financial statements - Screen 4', acquiredAtScreen: 4, status: 'VERIFIED', factKey: 'FY2026-CASH', text: "Cash $566m, inventory $2.476bn, property and equipment $3.067bn, and stockholders' deficit about $1.3bn.", relationships: { A: 'CONTEXT', B: 'CONTEXT', C: 'SUPPORTS', D: 'SUPPORTS', E: 'CONTEXT', F: 'SUPPORTS' }, weight: 4 },
  'TK-FS-METRICS': { id: 'TK-FS-METRICS', title: "Operating metrics", source: 'Complete financial statements - Screen 4', acquiredAtScreen: 4, status: 'VERIFIED', factKey: 'FY2026-EBITDA', text: "FY2026 gross margin 35.6%, SG&A to sales 30.2%, Adjusted EBITDA $792m, and consolidated same-store sales -1.4%.", relationships: { A: 'SUPPORTS', B: 'CONTEXT', C: 'CONTEXT', D: 'SUPPORTS', E: 'CONTEXT', F: 'SUPPORTS' }, weight: 4 },
  'TK-CLUE-CHANNEL': { id: 'TK-CLUE-CHANNEL', title: "Customers changing channels", source: 'CH1-A - Follow-up question', acquiredAtScreen: 3, status: 'CLUE', text: "Most of the traffic decline reflects channel switching; online margins are lower than store margins.", relationships: { A: 'SUPPORTS', B: 'CONTEXT', C: 'CONTEXT', D: 'CONTEXT', E: 'CONTEXT', F: 'SUPPORTS' }, weight: 1 },
  'TK-CLUE-RENOVATION': { id: 'TK-CLUE-RENOVATION', title: "Deferred renovation", source: 'CH1-B - Follow-up question', acquiredAtScreen: 3, status: 'CLUE', text: "Store renovation was deferred for three consecutive years as capital went to omnichannel programs.", relationships: { A: 'CONTEXT', B: 'SUPPORTS', C: 'CONTEXT', D: 'CONTEXT', E: 'CONTEXT', F: 'SUPPORTS' }, weight: 1 },
  'TK-CLUE-LIQUIDITY': { id: 'TK-CLUE-LIQUIDITY', title: "Covenant headroom", source: 'CH1-C - Follow-up question', acquiredAtScreen: 3, status: 'CLUE', text: "If holiday sales miss by 10%, operating cash remains sufficient but covenant headroom narrows considerably.", relationships: { A: 'CONTEXT', B: 'CONTEXT', C: 'SUPPORTS', D: 'SUPPORTS', E: 'CONTEXT', F: 'SUPPORTS' }, weight: 1 },
  'TK-CLUE-MATURITY': { id: 'TK-CLUE-MATURITY', title: "Upcoming secured note maturity", source: 'CH1-D - Follow-up question', acquiredAtScreen: 3, status: 'CLUE', text: "Some secured notes mature within 18 months, creating the nearest debt pressure.", relationships: { A: 'CONTEXT', B: 'CONTEXT', C: 'SUPPORTS', D: 'SUPPORTS', E: 'CONTEXT', F: 'SUPPORTS' }, weight: 1 },
  'TK-CLUE-MIX': { id: 'TK-CLUE-MIX', title: "Category margins", source: 'CH1-E - Follow-up question', acquiredAtScreen: 3, status: 'CLUE', text: "Traditional toys have better margins but are smaller than the weaker categories.", relationships: { A: 'CONTEXT', B: 'CONTEXT', C: 'CONTEXT', D: 'CONTEXT', E: 'SUPPORTS', F: 'SUPPORTS' }, weight: 1 },
  'TK-CLUE-MANAGEMENT': { id: 'TK-CLUE-MANAGEMENT', title: "Management disagreement", source: 'CH1-F - Follow-up question', acquiredAtScreen: 3, status: 'CLUE', text: "Michael invited a lawyer specializing in transfers of control to a private meeting.", relationships: { A: 'CONTEXT', B: 'CONTEXT', C: 'CONTEXT', D: 'CONTEXT', E: 'CONTEXT', F: 'SUPPORTS' }, weight: 1 },
  'TK-CLUE-HOUNDSTOOTH': { id: 'TK-CLUE-HOUNDSTOOTH', title: "Houndstooth rumor", source: 'CH1-G - Follow-up question', acquiredAtScreen: 3, status: 'CLUE', text: "There is a rumor of a conditional purchase right tied to EBITDA; the contract terms are not verified here.", relationships: { A: 'CONTEXT', B: 'CONTEXT', C: 'CONTEXT', D: 'CONTEXT', E: 'CONTEXT', F: 'CONTEXT' }, weight: 0 },
  'TK-CLUE-REFINANCE': { id: 'TK-CLUE-REFINANCE', title: "Refinancing pressure", source: 'CH2-F - Final question', acquiredAtScreen: 5, status: 'CLUE', text: "Liquidity and refinancing need close attention over the next 12 months; family shareholders could use poor results to challenge David.", relationships: { A: 'CONTEXT', B: 'CONTEXT', C: 'SUPPORTS', D: 'SUPPORTS', E: 'CONTEXT', F: 'SUPPORTS' }, weight: 1 },
  'TK-CLUE-HOUNDSTOOTH-TRIGGER': { id: 'TK-CLUE-HOUNDSTOOTH-TRIGGER', title: "Potential contract trigger", source: 'CH2-G - Final question', acquiredAtScreen: 5, status: 'CLUE', text: "If the rumor is true, the purchase right could become exercisable under the contract. The full text is available only in HS-G.", relationships: { A: 'CONTEXT', B: 'CONTEXT', C: 'CONTEXT', D: 'CONTEXT', E: 'CONTEXT', F: 'CONTEXT' }, weight: 0 },
  'TK-CLUE-CASH_USE': { id: 'TK-CLUE-CASH_USE', title: "Competing uses of capital", source: 'CH2-B - Final question', acquiredAtScreen: 5, status: 'CLUE', text: "Digital, fulfillment, and renovation all require capital; allocations affect different parts of the business.", relationships: { A: 'CONTEXT', B: 'SUPPORTS', C: 'CONTEXT', D: 'CONTEXT', E: 'CONTEXT', F: 'SUPPORTS' }, weight: 1 },
  'TK-CLUE-HOLIDAY': { id: 'TK-CLUE-HOLIDAY', title: "Holiday season", source: 'CH2-C - Final question', acquiredAtScreen: 5, status: 'CLUE', text: "Some stores could close, but deep cuts shrink the sales base; holiday performance will test liquidity resilience.", relationships: { A: 'CONTEXT', B: 'SUPPORTS', C: 'SUPPORTS', D: 'CONTEXT', E: 'CONTEXT', F: 'SUPPORTS' }, weight: 1 }
};

const QUESTIONS_1 = [
  { id: 'CH1-A', title: "Store traffic is falling while e-commerce grows. What are customers doing?", answer: "Most customers are switching channels; online margins are lower than store margins.", evidence: ['TK-CLUE-CHANNEL'] },
  { id: 'CH1-B', title: "Which capital program has been delayed the longest?", answer: "Store renovation has been deferred for three consecutive years in favor of omnichannel investment.", evidence: ['TK-CLUE-RENOVATION'] },
  { id: 'CH1-C', title: "What happens to liquidity if holiday sales miss by 10%?", answer: "Operating cash remains sufficient, but covenant headroom narrows considerably.", evidence: ['TK-CLUE-LIQUIDITY'] },
  { id: 'CH1-D', title: "Which debt matures first?", answer: "Some secured notes mature within 18 months. This is the nearest pressure. This answer does not confirm any governance clause.", evidence: ['TK-CLUE-MATURITY'] },
  { id: 'CH1-E', title: "Which category has better margins?", answer: "Traditional toys have better margins but are smaller than the weaker categories.", evidence: ['TK-CLUE-MIX'] },
  { id: 'CH1-F', title: "Is management aligned?", answer: "Not entirely. Michael has invited a lawyer specializing in transfers of control.", evidence: ['TK-CLUE-MANAGEMENT'] },
  { id: 'CH1-G', title: "Is there a special clause between Michael and an outside investor?", answer: "There are signs of a conditional arrangement that could affect family ownership, but the counterparty and exact terms can only be verified in HS-G.", evidence: ['TK-CLUE-HOUNDSTOOTH'] }
];

const QUESTIONS_2 = [
  { id: 'CH2-A', title: "Which expense is hardest to cut?", answer: "Some financial obligations can be refinanced but do not disappear; marketing also affects the sales base.", evidence: [] },
  { id: 'CH2-B', title: "How would additional capital be used?", answer: "Digital, fulfillment, and renovation are competing for capital.", evidence: ['TK-CLUE-CASH_USE'] },
  { id: 'CH2-C', title: "Why not close more stores?", answer: "Some should close, but cutting too deeply shrinks the sales base; holiday inventory must remain available.", evidence: ['TK-CLUE-HOLIDAY'] },
  { id: 'CH2-D', title: "Would the company be healthy if competitive pressure eased?", answer: "No. Debt, liquidity, and family disagreements would remain.", evidence: [] },
  { id: 'CH2-E', title: "Would the company be healthy if all debt disappeared?", answer: "No. The store network, competition, and control still need attention.", evidence: [] },
  { id: 'CH2-F', title: "What is your biggest concern over the next 12 months?", answer: "Liquidity and refinancing are the two pressures to monitor closely.", evidence: ['TK-CLUE-REFINANCE'] },
  { id: 'CH2-G', title: "Is there a contract condition we should clarify?", answer: (state) => state.selectedDossiers.includes('HS-G') ?"The opened file confirms measured EBITDA below $752.4m as the threshold. Trigger, exercise, and control are separate steps; check the designated tranche and authorized parties." : "There are signs of an EBITDA condition, but the full contract can only be verified in HS-G.", evidence: (state) => state.selectedDossiers.includes('HS-G') ? ['TK-CLUE-HOUNDSTOOTH-TRIGGER'] : ['TK-CLUE-HOUNDSTOOTH-TRIGGER'] }
];

const DIAGNOSES = [
  { id: 'A', title: 'Competitive / E-commerce Disease', desc: "Competitive pressure and channel switching are the central cause.", relationships: ['TK-A-SSS', 'TK-A-CHANNEL', 'TK-CLUE-CHANNEL', 'TK-FS-INCOME', 'TK-FS-METRICS'] },
  { id: 'B', title: 'Operating / Store Network Disease', desc: "The store network and operating investment are the main constraints.", relationships: ['TK-B-CAPEX', 'TK-CLUE-RENOVATION', 'TK-F-TRACK'] },
  { id: 'C', title: 'Liquidity Disease', desc: "Liquidity, seasonal inventory, and covenant headroom are the main constraints.", relationships: ['TK-C-CASH', 'TK-C-SEASON', 'TK-CLUE-LIQUIDITY', 'TK-FS-BALANCE'] },
  { id: 'D', title: 'Capital Structure / Financing Disease', desc: "Capital structure and refinancing ability are the central cause.", relationships: ['TK-D-LEVERAGE', 'TK-D-LBO', 'TK-CLUE-MATURITY', 'TK-CLUE-REFINANCE', 'TK-FS-INCOME', 'TK-FS-METRICS'] },
  { id: 'E', title: 'Product & Category Disease', desc: "The category mix and entertainment licensing cycle are the main constraints.", relationships: ['TK-E-MIX', 'TK-E-LICENSING', 'TK-CLUE-MIX'] },
  { id: 'F', title: 'Mixed Disease', desc: "Financial and operating factors interact to create a system of risks.", relationships: ['TK-A-SSS', 'TK-B-CAPEX', 'TK-C-CASH', 'TK-D-LEVERAGE', 'TK-D-LBO', 'TK-E-LICENSING', 'TK-F-TRACK', 'TK-FS-INCOME', 'TK-FS-BALANCE', 'TK-FS-METRICS'] }
];

const TREATMENTS = [
  { id: 'A', title: 'Invest to Compete', desc: "Direct capital toward digital, fulfillment, renovation, and the in-store experience.", effect: 'invest' },
  { id: 'B', title: 'Deep Cost Cutting', desc: "Cut SG&A, shrink the network, and preserve cash in the short term.", effect: 'cut' },
  { id: 'C', title: 'Debt Restructuring', desc: "Renegotiate maturities, interest rates, and payment priorities with creditors.", effect: 'debt' },
  { id: 'D', title: 'Asset Sale', desc: "Sell selected international assets and reallocate the proceeds.", effect: 'asset' },
  { id: 'E', title: 'Chapter 11', desc: "Enter the restructuring process assumed by this case.", effect: 'chapter11' },
  { id: 'F', title: 'Combined Restructuring', desc: "Run operating, capital, and governance programs together.", effect: 'combined' }
];

const TIMINGS = [
  { id: 'A', title: "Act now", desc: "Start the plan using the available holiday data." },
  { id: 'B', title: "After the holiday season", desc: "Wait for peak-season results before announcing the plan." },
  { id: 'C', title: "Try refinancing first", desc: "Test refinancing options before choosing the next step." },
  { id: 'D', title: "Wait six months", desc: "Allow more time to observe the operating initiatives." }
];

const PRIORITIES = [
  { id: 'Suppliers', title: 'Suppliers', desc: "Negotiate terms before announcing the plan." },
  { id: 'Employees', title: 'Employees', desc: "Reassure staff and retain key employees." },
  { id: 'Customers', title: 'Customers', desc: "Maintain shoppers' confidence through the transition." },
  { id: 'Creditors', title: 'Creditors', desc: "Negotiate debt terms early." },
  { id: 'Landlords', title: 'Landlords', desc: "Maintain relationships with property landlords." },
  { id: 'Holiday Inventory', title: 'Holiday Inventory', desc: "Secure inventory for the peak season." },
  { id: 'Governance & Family', title: 'Governance & Family', desc: "Inform the family leadership team and maintain stability." }
];

const REASSESS_MODES = [
  { id: 'KEEP', title: "Keep both", desc: "Keep the diagnosis and treatment already in effect." },
  { id: 'DIAGNOSIS', title: "Change diagnosis", desc: "Update the problem interpretation based on new facts." },
  { id: 'TREATMENT', title: "Change treatment", desc: "Switch to a treatment plan for the next period." },
  { id: 'BOTH', title: "Change both", desc: "Update both the diagnosis and treatment for the next period." }
];

function makeInitialState() {
  return {
    caseId: CANONICAL_CASE_ID, caseIdentity: 'toy-kingdom-anderson', schemaVersion: SCHEMA_VERSION,
    contentVersion: CONTENT_VERSION, scoringVersion: SCORING_VERSION, simulationVersion: SIMULATION_VERSION,
    status: 'IN_PROGRESS', currentScreen: 0, confirmedScreens: [], transitionIds: [], completedStoryScenes: [], answeredQuestions: [], selectedDossiers: [], selectedQuestions1: [], selectedQuestion2: null,
    draftSelection: { dossiers: [], questions1: [], question2: null, diagnosis: null, diagnosisEvidenceIds: [], treatment: null, timing: null, priorities: [], reassessmentMode: null, reassessmentDiagnosis: null, reassessmentTreatment: null, reassessmentEvidenceIds: [] },
    decisionHistory: [], evidenceLedger: Object.fromEntries(Object.keys(EVIDENCE).map((id) => [id, { status: 'LOCKED', provenance: [] }])),
    eventLedger: [], eventEvidence: {}, eventCursor: 0, eventSequence: [],
    reputation: 50, proposedTreatment: null, approvedTreatment: null, implementedTreatment: null, approvalReputationSnapshot: null,
    timing: null, priorities: [], financialState: { cash: 566, debt: 4800, ebitda: 792, operationalContinuity: 70, shortTermLiquidity: 50, longTermFinancialHealth: 50, refinancingStatus: 'NOT_TESTED', executionSuccess: null, newRisks: [] },
    governanceState: { score: 50, disclosure: false, boardPreparation: false, familyEvents: [], houndstoothHandled: false },
    familyState: { ownership: { anderson: 78, fund: 22 }, controlLost: false },
    houndstoothState: { referenceEbitda: 792, measuredEbitda: 792, measurementPeriod: 'Period 1 FY2026 simulation', triggerThreshold: 752.4, optionHolder: 'Houndstooth Capital', consentingSignatory: 'Michael Anderson', designatedTranchePct: 12, triggerStatus: false, exercisedStatus: false, controlLost: false, agreementVoided: false },
    assumptions: [], invalidatedAssumptions: [], invalidatedAssumptionIds: [],
    structured: { sourceChecks: { verified: [], provisional: [], uncertain: [], irreversible: '' }, diagnosisSummary: null, initialBriefing: null, reviewBriefing: null, riskPlan: null, authority: null, approvalAck: null, primaryConstraint: null, causalSummary: null, reassessmentReason: null },
    clientState: { understanding: 50, agency: 50, trust: 50, incidents: [] },
    reassessment: { mode: null, evidenceIds: [], applied: false, changedDiagnosis: false, changedTreatment: false, costApplied: 0, observationIds: [], assumptionStatus: null, reason: null, monitorMetric: null, threshold: null, reviewAt: null },
    finalOutcome: null, finalFeedback: null
  };
}

function isValidState(candidate) {
  const draft = candidate?.draftSelection;
  const financial = candidate?.financialState;
  const houndstooth = candidate?.houndstoothState;
  return Boolean(candidate && candidate.caseId === CANONICAL_CASE_ID && candidate.caseIdentity === 'toy-kingdom-anderson' && Number(candidate.schemaVersion) === SCHEMA_VERSION && typeof candidate.currentScreen === 'number' && draft && Array.isArray(draft.dossiers) && Array.isArray(draft.questions1) && Array.isArray(draft.priorities) && Array.isArray(draft.diagnosisEvidenceIds) && Array.isArray(draft.reassessmentEvidenceIds) && candidate.evidenceLedger && Array.isArray(candidate.confirmedScreens) && Array.isArray(candidate.eventLedger) && financial && Number.isFinite(financial.cash) && Number.isFinite(financial.debt) && Number.isFinite(financial.ebitda) && Array.isArray(financial.newRisks) && candidate.governanceState && candidate.familyState && houndstooth && Number.isFinite(houndstooth.triggerThreshold));
}

function storageKey() { return `${STORAGE_PREFIX}${CANONICAL_CASE_ID}-v${SCHEMA_VERSION}`; }
function localizeSavedNarrative(saved) {
  if (saved.contentVersion === CONTENT_VERSION) return saved;
  saved.answeredQuestions = (saved.answeredQuestions || []).map((entry) => {
    const question = getQuestion1(entry.id) || getQuestion2(entry.id);
    return question ? { ...entry, answer: typeof question.answer === 'function' ? question.answer(saved) : question.answer } : entry;
  });
  if (saved.eventSequence?.length && saved.currentScreen >= 10 && saved.currentScreen < 12) {
    const translatedEvents = buildEventSequence(saved);
    saved.eventSequence = translatedEvents;
    saved.eventLedger = saved.eventLedger.map((entry) => {
      const index = Number(String(entry.id).match(/^period1-(\d+)$/)?.[1]);
      if (entry.id === 'period2-treatment') return { ...entry, title: 'Re-evaluation implementation', text: `Next-period treatment ${saved.finalImplementedTreatment} begins from the remaining Period 1 state.` };
      return Number.isInteger(index) && translatedEvents[index] ? { ...entry, title: translatedEvents[index].title, text: translatedEvents[index].text } : entry;
    });
    const eventIds = ['TK-EVENT-SALES', 'TK-EVENT-VENDOR', 'TK-EVENT-LIQUIDITY', 'TK-EVENT-STORE', 'TK-EVENT-DIGITAL', 'TK-EVENT-DEBT', 'TK-EVENT-BOARD'];
    eventIds.forEach((id, index) => {
      if (saved.eventEvidence?.[id] && translatedEvents[index]) {
        saved.eventEvidence[id].title = translatedEvents[index].title;
        saved.eventEvidence[id].source = `Screen 10 · ${translatedEvents[index].title}`;
        saved.eventEvidence[id].text = translatedEvents[index].text;
      }
    });
  }
  Object.values(saved.evidenceLedger || {}).forEach((entry) => {
    entry.provenance = (entry.provenance || []).map((source) => source === 'Màn 10' ? 'Screen 10' : source === 'BCTC Màn 4' ? 'Screen 4 financial statements' : source);
  });
  saved.assumptions = (saved.assumptions || []).map((assumption) => {
    if (assumption === `${saved.implementedTreatment} thực thi trong Period 1`) return `Treatment ${saved.implementedTreatment} implemented in Period 1`;
    if (assumption === `${saved.proposedTreatment} được đề xuất; chờ phê duyệt và điều kiện thực thi`) return `Treatment ${saved.proposedTreatment} proposed; awaiting approval and implementation conditions`;
    return assumption;
  });
  saved.contentVersion = CONTENT_VERSION;
  return saved;
}
function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey()));
    if (isValidState(saved)) {
      if (!Array.isArray(saved.invalidatedAssumptionIds)) saved.invalidatedAssumptionIds = [...(saved.invalidatedAssumptions || [])];
      if (saved.currentScreen >= 12 && saved.status !== 'COMPLETED') saved.currentScreen = 11;
      return localizeSavedNarrative(saved);
    }
  } catch { /* corrupted save is reset safely */ }
  // The integrated build owns its save namespace. Legacy saves have no
  // verified field-by-field migration and must not be interpreted as this run.
  return makeInitialState();
}
function saveState() {
  try { localStorage.setItem(storageKey(), JSON.stringify(state)); } catch { /* gameplay remains usable without storage */ }
  const el = document.getElementById('saveStatus'); if (el) { el.innerHTML = '<i></i> Saved just now'; window.setTimeout(() => { el.innerHTML = '<i></i> Auto-saved'; }, 1800); }
}
function hasSave() { try { return isValidState(JSON.parse(localStorage.getItem(storageKey()))); } catch { return false; } }
function clearCaseSave() { try { localStorage.removeItem(storageKey()); } catch { /* no-op */ } }

function currentEvidence(state, id) {
  const item = state.eventEvidence?.[id] || EVIDENCE[id]; const ledger = state.evidenceLedger[id];
  return item ? { ...item, ...(ledger || {}) } : null;
}
function evidenceStatus(state, id) { return state.evidenceLedger[id]?.status || 'LOCKED'; }
function citableEvidence(state) { return [...new Set([...Object.keys(EVIDENCE), ...Object.keys(state.eventEvidence || {})])].filter((id) => ['DISCOVERED', 'VERIFIED'].includes(evidenceStatus(state, id))); }
function revealEvidence(state, ids, status = 'DISCOVERED', provenance = 'case') {
  (ids || []).forEach((id) => {
    if (!EVIDENCE[id] || !state.evidenceLedger[id]) return;
    const entry = state.evidenceLedger[id];
    const rank = { LOCKED: 0, CLUE: 1, DISCOVERED: 2, VERIFIED: 3, DISPROVED: 4 };
    // Evidence status is monotonic. A disproved fact stays disproved unless
    // a future replacement-contract mechanic is added explicitly.
    if (entry.status === 'DISPROVED' && status !== 'DISPROVED') return;
    if (rank[status] < rank[entry.status]) return;
    entry.status = status;
    if (!entry.provenance.includes(provenance)) entry.provenance.push(provenance);
  });
}
function hasDossier(state, id) { return state.draftSelection.dossiers.includes(id); }
function getDiagnosis(id) { return DIAGNOSES.find((x) => x.id === id); }
function getTreatment(id) { return TREATMENTS.find((x) => x.id === id); }
function getTiming(id) { return TIMINGS.find((x) => x.id === id); }
function getQuestion1(id) { return QUESTIONS_1.find((x) => x.id === id); }
function getQuestion2(id) { return QUESTIONS_2.find((x) => x.id === id); }
function reputationTier(value) { return value < 40 ? 'LOW' : value < 70 ? 'MEDIUM' : 'HIGH'; }
function reputationLabel(value) { return ({ LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High' })[reputationTier(value)]; }
function addReputation(state, delta) { state.reputation = clamp(state.reputation + delta); }
function resolveTreatmentApproval(proposedTreatment, reputation) {
  const tier = reputationTier(reputation); const downgrade = (proposedTreatment === 'A' && tier === 'LOW') || (proposedTreatment === 'F' && tier !== 'HIGH');
  return { proposedTreatment, approvedTreatment: downgrade ? 'B' : proposedTreatment, implementedTreatment: downgrade ? 'B' : proposedTreatment, reputationSnapshot: reputation, downgrade };
}

function relationshipFor(state, diagnosisId, evidenceId) {
  const e = state.eventEvidence?.[evidenceId] || EVIDENCE[evidenceId]; return e?.relationships?.[diagnosisId] || 'UNRELATED';
}
function distinctEvidenceIds(ids) {
  const seen = new Set();
  return (ids || []).filter((id) => {
    const key = (state.eventEvidence?.[id] || EVIDENCE[id])?.factKey || id;
    if (seen.has(key)) return false;
    seen.add(key); return true;
  });
}
function validateEvidenceSelection(state, ids, diagnosisId, allowEmpty = false) {
  const list = Array.isArray(ids) ? ids : [];
  if (new Set(list).size !== list.length) return 'Evidence cannot be cited twice.';
  if (list.length > 3) return 'You can cite up to three pieces of evidence.';
  if (list.some((id) => !(EVIDENCE[id] || state.eventEvidence?.[id]) || !citableEvidence(state).includes(id))) return 'You can cite only opened evidence with an eligible verification status.';
  if (!allowEmpty && list.length === 0 && citableEvidence(state).length > 0) return 'Select at least one piece of evidence.';
  return '';
}
function validateScreen(state) {
  const d = state.draftSelection;
  if (state.currentScreen === 2 && (d.dossiers.length !== 3 || d.dossiers.some((id) => !DOSSIERS[id]))) return 'Select exactly three files.';
  if (state.currentScreen === 3 && (d.questions1.length !== 2 || d.questions1.some((id) => !getQuestion1(id)))) return 'Select exactly two questions.';
  if (state.currentScreen === 5 && (!d.question2 || !getQuestion2(d.question2))) return 'Select one question.';
  if (state.currentScreen === 6) {
    if (!d.diagnosis || !getDiagnosis(d.diagnosis)) return 'Select a diagnosis.';
    const evidenceError = validateEvidenceSelection(state, d.diagnosisEvidenceIds, d.diagnosis, false);
    if (evidenceError) return evidenceError;
    if (!state.structured.primaryConstraint || !state.structured.causalSummary || !state.structured.sourceChecks.mode) return 'Complete the primary constraint, causal explanation, and source check.';
  }
  if (state.currentScreen === 7 && (!d.treatment || !getTreatment(d.treatment))) return 'Select a treatment plan.';
  if (state.currentScreen === 8 && (!d.timing || !getTiming(d.timing))) return 'Select when to act.';
  if (state.currentScreen === 9) {
    if (d.priorities.length !== 3 || d.priorities.some((id) => !PRIORITIES.some((p) => p.id === id))) return 'Select exactly three priority groups.';
    const b = state.structured.initialBriefing; const r = state.structured.riskPlan;
    if (!b?.message || !b.concern || !b.checkBack || !b.disclosure || !r?.risk || !r.mitigation) return 'Complete client communication, disclosure, and the risk plan.';
    const downgrade = (state.proposedTreatment === 'A' && reputationTier(state.reputation) === 'LOW') || (state.proposedTreatment === 'F' && reputationTier(state.reputation) !== 'HIGH');
    if (downgrade && state.structured.approvalAck !== 'accept-fallback') return 'Acknowledge the fallback plan after the approval response.';
  }
  if (state.currentScreen === 11) {
    if (!d.reassessmentMode) return 'Select a re-evaluation option.';
    const mode = d.reassessmentMode;
    if (['DIAGNOSIS', 'BOTH'].includes(mode) && (!d.reassessmentDiagnosis || !getDiagnosis(d.reassessmentDiagnosis))) return 'Select a new diagnosis.';
    if (['TREATMENT', 'BOTH'].includes(mode) && (!d.reassessmentTreatment || !getTreatment(d.reassessmentTreatment))) return 'Select a new treatment.';
    if (['DIAGNOSIS', 'BOTH'].includes(mode)) { const error = validateEvidenceSelection(state, d.reassessmentEvidenceIds, d.reassessmentDiagnosis, false); if (error) return error; }
    if (!state.structured.reassessmentReason || !state.reassessment.monitorMetric) return 'Complete the re-evaluation reason and monitoring metric.';
  }
  return '';
}

function applyDiagnosisReasoning(state, diagnosisId, ids) {
  const countedIds = distinctEvidenceIds(ids);
  const relationships = countedIds.map((id) => relationshipFor(state, diagnosisId, id));
  const support = relationships.filter((r) => r === 'SUPPORTS').length;
  const contradiction = relationships.filter((r) => r === 'CONTRADICTS').length;
  const unrelated = relationships.filter((r) => r === 'UNRELATED').length;
  const context = relationships.filter((r) => r === 'CONTEXT').length;
  const diagnosis = getDiagnosis(diagnosisId);
  const mixedEligible = hasDossier(state, 'HS-D') && ['HS-A', 'HS-B', 'HS-E', 'HS-F'].some((id) => hasDossier(state, id));
  const evidenceIds = countedIds;
  let delta = support * 4 - contradiction * 6 - unrelated * 2 + Math.min(2, context);
  if (diagnosisId === 'F' && !mixedEligible) delta -= 5;
  if (!countedIds.length) delta -= 8;
  if (support === 0 && countedIds.length) delta -= 5;
  if (diagnosisId === 'F' && mixedEligible && support >= 2) delta += 3;
  addReputation(state, delta);
  state.planReasoning = { diagnosisId, support, contradiction, unrelated, context, mixedEligible, evidenceIds, selectedEvidenceIds: [...ids] };
}

function resolveRefinancing(input) {
  const state = input;
  const leverage = state.financialState.debt / Math.max(1, state.financialState.ebitda);
  const hasDebtEvidence = citableEvidence(state).some((id) => ['TK-D-LEVERAGE', 'TK-D-LBO', 'TK-CLUE-MATURITY', 'TK-CLUE-REFINANCE'].includes(id));
  const credibility = state.reputation >= 60;
  const score = (state.timing === 'C' ? 1 : 0) + (hasDebtEvidence ? 1 : 0) + (credibility ? 1 : 0) + (leverage < 5.8 ? 1 : 0);
  return { success: score >= 3, score, leverage, reason: score >= 3 ? 'The available records and repayment capacity support further negotiations.' : 'Current leverage and records do not provide a strong enough position to refinance.' };
}

function applyTreatmentExecution(state) {
  const proposed = getTreatment(state.implementedTreatment || state.approvedTreatment || state.proposedTreatment);
  const f = state.financialState;
  if (!proposed) return;
  const prepared = state.priorities;
  const has = (key) => prepared.includes(key);
  const execution = {
    invest: has('Customers') && has('Holiday Inventory') && has('Employees'),
    cut: true,
    debt: has('Creditors'),
    asset: has('Customers') || has('Governance & Family'),
    chapter11: has('Suppliers') && has('Creditors'),
    combined: has('Creditors') && has('Suppliers') && has('Governance & Family')
  }[proposed.effect];
  f.executionSuccess = Boolean(execution);
  if (proposed.effect === 'invest') { f.cash -= execution ? 180 : 260; f.ebitda += execution ? 34 : 5; f.operationalContinuity += execution ? 18 : 2; f.shortTermLiquidity -= 10; f.longTermFinancialHealth += execution ? 18 : 5; }
  if (proposed.effect === 'cut') { f.cash += 190; f.ebitda -= 46; f.operationalContinuity -= 18; f.shortTermLiquidity += 22; f.longTermFinancialHealth -= 16; }
  if (proposed.effect === 'debt') { f.debt -= execution ? 620 : 120; f.cash += execution ? 90 : 15; f.shortTermLiquidity += execution ? 12 : 2; f.longTermFinancialHealth += execution ? 15 : 3; }
  if (proposed.effect === 'asset') { f.cash += execution ? 620 : 420; f.ebitda -= execution ? 88 : 65; f.operationalContinuity -= execution ? 10 : 15; f.shortTermLiquidity += 27; f.longTermFinancialHealth -= 6; }
  if (proposed.effect === 'chapter11') { f.debt -= execution ? 1750 : 900; f.cash -= execution ? 130 : 240; f.operationalContinuity += execution ? 4 : -18; f.shortTermLiquidity += execution ? 8 : -10; f.longTermFinancialHealth += execution ? 16 : -6; }
  if (proposed.effect === 'combined') { f.cash += execution ? 120 : -160; f.debt -= execution ? 850 : 260; f.ebitda += execution ? 26 : -22; f.operationalContinuity += execution ? 16 : -12; f.shortTermLiquidity += execution ? 15 : -8; f.longTermFinancialHealth += execution ? 21 : -12; }
  if (!has('Holiday Inventory')) f.newRisks.push('HOLIDAY_SHORTFALL');
  if (!has('Governance & Family')) f.newRisks.push('FAMILY_ESCALATION');
  if (state.timing === 'D') { f.cash -= 260; f.shortTermLiquidity -= 18; f.newRisks.push('RUNWAY_DELAY'); }
  if (state.timing === 'B') { f.cash -= 80; f.shortTermLiquidity -= 8; }
  if (state.timing === 'C') { f.refinancingStatus = resolveRefinancing(state).success ? 'SUCCESS' : 'FAILED'; if (f.refinancingStatus === 'SUCCESS') { f.debt -= 320; f.shortTermLiquidity += 14; } else { f.newRisks.push('REFINANCE_SIGNAL'); f.shortTermLiquidity -= 10; } }
  f.cash = Math.max(0, f.cash);
  f.operationalContinuity = clamp(f.operationalContinuity, 0, 100);
  f.shortTermLiquidity = clamp(f.shortTermLiquidity, 0, 100);
  f.longTermFinancialHealth = clamp(f.longTermFinancialHealth, 0, 100);
}

function applyPeriod2Treatment(state) {
  const treatment = getTreatment(state.finalImplementedTreatment); const f = state.financialState;
  if (!treatment || state.finalImplementedTreatment === state.implementedTreatment) return;
  const requirements = { invest: ['Customers', 'Holiday Inventory', 'Employees'], cut: [], debt: ['Creditors'], asset: [], chapter11: ['Suppliers', 'Creditors'], combined: ['Creditors', 'Suppliers', 'Governance & Family'] }[treatment.effect] || [];
  const prepared = requirements.every((id) => state.priorities.includes(id));
  const before = { cash: f.cash, debt: f.debt, ebitda: f.ebitda, operationalContinuity: f.operationalContinuity, longTermFinancialHealth: f.longTermFinancialHealth };
  if (treatment.effect === 'invest') { f.cash -= prepared ? 80 : 130; f.ebitda += prepared ? 20 : 5; f.operationalContinuity += prepared ? 8 : 2; f.longTermFinancialHealth += prepared ? 8 : 2; }
  if (treatment.effect === 'cut') { f.cash += 100; f.ebitda -= 30; f.operationalContinuity -= 10; f.longTermFinancialHealth -= 10; }
  if (treatment.effect === 'debt') { f.debt -= prepared ? 300 : 50; f.longTermFinancialHealth += prepared ? 8 : 2; }
  if (treatment.effect === 'asset') { f.cash += 300; f.ebitda -= 45; f.operationalContinuity -= 8; f.longTermFinancialHealth -= 4; }
  if (treatment.effect === 'chapter11') { f.debt -= prepared ? 800 : 300; f.cash -= prepared ? 120 : 220; f.longTermFinancialHealth += prepared ? 10 : 0; }
  if (treatment.effect === 'combined') { f.cash += prepared ? 50 : -80; f.debt -= prepared ? 450 : 100; f.ebitda += prepared ? 16 : -10; f.operationalContinuity += prepared ? 8 : -8; f.longTermFinancialHealth += prepared ? 12 : -8; }
  f.cash = Math.max(0, f.cash); f.operationalContinuity = clamp(f.operationalContinuity); f.longTermFinancialHealth = clamp(f.longTermFinancialHealth);
  state.period2TreatmentState = { before, after: { cash: f.cash, debt: f.debt, ebitda: f.ebitda, operationalContinuity: f.operationalContinuity, longTermFinancialHealth: f.longTermFinancialHealth }, implementedTreatment: state.finalImplementedTreatment };
  state.houndstoothState.measurementPeriod = 'Period 2 post-reassessment';
  state.eventLedger.push({ id: 'period2-treatment', period: 'Period 2', title: 'Re-evaluation implementation', text: `Next-period treatment ${state.finalImplementedTreatment} begins from the remaining Period 1 state.`, screen: 11 });
}

function buildEventSequence(state) {
  const f = state.financialState; const t = getTreatment(state.implementedTreatment); const has = (key) => state.priorities.includes(key);
  const updates = [
    { title: 'Sales Update', text: has('Customers') ? 'Customer communication maintains shopping activity during the transition.' : 'Some customers move to competitors because they are concerned about the restructuring plan.', evidence: ['TK-EVENT-SALES'] },
    { title: 'Vendor Update', text: has('Suppliers') ? 'Suppliers maintain current terms after being informed of the plan.' : 'Some suppliers demand shorter payment terms.', evidence: ['TK-EVENT-VENDOR'] },
    { title: 'Liquidity Update', text: `Simulated cash after implementation is $${money(f.cash)}m; short-term liquidity has ${f.shortTermLiquidity >= 60 ? 'room to maneuver' : f.shortTermLiquidity >= 35 ? 'limited headroom' : 'very little headroom'}.`, evidence: ['TK-EVENT-LIQUIDITY'] },
    { title: 'Store Update', text: t?.effect === 'invest' || t?.effect === 'combined' ? 'Some renovation and fulfillment projects begin with the allocated capital.' : 'Renovation remains deferred during the simulated period.', evidence: ['TK-EVENT-STORE'] },
    { title: 'Digital Update', text: t?.effect === 'cut' ? 'Digital sales keep growing but do not offset declining store traffic.' : 'E-commerce continues to grow, though margins remain lower than in stores.', evidence: ['TK-EVENT-DIGITAL'] },
    { title: 'Debt Update', text: f.refinancingStatus === 'SUCCESS' ? 'A group of creditors agrees to extensions under the negotiated terms.' : 'Debt terms and capital costs have not improved enough to create new headroom.', evidence: ['TK-EVENT-DEBT'] },
    { title: 'Family / Board Update', text: has('Governance & Family') ? 'David has more time to present his plan to family shareholders; Michael and Richard still demand oversight.' : 'Michael and Richard meet privately and prepare to vote against the plan.', evidence: ['TK-EVENT-BOARD'] }
  ];
  return updates;
}

function updateHoundstooth(state) {
  const h = state.houndstoothState; h.measuredEbitda = Number(state.financialState.ebitda.toFixed(2));
  if (h.agreementVoided) { h.triggerStatus = false; h.exercisedStatus = false; h.controlLost = false; state.familyState.controlLost = false; return; }
  // The contractual right exists in the case whether or not the player
  // opened HS-G. Access control limits what the player knows; it does not
  // make the underlying EBITDA trigger disappear.
  h.triggerStatus = h.measuredEbitda < h.triggerThreshold;
  if (h.triggerStatus && !state.priorities.includes('Governance & Family') && !state.financialState.newRisks.includes('HOUNDSTOOTH_PRESSURE')) {
    // A triggered contractual right creates an immediate financing/stakeholder
    // shock in the simulation; it is a financial state event, not a score bonus.
    state.financialState.cash = Math.max(0, state.financialState.cash - 300);
    state.financialState.ebitda -= 35;
    state.financialState.operationalContinuity -= 18;
    state.financialState.shortTermLiquidity -= 15;
    state.financialState.newRisks.push('HOUNDSTOOTH_PRESSURE');
  }
  h.exercisedStatus = Boolean(h.triggerStatus && !state.priorities.includes('Governance & Family'));
  h.controlLost = Boolean(h.exercisedStatus && state.financialState.operationalContinuity < 45);
  state.familyState.controlLost = h.controlLost;
}

function addEventEvidence(state, event) {
  const map = {
    'TK-EVENT-SALES': { title: 'Sales developments', source: 'Screen 10 · Sales Update', text: event.text, relationships: { A: 'SUPPORTS', B: 'CONTEXT', C: 'CONTEXT', D: 'CONTEXT', E: 'CONTEXT', F: 'SUPPORTS' }, weight: 1 },
    'TK-EVENT-VENDOR': { title: 'Supplier developments', source: 'Screen 10 · Vendor Update', text: event.text, relationships: { A: 'CONTEXT', B: 'SUPPORTS', C: 'SUPPORTS', D: 'CONTEXT', E: 'CONTEXT', F: 'SUPPORTS' }, weight: 1 },
    'TK-EVENT-LIQUIDITY': { title: 'Liquidity developments', source: 'Screen 10 · Liquidity Update', text: event.text, relationships: { A: 'CONTEXT', B: 'CONTEXT', C: 'SUPPORTS', D: 'SUPPORTS', E: 'CONTEXT', F: 'SUPPORTS' }, weight: 1 },
    'TK-EVENT-STORE': { title: 'Store developments', source: 'Screen 10 · Store Update', text: event.text, relationships: { A: 'CONTEXT', B: 'SUPPORTS', C: 'CONTEXT', D: 'CONTEXT', E: 'CONTEXT', F: 'SUPPORTS' }, weight: 1 },
    'TK-EVENT-DIGITAL': { title: 'Digital developments', source: 'Screen 10 · Digital Update', text: event.text, relationships: { A: 'SUPPORTS', B: 'CONTEXT', C: 'CONTEXT', D: 'CONTEXT', E: 'CONTEXT', F: 'SUPPORTS' }, weight: 1 },
    'TK-EVENT-DEBT': { title: 'Debt developments', source: 'Screen 10 · Debt Update', text: event.text, relationships: { A: 'CONTEXT', B: 'CONTEXT', C: 'SUPPORTS', D: 'SUPPORTS', E: 'CONTEXT', F: 'SUPPORTS' }, weight: 1 },
    'TK-EVENT-BOARD': { title: 'Board developments', source: 'Screen 10 · Family / Board Update', text: event.text, relationships: { A: 'CONTEXT', B: 'CONTEXT', C: 'CONTEXT', D: 'CONTEXT', E: 'CONTEXT', F: 'SUPPORTS' }, weight: 1 }
  };
  (event.evidence || []).forEach((id) => {
    if (map[id]) state.eventEvidence[id] = { id, acquiredAtScreen: 10, status: 'DISCOVERED', ...map[id] };
    // Event evidence is created after the initial ledger snapshot. Add its
    // ledger entry before revealing it so it becomes citable in M11.
    if (state.eventEvidence[id] && !state.evidenceLedger[id]) state.evidenceLedger[id] = { status: 'LOCKED', provenance: [] };
    revealEvidence(state, [id], 'DISCOVERED', 'Screen 10');
  });
}

function applyScreen(state) {
  const screen = state.currentScreen; const d = state.draftSelection;
  if (screen === 0 || screen === 1) return;
  if (screen === 2) {
    state.selectedDossiers = [...d.dossiers];
    d.dossiers.forEach((id) => { const dossier = DOSSIERS[id]; revealEvidence(state, dossier.evidenceIds, id === 'HS-G' ? 'VERIFIED' : 'DISCOVERED', id); addReputation(state, dossier.reputation - 2); });
    // Opening HS-G grants knowledge; disclosure is a later player action.
  }
  if (screen === 3) {
    state.selectedQuestions1 = [...d.questions1];
    state.answeredQuestions = d.questions1.map((id) => { const q = getQuestion1(id); return { id, answer: q.answer }; });
    d.questions1.forEach((id) => { const q = getQuestion1(id); revealEvidence(state, q.evidence, 'CLUE', id); });
    addReputation(state, d.questions1.includes('CH1-F') ? -2 : 2);
  }
  if (screen === 4) {
    revealEvidence(state, ['TK-FS-INCOME', 'TK-FS-BALANCE', 'TK-FS-METRICS'], 'VERIFIED', 'Screen 4 financial statements');
  }
  if (screen === 5) {
    const q = getQuestion2(d.question2); state.selectedQuestion2 = d.question2;
    state.answeredQuestions = [...state.answeredQuestions, { id: d.question2, answer: typeof q.answer === 'function' ? q.answer(state) : q.answer }];
    revealEvidence(state, typeof q.evidence === 'function' ? q.evidence(state) : q.evidence, d.question2 === 'CH2-G' && hasDossier(state, 'HS-G') ? 'VERIFIED' : 'CLUE', d.question2);
    addReputation(state, ['CH2-F', 'CH2-G'].includes(d.question2) ? 2 : 0);
  }
  if (screen === 6) {
    state.initialDiagnosis = d.diagnosis; state.initialDiagnosisEvidenceIds = [...d.diagnosisEvidenceIds];
    applyDiagnosisReasoning(state, d.diagnosis, d.diagnosisEvidenceIds);
  }
  if (screen === 7) {
    // Drafting a treatment never changes financial state. Approval is deferred
    // until timing, preparation and the briefing have been committed.
    state.proposedTreatment = d.treatment;
    state.treatmentApproval = { proposedTreatment: d.treatment, approvedTreatment: null, implementedTreatment: null, approvalReputationSnapshot: null, status: 'PENDING' };
    state.assumptions = [`Treatment ${d.treatment} proposed; awaiting approval and implementation conditions`];
  }
  if (screen === 8) {
    state.timing = d.timing;
    if (d.timing === 'C') { const result = resolveRefinancing(state); state.financialState.refinancingStatus = result.success ? 'SUCCESS' : 'FAILED'; state.refinancingResult = result; }
  }
  if (screen === 9) {
    const b = state.structured.initialBriefing || {};
    const communicationQuality = (b.message === 'explain' ? 2 : b.message === 'jargon' ? 1 : 0) + (b.concern === 'ack' ? 2 : b.concern === 'defer' ? 1 : 0) + (b.checkBack === 'teach' ? 2 : b.checkBack === 'check' ? 1 : 0) + (b.disclosure === 'verified' ? 2 : b.disclosure === 'uncertain' ? 1 : 0);
    const clientResponse = communicationQuality >= 7 && b.disclosure === 'verified' ? 'agree' : communicationQuality >= 5 && b.disclosure !== 'omit' ? 'conditional' : 'decline';
    state.clientState.consent = clientResponse;
    b.clientResponse = clientResponse;
    state.priorities = [...d.priorities];
    state.governanceState.disclosure = ['verified', 'uncertain'].includes(state.structured.initialBriefing?.disclosure);
    state.approvalReputationSnapshot = state.reputation;
    const approval = resolveTreatmentApproval(state.proposedTreatment, state.approvalReputationSnapshot);
    state.approvedTreatment = approval.approvedTreatment;
    state.implementedTreatment = approval.implementedTreatment;
    state.treatmentApproval = { ...approval, approvalReputationSnapshot: state.approvalReputationSnapshot, status: 'APPROVED' };
    state.assumptions = [`Treatment ${state.implementedTreatment} implemented in Period 1`];
    applyTreatmentExecution(state);
    updateHoundstooth(state);
    if (state.implementedTreatment === 'E' && !state.houndstoothState.triggerStatus) state.houndstoothState.agreementVoided = true;
    state.governanceState.boardPreparation = state.priorities.includes('Governance & Family');
    // Events are generated only after all financial and governance effects have
    // settled, so the timeline always describes the resolved state.
    state.eventSequence = buildEventSequence(state); state.eventCursor = 0;
  }
  if (screen === 10) {
    const event = state.eventSequence[state.eventCursor];
    if (event && !state.eventLedger.some((x) => x.id === `period1-${state.eventCursor}`)) {
      state.eventLedger.push({ id: `period1-${state.eventCursor}`, period: 'Period 1', title: event.title, text: event.text, screen: 10 }); addEventEvidence(state, event);
    }
    if (state.eventCursor < state.eventSequence.length - 1) { state.eventCursor += 1; return; }
    state.currentScreen = 11; return;
  }
  if (screen === 11) {
    const mode = d.reassessmentMode; state.reassessment = { ...state.reassessment, mode, evidenceIds: [...d.reassessmentEvidenceIds], applied: true, changedDiagnosis: ['DIAGNOSIS', 'BOTH'].includes(mode), changedTreatment: ['TREATMENT', 'BOTH'].includes(mode), costApplied: 0, reason: state.structured.reassessmentReason, monitorMetric: state.reassessment.monitorMetric };
    const reassessRelationships = d.reassessmentEvidenceIds.map((id) => relationshipFor(state, d.reassessmentDiagnosis || state.initialDiagnosis, id));
    const hasNewBasis = d.reassessmentEvidenceIds.some((id) => ['Screen 10', '\u004d\u00e0n 10'].some((source) => state.evidenceLedger[id]?.provenance.includes(source)) && (reassessRelationships.includes('CONTRADICTS') || id === 'TK-EVENT-LIQUIDITY' || id === 'TK-EVENT-DEBT'));
    if (mode !== 'KEEP' && !hasNewBasis && state.structured.reassessmentReason !== 'uncertain') { addReputation(state, -5); state.reassessment.costApplied = 5; }
    if (mode !== 'KEEP' && hasNewBasis) {
      state.reassessment.costApplied = 0;
      state.invalidatedAssumptions = [...state.assumptions];
      state.invalidatedAssumptionIds = [...state.assumptions];
      state.reassessment.assumptionStatus = 'INVALIDATED';
    }
    if (['DIAGNOSIS', 'BOTH'].includes(mode)) { state.finalDiagnosis = d.reassessmentDiagnosis; state.finalDiagnosisEvidenceIds = [...d.reassessmentEvidenceIds]; }
    else { state.finalDiagnosis = state.initialDiagnosis; state.finalDiagnosisEvidenceIds = [...state.initialDiagnosisEvidenceIds]; }
    if (['TREATMENT', 'BOTH'].includes(mode)) {
      state.finalProposedTreatment = d.reassessmentTreatment;
      state.reassessment.approvalReputationSnapshot = state.reputation;
      const reassessTier = reputationTier(state.reassessment.approvalReputationSnapshot);
      state.finalImplementedTreatment = (d.reassessmentTreatment === 'A' && reassessTier === 'LOW') || (d.reassessmentTreatment === 'F' && reassessTier !== 'HIGH') ? 'B' : d.reassessmentTreatment;
      state.reassessment.treatmentApproval = { proposedTreatment: d.reassessmentTreatment, approvedTreatment: state.finalImplementedTreatment, implementedTreatment: state.finalImplementedTreatment, approvalReputationSnapshot: state.reassessment.approvalReputationSnapshot };
    } else { state.finalProposedTreatment = state.proposedTreatment; state.finalImplementedTreatment = state.implementedTreatment; }
    applyPeriod2Treatment(state);
    state.governanceState.houndstoothHandled = state.priorities.includes('Governance & Family') && ['verified', 'uncertain'].includes(state.structured.initialBriefing?.disclosure);
    state.currentScreen = 12;
    finalize(state);
  }
}

function calculateFinancialOutcome(state) {
  const f = state.financialState;
  const liquidity = clamp((f.cash / 1000) * 45 + f.shortTermLiquidity * .55);
  const debtLoad = clamp(100 - (f.debt / 55));
  const continuity = f.operationalContinuity;
  const ebitda = clamp((f.ebitda / 850) * 100);
  const execution = f.executionSuccess === true ? 100 : f.executionSuccess === false ? 20 : 50;
  const longTermHealth = clamp(f.longTermFinancialHealth);
  const refinancing = f.refinancingStatus === 'SUCCESS' ? 100 : f.refinancingStatus === 'FAILED' ? 25 : 50;
  const riskPenalty = Math.min(6, (f.newRisks || []).length * .5);
  // Most weight remains on the live operating state; long-term health,
  // refinancing and newly created risks prevent short-term cash from
  // masquerading as a complete recovery.
  const score = liquidity * .3 + debtLoad * .2 + continuity * .2 + ebitda * .15 + execution * .15 + (longTermHealth - 50) * .05 + (refinancing - 50) * .03 - riskPenalty;
  // The upper tier leaves room for a high-liquidity, high-control-cost path:
  // strong cash generation can coexist with a separate governance control loss.
  const tier = score >= 63 ? 'STRONG_SURVIVAL' : score >= 43 ? 'FRAGILE_SURVIVAL' : 'FINANCIAL_COLLAPSE';
  return { tier, score: Math.round(score), metrics: { liquidity: Math.round(liquidity), debtLoad: Math.round(debtLoad), continuity: Math.round(continuity), ebitda: Math.round(ebitda), execution: Math.round(execution), longTermHealth: Math.round(longTermHealth), refinancing: Math.round(refinancing), riskPenalty } };
}
function calculateGovernanceOutcome(state) {
  const g = state.governanceState; let score = 45;
  if (hasDossier(state, 'HS-G')) score += 15;
  if (state.priorities.includes('Governance & Family')) score += 25; else score -= 16;
  if (state.reassessment.changedDiagnosis || state.reassessment.changedTreatment) score -= state.reassessment.costApplied;
  if (state.houndstoothState.triggerStatus && !g.houndstoothHandled) score -= 30;
  if (state.houndstoothState.controlLost) return { tier: 'CONTROL_LOST', score: 10 };
  if (score >= 65) return { tier: 'FAMILY_ALIGNED', score: Math.round(score) };
  // Low preparation fractures the family, but it does not by itself prove
  // that control has transferred. CONTROL_LOST is reserved for the explicit
  // Houndstooth exercise/control transition above.
  return { tier: 'FAMILY_FRACTURED', score: Math.round(score) };
}
function investigationScore(state) {
  const ids = distinctEvidenceIds(Object.keys(state.evidenceLedger).filter((id) => ['DISCOVERED', 'VERIFIED'].includes(evidenceStatus(state, id))));
  const domain = { financing: new Set(), operations: new Set(), liquidity: new Set(), governance: new Set() };
  ids.forEach((id) => { if (/D-|FS-(INCOME|METRICS|FUNDING)|MATURITY|REFINANCE|EVENT-DEBT/.test(id)) domain.financing.add(id); if (/A-|B-|E-|F-|FS-INCOME|FS-METRICS|EVENT-(SALES|STORE|DIGITAL)/.test(id)) domain.operations.add(id); if (/C-|FS-BALANCE|FS-FUNDING|LIQUIDITY|VENDOR/.test(id)) domain.liquidity.add(id); if (/G-|BOARD/.test(id)) domain.governance.add(id); });
  const coverage = (domain.financing.size ? 4 : 0) + (domain.operations.size ? 3 : 0) + (domain.liquidity.size ? 3 : 0) + (domain.governance.size ? 2 : 0);
  const qids = [...(state.selectedQuestions1 || []), state.selectedQuestion2].filter(Boolean); const uniqueQ = new Set(qids); const novelty = qids.filter((id) => ['CH1-C', 'CH1-D', 'CH1-F', 'CH1-G', 'CH2-A', 'CH2-D', 'CH2-E', 'CH2-F', 'CH2-G'].includes(id)).length; const questionQuality = clamp((novelty / Math.max(1, uniqueQ.size)) * 100);
  const source = state.structured?.sourceChecks?.mode === 'verified' ? 100 : state.structured?.sourceChecks?.mode === 'uncertain' ? 70 : 35;
  return clamp((coverage / 12) * 60 + questionQuality * .25 + source * .15);
}
function reasoningScore(state) {
  const ids = distinctEvidenceIds(state.initialDiagnosisEvidenceIds || []); const diagnosis = state.initialDiagnosis; const rel = ids.map((id) => relationshipFor(state, diagnosis, id));
  const valid = rel.filter((r) => ['SUPPORTS', 'CONTRADICTS', 'CONTEXT'].includes(r)).length / Math.max(1, rel.length); const support = rel.filter((r) => r === 'SUPPORTS').length; const contradiction = rel.filter((r) => r === 'CONTRADICTS').length;
  const evidenceUse = clamp(valid * 100 + support * 4 - contradiction * 2); const primary = diagnosis === 'D' || (diagnosis === 'F' && state.structured.primaryConstraint === 'financing') ? 100 : state.structured.primaryConstraint ? 55 : 20; const causal = state.structured.causalSummary === 'financing-chain' || (diagnosis === 'F' && state.structured.causalSummary === 'mixed-chain') ? 100 : state.structured.causalSummary ? 55 : 0;
  let score = primary * .35 + causal * .25 + evidenceUse * .4; if (!ids.length) score = Math.min(score, 40); if (ids.length && valid < .5) score = Math.min(score, 60); return clamp(score);
}
function suitabilityScore(state) {
  const t = state.implementedTreatment || state.approvedTreatment || state.proposedTreatment; const caps = { A: [10, 10, 100], B: [10, 60, 20], C: [100, 80, 30], D: [35, 90, 10], E: [100, 80, 50], F: [100, 85, 90] }[t] || [0, 0, 0]; const fit = caps[0] * .5 + caps[1] * .3 + caps[2] * .2; const coherent = state.initialDiagnosis === 'D' && ['C', 'E', 'F'].includes(t) ? 100 : 55; const feasible = state.financialState.cash >= 200 ? 80 : 35; const risk = state.structured?.riskPlan?.risk && state.structured?.riskPlan?.mitigation ? 100 : 25; const req = { A: ['Customers', 'Holiday Inventory', 'Employees'], B: [], C: ['Creditors'], D: [], E: ['Suppliers', 'Creditors'], F: ['Creditors', 'Suppliers', 'Governance & Family'] }[t] || []; const prepared = req.filter((x) => state.priorities.includes(x)).length / Math.max(1, req.length); const timing = state.timing === 'D' ? 35 : state.timing === 'C' ? 90 : 75; const execution = timing * .4 + prepared * 100 * .6; return clamp(fit * .35 + coherent * .1 + feasible * .2 + risk * .15 + execution * .2);
}
function communicationScore(state) {
  const b = state.structured.initialBriefing;
  if (!b?.message) return 0;
  const accuracy = b.message === 'explain' ? 100 : b.message === 'jargon' ? 70 : 10;
  const clarity = b.message === 'explain' ? 100 : b.message === 'jargon' ? 45 : 70;
  const respect = b.concern === 'ack' ? 100 : b.concern === 'defer' ? 55 : 0;
  const expectation = b.message === 'explain' ? 100 : b.message === 'jargon' ? 55 : 0;
  const check = b.checkBack === 'teach' ? 100 : b.checkBack === 'check' ? 50 : 0;
  return accuracy * .3 + clarity * .25 + respect * .2 + expectation * .15 + check * .1;
}
function ethicsScore(state) {
  const b = state.structured.initialBriefing;
  if (!b) return { score: 0, cap: 39 };
  const checks = { scope: b.consent !== 'decline' ? 80 : 100, disclosure: b.disclosure === 'verified' || b.disclosure === 'uncertain' ? 100 : 0, autonomy: b.consent === 'agree' || b.consent === 'conditional' ? 100 : 70, conflict: b.disclosure === 'verified' || b.disclosure === 'uncertain' ? 100 : 20 };
  const score = checks.scope * .25 + checks.disclosure * .3 + checks.autonomy * .25 + checks.conflict * .2;
  const cap = b.message === 'guarantee' || b.concern === 'pressure' ? 59 : 100;
  return { score: Math.min(score, cap), cap };
}
function clientExperienceScore(state) { const b = state.structured?.initialBriefing; const understanding = b?.message === 'explain' && b?.checkBack === 'teach' ? 100 : 0; const agency = ['agree', 'conditional'].includes(b?.consent) ? 100 : 0; const trust = state.clientState?.trust || 50; return clamp(understanding * .5 + agency * .3 + trust * .2); }

function adaptationScore(state) { const r = state.structured?.reassessmentReason; if (!state.reassessment.applied || !r) return 0; const evidence = state.reassessment.evidenceIds?.length ? 100 : 30; const coherent = r === 'invalidated' && state.reassessment.changedTreatment ? 100 : r === 'confirmed' && !state.reassessment.changedTreatment ? 100 : r === 'uncertain' ? 70 : 45; const monitor = state.reassessment.monitorMetric ? 100 : 0; return clamp(evidence * .4 + coherent * .35 + monitor * .25); }
function calculateCounselorPerformance(state) {
  const investigation = investigationScore(state); const reasoning = reasoningScore(state); const suitability = suitabilityScore(state); const communication = communicationScore(state); const ethicsInfo = ethicsScore(state); const adaptation = adaptationScore(state); const raw = investigation * .2 + reasoning * .2 + suitability * .25 + communication * .15 + ethicsInfo.score * .1 + adaptation * .1; const processCap = ethicsInfo.cap === 59 ? 59 : ethicsInfo.cap === 39 ? 39 : 100; const overall = Math.min(raw, processCap); return { overall: Math.round(overall), raw: Math.round(raw * 10) / 10, dimensions: { investigation: Math.round(investigation), reasoning: Math.round(reasoning), suitability: Math.round(suitability), communication: Math.round(communication), ethics: Math.round(ethicsInfo.score), adaptation: Math.round(adaptation) }, ethicsCap: ethicsInfo.cap };
}
function endingCopy(financial, governance) {
  const matrix = {
    'STRONG_SURVIVAL|FAMILY_ALIGNED': ['The successor', 'The company preserves its foundation, and the family cautiously aligns behind David.'],
    'STRONG_SURVIVAL|FAMILY_FRACTURED': ['A conditional truce', 'The company stabilizes, but David must share authority to keep the peace.'],
    'STRONG_SURVIVAL|CONTROL_LOST': ['Won the battle, lost the house', 'The company is stronger, but control passes away from David.'],
    'FRAGILE_SURVIVAL|FAMILY_ALIGNED': ['Surviving together', 'The company remains open with little margin for error, and the family shares the risk.'],
    'FRAGILE_SURVIVAL|FAMILY_FRACTURED': ['Divide before the fall', 'The company is smaller, and the family has made painful concessions.'],
    'FRAGILE_SURVIVAL|CONTROL_LOST': ['A hollow recovery', 'The company technically survives, but conflict consumes value.'],
    'FINANCIAL_COLLAPSE|FAMILY_ALIGNED': ['Failure with dignity', 'The company fails, but the family shares responsibility.'],
    'FINANCIAL_COLLAPSE|FAMILY_FRACTURED': ['A creditor takeover', 'Creditors or the fund gain ground while the family continues to fight.'],
    'FINANCIAL_COLLAPSE|CONTROL_LOST': ['A complete collapse', 'The court and creditors take control as the family loses authority.']
  };
  return matrix[`${financial.tier}|${governance.tier}`] || ['Unresolved outcome', 'The final state did not match a defined ending.'];
}
function finalize(state) {
  updateHoundstooth(state);
  const financial = calculateFinancialOutcome(state); const governance = calculateGovernanceOutcome(state); state.governanceState.score = governance.score; const process = calculateCounselorPerformance(state); const clientExperience = clientExperienceScore(state); const overall = process.ethicsCap < 100 ? Math.min(process.ethicsCap, process.overall * .5 + financial.score * .3 + clientExperience * .2) : process.overall * .5 + financial.score * .3 + clientExperience * .2; const ending = endingCopy(financial, governance);
  state.finalOutcome = { financial, governance, process, clientExperience: Math.round(clientExperience), overall: Math.round(overall), ending: { title: ending[0], text: ending[1] }, reputation: reputationTier(state.reputation), reputationLabel: reputationLabel(state.reputation) };
  const useful = (state.finalDiagnosisEvidenceIds || []).filter((id) => relationshipFor(state, state.finalDiagnosis, id) === 'SUPPORTS');
  const contradictory = (state.finalDiagnosisEvidenceIds || []).filter((id) => relationshipFor(state, state.finalDiagnosis, id) === 'CONTRADICTS');
  const missed = Object.keys(EVIDENCE).filter((id) => ['DISCOVERED', 'VERIFIED'].includes(evidenceStatus(state, id)) === false && EVIDENCE[id].relationships?.[state.finalDiagnosis] === 'SUPPORTS').slice(0, 3);
  state.finalFeedback = { result: ending[0], reason: `Initial diagnosis ${state.initialDiagnosis}; supporting evidence: ${useful.join(', ') || 'none'}; conflicting evidence: ${contradictory.join(', ') || 'none'}.`, meaning: `Proposed treatment ${state.proposedTreatment} was implemented in Period 1 as ${state.implementedTreatment}; reassessment choice: ${state.reassessment.mode || 'KEEP'}. Final reputation (${reputationLabel(state.reputation)}) reflects stakeholder response and does not change the outcome matrix.`, action: `Financial outcome: ${financial.tier}; Governance and Family outcome: ${governance.tier}.`, limit: missed.length ? `Important evidence not opened: ${missed.join(', ')}.` : 'No directly relevant defined evidence was left unopened.' };
}

function selectionCount(state, screen) {
  const d = state.draftSelection;
  if (screen === 2) return d.dossiers.length; if (screen === 3) return d.questions1.length; if (screen === 9) return d.priorities.length; if (screen === 6) return d.diagnosisEvidenceIds.length; if (screen === 11) return d.reassessmentEvidenceIds.length; return 0;
}
