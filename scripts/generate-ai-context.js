#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const distDir = path.join(__dirname, "..", "dist");
const outFile = path.join(__dirname, "..", "fwmakc-ai-context.md");

function findDtsFiles(dir) {
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(findDtsFiles(full));
    } else if (entry.name.endsWith(".d.ts")) {
      results.push(full);
    }
  }
  return results.sort();
}

const files = findDtsFiles(distDir);

if (files.length === 0) {
  console.error("No .d.ts files found. Run 'npm run build' first.");
  process.exit(1);
}

const lines = [
  "# api-server-toolkit — AI Context",
  "",
  "This file is auto-generated for AI-assisted development.",
  "Feed it to your LLM (Claude, ChatGPT, etc.) to get framework-aware code without hallucinations.",
  "",
  `Generated from ${files.length} declaration files.`,
  "",
  "---",
  "",
];

for (const file of files) {
  const rel = path.relative(path.join(distDir, ".."), file);
  const content = fs.readFileSync(file, "utf-8").trim();
  lines.push(`## ${rel}`);
  lines.push("");
  lines.push("```typescript");
  lines.push(content);
  lines.push("```");
  lines.push("");
}

fs.writeFileSync(outFile, lines.join("\n"));
console.log(`Written ${outFile} (${files.length} files, ${(fs.statSync(outFile).size / 1024).toFixed(1)} KB)`);
