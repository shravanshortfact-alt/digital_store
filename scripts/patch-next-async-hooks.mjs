import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const targets = [
  join(process.cwd(), "node_modules", "next", "dist"),
  join(process.cwd(), ".vercel", "output", "static", "_worker.js"),
];
const extensions = new Set([".js", ".mjs", ".cjs"]);

function extensionOf(filePath) {
  const index = filePath.lastIndexOf(".");
  return index === -1 ? "" : filePath.slice(index);
}

function patchFile(filePath) {
  const source = readFileSync(filePath, "utf8");
  const patched = source
    .replaceAll('from "async_hooks"', 'from "node:async_hooks"')
    .replaceAll("from 'async_hooks'", "from 'node:async_hooks'")
    .replaceAll('from"async_hooks"', 'from"node:async_hooks"')
    .replaceAll("from'async_hooks'", "from'node:async_hooks'");

  if (patched !== source) {
    writeFileSync(filePath, patched);
    return 1;
  }

  return 0;
}

function patchDirectory(dir) {
  let count = 0;

  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);

    if (stat.isDirectory()) {
      count += patchDirectory(path);
      continue;
    }

    if (stat.isFile() && extensions.has(extensionOf(path))) {
      count += patchFile(path);
    }
  }

  return count;
}

let count = 0;

for (const target of targets) {
  if (existsSync(target)) {
    count += patchDirectory(target);
  }
}

if (count > 0) {
  console.log(`Patched ${count} async_hooks import file(s).`);
}
