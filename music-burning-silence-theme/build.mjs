// build.mjs — a tiny zero-dependency bundler. It inlines the ES module graph (entry src/boot.js)
// plus the CSS into a single standalone `inkfall.html` that runs from file:// (double-click), no
// server and no tooling. Each module is wrapped in its own scoped factory with a CommonJS-style
// require, so there are no name collisions and circular imports work. Dev still uses the modular
// source over a server; run `node build.mjs` only when you want the standalone file.
//
//   usage:  node build.mjs   (from the repo root)
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const ENTRY = 'src/boot.js';
const read = key => readFileSync(path.join(ROOT, key), 'utf8');
const resolveFrom = (key, spec) => path.posix.normalize(path.posix.join(path.posix.dirname(key), spec));

// discover the module graph
const modules = new Map();
function crawl(key) {
  if (modules.has(key)) return;
  const src = read(key);
  modules.set(key, src);
  for (const spec of specsOf(src)) crawl(resolveFrom(key, spec));
}
function specsOf(src) {
  const out = [];
  const re = /(?:^\s*(?:import|export)[^\n]*?\bfrom\s*|^\s*import\s*|\bimport\s*\(\s*)(['"])(.+?)\1/gm;
  let m; while ((m = re.exec(src))) out.push(m[2]);
  return out;
}

// transform one module's ESM source into a factory body (CommonJS-style)
function transform(src, key) {
  const resolve = spec => JSON.stringify(resolveFrom(key, spec));
  src = src.replace(/\bimport\(\s*(['"])(.+?)\1\s*\)/g, (_m, _q, spec) => `Promise.resolve(__req(${resolve(spec)}))`);
  const out = [], named = [];
  for (const line of src.split('\n')) {
    let m;
    if ((m = line.match(/^\s*export\s*\{([^}]*)\}\s*from\s*(['"])(.+?)\2\s*;?\s*$/))) {
      const names = m[1].split(',').map(s => s.trim()).filter(Boolean);
      out.push(`{ const __m = __req(${resolve(m[3])}); ${names.map(n => `__exports.${n} = __m.${n};`).join(' ')} }`);
    } else if ((m = line.match(/^\s*import\s*\{([^}]*)\}\s*from\s*(['"])(.+?)\2\s*;?\s*$/))) {
      const names = m[1].split(',').map(s => s.trim()).filter(Boolean).map(n => { const a = n.split(/\s+as\s+/); return a.length === 2 ? `${a[0]}: ${a[1]}` : n; });
      out.push(`const { ${names.join(', ')} } = __req(${resolve(m[3])});`);
    } else if ((m = line.match(/^\s*import\s*\*\s*as\s+(\w+)\s*from\s*(['"])(.+?)\2\s*;?\s*$/))) {
      out.push(`const ${m[1]} = __req(${resolve(m[3])});`);
    } else if ((m = line.match(/^\s*import\s+(\w+)\s+from\s*(['"])(.+?)\2\s*;?\s*$/))) {
      out.push(`const ${m[1]} = __req(${resolve(m[3])}).default;`);
    } else if ((m = line.match(/^\s*import\s*(['"])(.+?)\1\s*;?\s*$/))) {
      out.push(`__req(${resolve(m[2])});`);
    } else if ((m = line.match(/^\s*export\s+default\s+(.*)$/))) {
      out.push(`__exports.default = ${m[1]}`);
    } else if ((m = line.match(/^\s*export\s+(const|let|var)\s+(\w+)(.*)$/))) {
      named.push(m[2]); out.push(`${m[1]} ${m[2]}${m[3]}`);
    } else if ((m = line.match(/^\s*export\s+function\s+(\w+)(.*)$/))) {
      named.push(m[1]); out.push(`function ${m[1]}${m[2]}`);
    } else if ((m = line.match(/^\s*export\s+class\s+(\w+)(.*)$/))) {
      named.push(m[1]); out.push(`class ${m[1]}${m[2]}`);
    } else out.push(line);
  }
  for (const n of named) out.push(`__exports.${n} = ${n};`);
  return out.join('\n');
}

crawl(ENTRY);

let bundle = '(function(){\n"use strict";\nconst __mod = {}, __cache = {};\n';
bundle += 'function __req(k){ if (__cache[k]) return __cache[k]; const e = {}; __cache[k] = e; __mod[k](e, __req); return e; }\n';
for (const [key, src] of modules) {
  bundle += `__mod[${JSON.stringify(key)}] = function(__exports, __req){\n${transform(src, key)}\n};\n`;
}
bundle += `__req(${JSON.stringify(ENTRY)});\n})();\n`;

const css = read('styles/inkfall.css');
// use replacement FUNCTIONS so `$` in the CSS/JS is not treated as a special replace pattern
const html = read('index.html')
  .replace(/<link rel="stylesheet" href="styles\/inkfall\.css">/, () => `<style>\n${css}\n</style>`)
  .replace(/<script type="module" src="src\/boot\.js"><\/script>/, () => `<script>\n${bundle}\n</script>`);

writeFileSync(path.join(ROOT, 'inkfall.html'), html);
console.log(`inkfall.html written — ${modules.size} modules, ${(html.length / 1024 | 0)} KB. Double-click to run.`);
