"""Browser smoke test for final.html with the installed Chrome and CDP."""
import asyncio
import base64
import json
import re
import subprocess
import tempfile
import time
import urllib.request
from pathlib import Path

import websockets

ROOT = Path(__file__).resolve().parents[1]
SHOTS = ROOT / 'screenshots'
CHROME = Path(r'C:\Users\Mr.Nguyen Nhung\AppData\Local\Google\Chrome\Application\chrome.exe')


async def main(ws):
    sequence = 0
    errors = []

    async def send(method, params=None):
        nonlocal sequence
        sequence += 1
        ident = sequence
        await ws.send(json.dumps({'id': ident, 'method': method, 'params': params or {}}))
        while True:
            message = json.loads(await ws.recv())
            if message.get('method') == 'Runtime.exceptionThrown':
                errors.append(str(message['params']['exceptionDetails']))
            if message.get('id') == ident:
                if 'error' in message:
                    raise AssertionError(message['error'])
                return message.get('result', {})

    async def evaluate(expression):
        result = await send('Runtime.evaluate', {'expression': expression, 'returnByValue': True, 'awaitPromise': True})
        if 'exceptionDetails' in result:
            raise AssertionError(result['exceptionDetails'])
        return result.get('result', {}).get('value')

    async def click(selector):
        assert await evaluate(f'!!document.querySelector({json.dumps(selector)})'), selector
        await evaluate(f'document.querySelector({json.dumps(selector)}).click()')

    async def chosen(kind, ident):
        await click(f'[data-select-kind="{kind}"][data-select-id="{ident}"]')

    async def shot(name, width=1440, height=900):
        await send('Emulation.setDeviceMetricsOverride', {'width': width, 'height': height, 'deviceScaleFactor': 1, 'mobile': width < 600})
        await asyncio.sleep(.2)
        visible_text = await evaluate('document.body.innerText')
        assert not re.search(r'[À-ÖØ-öø-ỹ]', visible_text), f'Non-English text on {name}: {visible_text}'
        result = await send('Page.captureScreenshot', {'format': 'png', 'captureBeyondViewport': True})
        SHOTS.mkdir(exist_ok=True)
        (SHOTS / name).write_bytes(base64.b64decode(result['data']))

    await send('Page.enable')
    await send('Runtime.enable')
    await send('Page.navigate', {'url': (ROOT / 'final.html').as_uri()})
    for _ in range(120):
        if await evaluate('!!document.querySelector(".case-menu-card")'):
            break
        await asyncio.sleep(.2)
    else:
        raise AssertionError(f"Game did not render; JS errors: {errors}")

    assert await evaluate('document.querySelectorAll(".case-menu-card").length') == 2
    await click('#rulesBtn')
    assert await evaluate('document.activeElement.id') == 'rulesClose'
    assert await evaluate('!document.querySelector("#rulesModal").classList.contains("hidden")')
    await shot('ui-rules-desktop.png')
    await click('#rulesClose')
    assert await evaluate('document.activeElement.id') == 'rulesBtn'
    await click('[data-menu-action="start"]')
    assert await evaluate('state.currentScreen') == 0
    assert await evaluate('state.uiScene') == 'check'
    await shot('ui-check-it-out-desktop.png')
    await shot('ui-check-it-out-mobile.png', 390, 844)
    assert await evaluate('document.documentElement.scrollWidth <= 390')
    await send('Emulation.setDeviceMetricsOverride', {'width': 1440, 'height': 900, 'deviceScaleFactor': 1, 'mobile': False})
    await click('[data-story-next="inbox"]')
    assert await evaluate('state.uiScene') == 'inbox'
    await shot('ui-client-message-desktop.png')
    await send('Page.reload')
    await asyncio.sleep(.5)
    await click('[data-menu-action="start"]')
    assert await evaluate('state.uiScene') == 'inbox'
    await click('[data-story-next="game"]')
    assert await evaluate('state.uiScene') is None
    await click('#confirmBtn')
    assert await evaluate('state.currentScreen') == 1
    await shot('ui-clinic-desktop.png')
    await shot('ui-stepper-early-desktop.png')
    assert await evaluate('getComputedStyle(document.querySelector(".step")).fontSize') == '16px'
    assert await evaluate('getComputedStyle(document.querySelector(".step")).fontFamily.includes("Arial")')
    assert await evaluate('document.querySelector(".stepper-track").scrollWidth > document.querySelector(".stepper-track").clientWidth')
    await click('[data-step-scroll="1"]')
    await asyncio.sleep(.3)
    assert await evaluate('document.querySelector(".stepper-track").scrollLeft > 0')
    await evaluate('document.querySelector(".stepper-track").focus()')
    await evaluate('document.querySelector(".stepper-track").dispatchEvent(new KeyboardEvent("keydown", {key: "ArrowLeft", bubbles: true}))')
    await asyncio.sleep(.3)
    assert await evaluate('document.querySelector(".stepper-track").scrollLeft < 320')
    assert await evaluate('getComputedStyle(document.querySelector(".dialogue-card blockquote")).color') == 'rgb(24, 48, 74)'
    await click('#rulesBtn')
    assert await evaluate('state.currentScreen') == 1
    await click('#rulesClose')
    await click('#confirmBtn')
    assert await evaluate('state.uiScene') == 'before-round-2'
    await shot('ui-before-round-2-desktop.png')
    await send('Page.reload')
    await asyncio.sleep(.5)
    await click('[data-menu-action="start"]')
    assert await evaluate('state.uiScene') == 'before-round-2'
    await shot('ui-before-round-2-mobile.png', 390, 844)
    assert await evaluate('document.documentElement.scrollWidth <= 390')
    assert await evaluate('document.querySelector(".story-image-scene").scrollWidth > document.querySelector(".story-image-scene").clientWidth')
    await send('Emulation.setDeviceMetricsOverride', {'width': 1440, 'height': 900, 'deviceScaleFactor': 1, 'mobile': False})
    await click('[data-story-next="game"]')
    assert await evaluate('state.currentScreen') == 2
    await shot('ui-profile-desktop.png')
    assert await evaluate('document.querySelector(".client-portrait").naturalWidth > 0')
    assert await evaluate('document.querySelector(".client-portrait").getAttribute("src").includes("round1/david.png")')
    for ident in ('HS-D', 'HS-B', 'HS-G'):
        await chosen('dossier', ident)
    assert await evaluate('document.querySelector("#evidenceModal").classList.contains("hidden")')
    assert await evaluate('state.selectedDossiers.length === 0')
    await click('#confirmBtn')
    assert await evaluate('state.uiScene') == 'doc-intro'
    reputation_after_dossier = await evaluate('state.reputation')
    await send('Page.reload')
    await asyncio.sleep(.5)
    await click('[data-menu-action="start"]')
    assert await evaluate('state.uiScene') == 'doc-intro'
    assert await evaluate('state.reputation') == reputation_after_dossier
    await shot('ui-doc-g-intro-desktop.png')
    await click('[data-story-next="doc-envelope"]')
    await shot('ui-doc-g-envelope-desktop.png')
    await click('[data-story-next="doc-letter"]')
    await shot('ui-doc-g-letter-desktop.png')
    assert await evaluate('document.querySelector(".doc-letter-zoom img").naturalWidth > 0')
    assert await evaluate('state.selectedDossiers.includes("HS-G")')
    await click('[data-letter-zoom]')
    assert await evaluate('document.querySelector("[data-letter-zoom]").classList.contains("zoomed")')
    await evaluate('document.dispatchEvent(new KeyboardEvent("keydown", {key: "Escape", bubbles: true}))')
    assert await evaluate('!document.querySelector("[data-letter-zoom]").classList.contains("zoomed")')
    await shot('ui-doc-g-letter-mobile.png', 390, 844)
    assert await evaluate('document.documentElement.scrollWidth <= 390')
    await send('Emulation.setDeviceMetricsOverride', {'width': 1440, 'height': 900, 'deviceScaleFactor': 1, 'mobile': False})
    await click('[data-story-next="game"]')
    assert await evaluate('state.currentScreen') == 3
    assert await evaluate('document.querySelector("#confirmBtn").disabled')
    assert await evaluate('document.querySelector("#evidenceModal").classList.contains("hidden")')
    for ident in ('CH1-C', 'CH1-D'):
        await chosen('question1', ident)
    assert await evaluate('document.querySelector("#evidenceModal").classList.contains("hidden")')
    before_question_record = await evaluate('JSON.stringify({reputation:state.reputation,answered:state.answeredQuestions.length,ledger:JSON.stringify(state.evidenceLedger)})')
    await click('#confirmBtn')
    assert await evaluate('!document.querySelector("#evidenceModal").classList.contains("hidden")')
    assert await evaluate('document.querySelector("#modalTitle").textContent === "Selected documents"')
    after_question_record = await evaluate('JSON.stringify({reputation:state.reputation,answered:state.answeredQuestions.length,ledger:JSON.stringify(state.evidenceLedger)})')
    assert after_question_record != before_question_record
    recorded_question_state = await evaluate('JSON.stringify({reputation:state.reputation,answered:state.answeredQuestions.length,ledger:JSON.stringify(state.evidenceLedger),confirmed:[...state.confirmedScreens]})')
    await click('#reviewDossiersContinue')
    assert await evaluate('document.querySelector("#evidenceModal").classList.contains("hidden")')
    assert await evaluate('JSON.stringify({reputation:state.reputation,answered:state.answeredQuestions.length,ledger:JSON.stringify(state.evidenceLedger),confirmed:[...state.confirmedScreens]})') == recorded_question_state
    await send('Page.reload')
    await asyncio.sleep(.5)
    await click('[data-menu-action="start"]')
    assert await evaluate('document.querySelector("#evidenceModal").classList.contains("hidden")')
    assert await evaluate('state.uiScene') == 'before-round-4'
    await shot('ui-before-round-4-desktop.png')
    await send('Page.reload')
    await asyncio.sleep(.5)
    await click('[data-menu-action="start"]')
    assert await evaluate('state.uiScene') == 'before-round-4'
    await click('[data-story-next="game"]')
    assert await evaluate('state.currentScreen') == 4
    await click('#confirmBtn')
    assert await evaluate('state.uiScene') == 'before-round-5-governance'
    await shot('ui-before-round-5-governance-desktop.png')
    await click('[data-story-next="before-round-5-common"]')
    assert await evaluate('state.uiScene') == 'before-round-5-common'
    await click('[data-story-next="game"]')
    assert await evaluate('state.currentScreen') == 5
    await chosen('question2', 'CH2-F')
    await click('#confirmBtn')
    assert await evaluate('state.currentScreen') == 6
    assert await evaluate('getComputedStyle(document.querySelector(".decision-head"), "::after").content === "none"')
    assert await evaluate('document.querySelector(".choice-question").textContent.length > 10')
    assert await evaluate('getComputedStyle(document.querySelector(".choice-question")).fontSize') == '22px'
    assert await evaluate('getComputedStyle(document.querySelector(".option-card h3")).fontFamily.includes("Times New Roman")')
    assert await evaluate('getComputedStyle(document.querySelector(".option-card h3")).fontSize') == '18px'
    assert await evaluate('getComputedStyle(document.querySelector(".option-card p")).fontSize') == '16px'
    assert await evaluate('getComputedStyle(document.querySelector(".answer-block p")).fontSize') == '16px'
    assert await evaluate('getComputedStyle(document.querySelector(".answer-block p")).fontFamily.includes("Arial")')
    assert await evaluate('document.querySelector(".decision-card").getBoundingClientRect().width > 1000')
    assert await evaluate('getComputedStyle(document.querySelector(".game-hero"), "::after").content === "none"')
    assert await evaluate('document.querySelectorAll(".option-id").length') == 0
    await shot('ui-diagnosis-desktop.png')
    await shot('ui-replay-clean-desktop.png')
    before_rules = await evaluate('JSON.stringify(state.draftSelection)')
    await click('#rulesBtn')
    assert await evaluate('JSON.stringify(state.draftSelection)') == before_rules
    await evaluate('document.dispatchEvent(new KeyboardEvent("keydown", {key: "Escape", bubbles: true}))')
    assert await evaluate('document.querySelector("#rulesModal").classList.contains("hidden")')
    assert await evaluate('document.activeElement.id') == 'rulesBtn'
    await shot('ui-diagnosis-mobile.png', 390, 844)
    assert await evaluate('document.documentElement.scrollWidth <= 390')
    await click('#rulesBtn')
    await shot('ui-rules-mobile.png', 390, 844)
    await click('#rulesClose')
    await send('Emulation.setDeviceMetricsOverride', {'width': 1440, 'height': 900, 'deviceScaleFactor': 1, 'mobile': False})
    await chosen('diagnosis', 'D')
    await click('[data-evidence-toggle="TK-D-LEVERAGE"]')
    for kind, ident in (('primary-constraint', 'financing'), ('causal-summary', 'financing-chain'), ('source-check', 'verified')):
        await chosen(kind, ident)
    await click('#confirmBtn')
    await chosen('treatment', 'C')
    await click('#confirmBtn')
    assert await evaluate('state.uiScene') == 'before-round-8'
    await shot('ui-before-round-8-desktop.png')
    await click('[data-story-next="game"]')
    await chosen('timing', 'A')
    await click('#confirmBtn')
    for kind, ident in (
        ('priority', 'Creditors'), ('priority', 'Suppliers'), ('priority', 'Governance & Family'),
        ('brief-message', 'explain'), ('brief-concern', 'ack'), ('brief-check', 'teach'),
        ('brief-disclosure', 'verified'),
        ('risk', 'creditor'), ('risk-mitigation', 'prepare'),
    ):
        await chosen(kind, ident)
    assert await evaluate('!document.querySelector("[data-select-kind=brief-consent]")')
    await click('#confirmBtn')
    assert await evaluate('state.clientState.consent === \"agree\"')
    while await evaluate('state.currentScreen === 10'):
        await click('#confirmBtn')
    assert await evaluate('state.uiScene') == 'before-round-11'
    await shot('ui-before-round-11-desktop.png')
    reputation_before_migration = await evaluate('state.reputation')
    await evaluate("(function(){state.contentVersion='case01-toy-kingdom-v3';state.answeredQuestions[0].answer='OLD ANSWER';state.eventSequence[0].text='OLD UPDATE';state.eventLedger[0].text='OLD UPDATE';state.eventEvidence['TK-EVENT-SALES'].text='OLD UPDATE';saveState()})()")
    await send('Page.reload')
    await asyncio.sleep(.5)
    await click('[data-menu-action="start"]')
    assert await evaluate('state.reputation') == reputation_before_migration
    assert await evaluate('state.answeredQuestions[0].answer !== "OLD ANSWER"')
    assert await evaluate('state.eventSequence[0].text !== "OLD UPDATE"')
    assert await evaluate('state.eventLedger[0].text !== "OLD UPDATE"')
    assert await evaluate('state.eventEvidence["TK-EVENT-SALES"].text !== "OLD UPDATE"')
    await click('[data-story-next="game"]')
    assert await evaluate('state.currentScreen') == 11
    assert await evaluate('!!document.querySelector(".reassessment-doctor")')
    assert await evaluate('!document.querySelector("[data-select-kind=brief-message]")')
    for mode, question in (
        ('KEEP', 'Why are you keeping both the diagnosis and treatment?'),
        ('DIAGNOSIS', 'Why are you changing the diagnosis?'),
        ('TREATMENT', 'Why are you changing the treatment?'),
        ('BOTH', 'Why are you changing both the diagnosis and treatment?'),
    ):
        await chosen('reassess-mode', mode)
        assert await evaluate(f'document.querySelector(".reassessment-panel .choice-question").textContent === {json.dumps(question)}')
        assert await evaluate('state.structured.reassessmentReason === null')
    await chosen('reassess-mode', 'KEEP')
    assert await evaluate('!document.querySelector("[data-select-kind=reassess-diagnosis]") && !document.querySelector("[data-select-kind=reassess-treatment]")')
    await shot('ui-followup-desktop.png')
    await shot('ui-followup-mobile.png', 390, 844)
    assert await evaluate('document.documentElement.scrollWidth <= 390')
    await send('Emulation.setDeviceMetricsOverride', {'width': 1440, 'height': 900, 'deviceScaleFactor': 1, 'mobile': False})
    await asyncio.sleep(.1)
    assert await evaluate('document.querySelector(".stepper-track").scrollLeft > 0')
    assert await evaluate('document.querySelector(".step.current").getBoundingClientRect().right <= document.querySelector(".stepper-track").getBoundingClientRect().right')
    await shot('ui-stepper-late-desktop.png')
    for kind, ident in (
        ('reassess-mode', 'KEEP'), ('reassess-reason', 'confirmed'), ('reassess-metric', 'debt'),
    ):
        await chosen(kind, ident)
    await click('#confirmBtn')
    assert await evaluate('state.currentScreen') == 12
    assert await evaluate('Number(document.querySelector(".conclusion-score strong").textContent) === state.finalOutcome.overall')
    assert await evaluate('Number(document.querySelector(".conclusion-outcomes strong").textContent.split("/")[0]) === state.finalOutcome.financial.score')
    assert await evaluate('document.querySelector(".conclusion-profile").textContent.includes("Capital Structure")')
    assert await evaluate('document.querySelector(".conclusion-hero img").getAttribute("src").includes("doctor-good") === (state.finalOutcome.overall >= 85) || state.finalOutcome.overall < 85')
    await shot('ui-result-desktop.png')
    for score in (84, 85, 86):
        expected = await evaluate(f'summaryDoctorAsset({score}, state.finalOutcome.financial.tier)')
        assert expected.endswith('doctor-good.png') if score >= 85 else expected.endswith(('doctor-bad.png', 'doctor-medium.png', 'doctor-good.png'))
        await evaluate(f'(function(){{const copy=JSON.parse(JSON.stringify(state));copy.finalOutcome.overall={score};document.querySelector(\".conclusion\").outerHTML=renderConclusion(copy)}})()')
        await shot(f'ui-conclusion-{score}-desktop.png')
    await evaluate('(function(){document.querySelector(".conclusion").outerHTML=renderConclusion(state)})()')
    await shot('ui-result-mobile.png', 390, 844)
    assert await evaluate('document.documentElement.scrollWidth <= 390')
    await send('Emulation.setDeviceMetricsOverride', {'width': 1440, 'height': 900, 'deviceScaleFactor': 1, 'mobile': False})
    assert await evaluate('document.documentElement.scrollWidth <= 1440')
    previous_score = await evaluate('state.finalOutcome.overall')
    await send('Page.reload')
    await asyncio.sleep(.5)
    await click('[data-menu-action="start"]')
    assert await evaluate('state.finalOutcome.overall') == previous_score
    await click('#reopenCaseBtn')
    await click('[data-story-next="inbox"]')
    await click('[data-story-next="game"]')
    await click('#confirmBtn')
    await click('#confirmBtn')
    assert await evaluate('state.uiScene') == 'before-round-2'
    await click('[data-story-next="game"]')
    for ident in ('HS-A', 'HS-B', 'HS-C'):
        await chosen('dossier', ident)
    await click('#confirmBtn')
    assert await evaluate('state.uiScene') is None
    assert await evaluate('state.currentScreen') == 3
    for ident in ('CH1-C', 'CH1-D'):
        await chosen('question1', ident)
    await click('#confirmBtn')
    assert await evaluate('state.uiScene') == 'before-round-4'
    await click('[data-story-next="game"]')
    await click('#confirmBtn')
    assert await evaluate('state.uiScene') == 'before-round-5-common'
    await shot('ui-before-round-5-standard-desktop.png')
    await send('Page.reload')
    await asyncio.sleep(.5)
    await click('[data-menu-action="start"]')
    assert await evaluate('state.uiScene') == 'before-round-5-common'
    await click('[data-story-next="game"]')
    assert await evaluate('state.currentScreen') == 5
    assert not errors, errors
    print('Browser UI journey passed; scores, profile, contrast, typography, rules and mobile overflow checked')


if __name__ == '__main__':
    with tempfile.TemporaryDirectory(prefix='medifin-chrome-') as profile:
        proc = subprocess.Popen([str(CHROME), '--headless', '--disable-gpu', '--disable-software-rasterizer',
                                 '--no-sandbox', '--no-first-run', '--remote-allow-origins=*',
                                 '--remote-debugging-port=9223', f'--user-data-dir={profile}', 'about:blank'],
                                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        try:
            tabs = None
            for _ in range(60):
                try:
                    tabs = json.load(urllib.request.urlopen('http://127.0.0.1:9223/json', timeout=1))
                    if tabs:
                        break
                except Exception:
                    time.sleep(.2)
            if not tabs:
                raise RuntimeError('Chrome debugging endpoint did not start')
            async def run():
                tab = next(t for t in tabs if t.get('type') == 'page' and t.get('url', '').startswith('about:'))
                async with websockets.connect(tab['webSocketDebuggerUrl'], max_size=30_000_000) as ws:
                    await main(ws)
            asyncio.run(run())
        finally:
            proc.terminate()
            try:
                proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                proc.kill()
