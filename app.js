/* UI adapter for the Case 01 engine in engine.js. */
function optionCard(item, selected, attrs = '') {
  return `<button type="button" class="option-card ${selected ? 'selected' : ''}" aria-pressed="${selected}" ${attrs}><span class="option-top"><span class="option-check" aria-hidden="true">✓</span></span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.desc || '')}</p></button>`;
}
function renderStepper(state) {
  return `<nav class="stepper-card" aria-label="Case progress"><button class="stepper-arrow" type="button" data-step-scroll="-1" aria-label="View previous screens">‹</button><div class="stepper-track" tabindex="0" aria-label="Case screens; scroll horizontally to view more">${SCREEN_LABELS.map((label, i) => `<div class="step ${i === state.currentScreen ? 'current' : i < state.currentScreen ? 'done' : ''}" ${i === state.currentScreen ? 'aria-current="step"' : ''}><span>${i}</span><b>${escapeHtml(label)}</b></div>`).join('')}</div><button class="stepper-arrow" type="button" data-step-scroll="1" aria-label="View next screens">›</button></nav>`;
}
function renderNotebook(state) {
  const opened = Object.keys(state.evidenceLedger).filter((id) => ['CLUE', 'DISCOVERED', 'VERIFIED', 'DISPROVED'].includes(evidenceStatus(state, id)));
  const dossierList = (state.selectedDossiers || []).map((id) => { const d = DOSSIERS[id]; return `<button class="notebook-item dossier-notebook-item" type="button" data-dossier-open="${escapeHtml(id)}"><span class="notebook-dot"></span><span><strong>${escapeHtml(dossierLabel(d.id))} · ${escapeHtml(d.title)}</strong><small>Open the file to read the full contents</small></span></button>`; }).join('');
  return `<section class="state-card notebook-card"><div class="card-label-row"><span class="card-label">EVIDENCE NOTEBOOK</span><span class="notebook-count">${opened.length} opened</span></div>${dossierList ? `<div class="notebook-list dossier-list">${dossierList}</div>` : ''}${opened.length ? `<div class="notebook-list">${opened.map((id) => { const e = currentEvidence(state, id); return `<button class="notebook-item" type="button" data-evidence-open="${escapeHtml(id)}"><span class="notebook-dot"></span><span><strong>${escapeHtml(e.title)}</strong><small>${escapeHtml(displayDossierText(e.source))} · ${escapeHtml(statusLabel(e.status))}</small></span></button>`; }).join('')}</div>` : '<p class="ledger-empty">No files have been opened yet.</p>'}</section>`;
}
function renderSidebar(state) {
  const f = state.financialState; const showFinance = state.currentScreen >= 4;
  return `<aside class="side-column"><section class="state-card client-card" aria-label="Client David Anderson"><div class="client-pill">Client: David · CEO</div><img class="client-portrait" src="asset/images/round1/david.png" alt="Portrait of David Anderson" /></section>${showFinance ? `<section class="state-card financial-card"><div class="card-label">KNOWN FIGURES</div><div class="known-figure"><span>Cash FY2026</span><strong>$${money(f.cash)}m</strong></div><div class="known-figure"><span>Debt snapshot</span><strong>$${money(f.debt)}m</strong></div><div class="known-figure"><span>Measured EBITDA</span><strong>$${money(f.ebitda, 1)}m</strong></div></section>` : ''}${renderNotebook(state)}${state.eventLedger.length ? `<section class="state-card ledger-card"><div class="card-label-row"><span class="card-label">TIMELINE</span><span class="notebook-count">${state.eventLedger.length} updates</span></div><div class="event-list">${state.eventLedger.slice(-3).map((e) => `<div class="ledger-item"><i></i><span><strong>${escapeHtml(e.title)}</strong><br />${escapeHtml(e.text)}</span></div>`).join('')}</div></section>` : ''}</aside>`;
}

// Story scenes sit between numbered screens; they do not touch the scoring engine.
const dossierLabel = (id) => `Doc ${String(id).replace('HS-', '')}`;
const displayDossierText = (value) => String(value ?? '').replace(/(?:Document|Hồ sơ|HS-)\s*([A-G])\b/gi, (_, letter) => `Doc ${letter.toUpperCase()}`);
function renderStoryScene(state) {
  const scene = state.uiScene;
  const imageScenes = {
    'before-round-2': ['asset/images/story/round1-before-round2.png', 'Continue to Round 2', 'David says he has brought detailed documents and there is only time to review three files.'],
    'before-round-4': ['asset/images/story/round3-before-round4.png', 'Continue to Round 4', "The CFO presents Toy Kingdom's audited consolidated financial statements."],
    'before-round-5-governance': ['asset/images/story/round4-governance-before-round5.png', 'Continue to Round 5', 'The CFO explains that the $149 million in Other Income, net largely comes from life insurance proceeds held in disputed escrow, then provides the complete file.'],
    'before-round-5-common': ['asset/images/story/round4-standard-before-round5.png', 'Continue to Round 5', 'The doctor has reviewed the profiles and asks the client to answer the next question truthfully.'],
    'before-round-8': ['asset/images/story/before-round-8-timing.png', 'Continue to Round 8', 'David asks when would be the right time to take action.'],
    'before-round-11': ['asset/images/story/before-round-11-reassessment.png', 'Continue to Round 11', 'David says the storm has exposed Michael’s position and asks whether to change the diagnosis or treatment plan.']
  };
  if (imageScenes[scene]) {
    const [src, label, description] = imageScenes[scene];
    const nextScene = scene === 'before-round-5-governance' ? 'before-round-5-common' : 'game';
    return `<section class="story-image-scene story-${scene}" aria-label="Dialogue scene"><div class="story-image-frame"><img src="${src}" alt="${description}" /><button class="story-next-hotspot" type="button" data-story-next="${nextScene}" aria-label="${label}" title="${label}"></button></div></section>`;
  }
  if (scene === 'check') return `<section class="story-scene story-check" aria-label="New message"><div class="story-check-left"><img src="asset/images/round1/counselor-phone.png" alt="The counselor checks a phone" /></div><div class="story-check-right"><img class="story-watercolor" src="asset/images/round1/message-bg.png" alt="" /><img class="story-notification" src="asset/images/round1/message-phone.png" alt="New message notification" /><button class="story-primary" type="button" data-story-next="inbox">Check it out</button></div></section>`;
  if (scene === 'inbox') return `<section class="story-scene story-inbox" aria-label="Client messages"><div class="inbox-phone"><div class="inbox-speaker" aria-hidden="true"></div><div class="inbox-list"><button class="inbox-message" type="button" data-story-next="game"><img src="asset/images/round1/david.png" alt="" /><span><strong>David Anderson</strong><small>CEO · Toy Kingdom Inc.</small><span>Sales keep falling. Some measures have improved, but the company is still struggling.</span></span></button><div class="inbox-placeholder" aria-disabled="true"><span class="inbox-avatar" aria-hidden="true"></span><span>No other messages</span></div><div class="inbox-placeholder" aria-disabled="true"><span class="inbox-avatar" aria-hidden="true"></span><span>No other messages</span></div></div></div><p>Select David's message to open his case.</p></section>`;
  if (scene?.startsWith('doc-')) {
    const docs = Object.values(DOSSIERS).map((d) => `<button type="button" class="doc-tab" data-dossier-open="${escapeHtml(d.id)}" ${hasDossier(state, d.id) ? '' : 'disabled'}>${escapeHtml(dossierLabel(d.id))}</button>`).join('');
    const nav = `<nav class="doc-scene-nav" aria-label="Selected files">${docs}</nav>`;
    if (scene === 'doc-intro') return `<section class="story-scene doc-scene doc-intro">${nav}<div class="doc-intro-main"><img src="asset/images/round2/doc-g-david.png" alt="David Anderson at his desk" /><div class="doc-intro-copy"><span>Doc G · GOVERNANCE & FAMILY</span><p>${escapeHtml(DOSSIERS['HS-G'].content[1])}</p><button class="story-primary" type="button" data-story-next="doc-envelope">Continue</button></div></div></section>`;
    if (scene === 'doc-envelope') return `<section class="story-scene doc-scene doc-envelope">${nav}<div class="doc-envelope-main"><button type="button" class="envelope-open" data-story-next="doc-letter" aria-label="Open Doc G envelope"><span class="sr-only">Open Doc G envelope</span></button><p>Select the envelope to open the confidential letter.</p><button class="story-primary" type="button" data-story-next="doc-letter">Open letter</button></div></section>`;
    if (scene === 'doc-letter') return `<section class="story-scene doc-scene doc-letter">${nav}<div class="doc-letter-main"><h2>Doc G · Confidential Contingency Correspondence</h2><button class="doc-letter-zoom" type="button" data-letter-zoom aria-label="Zoom the letter in or out" aria-pressed="false"><img src="asset/images/round2/doc-g-letter-doc.png" alt="Confidential letter in Doc G" /></button><p>Select the letter to enlarge it for reading.</p><button class="story-primary" type="button" data-story-next="game">Continue to questions</button></div></section>`;
  }
  return '';
}

