# Case 01 integration notes

## Source mapping

`G02/medifin-v3/index.html` loads only its `app.js`; its `js/state.js`, `js/router.js` and `js/scoring.js` are not loaded by that entry point. Those files are not part of the integrated runtime. The integrated `final.html` loads exactly one engine and one UI adapter.

| A view/round | Integrated screen | Actions and state owned by B |
| --- | --- | --- |
| Intake and client meeting | 0–1 | Read case facts and David's interview; no scoring effect |
| Case files and document viewer | 2 | Select three dossiers, lock the rest, reveal evidence with provenance |
| Follow-up questions and answers | 3 | Select two questions; reveal clue level evidence |
| Financial statements | 4 | Reveal the financial statement evidence |
| Final question and answer | 5 | Ask one final question, with answer based on acquired knowledge |
| Diagnosis | 6 | Choose hypothesis, cite eligible evidence, record constraint, causal chain and source checks |
| Treatment | 7 | Propose one treatment without applying its effects |
| Timing | 8 | Choose timing; resolve refinancing when applicable |
| Preparation | 9 | Choose three stakeholders, brief David, disclose risk, obtain consent, plan mitigation; resolve approval and implement Period 1 treatment |
| Seven progress updates | 10 | Reveal resolved events in order, once each |
| Follow-up | 11 | Reassess using acquired evidence, rationale, monitoring metric and review briefing |
| Conclusion | 12 | Show financial, governance, six competency, client experience and overall results |

A uses additional view indices for document and answer viewers. The integrated game uses B's business screen IDs 0–12 and keeps document/evidence reading in a modal, so view indices never control scoring or evidence access.

## Decision boundaries

- B is authoritative for case facts, scoring, simulation, state and endings. The revised Word user flow is reference content only.
- Opening HS-G reveals verified knowledge but does not mark the disclosure action complete. Screen 9 records disclosure from the player's briefing choice. This fixes a contradiction found in B.
- Proposed, approved and implemented treatments remain separate. Screen 7 only drafts the proposal; Screen 9 applies the approved treatment once and then creates the event sequence.
- The integrated save key never migrates, reads or clears saves from either source build.
- Draft choices are saved as they are made, so reload before confirmation restores the visible selection. Repeated physical clicks on the same confirmation control advance at most one timeline update.
- Source document PNGs include older text, so displaying them as evidence would present conflicting facts. The integrated viewer uses current data-driven dossier content.

## Test status

- Static file and asset checks pass with `python -X utf8 tests/static_check.py`.
- Both JavaScript files parse without syntax errors in a JavaScript grammar parser.
- Playwright drove Edge through a full 13-screen UI path. The integrated run matched B's treatment, financial state, events, six competency scores and ending; Counselor Process was 93. Reload retained three draft priorities, a double click advanced only one event, and replay cleared evidence and events.
- A second viable path completed with Counselor Process 91. A deliberately weak path completed at 49, downgraded proposed F to implemented B and applied the Ethics cap of 59. Without HS-G, CH2-G did not reveal the exact contract threshold.
- Eight representative desktop/mobile screenshots are in `screenshots/`. The 390px mobile page passed a no-horizontal-overflow check. The original A design is adapted, not reproduced pixel for pixel; its document PNGs remain unused where their embedded facts conflict with current case data.
- Nine ending fixtures, two simultaneous saved runs and exhaustive visual comparison of every round remain unverified.

No changes were made to the source folders and nothing was published.
