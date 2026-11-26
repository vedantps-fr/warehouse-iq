# Live Arrival Index: step-by-step build process

Problem Statement 09, The Warehouse's Broken Number Ranges.
Rule: do one step at a time. A step is Done only when its check has passed. Record the result in the log at the bottom.

## Decisions
- **Data structure:** an AVL tree whose nodes are ranges `[start, end]`. A switch turns balancing off (Unbalanced mode) for comparison.
- **3D engine:** written in-house on Canvas 2D (perspective camera, orbit/zoom/pan, shaded boxes, lines, labels, click picking). Why: Three.js cannot be downloaded in the build workspace, so it could not be tested. An in-house engine can be checked with real screenshots, and the page needs no outside library.
- **Layout:** one page with separate sections and a top navigation bar. Each section has its own address (`#index`, `#dashboard`, …).
- **Logic is kept apart from drawing.** Every operation returns an event (path visited, case, rotations), and the views only draw events.

## Steps

| # | Step | Check that proves it | Status |
|---|------|----------------------|--------|
| 0 | Process file and plan | This file exists | Done |
| 1 | Core logic: insert (new / extend left / extend right / bridge / duplicate), insertRange, delete with splitting, range and gap query, invariant checker, brute-force oracle | 21 unit tests pass in Node; 10,000 random operations match brute force | Done |
| 2 | 3D engine: camera, orbit/zoom/pan, boxes with lighting, lines and curves, text labels, click picking, animation loop that pauses when off-screen | Test scene renders in headless Chrome; a click picks the right box | Done |
| 3 | App shell: top navigation, sections, address routing, light and dark theme | Every link opens its section; back button works | Done |
| 4 | Section "Live index": 3D tree and 3D number line in one scene; packages drop in; search path glows; tether ray from a clicked node to its block on the line; caption for every case; play, pause, step, speed; undo, redo, reset; presets | Problem example plays and ends with [1,3] [6,7], gap [4,5] | Done |
| 5 | Section "Dashboard": stat tiles, 3D bars of nodes visited per operation against 2 log₂ n, 3D memory towers (tree vs. array), case breakdown, height meter | Numbers match the core after a scripted run | Done |
| 6 | Section "AVL vs Unbalanced": two 3D trees fed the same IDs side by side | Sorted input: AVL height ≤ 1.44 log₂ n, Unbalanced height = n | Done |
| 7 | Section "Bridge demo": before and after in 3D, with the two neighbours marked | [1,3] [5,8] + 4 gives [1,8]; caption names the two neighbours | Done |
| 8 | Section "Tests": test runner, inject-a-bug, 50,000-ID stress test | All tests green; stress finishes with invariants valid | Done |
| 9 | Section "Data": operation log, copy as JSON, share code export and import | Share code round-trips to the same ranges | Done |
| 10 | Polish: keyboard keys, phone layout, reduced motion, input errors | No sideways scroll at 390 px wide; bad input shows a message | Done |
| 11 | Full regression in headless Chrome, then publish | No page errors; screenshots of every section look right | Done |
| 12 | Restyle to the reference design: dark navy and cyan, Orbitron + Inter + JetBrains Mono, header bar, cards, buttons, inputs | Screenshot matches the reference look | Done |
| 13 | Warehouse home page: KPI tiles, interval cards with gap connectors, ingest panel (single, quick, batch), gap analysis panel | Tiles and cards match the core for the problem example | Done |
| 14 | 3D warehouse hangar: one rack per range, one box per package, gap markers, arrival drop animation, 5 camera modes | All 5 camera modes render; a new package drops into its rack | Done |
| 15 | Demonstration mode (9 scenarios, each checked against its expected result), home test panel, audit trail with timestamps | All 9 scenarios match their expected ranges | Done |
| 16 | Restyle the 3D palette and the other sections (index tree, dashboard, compare, bridge, tests, log) | Each section screenshot reads well in the new style | Done |
| 17 | Full regression, then publish | No page errors; every earlier check still passes | Done |
| 18 | Story mode plan (from the friend's prompt): keep Warehouse IQ, add a Story section; keep the tested engine. Fix the prompt's chapter-4 input (sorted 1..200 would merge into one range; use 2, 4, … 400) | Plan recorded here | Done |
| 19 | Engine effects: depth fog, additive glow halos, drifting particles, ring pulses | Test scene shows each effect; no page errors | Done |
| 20 | Tree view effects: ±2 balance badge before each rotation, insertRange sweep bar, delete split animation, animated linear↔compressed track, camera auto-focus | Each effect visible on the Index tree page | Done |
| 21 | Story shell: enter screen, chapter indicator 1–4, skip, next, auto-play, fading narration, keys 1–4 / Space / ← → / ?, sound toggle (Web Audio, muted by default) | Enter → chapter 1 → skip → … → ending works by mouse and keys | Done |
| 22 | Chapters 1–4 scripted: Arrivals (press and hold to stream), Bridges (split view, sweep, split), Vast Gaps (scale morph, memory counter), Balance (LL, RR, LR, RL, then 200 sorted IDs AVL vs Unbalanced) | Each chapter ends in the expected state | Done |
| 23 | Ending screen: invariants, test pass count, oracle mismatch count over 10,000 random ops (must be 0), stress time, height, ranges; restart and explore | Numbers shown match the core | Done |
| 24 | Full regression, then publish | No page errors; every earlier check still passes | Done |

## Log
- Step 0: process file written.
- Step 1: 21 of 21 unit tests pass in Node, including 10,000 random mixed operations against brute force. 50,000 random IDs insert in about 0.14 s with height 19.
- Step 2: engine test page rendered 3 shaded boxes, edges, a floor with shadows, a dashed curve and labels. Clicking the projected centres picked boxes 1, 2, 3 and empty space as expected. Drag changed the orbit angle; the wheel zoomed.
- Steps 3–4: navigation and routing work. Preset 1 played in headless Chrome and ended with [1,3] [6,7] and gap [4,5]. Clicking a node selected it and drew the ray to its track block. Fixed: the camera framed the scene too loosely, so track numbers were too small; framing tightened and labels enlarged.
- Step 5: after inserting 1,3,7,2,6,10⁹,5·10⁸ the tiles showed 4 ranges, 7 IDs, height 3, 7 operations, 1 rotation, matching the core. Bug found and fixed: "nodes visited" also counted an internal lookup made after the insert. It now counts only the floor and higher searches; 5,000 random inserts never exceed 2·height+2. The reference line is now 2 log₂ n, since an insert runs two searches.
- Step 6: sorted 2…30 (15 IDs): AVL height 4 (bound 5.9) with 11 rotations; Unbalanced height 15, one chain. Bad custom input ("x") shows an error. Fixed: the angled camera made the trees recede so labels vanished; this view now uses a near-front camera, and labels keep a readable minimum size when they fit their box.
- Step 7: [1,3] [5,8] + other ranges 12-14, 20, 26-30; adding 4 gave [1,8], 5 nodes → 4, the other ranges untouched, invariants valid. The package hops along the search path. Bad set-ups show clear messages. Fixed: (a) small pill tags were skipped, so "floor(4)" and "higher(4)" did not show; pills now keep a minimum size. (b) A view built while its section was hidden kept a wrong camera distance; the engine now refits when the canvas size changes.
- Step 8: 21 of 21 tests pass in the page. "Inject a bug" turned both badges red; undo turned them green again. Stress: 50,000 IDs at about 2.5 µs each, height 19 (bound 22.5), invariants valid, brute force agrees. Fixed: the top 7 levels (127 nodes) were too wide to read, so the view now shows the top 5.
- Step 9: insert 1,3,9,4, range 20-40, remove 30 gave [1,1] [3,4] [9,9] [20,29] [31,40]. The share code LAI1:i1.i3.i9.i4.r20-40.d30 imported back to the same ranges; a broken code shows "Unreadable part". Fixed: the nav badges were cutting off the last link; badge text shortened.
- Step 10: at 390 px wide, none of the 6 sections scrolls sideways, in light or dark mode. Keyboard: Space pauses, then steps one arrival (4 waiting → 3); ← undoes; ? shows the key list. Dark mode checked on the Bridge demo.
- Step 11: final build re-run end to end. Node: 21/21. Browser: Live index, Dashboard, Compare, Bridge, Tests and Log-and-share checks all passed with no page errors. Published as a new version of the same page.
- Step 12: switched to the reference style: dark navy with cyan, Orbitron headings, Inter labels, JetBrains Mono data, glowing KPI and card borders. Fixed: the header wrapped untidily, so it is now brand and status on top with section tabs underneath.
- Step 13: scenario 1 gave tiles of 5 packages, 2 intervals, 2 missing in [1..7], 0 duplicates. Interval cards: INTERVAL #1 [1,3] 3 PACKAGES, GAP [4..5] 2 MISSING, INTERVAL #2 [6,7] 2 PACKAGES. The audit trail matches the reference rows.
- Step 14: hangar renders racks, blue package boxes, amber gap bays and the drop animation, in all 5 camera modes. Investigated: racks seemed missing in a full-page screenshot, but the canvas was only paused while off-screen (as designed); starting a scenario now scrolls the hangar into view. Fixed: the framing formula cut racks off at angled views, so the engine now projects the 8 bounding-box corners through the camera to find the exact distance.
- Step 15: all 9 demonstration scenarios PASS against their expected ranges (scenario 4 also confirms 3 duplicates). Home test panel: 21 / 21 passed (100%).
- Step 16: the Index tree, Dashboard, AVL vs Unbalanced, Bridge, Tests and Log sections all render in the new style, with the 3D palette switched to navy nodes with cyan edges. Fixed: on phones the sticky header took 190 px, so it is now compact (95 px) and the KPI tiles sit two per row. The Bridge button stayed disabled after one run; it now offers "Play again".
- Step 17: final build re-run end to end. Node: 21/21. Browser: Index tree, Dashboard, compare, bridge, tests and share checks, all 9 scenarios, keyboard and phone widths passed with no page errors. Published as "Warehouse IQ" on the same page link.
- Step 18: the friend's prompt was reviewed. Already built: the core, tests, oracle, bridge demo, sparse IDs, compare, stress, share code, keyboard. To add: the cinematic story flow and its effects. Decisions (chosen by the user): add Story mode to Warehouse IQ rather than replacing it, and keep the in-house tested engine instead of Three.js. Prompt bug fixed: sorted 1..200 would merge into one range [1,200] (one node, nothing to balance), so chapter 4 uses 2, 4, … 400.
- Step 19: test scene showed depth fog (far nodes fade into the background), additive glow halos, drifting particles and an expanding ring pulse. No page errors.
- Step 20: on the Index tree page, inserting 10, 20, 30 flashed a red "bf −2 → RR" badge on node 10 before the rotation. Range insert [12,25] showed the violet sweep bar and gave [10,10] [12,25] [30,30]. Removing 18 split [12,25] into [12,17] and [19,25], the new node rising from the old one's position. The Linear/Compressed switch now animates. The camera briefly focuses on the changed node.
- Steps 21–23: Story section added: enter screen, chapter indicator, Next, Auto, Skip, key hints, fading two-line narration, and a sound toggle (off by default). A scripted browser run: chapter 1 ended at [1,3] [6,7]; press-and-hold streamed 10 arrivals with invariants valid; ← undid one. Chapter 2 ended at [1,8] [10,15] [17,22] (bridge, sweep of [10,22], split at 16). Chapter 3 showed 3 nodes against 1,000,000,001 slots and morphed the scale. Chapter 4 showed LL, RR, LR, RL, then 200 sorted IDs: AVL height 8 with 192 rotations against Unbalanced height 200. Ending: invariants valid, 21/21 tests, 0 mismatches in 10,000 random operations, 50,000-ID stress in 127 ms, height 19. Bug found and fixed: steps that auto-advanced stayed in the "waiting for Next" list, so Next did nothing at the end of chapter 1.
- Step 24: final build re-run end to end. Node: 21/21. Browser: Index tree, Dashboard, compare, bridge, tests and share checks, all 9 Warehouse scenarios, keyboard, the ±2 badge, and phone widths (including Story) passed with no page errors. Published with Story mode on the same page link.
- Not built from the friend's prompt, on purpose: Three.js (the user chose the tested in-house engine); a light theme (the site follows the user's dark reference design); deeper nodes as points above the render cap (the view shows the top levels with a badge).
I was a part of this too
