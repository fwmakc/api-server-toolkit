#!/usr/bin/env node

/**
 * Service-level AI Context Generator
 *
 * Scans ./src/ of the current project (controllers, services, entities, DTOs)
 * and produces a structured markdown reference for AI-assisted development.
 *
 * Usage: node node_modules/api-server-toolkit/scripts/generate-service-context.js
 * Output: ./ai-context.md
 */

const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");
const SRC_DIR = path.join(PROJECT_ROOT, "src");
const OUT_FILE = path.join(PROJECT_ROOT, "ai-context.md");

const SKIP_DIRS = ["node_modules", "dist", "tests", "test", "coverage"];
const SKIP_PATTERNS = [/\.spec\.ts$/, /\.test\.ts$/];

if (!fs.existsSync(SRC_DIR)) {
  console.error("No src/ directory found. Run from the service project root.");
  process.exit(1);
}

// ─── Helpers ─────────────────────────────────────────────────────────

function readDir(dir) {
  try {
    return fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}

function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return "";
  }
}

function findFiles(dir, pattern) {
  const results = [];
  for (const entry of readDir(dir)) {
    if (SKIP_DIRS.includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findFiles(full, pattern));
    } else if (pattern.test(entry.name) && !SKIP_PATTERNS.some(p => p.test(entry.name))) {
      results.push(full);
    }
  }
  return results.sort();
}

function relPath(filePath) {
  return path.relative(PROJECT_ROOT, filePath).replace(/\\/g, "/");
}

// ─── 1. Controllers ──────────────────────────────────────────────────

function scanControllers() {
  const files = findFiles(SRC_DIR, /\.controller\.ts$/);
  const controllers = [];

  for (const file of files) {
    const content = readFile(file);
    if (content.includes("@ApiExcludeController()")) continue;

    const ctrlMatch = content.match(/@Controller\s*\(\s*["']([^"']*)["']\s*\)/);
    const basePath = ctrlMatch ? ctrlMatch[1] : "";
    const tagMatch = content.match(/@ApiTags\s*\(\s*["']([^"']+)["']\s*\)/);
    const tag = tagMatch ? tagMatch[1] : "";
    const classMatch = content.match(/export\s+class\s+(\w+)/);
    const className = classMatch ? classMatch[1] : "Unknown";

    const routes = [];
    const routeRe = /@(Get|Post|Put|Patch|Delete)\s*\(\s*["']?([^"'(){}]*)["']?\s*\)/g;
    let m;
    while ((m = routeRe.exec(content))) {
      routes.push({ method: m[1].toUpperCase(), path: m[2] });
    }

    if (routes.length > 0 || basePath) {
      controllers.push({ className, tag, basePath, routes, file: relPath(file) });
    }
  }

  return controllers;
}

// ─── 2. Services ─────────────────────────────────────────────────────

function scanServices() {
  const files = findFiles(SRC_DIR, /\.service\.ts$/);
  const services = [];

  for (const file of files) {
    const content = readFile(file);
    const classMatch = content.match(/export\s+class\s+(\w+)/);
    if (!classMatch) continue;
    const className = classMatch[1];

    const extendsMatch = content.match(/extends\s+(\w+)/);
    const parent = extendsMatch ? extendsMatch[1] : "";

    const methods = [];
    const methodRe = /(?:public\s+|private\s+|protected\s+)?(?:async\s+)?(\w+)\s*\(([^)]*)\)\s*:\s*([^{;]+)/g;
    let m;
    while ((m = methodRe.exec(content))) {
      const name = m[1];
      if (name === "constructor") continue;
      const params = m[2].trim();
      const returnType = m[3].trim();
      methods.push({ name, params, returnType });
    }

    if (methods.length > 0) {
      services.push({ className, parent, methods, file: relPath(file) });
    }
  }

  return services;
}

// ─── 3. Entities ─────────────────────────────────────────────────────

