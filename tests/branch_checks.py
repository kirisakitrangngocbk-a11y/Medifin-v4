"""Two additional Case 01 browser branches. Requires playwright and Edge."""

from pathlib import Path
from playwright.sync_api import sync_playwright

URL = (Path(__file__).resolve().parents[1] / 'final.html').as_uri()


def branch(browser, weak):
    context = browser.new_context()
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda err: errors.append(str(err)))
    page.goto(URL)

    def click(selector):
        page.locator(selector).first.click()

    def select(kind, ident):
        click(f'[data-select-kind="{kind}"][data-select-id="{ident}"]')

    click('[data-menu-action="start"]')
    click('#confirmBtn')
    click('#confirmBtn')
    for dossier in (('HS-A', 'HS-B', 'HS-E') if weak else ('HS-A', 'HS-C', 'HS-D')):
        select('dossier', dossier)
    click('#confirmBtn')
    for question in (('CH1-A', 'CH1-E') if weak else ('CH1-C', 'CH1-G')):
        select('question1', question)
    click('#confirmBtn')
    click('#confirmBtn')
    select('question2', 'CH2-C' if weak else 'CH2-G')
    click('#confirmBtn')
    if not weak:
        assert page.evaluate("state.answeredQuestions.at(-1).answer.includes('$752.4m')") is False
        assert page.evaluate("state.governanceState.disclosure") is False
    select('diagnosis', 'A' if weak else 'D')
    click('[data-evidence-toggle="TK-A-SSS"]' if weak else '[data-evidence-toggle="TK-D-LEVERAGE"]')
    select('primary-constraint', 'operations' if weak else 'financing')
    select('causal-summary', 'sales-chain' if weak else 'financing-chain')
    select('source-check', 'none' if weak else 'uncertain')
    click('#confirmBtn')
    select('treatment', 'F' if weak else 'E')
    click('#confirmBtn')
    select('timing', 'D' if weak else 'B')
    click('#confirmBtn')
    for priority in (('Employees', 'Customers', 'Landlords') if weak else ('Suppliers', 'Creditors', 'Governance & Family')):
        select('priority', priority)
    for kind, ident in (
        ('brief-message', 'guarantee' if weak else 'explain'),
        ('brief-concern', 'pressure' if weak else 'ack'),
        ('brief-check', 'none' if weak else 'teach'),
        ('brief-disclosure', 'omit' if weak else 'uncertain'),
        ('brief-consent', 'decline' if weak else 'conditional'),
        ('risk', 'cash' if weak else 'creditor'),
        ('risk-mitigation', 'none' if weak else 'prepare'),
    ):
        select(kind, ident)
    if weak:
        assert page.locator('[data-select-kind="approval-ack"]').count() == 1
        select('approval-ack', 'accept-fallback')
    click('#confirmBtn')
    if weak:
        assert page.evaluate('state.proposedTreatment') == 'F'
        assert page.evaluate('state.implementedTreatment') == 'B'
        assert page.evaluate('state.governanceState.disclosure') is False
    else:
        assert page.evaluate('state.implementedTreatment') == 'E'
        assert page.evaluate('state.governanceState.disclosure') is True
    for _ in range(7):
        click('#confirmBtn')
    select('reassess-mode', 'KEEP')
    select('reassess-reason', 'uncertain' if weak else 'confirmed')
    select('reassess-metric', 'continuity' if weak else 'cash')
    for kind, ident in (
        ('review-brief-message', 'review-guarantee' if weak else 'review-explain'),
        ('review-brief-concern', 'review-pressure' if weak else 'review-ack'),
        ('review-brief-check', 'review-none' if weak else 'review-teach'),
        ('review-brief-disclosure', 'review-omit' if weak else 'review-uncertain'),
        ('review-brief-consent', 'review-decline' if weak else 'review-conditional'),
    ):
        select(kind, ident)
    click('#confirmBtn')
    result = page.evaluate('state.finalOutcome')
    assert page.locator('.result-card').count() == 1
    assert not errors, errors
    if weak:
        assert result['process']['ethicsCap'] == 59
        assert result['process']['overall'] <= 59
    print('weak' if weak else 'alternative', result['ending']['title'], result['process']['overall'])
    context.close()


if __name__ == '__main__':
    with sync_playwright() as pw:
        browser = pw.chromium.launch(channel='msedge', headless=True)
        branch(browser, False)
        branch(browser, True)
        browser.close()
