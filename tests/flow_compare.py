"""Browser journey and source-B parity check. Requires playwright and Edge."""

from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(r'C:\Users\Mr.Nguyen Nhung\Downloads\HIHI\Medifin\index.html')
SHOTS = ROOT / 'screenshots'


def run_case(browser, url, shots=False):
    context = browser.new_context(viewport={'width': 1440, 'height': 900})
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda err: errors.append(str(err)))
    page.goto(url)

    def click(selector):
        page.locator(selector).first.click()

    def chosen(kind, ident):
        click(f'[data-select-kind="{kind}"][data-select-id="{ident}"]')

    def snap(name):
        if shots:
            SHOTS.mkdir(exist_ok=True)
            page.screenshot(path=str(SHOTS / name), full_page=True)

    assert page.locator('.case-menu-card').count() == 2
    snap('00-menu-desktop.png')
    click('[data-menu-action="start"]')
    snap('01-intake-desktop.png')
    click('#confirmBtn')
    click('#confirmBtn')
    for item in ('HS-D', 'HS-B', 'HS-G'):
        chosen('dossier', item)
    snap('02-files-desktop.png')
    click('#confirmBtn')
    for item in ('CH1-C', 'CH1-D'):
        chosen('question1', item)
    click('#confirmBtn')
    click('#confirmBtn')
    chosen('question2', 'CH2-F')
    click('#confirmBtn')
    chosen('diagnosis', 'D')
    click('[data-evidence-toggle="TK-D-LEVERAGE"]')
    chosen('primary-constraint', 'financing')
    chosen('causal-summary', 'financing-chain')
    chosen('source-check', 'verified')
    snap('06-diagnosis-desktop.png')
    click('#confirmBtn')
    chosen('treatment', 'C')
    click('#confirmBtn')
    chosen('timing', 'A')
    click('#confirmBtn')
    for kind, ident in (
        ('priority', 'Creditors'), ('priority', 'Suppliers'),
        ('priority', 'Governance & Family'),
        ('brief-message', 'explain'), ('brief-concern', 'ack'),
        ('brief-check', 'teach'), ('brief-disclosure', 'verified'),
        ('brief-consent', 'conditional'), ('risk', 'creditor'),
        ('risk-mitigation', 'prepare'),
    ):
        chosen(kind, ident)
    snap('09-preparation-desktop.png')
    if shots:
        page.set_viewport_size({'width': 390, 'height': 844})
        snap('09-preparation-mobile.png')
        width = page.evaluate('document.documentElement.scrollWidth')
        assert width <= 390, f'mobile horizontal overflow: {width}'
        page.set_viewport_size({'width': 1440, 'height': 900})
        page.reload()
        click('[data-menu-action="start"]')
        assert page.evaluate('state.currentScreen') == 9
        assert page.locator('[data-select-kind="priority"].selected').count() == 3
    click('#confirmBtn')
    assert page.evaluate('state.implementedTreatment') == 'C'
    assert page.evaluate('state.governanceState.disclosure') is True
    snap('10-event-desktop.png')
    if shots:
        page.locator('#confirmBtn').dblclick()
        assert page.evaluate('state.eventLedger.length') == 1, 'double click advanced two events'
    else:
        click('#confirmBtn')
    for _ in range(6):
        click('#confirmBtn')
    assert page.evaluate('state.currentScreen') == 11
    assert page.evaluate('state.eventLedger.length') == 7
    chosen('reassess-mode', 'KEEP')
    chosen('reassess-reason', 'confirmed')
    chosen('reassess-metric', 'debt')
    for kind, ident in (
        ('review-brief-message', 'review-explain'),
        ('review-brief-concern', 'review-ack'),
        ('review-brief-check', 'review-teach'),
        ('review-brief-disclosure', 'review-verified'),
        ('review-brief-consent', 'review-conditional'),
    ):
        chosen(kind, ident)
    click('#confirmBtn')
    assert page.locator('.result-card').count() == 1
    snap('12-result-desktop.png')
    result = page.evaluate('''() => ({
      screen: state.currentScreen,
      treatment: state.implementedTreatment,
      events: state.eventLedger.map(x => x.id),
      cash: state.financialState.cash,
      debt: state.financialState.debt,
      ebitda: state.financialState.ebitda,
      process: state.finalOutcome.process,
      financial: state.finalOutcome.financial,
      governance: state.finalOutcome.governance,
      ending: state.finalOutcome.ending.title
    })''')
    assert not errors, errors
    if shots:
        click('#reopenCaseBtn')
        assert page.evaluate('state.currentScreen') == 0
        assert page.evaluate('state.selectedDossiers.length') == 0
        assert page.evaluate('state.eventLedger.length') == 0
        assert page.evaluate("Object.values(state.evidenceLedger).every(x => x.status === 'LOCKED')")
    context.close()
    return result


if __name__ == '__main__':
    with sync_playwright() as pw:
        browser = pw.chromium.launch(channel='msedge', headless=True)
        integrated = run_case(browser, (ROOT / 'final.html').as_uri(), shots=True)
        baseline = run_case(browser, SOURCE.as_uri())
        assert integrated == baseline, (integrated, baseline)
        print('Browser journey and source-B state parity passed')
        print(integrated['ending'], integrated['process']['overall'])
        browser.close()
