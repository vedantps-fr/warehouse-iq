// Joins the source files into one self-contained index.html.
// Run:  node build.js
const fs = require('fs');
const read = p => fs.readFileSync(__dirname + '/' + p, 'utf8');

const appOrder = ['base', 'index', 'home', 'dash', 'compare', 'bridge', 'tests', 'data', 'story', 'init'];
const core = read('src/core.js').replace(/if\(typeof module!=='undefined'\)module\.exports=\{[^}]*\};/, '');
const app = appOrder.map(n => read('src/app/' + n + '.js')).join('\n');

const html = read('src/shell.html')
  .replace('/*CORE*/', () => core)
  .replace('/*ENGINE*/', () => read('src/engine.js'))
  .replace('/*APP*/', () => app);

fs.writeFileSync(__dirname + '/index.html', html);
console.log('Built index.html (' + Math.round(html.length / 1024) + ' KB)');
