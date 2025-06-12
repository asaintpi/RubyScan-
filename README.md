# RubyScan – Milestone 1 (Scan Bar)

Version **0.2.0** introduces the ruby scan animation:

- **Ctrl+F** → RubyScan input.
- Press **Enter** → horizontal scan bar sweeps the viewport.
- Every word flashes ruby as line passes.
- Matching words remain glowing.

## Install / Reload

1. Open **chrome://extensions**.
2. _If already installed_ → click **Refresh** on RubyScan.
3. _New install_ → **Load unpacked** → select `rubyscan` folder.

## Known Limitations

- Full-page wrapping may lag on pages >1 MB HTML (will optimize in Milestone 2).
- Does exact‑case matching; no partial/fuzzy search yet.
- No next/prev arrows (Milestone 2).

## Next Up

- Viewport‑only wrapping & performance tuning.
- Next/Prev navigation and hit count.
- Options page (speed + themes).
