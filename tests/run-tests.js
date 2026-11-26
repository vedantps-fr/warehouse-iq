// Runs the core test suite and the brute-force fuzz check without a browser.
// Run:  node tests/run-tests.js
const { runTests, fuzzMismatches, IntervalIndex, mkRng } = require('../src/core.js');

const results = runTests();
for (const t of results) console.log((t.ok ? 'PASS ' : 'FAIL ') + t.name + (t.detail ? '  (' + t.detail + ')' : ''));
const passed = results.filter(t => t.ok).length;
console.log('\n' + passed + ' / ' + results.length + ' tests passed');

const fz = fuzzMismatches(10000, 42);
console.log('Fuzz: ' + fz.ops + ' random operations, ' + fz.mismatches + ' mismatches against brute force');

const ix = new IntervalIndex(), seen = new Set(), rnd = mkRng(7);
const t0 = Date.now();
while (seen.size < 50000) { const x = Math.floor(rnd() * 1e9); if (!seen.has(x)) { seen.add(x); ix.insert(x); } }
console.log('Stress: 50,000 random IDs in ' + (Date.now() - t0) + ' ms, height ' + ix.height() + ', ' + ix.count + ' ranges, invariants ' + (ix.check().length ? 'BROKEN' : 'valid'));

process.exit(passed === results.length && fz.mismatches === 0 ? 0 : 1);