function renderDossierScreen(state) {
  const selected = state.draftSelection.dossiers; return `<div class="options-wrap"><div class="select-helper"><span>Choose exactly three docs to open</span><b>${selected.length}/3</b></div><div class="option-grid dossier-grid">${Object.values(DOSSIERS).map((d) => optionCard({ id: d.id, title: `${dossierLabel(d.id)} — ${d.title}`, desc: `${d.scope}. ${d.summary}` }, selected.includes(d.id), `data-select-kind="dossier" data-select-id="${d.id}"`)).join('')}</div></div>`;
}
function renderQuestionScreen(state) {
  const selected = state.draftSelection.questions1; return `<div class="options-wrap"><div class="select-helper"><span>Choose exactly two questions</span><b>${selected.length}/2</b></div><div class="option-grid">${QUESTIONS_1.map((q) => optionCard({ id: q.id, title: displayDossierText(q.title), desc: 'Ask for more detail about one part of the case.' }, selected.includes(q.id), `data-select-kind="question1" data-select-id="${q.id}"`)).join('')}</div></div>`;
}
function renderFinancials() {
  const answers = state.answeredQuestions?.filter((q) => q.id.startsWith('CH1-')) || [];
  const answerBlock = answers.length ? `<section class="answer-block"><span class="card-label">ANSWER RECEIVED</span>${answers.map((q) => `<div><strong>${escapeHtml(q.id)}</strong><p>${escapeHtml(displayDossierText(q.answer))}</p></div>`).join('')}</section>` : '';
  const governanceNote = hasDossier(state, 'HS-G') ? '<section class="answer-block governance-note"><span class="card-label">AUTHORIZED ANNOTATION</span><p>Most of the $149m in Other Income, net comes from life insurance proceeds held in a disputed escrow account. David wants to reinvest; Michael and Richard want an immediate distribution.</p></section>' : '';
  return `<div class="table-wrap"><table><caption>Consolidated Income Statement · USD millions</caption><thead><tr><th>Metric</th><th>FY2024</th><th>FY2025</th><th>FY2026</th></tr></thead><tbody><tr><th>Net Sales</th><td>12,361</td><td>11,802</td><td>11,540</td></tr><tr><th>Cost of Sales</th><td>(7,931)</td><td>(7,576)</td><td>(7,432)</td></tr><tr><th>Gross Margin</th><td>4,430</td><td>4,226</td><td>4,108</td></tr><tr><th>SG&A</th><td>(3,915)</td><td>(3,593)</td><td>(3,480)</td></tr><tr><th>Depreciation &amp; Amortization</th><td>(377)</td><td>(343)</td><td>(317)</td></tr><tr><th>Other Income, net</th><td>53</td><td>88</td><td>149</td></tr><tr><th>Operating Earnings</th><td>191</td><td>378</td><td>460</td></tr><tr><th>Interest Expense</th><td>(451)</td><td>(429)</td><td>(457)</td></tr><tr><th>Interest Income</th><td>4</td><td>3</td><td>2</td></tr><tr><th>Earnings / (Loss) Before Tax</th><td>(256)</td><td>(48)</td><td>5</td></tr><tr><th>Income Tax Expense</th><td>(32)</td><td>(76)</td><td>(34)</td></tr><tr><th>Net Loss</th><td>(288)</td><td>(124)</td><td>(29)</td></tr><tr><th>Noncontrolling Interest</th><td>(4)</td><td>(6)</td><td>(7)</td></tr><tr><th>Net Loss attributable</th><td>(292)</td><td>(130)</td><td>(36)</td></tr></tbody></table><table><caption>Operating Metrics</caption><thead><tr><th>Metric</th><th>FY2024</th><th>FY2025</th><th>FY2026</th></tr></thead><tbody><tr><th>Gross Margin %</th><td>35.8%</td><td>35.8%</td><td>35.6%</td></tr><tr><th>SG&A / Sales</th><td>31.7%</td><td>30.4%</td><td>30.2%</td></tr><tr><th>Adjusted EBITDA</th><td>$642m</td><td>$800m</td><td>$792m</td></tr><tr><th>Consolidated SSS</th><td>0.0%</td><td>+0.9%</td><td>−1.4%</td></tr></tbody></table><div class="facts-grid"><div><span>Cash</span><strong>$566m</strong></div><div><span>Receivables</span><strong>$255m</strong></div><div><span>Inventory</span><strong>$2.476bn</strong></div><div><span>Current assets</span><strong>$3.389bn</strong></div><div><span>Property &amp; equipment</span><strong>$3.067bn</strong></div><div><span>Total debt</span><strong>~$4.8bn</strong></div><div><span>Secured debt</span><strong>~$3.4bn</strong></div><div><span>Stockholders’ deficit</span><strong>~$1.3bn</strong></div></div>${answerBlock}${governanceNote}</div>`;
}
function renderQuestion2(state) {
  const selected = state.draftSelection.question2; return `<div class="options-wrap"><div class="select-helper"><span>Choose one question</span><b>${selected ? '1/1' : '0/1'}</b></div><div class="option-grid">${QUESTIONS_2.map((q) => optionCard({ id: q.id, title: displayDossierText(q.title), desc: 'Use one question to test your hypothesis before finalizing the plan.' }, selected === q.id, `data-select-kind="question2" data-select-id="${q.id}"`)).join('')}</div></div>`;
}
function renderDiagnosis(state, reassessment = false) {
  const selectedDiagnosis = reassessment ? state.draftSelection.reassessmentDiagnosis : state.draftSelection.diagnosis;
  const selectedEvidence = reassessment ? state.draftSelection.reassessmentEvidenceIds : state.draftSelection.diagnosisEvidenceIds;
  const eligible = citableEvidence(state); const diagnosisCards = DIAGNOSES.map((d) => optionCard(d, selectedDiagnosis === d.id, `data-select-kind="${reassessment ? 'reassess-diagnosis' : 'diagnosis'}" data-select-id="${d.id}"`)).join('');
  const evidence = eligible.length ? eligible.map((id) => { const e = currentEvidence(state, id); return `<div class="evidence-row ${selectedEvidence.includes(id) ? 'selected' : ''}"><button type="button" class="evidence-name" data-evidence-open="${escapeHtml(id)}"><strong>${escapeHtml(e.title)}</strong><small>${escapeHtml(displayDossierText(e.source))} · ${escapeHtml(statusLabel(e.status))}</small></button><button type="button" class="evidence-use" data-evidence-toggle="${escapeHtml(id)}" aria-pressed="${selectedEvidence.includes(id)}">${selectedEvidence.includes(id) ? 'Selected' : 'Use as evidence'}</button></div>`; }).join('') : '<p class="empty-evidence">No evidence is ready to cite. You can continue with a diagnosis that has no supporting evidence.</p>';
  return `<div class="option-grid diagnosis-grid">${diagnosisCards}</div><section class="evidence-picker"><div class="picker-head"><div><span class="card-label">SUPPORTING EVIDENCE</span><h3>Select evidence to support your reasoning</h3></div><b>${selectedEvidence.length}/3</b></div><p class="picker-note">Select a title to read the details. Reading evidence does not select it.</p><div class="evidence-options">${evidence}</div></section>`;
}
function renderTreatment(state, reassessment = false) {
  const selected = reassessment ? state.draftSelection.reassessmentTreatment : state.draftSelection.treatment; return `<div class="option-grid">${TREATMENTS.map((t) => optionCard(t, selected === t.id, `data-select-kind="${reassessment ? 'reassess-treatment' : 'treatment'}" data-select-id="${t.id}"`)).join('')}</div>`;
}
function reassessmentReasonQuestion(mode) {
  return ({
    KEEP: 'Why are you keeping both the diagnosis and treatment?',
    DIAGNOSIS: 'Why are you changing the diagnosis?',
    TREATMENT: 'Why are you changing the treatment?',
    BOTH: 'Why are you changing both the diagnosis and treatment?'
  })[mode] || 'Why are you reviewing the diagnosis and treatment?';
}
function miniChoice(title, options, selected, kind, hint = 'Choose one option.') {
  const guidance = {
    'primary-constraint': 'Choose the factor that most limits the company in carrying out a plan.',
    'causal-summary': 'Choose the reasoning that fits your diagnosis and cited evidence.',
    'source-check': 'Distinguish verified facts, preliminary information, and points that still need checking.'
  };
  hint = guidance[kind] || hint;
  return `<section class="structured-choice"><h3 class="choice-question">${escapeHtml(title)}</h3><p class="choice-hint">${escapeHtml(hint)}</p><div class="option-grid compact-grid">${options.map((o) => optionCard(o, selected === o.id, `data-select-kind="${kind}" data-select-id="${o.id}"`)).join('')}</div></section>`;
}
function renderBriefing(state, review = false) {
  const b = review ? state.structured.reviewBriefing : state.structured.initialBriefing;
  const suffix = review ? 'review-' : '';
  return `<section class="structured-panel"><div class="card-label">CLIENT COMMUNICATION</div>${miniChoice('How will you explain the plan to David?', [{ id: `${suffix}explain`, title: 'Explain goals, trade-offs, and conditions', desc: 'State known facts, limits, and review points.' }, { id: `${suffix}jargon`, title: 'Use concise financial terminology', desc: 'Focus on capital structure and leverage.' }, { id: `${suffix}guarantee`, title: 'Offer a guaranteed outcome', desc: 'Make a promise about the result.' }], b?.message ? `${suffix}${b.message}` : null, `${suffix}brief-message`)}${miniChoice('How will you respond to David’s concern?', [{ id: `${suffix}ack`, title: 'Acknowledge it and explain the trade-off', desc: 'Give David room to weigh the risks and options.' }, { id: `${suffix}defer`, title: 'Acknowledge it and move on', desc: 'Leave the concern unresolved for now.' }, { id: `${suffix}pressure`, title: 'Push for an immediate signature', desc: 'Emphasize time pressure and opportunity.' }], b?.concern ? `${suffix}${b.concern}` : null, `${suffix}brief-concern`)}${miniChoice('How will you check David’s understanding?', [{ id: `${suffix}teach`, title: 'Ask David to explain it back', desc: 'Check goals, conditions, and trade-offs.' }, { id: `${suffix}check`, title: 'Ask whether he understands', desc: 'Use a brief confirmation question.' }, { id: `${suffix}none`, title: 'Do not check understanding', desc: 'Move directly to confirmation.' }], b?.checkBack ? `${suffix}${b.checkBack}` : null, `${suffix}brief-check`)}${miniChoice('How will you disclose information and respect his decision?', [{ id: `${suffix}verified`, title: 'Disclose verified facts', desc: 'Share sourced information with the right audience.' }, { id: `${suffix}uncertain`, title: 'State limits and verify uncertainty', desc: 'Make uncertainty clear before committing.' }, { id: `${suffix}omit`, title: 'Omit inconvenient risks', desc: 'Leave the risk out of the briefing.' }], b?.disclosure ? `${suffix}${b.disclosure}` : null, `${suffix}brief-disclosure`)}</section>`;
}
function renderRiskPlan(state) {
  const r = state.structured.riskPlan || {};
  return `<section class="structured-panel"><div class="card-label">RISK PLAN</div>${miniChoice('Choose the main risk to monitor.', [{ id: 'cash', title: 'Cash burn / runway', desc: 'Spending depletes the cash buffer before new funds arrive.' }, { id: 'creditor', title: 'Creditor refusal', desc: 'Negotiations fail to secure the required terms.' }, { id: 'continuity', title: 'Continuity / vendor shock', desc: 'Suppliers or operations are disrupted.' }], r.risk, 'risk')} ${miniChoice('Choose a mitigation and monitoring measure.', [{ id: 'stage', title: 'Stage the plan and set review thresholds', desc: 'Set stop points and a fallback plan.' }, { id: 'prepare', title: 'Prepare stakeholders first', desc: 'Confirm who is responsible.' }, { id: 'none', title: 'No measure yet', desc: 'Monitor after implementation.' }], r.mitigation, 'risk-mitigation')}</section>`;
}
function renderScreen(state) {
  const s = state.currentScreen; if (s === 0) return `<section class="intake-card"><div class="eyebrow"><span class="eyebrow-line"></span> CONFIDENTIAL · CLIENT FILE</div><h1>Toy Kingdom Inc.<br /><em>The Anderson family</em></h1><p class="hero-lead">A retailer is improving operations but lacks reinvestment capital and family agreement.</p><div class="intake-facts"><div><span>Industry</span><strong>Specialty retail · toys</strong></div><div><span>FY2026 revenue</span><strong>$11.540bn</strong></div><div><span>Scale</span><strong>~1,700 stores</strong></div><div><span>Ownership</span><strong>Anderson 78% · Fund 22%</strong></div><div><span>Adjusted EBITDA</span><strong>$792m</strong></div><div><span>Operating Earnings</span><strong>$460m</strong></div><div><span>Net Loss attributable</span><strong>−$36m</strong></div><div><span>Major transaction</span><strong>Simulated LBO $6.6bn · 2015</strong></div></div></section>`;
  if (s === 1) return `<section class="dialogue-card"><div class="eyebrow"><span class="eyebrow-line"></span> DAVID ANDERSON · CEO</div><blockquote>“Sales keep falling. Amazon, Walmart, and online retail are changing the whole industry. Some measures have improved, yet the company is finding it harder to cope.”</blockquote><blockquote>“I found out Michael has hired his own lawyer, and Richard has quietly offered international assets for sale without going through the board. I do not know whether the problem lies in the market or in my own family.”</blockquote></section>`;
  if (s === 2) return renderDossierScreen(state);
  if (s === 3) return renderQuestionScreen(state);
  if (s === 4) return `<div class="statement-wrap">${renderFinancials()}</div>`;
  if (s === 5) return renderQuestion2(state);
  if (s === 6) { const answer = state.answeredQuestions?.find((q) => q.id === state.selectedQuestion2); return `<div class="options-wrap diagnosis-wrap">${answer ? `<section class="answer-block compact"><span class="card-label">ANSWER RECEIVED</span><p>${escapeHtml(answer.id)} · ${escapeHtml(displayDossierText(answer.answer))}</p></section>` : ''}${renderDiagnosis(state)}${miniChoice('Choose the primary financial constraint.', [{ id: 'financing', title: 'Debt pressure and access to capital', desc: 'Consider debt, interest, and refinancing capacity.' }, { id: 'liquidity', title: 'Liquidity and operating runway', desc: 'Consider cash, inventory, and upcoming maturities.' }, { id: 'operations', title: 'Operations and sales channels', desc: 'Consider stores, channels, and capital allocation.' }], state.structured.primaryConstraint, 'primary-constraint')}${miniChoice('Choose an explanation for how the identified problems connect.', [{ id: 'financing-chain', title: 'Debt limits investment and operations', desc: 'Connect debt, interest coverage, and capital left for investment.' }, { id: 'sales-chain', title: 'Channel shifts weaken sales', desc: 'Explain what sales figures alone might miss.' }, { id: 'mixed-chain', title: 'Several factors interact', desc: 'Identify the main constraint and how the problems interact.' }], state.structured.causalSummary, 'causal-summary')}${miniChoice('Choose how to assess the reliability of your information.', [{ id: 'verified', title: 'Distinguish verified facts from preliminary information', desc: 'State what is verified and what remains a clue.' }, { id: 'uncertain', title: 'Identify missing information', desc: 'State what must be checked before committing.' }, { id: 'none', title: 'Do not state the degree of certainty', desc: 'Use information without explaining its limits.' }], state.structured.sourceChecks.mode, 'source-check')}</div>`; }
  if (s === 7) return `<div class="options-wrap"><div class="select-helper"><span>Choose one treatment plan</span><b>${state.draftSelection.treatment ? '1/1' : '0/1'}</b></div>${renderTreatment(state)}</div>`;
  if (s === 8) return `<div class="options-wrap"><div class="select-helper"><span>Choose one time to act</span><b>${state.draftSelection.timing ? '1/1' : '0/1'}</b></div><div class="option-grid">${TIMINGS.map((t) => optionCard(t, state.draftSelection.timing === t.id, `data-select-kind="timing" data-select-id="${t.id}"`)).join('')}</div></div>`;
  if (s === 9) { const proposed = state.draftSelection.treatment; const tier = reputationTier(state.reputation); const downgrade = (proposed === 'A' && tier === 'LOW') || (proposed === 'F' && tier !== 'HIGH'); const notice = downgrade ? `<div class="answer-block compact"><span class="card-label">APPROVAL RESPONSE</span><p>Plan ${escapeHtml(proposed)} needs additional approval conditions. The board will accept only fallback plan B for Period 1.</p>${miniChoice('How will you acknowledge the board-approved plan?', [{ id: 'accept-fallback', title: 'Accept plan B subject to conditions', desc: 'Record the reason and prepare the revised plan.' }], state.structured.approvalAck, 'approval-ack')}</div>` : ''; return `<div class="options-wrap"><div class="select-helper"><span>Choose exactly three priority groups</span><b>${state.draftSelection.priorities.length}/3</b></div><div class="option-grid">${PRIORITIES.map((p) => optionCard(p, state.draftSelection.priorities.includes(p.id), `data-select-kind="priority" data-select-id="${p.id}"`)).join('')}</div>${notice}${renderBriefing(state)}${renderRiskPlan(state)}</div>`; }
  if (s === 10) { const event = state.eventSequence[state.eventCursor] || { title: 'Preparing update', text: '' }; return `<div class="timeline-wrap"><div class="timeline-tabs">${state.eventSequence.map((e, i) => `<span class="timeline-tab ${i === state.eventCursor ? 'current' : i < state.eventCursor ? 'done' : ''}">${i + 1}. ${escapeHtml(e.title)}</span>`).join('')}</div>${state.eventCursor === 0 && state.structured.initialBriefing?.clientResponse ? `<div class="answer-block compact client-response"><span class="card-label">DAVID'S RESPONSE</span><p>${state.structured.initialBriefing.clientResponse === 'agree' ? 'David agrees with the plan.' : state.structured.initialBriefing.clientResponse === 'conditional' ? 'David agrees subject to clear conditions and review points.' : 'David is not ready to agree and asks for further discussion.'}</p></div>` : ''}<article class="event-card"><span class="card-label">PERIOD 1 UPDATE</span><h3>${escapeHtml(event.title)}</h3><p>${escapeHtml(event.text)}</p></article></div>`; }
  if (s === 11) { const mode = state.draftSelection.reassessmentMode; return `<div class="options-wrap reassessment-wrap"><section class="reassessment-panel"><div class="reassessment-intro"><span>RE-EVALUATION</span><h3>Adjust diagnosis and treatment</h3></div><div class="reassessment-layout"><img class="reassessment-doctor" src="asset/images/round6/diagnosis-doctor.png" alt="Consulting physician" /><div class="reassessment-choices"><div class="option-grid">${REASSESS_MODES.map((m) => optionCard(m, mode === m.id, `data-select-kind="reassess-mode" data-select-id="${m.id}"`)).join('')}</div></div></div>${mode && ['DIAGNOSIS', 'BOTH'].includes(mode) ? `<section class="reassess-section"><span class="card-label">NEXT-PERIOD DIAGNOSIS</span>${renderDiagnosis(state, true)}</section>` : ''}${mode && ['TREATMENT', 'BOTH'].includes(mode) ? `<section class="reassess-section"><span class="card-label">NEXT-PERIOD TREATMENT</span>${renderTreatment(state, true)}</section>` : ''}${mode ? `${miniChoice(reassessmentReasonQuestion(mode), [{ id: 'confirmed', title: 'New evidence supports the current approach', desc: 'The latest developments support the original diagnosis and treatment.' }, { id: 'invalidated', title: 'New evidence challenges the current approach', desc: 'The latest developments contradict an assumption behind the diagnosis or treatment.' }, { id: 'uncertain', title: 'The evidence is not yet conclusive', desc: 'More information is needed before deciding whether the current approach remains appropriate.' }], state.structured.reassessmentReason, 'reassess-reason', 'Choose the reason that best explains your decision based on the new evidence.')}${miniChoice('Which metric should be monitored next period?', [{ id: 'cash', title: 'Cash / liquidity', desc: 'Track runway and available cash.' }, { id: 'debt', title: 'Debt / interest coverage', desc: 'Track financial obligations.' }, { id: 'continuity', title: 'Continuity / sales', desc: 'Track operations and sales.' }], state.reassessment.monitorMetric, 'reassess-metric')}` : ''}<p class="reassessment-note">Your choices are recorded only after you confirm this screen.</p></section></div>`; }
  return renderResult(state);
}
function renderGame(state) {
  const title = state.currentScreen === 0 ? 'Client intake' : `Case 01 · ${SCREEN_LABELS[state.currentScreen]}`;
  const prompts = { 0: 'Toy Kingdom Inc. · The Anderson family', 1: 'Listen before asking questions', 2: 'Choose files to open', 3: 'Close the information gaps', 4: 'Complete financial statements', 5: 'One question before diagnosis', 6: 'Connect evidence to your diagnosis', 7: 'Choose a treatment plan', 8: 'Choose when to act', 9: 'Prepare before announcing the plan', 10: 'Follow the developments', 11: 'New evidence after Period 1', 12: 'Consultation summary' };
  const terminal = state.status === 'COMPLETED' && state.currentScreen === 12;
  const effectiveScreen = terminal ? 12 : Math.min(Math.max(state.currentScreen, 0), 11);
  const effectiveTitle = effectiveScreen === 0 ? 'Client intake' : `Case 01 · ${SCREEN_LABELS[effectiveScreen]}`;
  if (terminal) return `<section class="section-wrap conclusion-wrap">${renderConclusion(state)}</section>`;
  return `<section class="hero section-wrap game-hero"><div class="hero-copy"><div class="eyebrow"><span class="eyebrow-line"></span> ${escapeHtml(effectiveTitle)}</div><h1>${escapeHtml(prompts[effectiveScreen])}</h1><p class="hero-lead">Every confirmed decision becomes part of this case record.</p></div><div class="hero-meta"><div class="client-mini"><div class="client-avatar">D</div><div><strong>David Anderson</strong><span>CEO · Toy Kingdom Inc.</span></div></div><button class="text-btn" type="button" id="restartBtn">↻ Play again</button></div></section><section class="section-wrap workspace"><div class="main-column">${effectiveScreen > 0 ? renderStepper({ ...state, currentScreen: effectiveScreen }) : ''}<section class="decision-card" aria-live="polite">${renderDecisionFrame({ ...state, currentScreen: effectiveScreen })}</section></div>${renderSidebar({ ...state, currentScreen: effectiveScreen })}</section>`;
}
function renderDecisionFrame(state) {
  const s = state.currentScreen;
  const validation = validateScreen(state);
  const canConfirm = s === 0 || s === 1 || s === 4 || s === 10 || !validation;
  const labels = {
    0: 'Start case', 1: 'Begin review', 2: 'Open selected files', 3: 'Record questions',
    4: 'Continue', 5: 'Record final question', 6: 'Confirm diagnosis', 7: 'Record treatment',
    8: 'Record timing', 9: 'Begin timeline',
    10: state.eventCursor >= state.eventSequence.length - 1 ? 'Continue to re-evaluation' : 'Read next update',
    11: 'Confirm re-evaluation'
  };
  const context = s === 10 || [0, 1, 4].includes(s) ? '' : `<p class="frame-note">${escapeHtml(validation || 'Confirm to lock this choice into the case record.')}</p>`;
  return `<div class="fade-in"><div class="decision-head"><div class="decision-kicker"><span class="decision-number">Screen ${String(s).padStart(2, '0')} - ${escapeHtml(SCREEN_LABELS[s])}</span>${s >= 2 && s <= 9 ? `<span class="count-chip">${selectionCount(state, s)} selected</span>` : ''}</div><h2>${escapeHtml(screenTitle(s))}</h2><p>${escapeHtml(screenPrompt(s))}</p></div>${renderScreen(state)}${context}<div class="confirm-bar"><div class="confirm-copy"><strong>${validation && ![0, 1, 4, 10].includes(s) ? 'Needs attention' : 'Ready'}</strong><span>${s === 10 ? 'This update is part of the simulated timeline.' : 'Confirm to continue to the next screen.'}</span></div><button type="button" class="primary-btn" id="confirmBtn" ${canConfirm ? '' : 'disabled'}>${escapeHtml(labels[s])} &rarr;</button></div></div>`;
}

function screenTitle(screen) { return ({ 0: 'Client intake', 1: 'Clinic', 2: 'Case files', 3: 'Questions', 4: 'Financial statements', 5: 'Final question', 6: 'Diagnosis', 7: 'Treatment plan', 8: 'Timing', 9: 'Preparation', 10: 'Developments', 11: 'Re-evaluation' })[screen] || 'Conclusion'; }
function screenPrompt(screen) { return ({ 0: 'Review the confidential client file before you begin.', 1: 'David describes an operating challenge and a family disagreement.', 2: 'You may open three files. Unselected files remain locked.', 3: 'Ask two questions to gather additional information before reviewing the financial statements.', 4: 'The CFO provides the complete statements as an independent source.', 5: 'Use one final question to test the hypothesis you are considering.', 6: 'Choose a diagnosis and cite the evidence you have collected.', 7: 'Choose a treatment plan for approval.', 8: 'Your timing choice becomes part of the simulated timeline.', 9: 'Prepare three stakeholder groups before announcing the plan.', 10: 'Updates appear in sequence and provide evidence for reassessment.', 11: 'Period 1 has been recorded. New decisions apply to the next period.' })[screen] || ''; }

function summaryDoctorAsset(overall, financialTier) { return overall >= 85 ? 'asset/images/round12/doctor-good.png' : financialTier === 'FINANCIAL_COLLAPSE' ? 'asset/images/round12/doctor-bad.png' : financialTier === 'FRAGILE_SURVIVAL' ? 'asset/images/round12/doctor-medium.png' : 'asset/images/round12/doctor-good.png'; }

function renderResult(state) { return renderConclusion(state); }

function renderConclusion(state) {
  const o = state.finalOutcome || (finalize(state), state.finalOutcome);
  const f = o.financial, g = o.governance, p = o.process;
  const tierNames = { STRONG_SURVIVAL: 'Strong survival', FRAGILE_SURVIVAL: 'Fragile survival', FINANCIAL_COLLAPSE: 'Financial collapse', FAMILY_ALIGNED: 'Family aligned', FAMILY_FRACTURED: 'Family divided', CONTROL_LOST: 'Control lost' };
  const named = (id, list) => id ? `${id} - ${list.find((item) => item.id === id)?.title || id}` : 'None';
  const doctor = summaryDoctorAsset(o.overall, f.tier);
  const rep = clamp(state.reputation);
  const history = [
    ['Profiles opened', (state.selectedDossiers || []).map((id) => `${dossierLabel(id)} - ${DOSSIERS[id]?.title || id}`).join('; ') || 'None'],
    ['Questions asked', [...(state.selectedQuestions1 || []), state.selectedQuestion2].filter(Boolean).map((id) => named(id, [...QUESTIONS_1, ...QUESTIONS_2])).join('; ') || 'None'],
    ['Initial diagnosis', named(state.initialDiagnosis, DIAGNOSES)], ['Final diagnosis', named(state.finalDiagnosis || state.initialDiagnosis, DIAGNOSES)],
    ['Initial treatment', named(state.proposedTreatment, TREATMENTS)], ['Treatment implemented', named(state.implementedTreatment, TREATMENTS)],
    ['Next-period treatment', named(state.finalImplementedTreatment || state.implementedTreatment, TREATMENTS)],
    ['Timing', named(state.timing, TIMINGS)], ['Priority groups', (state.priorities || []).join(', ') || 'None'],
    ['Re-evaluation', REASSESS_MODES.find((item) => item.id === (state.reassessment.mode || 'KEEP'))?.title || 'Keep both']
  ];
  return `<div class="conclusion fade-in"><header class="conclusion-heading"><span>ROUND 12 &middot; CONCLUSION</span><h2>Case completed</h2><p>Results from the decisions and events in this playthrough.</p></header>${renderStepper(state)}<section class="conclusion-complete"><div class="conclusion-label">CASE COMPLETED</div><div class="conclusion-hero"><div><span>RESULT</span><h3>${escapeHtml(o.ending.title)}</h3><img src="${doctor}" alt="Consulting physician" /></div><div class="conclusion-score"><span>Total case score</span><strong>${o.overall}</strong><small>/ 100 &middot; calculated by the game</small></div></div></section><div class="conclusion-body"><div class="conclusion-outcomes"><section><h3>Financial health</h3><strong>${f.score} / 100</strong><span>${escapeHtml(tierNames[f.tier] || f.tier)}</span><p>Liquidity ${f.metrics.liquidity} &middot; Debt load ${f.metrics.debtLoad} &middot; Continuity ${f.metrics.continuity}</p></section><section><h3>Governance &middot; Family stability</h3><strong>${g.score} / 100</strong><span>${escapeHtml(tierNames[g.tier] || g.tier)}</span><p>Governance is calculated separately from financial condition.</p></section></div><section class="conclusion-reputation"><div><strong>REPUTATION</strong><span>${rep} / 100 &middot; ${escapeHtml(o.reputationLabel)}</span></div><div class="reputation-track" role="meter" aria-label="Reputation" aria-valuenow="${rep}" aria-valuemin="0" aria-valuemax="100"><i style="width:${rep}%"></i></div></section><section class="conclusion-profile"><h3>Profile summary</h3><p>Choices made in this playthrough. The engine does not calculate a separate score for every choice.</p><dl>${history.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join('')}</dl><div class="conclusion-process"><span>Consulting process <b>${p.overall}/100</b></span><span>Client experience <b>${o.clientExperience}/100</b></span></div></section><section class="conclusion-reality"><h3>Comparison with reality</h3><p>Toys &quot;R&quot; Us filed for Chapter 11 bankruptcy protection in 2017 in an attempt to restructure its debt. Its U.S. business later moved toward liquidation in 2018 after the restructuring effort failed to stabilize the company. Toy Kingdom Inc. is a separate simulation.</p></section><section class="conclusion-feedback"><h3>Final feedback</h3><p>${escapeHtml(o.ending.text)}</p><p>${escapeHtml(state.finalFeedback?.limit || '')}</p></section><div class="result-actions"><button type="button" class="secondary-btn" id="closeCaseBtn">Back to menu</button><button type="button" class="primary-btn" id="reopenCaseBtn">Play again</button></div></div></div>`;
}

function renderMenu() {
  const saved = hasSave(); return `<section class="menu-hero section-wrap"><div class="eyebrow"><span class="eyebrow-line"></span> MEDIFIN - FINANCIAL CLINIC</div><h1>Choose a<br /><em>case to review</em></h1><p class="hero-lead">Each case is a standalone simulation. Progress is saved separately for each case.</p></section><section class="section-wrap case-menu"><article class="case-menu-card playable" data-case-id="case01"><div class="case-menu-top"><span class="case-number">CASE 01</span><span class="status-pill">PLAYABLE</span></div><h2>Toy Kingdom Inc.</h2><p>Anderson family - specialty retail - 13 investigation, diagnosis, and reassessment screens.</p><div class="case-facts"><span>~1,700 stores</span><span>FY2026 $11.540bn</span><span>Anderson 78%</span></div><div class="case-actions"><button class="primary-btn" type="button" data-menu-action="start">${saved ? 'Continue' : 'Start case'} -&gt;</button>${saved ? '<button class="secondary-btn" type="button" data-menu-action="restart">Restart</button>' : ''}</div></article><article class="case-menu-card incoming" data-case-id="case02" aria-disabled="true"><div class="case-menu-top"><span class="case-number">CASE 02</span><span class="status-pill muted">INCOMING</span></div><h2>Coming soon</h2><p>The next case will be available in a future release.</p><div class="case-facts"><span>Locked</span><span>Unavailable</span></div><button class="secondary-btn" type="button" disabled>Coming soon</button></article></section>`;
}

let state = makeInitialState(); let view = 'menu'; let busy = false; let modalEvidenceId = null; let modalDossierId = null; let modalReturnFocus = null;
function openRules() {
  document.getElementById('rulesModal').classList.remove('hidden');
  document.getElementById('rulesBtn').setAttribute('aria-expanded', 'true');
  document.getElementById('rulesClose').focus();
}
function closeRules() {
  document.getElementById('rulesModal').classList.add('hidden');
  document.getElementById('rulesBtn').setAttribute('aria-expanded', 'false');
  document.getElementById('rulesBtn').focus();
}
function render() {
  const main = document.getElementById('mainContent'); const top = document.getElementById('topbarContext'); const footer = document.getElementById('footerContext'); const menuBtn = document.getElementById('menuBtn');
  if (view === 'menu') { main.innerHTML = `<div class="integrated-menu">${renderMenu()}</div>`; top.innerHTML = ''; footer.textContent = 'Case selection'; menuBtn.classList.add('hidden'); }
  else { const outcomeClass = state.currentScreen === 12 ? ` outcome-${state.finalOutcome?.financial?.tier || 'FRAGILE_SURVIVAL'}` : ''; main.innerHTML = state.uiScene ? `<div class="integrated-story">${renderStoryScene(state)}</div>` : `<div class="integrated-game stage-${state.currentScreen}${outcomeClass}">${renderGame(state)}</div>`; top.innerHTML = `<span class="topbar-dot"></span><span>FINANCIAL CLINIC</span><span class="topbar-slash">/</span><span>CASE 01</span>`; footer.textContent = state.uiScene ? 'Case 01 / Story' : `Case 01 / ${SCREEN_LABELS[state.currentScreen] || 'Complete'}`; menuBtn.classList.remove('hidden'); }
  bindDynamicState();
  window.requestAnimationFrame(() => {
    const track = document.querySelector('.stepper-track');
    const current = track?.querySelector('.step.current');
    if (track && current) {
      track.scrollLeft = current.offsetLeft - track.offsetLeft - (track.clientWidth - current.clientWidth) / 2;
      updateStepperArrows();
    }
  });
}
function updateStepperArrows() {
  const track = document.querySelector('.stepper-track');
  if (!track) return;
  const previous = document.querySelector('[data-step-scroll="-1"]');
  const next = document.querySelector('[data-step-scroll="1"]');
  if (previous) previous.disabled = track.scrollLeft <= 1;
  if (next) next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 1;
}
function bindDynamicState() { const modal = document.getElementById('evidenceModal'); if (modalEvidenceId) modal.classList.remove('hidden'); }
function toast(message) { const el = document.getElementById('toast'); el.textContent = message; el.classList.add('show'); clearTimeout(window.__medifinToast); window.__medifinToast = window.setTimeout(() => el.classList.remove('show'), 2400); }
function startCase(restart = false) { const fresh = restart || !hasSave(); if (restart) clearCaseSave(); state = fresh ? makeInitialState() : loadState(); state.completedStoryScenes ||= []; if (fresh) state.uiScene = 'check'; else if (!state.uiScene) { const seen = state.completedStoryScenes; if (state.currentScreen === 2 && state.confirmedScreens.includes(1) && !seen.includes('before-round-2')) state.uiScene = 'before-round-2'; else if (state.currentScreen === 4 && state.confirmedScreens.includes(3) && !seen.includes('before-round-4')) state.uiScene = 'before-round-4'; else if (state.currentScreen === 8 && state.confirmedScreens.includes(7) && !seen.includes('before-round-8')) state.uiScene = 'before-round-8'; else if (state.currentScreen === 11 && state.confirmedScreens.includes(10) && !seen.includes('before-round-11')) state.uiScene = 'before-round-11'; else if (state.currentScreen === 5 && state.confirmedScreens.includes(4)) { const branch = state.selectedDossiers.includes('HS-G') ? 'before-round-5-governance' : 'before-round-5-common'; if (!seen.includes(branch)) state.uiScene = branch; } } view = 'game'; saveState(); render(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
function goMenu() { view = 'menu'; closeModal(); render(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
function confirmCurrent() {
  if (busy || state.status === 'COMPLETED' || state.currentScreen >= 12) return;
  const error = validateScreen(state); const easy = [0, 1, 4, 10].includes(state.currentScreen); if (error && !easy) { toast(error); return; }
  busy = true; const screenBefore = state.currentScreen; applyScreen(state);
  if (state.status !== 'COMPLETED' && screenBefore !== 10 && screenBefore !== 11) state.currentScreen = screenBefore + 1;
  state.completedStoryScenes ||= [];
  if (screenBefore === 1 && !state.completedStoryScenes.includes('before-round-2')) state.uiScene = 'before-round-2';
  if (screenBefore === 3 && !state.completedStoryScenes.includes('before-round-4')) state.uiScene = 'before-round-4';
  if (screenBefore === 4) { const branchScene = state.selectedDossiers.includes('HS-G') ? 'before-round-5-governance' : 'before-round-5-common'; if (!state.completedStoryScenes.includes(branchScene)) state.uiScene = branchScene; }
  if (screenBefore === 7 && !state.completedStoryScenes.includes('before-round-8')) state.uiScene = 'before-round-8';
  if (screenBefore === 10 && state.currentScreen === 11 && !state.completedStoryScenes.includes('before-round-11')) state.uiScene = 'before-round-11';
  if (screenBefore === 2 && state.selectedDossiers.includes('HS-G')) state.uiScene = 'doc-intro';
  if (screenBefore === 11) state.status = 'COMPLETED';
  if (screenBefore !== 10 || state.currentScreen !== 10) { if (!state.confirmedScreens.includes(screenBefore)) state.confirmedScreens.push(screenBefore); state.decisionHistory.push({ screen: screenBefore, selection: deepCopy(state.draftSelection), at: Date.now() }); state.transitionIds.push(`${screenBefore}-${state.confirmedScreens.length}`); }
  saveState(); render(); busy = false;
  if (screenBefore === 2) openSelectedDossierReview();
  window.setTimeout(() => document.querySelector('.decision-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
}
function setSelection(kind, id) {
  const d = state.draftSelection;
  if (kind === 'dossier') { const list = d.dossiers; if (list.includes(id)) list.splice(list.indexOf(id), 1); else if (list.length < 3) list.push(id); else toast('You can choose only three files.'); }
  if (kind === 'question1') { const list = d.questions1; if (list.includes(id)) list.splice(list.indexOf(id), 1); else if (list.length < 2) list.push(id); else toast('You can choose only two questions.'); }
  if (kind === 'question2') d.question2 = id;
  if (kind === 'diagnosis') d.diagnosis = id;
  if (kind === 'treatment') d.treatment = id;
  if (kind === 'timing') d.timing = id;
  if (kind === 'priority') { const list = d.priorities; if (list.includes(id)) list.splice(list.indexOf(id), 1); else if (list.length < 3) list.push(id); else toast('You can choose only three priority groups.'); }
  if (kind === 'reassess-mode') { d.reassessmentMode = id; d.reassessmentDiagnosis = null; d.reassessmentTreatment = null; d.reassessmentEvidenceIds = []; state.structured.reassessmentReason = null; }
  if (kind === 'reassess-diagnosis') d.reassessmentDiagnosis = id;
  if (kind === 'reassess-treatment') d.reassessmentTreatment = id;
  if (kind === 'primary-constraint') state.structured.primaryConstraint = id;
  if (kind === 'causal-summary') state.structured.causalSummary = id;
  if (kind === 'source-check') state.structured.sourceChecks.mode = id;
  if (kind === 'risk') { state.structured.riskPlan ||= {}; state.structured.riskPlan.risk = id; }
  if (kind === 'risk-mitigation') { state.structured.riskPlan ||= {}; state.structured.riskPlan.mitigation = id; }
  if (kind === 'reassess-reason') state.structured.reassessmentReason = id;
  if (kind === 'reassess-metric') state.reassessment.monitorMetric = id;
  if (kind === 'approval-ack') state.structured.approvalAck = id;
  if (kind.endsWith('brief-message')) { const review = kind.startsWith('review-'); state.structured[review ? 'reviewBriefing' : 'initialBriefing'] ||= {}; state.structured[review ? 'reviewBriefing' : 'initialBriefing'].message = id.replace(/^review-/, ''); }
  if (kind.endsWith('brief-concern')) { const review = kind.startsWith('review-'); state.structured[review ? 'reviewBriefing' : 'initialBriefing'] ||= {}; state.structured[review ? 'reviewBriefing' : 'initialBriefing'].concern = id.replace(/^review-/, ''); }
  if (kind.endsWith('brief-check')) { const review = kind.startsWith('review-'); state.structured[review ? 'reviewBriefing' : 'initialBriefing'] ||= {}; state.structured[review ? 'reviewBriefing' : 'initialBriefing'].checkBack = id.replace(/^review-/, ''); }
  if (kind.endsWith('brief-disclosure')) { const review = kind.startsWith('review-'); state.structured[review ? 'reviewBriefing' : 'initialBriefing'] ||= {}; state.structured[review ? 'reviewBriefing' : 'initialBriefing'].disclosure = id.replace(/^review-/, ''); }
  
  saveState(); render();
}
function selectedEvidenceList() { return state.currentScreen === 11 ? state.draftSelection.reassessmentEvidenceIds : state.draftSelection.diagnosisEvidenceIds; }
function toggleEvidence(id) { const list = selectedEvidenceList(); if (!citableEvidence(state).includes(id)) return toast('This evidence is not ready to cite.'); if (list.includes(id)) list.splice(list.indexOf(id), 1); else if (list.length < 3) list.push(id); else return toast('You can cite up to three pieces of evidence.'); closeModal(); saveState(); render(); }
function openEvidence(id, target) { if (!currentEvidence(state, id) || !['CLUE', 'DISCOVERED', 'VERIFIED', 'DISPROVED'].includes(evidenceStatus(state, id))) return; modalEvidenceId = id; modalDossierId = null; modalReturnFocus = target || document.activeElement; const e = currentEvidence(state, id); document.getElementById('modalTitle').textContent = `${e.id} · ${e.title}`; document.getElementById('modalBody').innerHTML = `<div class="modal-meta"><span>${escapeHtml(displayDossierText(e.source))}</span><span>${escapeHtml(statusLabel(e.status))}</span></div><p class="modal-text">${escapeHtml(displayDossierText(e.text))}</p>${e.provenance?.length ? `<p class="modal-provenance">Opened from: ${escapeHtml(displayDossierText(e.provenance.join(', ')))}</p>` : ''}`; const selected = selectedEvidenceList().includes(id); document.getElementById('modalActions').innerHTML = citableEvidence(state).includes(id) && [6, 11].includes(state.currentScreen) ? `<button type="button" class="secondary-btn" id="modalEvidenceAction">${selected ? 'Deselect' : 'Use as evidence'}</button>` : ''; document.getElementById('evidenceModal').classList.remove('hidden'); window.setTimeout(() => document.getElementById('modalClose')?.focus(), 0); }
function openDossier(id, target) { if (!hasDossier(state, id) || !DOSSIERS[id]) return; modalDossierId = id; modalEvidenceId = null; modalReturnFocus = target || document.activeElement; const d = DOSSIERS[id]; document.getElementById('modalTitle').textContent = `${dossierLabel(d.id)} · ${d.title}`; document.getElementById('modalBody').innerHTML = `<div class="modal-meta"><span>${escapeHtml(d.scope)}</span><span>Opened</span></div><div class="modal-text">${d.content.map((line) => `<p>${escapeHtml(line)}</p>`).join('')}</div>`; document.getElementById('modalActions').innerHTML = ''; document.getElementById('evidenceModal').classList.remove('hidden'); window.setTimeout(() => document.getElementById('modalClose')?.focus(), 0); }
let dossierReviewIndex = 0; let dossierReviewIds = [];
function renderDossierReview() {
  const ids = dossierReviewIds;
  const id = ids[dossierReviewIndex]; const dossier = DOSSIERS[id];
  document.getElementById('modalTitle').textContent = 'Selected documents';
  document.getElementById('modalBody').innerHTML = `<nav class="dossier-review-tabs" aria-label="Choose a doc to read">${ids.map((item, index) => `<button type="button" class="${index === dossierReviewIndex ? 'active' : ''}" data-review-dossier="${index}" aria-pressed="${index === dossierReviewIndex}">${escapeHtml(dossierLabel(item))}</button>`).join('')}</nav><div class="modal-meta"><span>${escapeHtml(dossier.scope)}</span><span>${escapeHtml(dossierLabel(dossier.id))}</span></div><div class="modal-text">${dossier.content.map((line) => `<p>${escapeHtml(line)}</p>`).join('')}</div>`;
  document.getElementById('modalActions').innerHTML = '<button type="button" class="primary-btn" id="reviewDossiersContinue">Continue</button>';
}
function openSelectedDossierReview() {
  if (state.currentScreen !== 3 || state.selectedDossiers.length !== 3 || modalDossierId === 'review' || !document.getElementById('evidenceModal').classList.contains('hidden')) return;
  dossierReviewIds = [...state.selectedDossiers];
  modalDossierId = 'review'; modalEvidenceId = null; dossierReviewIndex = 0; modalReturnFocus = document.activeElement;
  document.querySelector('#evidenceModal .evidence-modal').classList.add('dossier-review-modal');
  renderDossierReview(); document.getElementById('evidenceModal').classList.remove('hidden');
  window.setTimeout(() => document.querySelector('[data-review-dossier="0"]')?.focus(), 0);
}
function closeModal() { const modal = document.getElementById('evidenceModal'); const returnFocus = modalReturnFocus; modal.classList.add('hidden'); modal.querySelector('.evidence-modal').classList.remove('dossier-review-modal'); document.getElementById('modalClose').classList.remove('hidden'); modalEvidenceId = null; modalDossierId = null; dossierReviewIds = []; modalReturnFocus = null; if (returnFocus?.isConnected && typeof returnFocus.focus === 'function') window.setTimeout(() => returnFocus.focus(), 0); }

document.addEventListener('click', (event) => {
  const storyNext = event.target.closest('[data-story-next]');
  if (storyNext) { if (busy) return; busy = true; state.completedStoryScenes ||= []; if (['before-round-2', 'before-round-4', 'before-round-5-governance', 'before-round-5-standard', 'before-round-5-common', 'before-round-8', 'before-round-11'].includes(state.uiScene) && !state.completedStoryScenes.includes(state.uiScene)) state.completedStoryScenes.push(state.uiScene); state.uiScene = storyNext.dataset.storyNext === 'game' ? null : storyNext.dataset.storyNext; saveState(); render(); window.scrollTo({ top: 0, behavior: 'smooth' }); busy = false; return; }
  if (event.target.closest('[data-letter-zoom]')) { const letter = event.target.closest('[data-letter-zoom]'); letter.classList.toggle('zoomed'); letter.setAttribute('aria-pressed', letter.classList.contains('zoomed')); return; }
  const stepArrow = event.target.closest('[data-step-scroll]');
  if (stepArrow) { document.querySelector('.stepper-track')?.scrollBy({ left: Number(stepArrow.dataset.stepScroll) * 320, behavior: 'smooth' }); return; }
  if (event.target.closest('#rulesBtn')) { openRules(); return; }
  if (event.target.closest('#rulesClose') || event.target.id === 'rulesModal') { closeRules(); return; }
  const menuAction = event.target.closest('[data-menu-action]'); if (menuAction) { const action = menuAction.dataset.menuAction; if (action === 'start') startCase(false); if (action === 'restart') startCase(true); return; }
  if (event.target.closest('#brandHome')) { event.preventDefault(); goMenu(); return; }
  if (event.target.closest('#menuBtn')) { goMenu(); return; }
  if (event.target.closest('#restartBtn')) { startCase(true); return; }
  if (event.target.closest('#confirmBtn')) { if (event.detail > 1) return; confirmCurrent(); return; }
  const select = event.target.closest('[data-select-kind]'); if (select) { setSelection(select.dataset.selectKind, select.dataset.selectId); return; }
  const evidenceToggle = event.target.closest('[data-evidence-toggle]'); if (evidenceToggle) { toggleEvidence(evidenceToggle.dataset.evidenceToggle); return; }
  const evidenceOpen = event.target.closest('[data-evidence-open]'); if (evidenceOpen) { openEvidence(evidenceOpen.dataset.evidenceOpen, evidenceOpen); return; }
  const dossierOpen = event.target.closest('[data-dossier-open]'); if (dossierOpen) { openDossier(dossierOpen.dataset.dossierOpen, dossierOpen); return; }
  const reviewTab = event.target.closest('[data-review-dossier]'); if (reviewTab) { dossierReviewIndex = Number(reviewTab.dataset.reviewDossier); renderDossierReview(); document.querySelector(`[data-review-dossier="${dossierReviewIndex}"]`)?.focus(); return; }
  if (event.target.closest('#reviewDossiersContinue')) { closeModal(); return; }
  if (event.target.closest('#modalClose') || event.target.id === 'evidenceModal') { closeModal(); return; }
  if (event.target.closest('#modalEvidenceAction')) { toggleEvidence(modalEvidenceId); return; }
  if (event.target.closest('#closeCaseBtn')) { goMenu(); return; }
  if (event.target.closest('#reopenCaseBtn')) { startCase(true); return; }
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && document.querySelector('.doc-letter-zoom.zoomed')) { document.querySelector('.doc-letter-zoom.zoomed').click(); return; }
  if (event.target.matches?.('.stepper-track') && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
    event.preventDefault();
    event.target.scrollBy({ left: event.key === 'ArrowRight' ? 160 : -160, behavior: 'smooth' });
    return;
  }
  const rules = document.getElementById('rulesModal');
  if (!rules.classList.contains('hidden')) {
    if (event.key === 'Escape') { event.preventDefault(); closeRules(); return; }
    if (event.key === 'Tab') {
      const focusable = [...rules.querySelectorAll('button, a[href], [tabindex]:not([tabindex="-1"])')].filter((el) => !el.disabled);
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
    return;
  }
  if (event.key === 'Escape' && (modalEvidenceId || modalDossierId)) closeModal();
});
document.addEventListener('scroll', (event) => { if (event.target.matches?.('.stepper-track')) updateStepperArrows(); }, true);

// A small read-only integration surface keeps the transition engine testable
// without adding a debug control to the production player flow.
window.MEDIFIN = Object.freeze({
  CASE_ID: CANONICAL_CASE_ID,
  makeInitialState,
  resolveRefinancing,
  updateHoundstooth,
  calculateFinancialOutcome,
  calculateGovernanceOutcome,
  calculateCounselorPerformance, investigationScore, reasoningScore, suitabilityScore, communicationScore, ethicsScore, adaptationScore, clientExperienceScore, resolveTreatmentApproval,
  reputationTier,
  validateEvidenceSelection,
  EVIDENCE,
  DOSSIERS,
  DIAGNOSES,
  TREATMENTS
});

render();