function scanEntities() {
  const files = findFiles(SRC_DIR, /\.entity\.ts$/);
  const entities = [];

  for (const file of files) {
    const content = readFile(file);
    const classMatch = content.match(/export\s+class\s+(\w+)/);
    if (!classMatch) continue;
    const className = classMatch[1];

    const tableMatch = content.match(/@Entity\s*\(\s*['"]([^'"]+)['"]?/);
    const tableName = tableMatch ? tableMatch[1] : "";

    const columns = [];
    const colRe = /(?:@(?:IdColumn|VarcharColumn|TextColumn|IntColumn|SmallIntColumn|BigIntColumn|FloatColumn|BooleanColumn|DateColumn|CreatedColumn|UpdatedColumn|JsonColumn|EnumColumn|PositionAscColumn|PositionDescColumn|DtoColumn|DtoCreatedColumn|DtoUpdatedColumn|DtoEnumColumn|DtoJsonColumn|IndexedColumn)\s*(?:\([^)]*)?\)\s*\n\s*)(\w+)\??\s*:\s*(\S+);/g;
    let m;
    while ((m = colRe.exec(content))) {
      columns.push({ name: m[1], type: m[2].replace(";", "") });
    }

    const relations = [];
    const relRe = /@(?:OneToOne|OneToMany|ManyToOne|ManyToMany)\s*\(\s*(?:\(\)\s*=>\s*)?(\w+)/g;
    let m2;
    while ((m2 = relRe.exec(content))) {
      relations.push(m2[1]);
    }

    entities.push({ className, tableName, columns, relations, file: relPath(file) });
  }

  return entities;
}

// ─── 4. DTOs ─────────────────────────────────────────────────────────

function scanDtos() {
  const files = findFiles(SRC_DIR, /\.dto\.ts$/);
  const dtos = [];

  for (const file of files) {
    const content = readFile(file);
    const classMatch = content.match(/export\s+class\s+(\w+)/);
    if (!classMatch) continue;
    const className = classMatch[1];

    const fields = [];
    const propRe = /(?:@\w+\s*(?:\([^)]*\))?\s*)*(\w+)\??\s*:\s*(\S+);/g;
    let m;
    while ((m = propRe.exec(content))) {
      const name = m[1];
      if (["constructor", "super"].includes(name)) continue;
      const type = m[2].replace(";", "");
      const optional = m[0].includes("?:");
      fields.push({ name, type, optional });
    }

    if (fields.length > 0) {
      dtos.push({ className, fields, file: relPath(file) });
    }
  }

  return dtos;
}

// ─── Output ──────────────────────────────────────────────────────────

function generate() {
  const controllers = scanControllers();
  const services = scanServices();
  const entities = scanEntities();
  const dtos = scanDtos();

  const pkgName = (() => {
    try {
      return require(path.join(PROJECT_ROOT, "package.json")).name || "service";
    } catch {
      return "service";
    }
  })();

  const lines = [
    `# AI Context — ${pkgName}`,
    "",
    "> Auto-generated. Run `npm run ai-context` to regenerate.",
    `> Generated: ${new Date().toISOString()}`,
    "",
    "---",
    "",
  ];

  // Controllers
  if (controllers.length > 0) {
    lines.push("## Controllers", "");
    for (const ctrl of controllers) {
      const tagStr = ctrl.tag ? ` [${ctrl.tag}]` : "";
      lines.push(`### ${ctrl.className}${tagStr}`, "");
      if (ctrl.basePath) lines.push(`Base path: \`/${ctrl.basePath}\``, "");
      lines.push("| Method | Path |");
      lines.push("|--------|------|");
      for (const r of ctrl.routes) {
        const fullPath = ctrl.basePath && r.path
          ? `${ctrl.basePath}/${r.path}`
          : ctrl.basePath || r.path || "";
        lines.push(`| \`${r.method}\` | \`/${fullPath}\` |`);
      }
      lines.push("");
    }
    lines.push("---", "");
  }

  // Services
  if (services.length > 0) {
    lines.push("## Services", "");
    for (const svc of services) {
      const parentStr = svc.parent ? ` extends \`${svc.parent}\`` : "";
      lines.push(`### ${svc.className}${parentStr}`, "");
      for (const m of svc.methods) {
        lines.push(`- \`${m.name}(${m.params}): ${m.returnType}\``);
      }
      lines.push("");
    }
    lines.push("---", "");
  }

  // Entities
  if (entities.length > 0) {
    lines.push("## Entities", "");
    for (const ent of entities) {
      const tableStr = ent.tableName ? ` (table: \`${ent.tableName}\`)` : "";
      lines.push(`### ${ent.className}${tableStr}`, "");
      if (ent.columns.length > 0) {
        lines.push("| Column | Type |");
        lines.push("|--------|------|");
        for (const c of ent.columns) {
          lines.push(`| \`${c.name}\` | \`${c.type}\` |`);
        }
        lines.push("");
      }
      if (ent.relations.length > 0) {
        lines.push(`Relations: ${ent.relations.map((r) => `\`${r}\``).join(", ")}`, "");
      }
      lines.push("");
    }
    lines.push("---", "");
  }

  // DTOs
  if (dtos.length > 0) {
    lines.push("## DTOs", "");
    for (const dto of dtos) {
      lines.push(`### ${dto.className}`, "");
      lines.push("| Field | Type | Optional |");
      lines.push("|-------|------|----------|");
      for (const f of dto.fields) {
        lines.push(`| \`${f.name}\` | \`${f.type}\` | ${f.optional ? "yes" : "no"} |`);
      }
      lines.push("");
    }
  }

  const content = lines.join("\n");
  fs.writeFileSync(OUT_FILE, content);
  console.log(`Written ${OUT_FILE} (${controllers.length} controllers, ${services.length} services, ${entities.length} entities, ${dtos.length} DTOs, ${(content.length / 1024).toFixed(1)} KB)`);
}

generate();
