# Warehouse IQ – Live Arrival Index

Problem Statement 09: **The Warehouse's Broken Number Ranges**.

Package IDs (0 to 1,000,000,000, up to 50,000 unique) arrive in any order. The index keeps them as sorted,
non-overlapping ranges, extends or merges ranges when a connecting ID arrives, ignores duplicates, and
reports the ranges and the missing gaps inside any window, without an array sized to the largest ID.

## Run it
- **Just open `index.html`** in Chrome or Edge. Nothing to install.
- Run the tests (needs Node.js): `npm test` or `node tests/run-tests.js`
- After editing anything in `src/`, rebuild the page: `npm run build` or `node build.js`

## How it works
An **AVL tree** (a self-balancing binary search tree) where each node is one range `[start, end]`.
For a new ID `x` it finds only two neighbours: `floor(x)` (the range starting at or before x) and
`higher(x)` (the next range after it). Exactly one case applies:

| Case | Condition | Action |
|---|---|---|
| Duplicate | x is inside floor's range | nothing changes |
| Bridge | floor ends at x−1 and higher starts at x+1 | merge the two ranges into one node |
| Extend right | floor ends at x−1 | floor's end becomes x |
| Extend left | higher starts at x+1 | higher's start becomes x |
| New | none of the above | insert a new node [x, x] |

After each change the tree rebalances with rotations (LL, RR, LR, RL), so its height stays about log₂ k.

| Operation | Time | Space |
|---|---|---|
| insert(x) | O(log k) | O(1) extra |
| insertRange(L, R) | O((m+1) log k) for m absorbed ranges | O(1) extra |
| delete(x), with range splitting | O(log k) | O(1) extra |
| query(L, R): ranges and gaps | O(log k + m) | O(m) output |
| Whole structure | | O(k), where k = number of ranges |

## Project structure
```
index.html          the finished web page (built from src/)
build.js            joins src/ into index.html
package.json        npm scripts: build, test
src/
  core.js           the data structure: AVL interval tree, brute-force oracle, invariant checker, tests
  engine.js         small 3D renderer on HTML canvas (camera, shading, fog, glow, picking)
  shell.html        page layout (HTML) and styling (CSS)
  app/
    base.js         shared helpers, the reusable 3D tree view, routing, sound
    index.js        Index tree page: animated inserts, captions, presets, undo/redo
    home.js         Warehouse page: KPIs, 3D hangar, ingest, gap analysis, scenarios, audit trail
    dash.js         Dashboard: 3D charts of visits per operation and memory
    compare.js      AVL vs Unbalanced, side by side
    bridge.js       Bridge demo: before and after
    tests.js        test runner page and 50,000-ID stress test
    data.js         operation log, share code export and import
    story.js        Story mode: enter screen, 4 chapters, ending
    init.js         start-up
tests/
  run-tests.js      runs all tests in Node, without a browser
PROCESS.md          step-by-step build log: every step, its check, and the bugs fixed
```

## Languages
JavaScript (logic, 3D, animation), HTML (structure), CSS (design). No frameworks and no libraries;
fonts come from Google Fonts.
