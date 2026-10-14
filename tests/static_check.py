from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]
html = (root / 'final.html').read_text(encoding='utf-8')
engine = (root / 'engine.js').read_text(encoding='utf-8')
ui = (root / 'app.js').read_text(encoding='utf-8')
css = (root / 'integrated.css').read_text(encoding='utf-8')

assert html.index('src="engine.js"') < html.index('src="app.js"')
assert 'src="app.js"' in html and 'href="integrated.css"' in html
assert 'function makeInitialState()' in engine
assert 'function calculateCounselorPerformance(state)' in engine
assert 'function render()' in ui
assert 'function calculateCounselorPerformance(state)' not in ui
assert "const STORAGE_PREFIX = 'medifin-integrated-save-'" in engine
assert 'return makeInitialState();' in engine
assert 'localStorage.removeItem(LEGACY_TOY_KEY)' not in engine
assert "state.governanceState.disclosure = d.dossiers.includes('HS-G')" not in engine
assert "['verified', 'uncertain'].includes(state.structured.initialBriefing?.disclosure)" in engine
assert 'state.eventSequence = buildEventSequence(state)' in engine
assert 'state.implementedTreatment = approval.implementedTreatment' in engine
for name in ('investigationScore', 'reasoningScore', 'suitabilityScore',
             'communicationScore', 'ethicsScore', 'adaptationScore'):
    assert f'function {name}(' in engine
for stage in range(13):
    assert f"if (s === {stage})" in ui or stage == 12
for url in re.findall(r"url\(['\"]?([^)'\"]+)", css):
    if url.startswith('asset/'):
        assert (root / url).is_file(), url
for url in re.findall(r'"(asset/images/[^" ]+)"', ui):
    assert (root / url).is_file(), url
print('Static integration checks passed')
