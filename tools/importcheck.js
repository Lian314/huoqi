#!/usr/bin/env node
/**
 * 静态检查：所有 ES Module 的具名导入是否在目标模块中真实存在。
 * 用法： node tools/importcheck.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');

const errors = [];
const warnings = [];

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.js')) out.push(p);
  }
  return out;
}

/** 粗略提取一个模块的具名导出 */
function exportsOf(file) {
  const src = fs.readFileSync(file, 'utf8');
  const names = new Set();
  const add = (n) => { if (n && !n.startsWith('*')) names.add(n.trim()); };

  for (const m of src.matchAll(/^export\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/gm)) add(m[1]);
  for (const m of src.matchAll(/^export\s+class\s+([A-Za-z_$][\w$]*)/gm)) add(m[1]);
  for (const m of src.matchAll(/^export\s+(?:const|let|var)\s+([A-Za-z_$][\w$]*)/gm)) add(m[1]);
  // export { a, b as c }
  for (const m of src.matchAll(/^export\s*\{([^}]*)\}/gm)) {
    for (const part of m[1].split(',')) {
      const t = part.trim();
      if (!t) continue;
      const as = t.split(/\s+as\s+/);
      add(as[1] || as[0]);
    }
  }
  return names;
}

const cache = new Map();
function getExports(file) {
  if (!cache.has(file)) cache.set(file, exportsOf(file));
  return cache.get(file);
}

const files = walk(SRC);
const modules = new Map();
for (const f of files) modules.set(path.resolve(f), f);

let importCount = 0;

for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  const rel = path.relative(ROOT, f).replace(/\\/g, '/');

  // import { a, b as c } from './x.js'
  for (const m of src.matchAll(/import\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g)) {
    const names = m[1];
    const spec = m[2];
    const target = path.resolve(path.dirname(f), spec);
    if (!fs.existsSync(target)) { errors.push(`${rel}: 找不到模块 "${spec}"`); continue; }
    if (!/\.js$/.test(target)) continue;
    const ex = getExports(target);
    for (const part of names.split(',')) {
      const t = part.trim();
      if (!t) continue;
      const orig = t.split(/\s+as\s+/)[0].trim();
      importCount++;
      if (!ex.has(orig)) {
        errors.push(`${rel}: 从 "${spec}" 导入了不存在的 "${orig}"`);
      }
    }
  }

  // import x from '...'  / import * as x from '...'
  for (const m of src.matchAll(/^import\s+(?!\s*\{)[^;]*?from\s*['"]([^'"]+)['"]/gm)) {
    const target = path.resolve(path.dirname(f), m[1]);
    if (!fs.existsSync(target)) errors.push(`${rel}: 找不到模块 "${m[1]}"`);
  }

  // 相对导入必须带 .js 后缀
  for (const m of src.matchAll(/from\s*['"](\.[^'"]*)['"]/g)) {
    if (!/\.js$/.test(m[1])) errors.push(`${rel}: 相对导入 "${m[1]}" 缺少 .js 后缀`);
  }
}

console.log(`检查 ${files.length} 个模块，${importCount} 条具名导入`);
if (warnings.length) {
  console.log(`⚠ 警告 ${warnings.length} 条`);
  for (const w of warnings) console.log('  · ' + w);
}
if (errors.length) {
  console.log(`✖ 错误 ${errors.length} 条：`);
  for (const e of errors) console.log('  · ' + e);
  process.exit(1);
}
console.log('✔ 导入图完整');
