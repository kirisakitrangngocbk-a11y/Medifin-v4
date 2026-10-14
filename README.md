# MEDIFIN integrated — Case 01

Open `final.html` in a current browser. A local static server also works:

```powershell
python -m http.server 8000
```

Then open `http://localhost:8000/final.html`. No build step or network dependency is required for the game logic. The source builds are left intact.

The integrated game uses the Case 01 data, state transitions, simulation, evidence ledger and scoring v3 from `Medifin`. `engine.js` owns these rules. `app.js` renders the 13 game screens and dispatches player actions to that engine. The single save key uses the `medifin-integrated-save-` prefix so it cannot load or erase a source build's save.

`integrated.css` adapts the typography, palette, imagery and responsive treatment of `G02/medifin-v3` to the complete Case 01 flow. The copied assets are in `asset/images/`. Images of documents A–G contain embedded text that may disagree with current game data; those images are therefore retained as source assets but not displayed as evidence. The current case facts and document content are rendered from `engine.js`.

The player UI now uses larger text, a horizontally scrollable round indicator, a chest-up David portrait and wider decision cards. The received-answer blocks use a Vietnamese-friendly sans-serif font. Decorative figures were removed from the replay area. These changes are limited to rendering and styles; `engine.js` remains the scoring source.

See [INTEGRATION_NOTES.md](INTEGRATION_NOTES.md) for round mapping, source conflicts and the test status.

Run the static checks with `python -X utf8 tests/static_check.py`. On this machine, run `python tests/browser_ui_check.py` for a full browser journey and screenshots of the clinic, diagnosis, profile, rules and results. The Playwright parity checks remain in `tests/flow_compare.py` and `tests/branch_checks.py` for environments with Playwright and Edge; `flow_compare.py` points to the local B source checkout, so adjust that constant if the source folder moves.
