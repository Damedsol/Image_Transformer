#!/usr/bin/env node
/**
 * lint-filenames — self-contained replacement for `@ls-lint/ls-lint`.
 *
 * Replicates the naming-validation behavior of ls-lint v2.3.1 (Go, unmaintained)
 * using only Node builtins (zero runtime deps). Reads a JSON config
 * (`.ls-lint.json` by default) and walks the workdir validating file/directory
 * casing with the same per-rune rule semantics and the same output contract:
 *
 *   - no violations           → no output, exit 0
 *   - violations (text mode)  → `{path} failed for `{ext}` rules: {names}`
 *                               to stderr, exit 1
 *
 * CLI flags (parity with ls-lint): --config (mergeable), --workdir, --warn,
 * --error-output-format text|json, --debug, --version.
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const extSep = ".";
const dirRule = ".dir";
const RULE_OR = " | ";

// ---------------------------------------------------------------------------
// Unicode-aware rune helpers (mirror Go's unicode.IsLetter/IsLower/IsUpper/IsDigit)
// ---------------------------------------------------------------------------
const RE_LETTER = /[\p{L}]/u;
const RE_LOWER = /[\p{Ll}]/u;
const RE_UPPER = /[\p{Lu}]/u;
const RE_DIGIT = /[\p{Nd}]/u;

const isLetter = (c) => RE_LETTER.test(c);
const isLower = (c) => RE_LOWER.test(c);
const isUpper = (c) => RE_UPPER.test(c);
const isDigit = (c) => RE_DIGIT.test(c);

// ---------------------------------------------------------------------------
// Per-rune validators (literal port of ls-lint's internal/rule/*.go)
// ---------------------------------------------------------------------------
function validateKebab(value) {
	for (const c of value) {
		if (c === "-" || isDigit(c)) continue; // "-" (45) or digit
		if (!isLetter(c)) return false;
		if (!isLower(c)) return false;
	}
	return true;
}

function validateSnake(value) {
	for (const c of value) {
		if (c === "_" || isDigit(c)) continue; // "_" (95) or digit
		if (!isLetter(c)) return false;
		if (!isLower(c)) return false;
	}
	return true;
}

function validateScreamingSnake(value) {
	for (const c of value) {
		if (c === "_" || isDigit(c)) continue;
		if (!isLetter(c)) return false;
		if (!isUpper(c)) return false;
	}
	return true;
}

function validateLowercase(value) {
	for (const c of value) {
		if (!isLetter(c)) return false;
		if (!isLower(c)) return false;
	}
	return true;
}

function validateCamel(value) {
	for (let i = 0; i < value.length; i++) {
		const c = value[i];
		if (!isLetter(c) && !isDigit(c)) return false;
		if (isUpper(c)) {
			if (i === 0) return false; // first rune cannot be upper
			if (isDigit(value[i - 1])) continue; // rune -1 can be digit
			// allow cases like ssrVFor.ts
			if (i >= 2 && isUpper(value[i - 1]) && isLower(value[i - 2])) continue;
			if (!isLower(value[i - 1])) return false; // rune -1 must be lower
		}
	}
	return true;
}

function validatePascal(value) {
	for (let i = 0; i < value.length; i++) {
		const c = value[i];
		if (!isLetter(c) && !isDigit(c)) return false;
		if (i === 0 && isLower(c)) return false; // first rune cannot be lower
		if (isUpper(c)) {
			if (i === 0) continue;
			if (isDigit(value[i - 1])) continue;
			if (i >= 2 && isUpper(value[i - 1]) && isLower(value[i - 2])) continue;
			if (!isLower(value[i - 1])) return false;
		}
	}
	return true;
}

// ---------------------------------------------------------------------------
// Rule aliases (mirror Go's rule.Rules map)
// ---------------------------------------------------------------------------
const VALIDATORS = {
	lowercase: validateLowercase,
	camelcase: validateCamel,
	pascalcase: validatePascal,
	snakecase: validateSnake,
	screamingsnakecase: validateScreamingSnake,
	kebabcase: validateKebab,
};

const RULE_ALIASES = {
	lowercase: "lowercase",
	camelcase: "camelcase",
	camelCase: "camelcase",
	pascalcase: "pascalcase",
	PascalCase: "pascalcase",
	snakecase: "snakecase",
	snake_case: "snakecase",
	screamingsnakecase: "screamingsnakecase",
	SCREAMING_SNAKE_CASE: "screamingsnakecase",
	kebabcase: "kebabcase",
	"kebab-case": "kebabcase",
};

// Rules ls-lint supports that need extra machinery (not used by this config).
const UNSUPPORTED = new Set(["regex", "exists"]);

function canonicalRuleName(raw) {
	const trimmed = raw.trim();
	const name = trimmed.split(":")[0];
	if (UNSUPPORTED.has(name)) {
		throw new Error(`rule ${name} is not supported by lint-filenames`);
	}
	const canonical = RULE_ALIASES[name];
	if (!canonical) {
		throw new Error(`rule ${name} not exists`);
	}
	return canonical;
}

// ---------------------------------------------------------------------------
// Config → RuleIndex: Map<dirPath, Map<ext, canonicalRuleName[]>>
// ---------------------------------------------------------------------------
function buildIndex(list, index = {}, key = "") {
	if (index[key] == null) index[key] = {};
	for (const [k, v] of Object.entries(list)) {
		if (v == null) continue;
		if (typeof v === "object") {
			const childKey = key === "" ? k : `${key}/${k}`;
			buildIndex(v, index, childKey);
			continue;
		}
		const rules = String(v)
			.split(RULE_OR)
			.map((raw) => canonicalRuleName(raw));
		(index[key][k] ||= []).push(...rules);
	}
	return index;
}

// GetConfig: longest matching directory prefix of `path` (no inheritance).
function resolveRules(index, relPath) {
	const dirs = relPath.split("/");
	for (let i = dirs.length; i >= 0; i--) {
		const dir = dirs.slice(0, i).join("/");
		if (index[dir]) return index[dir];
	}
	return null;
}

// ShouldIgnore: exact match or any ancestor prefix in the ignore set.
function isIgnored(ignoreSet, relPath) {
	if (ignoreSet.has(relPath)) return true;
	const dirs = relPath.split("/");
	for (let i = 0; i < dirs.length; i++) {
		if (ignoreSet.has(dirs.slice(0, i).join("/"))) return true;
	}
	return false;
}

// validateFile: enumerate 2^n extension combinations and validate the stem.
function validateFile(index, relPath, errors) {
	const rules = resolveRules(index, relPath);
	if (!rules) return;
	const base = relPath.split("/").pop();
	const segs = base.split(extSep);
	const exts = segs.slice(1); // everything after the first segment
	const stem = segs[0];
	const n = exts.length;
	const max = 2 ** n;
	let ext = null;
	for (let i = 0; i < max; i++) {
		const combined = exts
			.map((_e, j) => (i & (1 << (n - 1 - j)) ? "*" : exts[j]))
			.join(extSep);
		const candidate = `${extSep}${combined}`;
		if (rules[candidate]) {
			ext = candidate;
			break;
		}
	}
	if (ext == null) return;
	const ruleNames = rules[ext];
	const valid = ruleNames.some((name) => VALIDATORS[name](stem));
	if (!valid) {
		errors.push({ path: relPath, ext, rules: ruleNames });
	}
}

// validateDir
function validateDir(index, relPath, errors) {
	const base = relPath.split("/").pop();
	if (base === "." || base === "" || base === "/") return; // skip root
	const rules = resolveRules(index, relPath);
	if (!rules || !rules[dirRule]) return;
	const ruleNames = rules[dirRule];
	const valid = ruleNames.some((name) => VALIDATORS[name](base));
	if (!valid) {
		errors.push({ path: relPath, ext: dirRule, rules: ruleNames });
	}
}

// ---------------------------------------------------------------------------
// Walk
// ---------------------------------------------------------------------------
function normalizeRel(relPath) {
	return relPath.split(path.sep).join("/");
}

function lintWorkdir(workdir, index, ignoreSet, debug) {
	const errors = [];
	const log = debug ? (msg) => process.stdout.write(`${msg}\n`) : () => {};

	function walk(relPath) {
		if (isIgnored(ignoreSet, relPath)) {
			log(`skip dir: ${relPath}`);
			return;
		}
		const abs = path.join(workdir, relPath);
		let stat;
		try {
			stat = fs.statSync(abs);
		} catch {
			return;
		}
		if (stat.isDirectory()) {
			if (relPath !== ".") {
				log(`lint dir: ${relPath}`);
				validateDir(index, relPath, errors);
			}
			let entries;
			try {
				entries = fs.readdirSync(abs, { withFileTypes: true });
			} catch {
				return;
			}
			entries.sort((a, b) => (a.name < b.name ? -1 : 1));
			for (const entry of entries) {
				const childRel =
					relPath === "." ? entry.name : `${relPath}/${entry.name}`;
				walk(childRel);
			}
		} else {
			log(`lint file: ${relPath}`);
			validateFile(index, normalizeRel(relPath), errors);
		}
	}

	walk(workdir === "." ? "." : normalizeRel(workdir));
	return errors;
}

// ---------------------------------------------------------------------------
// Output formatting (parity with ls-lint main.go)
// ---------------------------------------------------------------------------
function formatText(errors) {
	return errors
		.map((e) => {
			const p = e.path || ".";
			return `${p} failed for \`${e.ext}\` rules: ${e.rules.join(" | ")}\n`;
		})
		.join("");
}

function formatJson(errors) {
	const index = {};
	for (const e of errors) {
		const p = e.path || ".";
		index[p] ||= {};
		(index[p][e.ext] ||= []).push(...e.rules);
	}
	return JSON.stringify(index);
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
function readConfig(filePath) {
	let raw;
	try {
		raw = fs.readFileSync(filePath, "utf8");
	} catch {
		throw new Error(`cannot read config ${filePath}`);
	}
	return JSON.parse(raw);
}

// Shallow merge of `ls` + concat/sort/dedup of `ignore` (mirror ls-lint).
function mergeConfigs(configFiles) {
	const merged = { ls: {}, ignore: [] };
	for (const file of configFiles) {
		const cfg = readConfig(file);
		Object.assign(merged.ls, cfg.ls || {});
		merged.ignore.push(...(cfg.ignore || []));
	}
	merged.ignore = [...new Set(merged.ignore)].sort();
	return merged;
}

function parseArgs(argv) {
	const opts = {
		configs: [],
		workdir: ".",
		warn: false,
		outputFormat: "text",
		debug: false,
		version: false,
	};
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (a === "--config" || a === "-config") {
			opts.configs.push(argv[++i]);
		} else if (a === "--workdir" || a === "-workdir") {
			opts.workdir = argv[++i];
		} else if (a === "--warn" || a === "-warn") {
			opts.warn = true;
		} else if (a === "--error-output-format" || a === "-error-output-format") {
			opts.outputFormat = argv[++i];
		} else if (a === "--debug" || a === "-debug") {
			opts.debug = true;
		} else if (a === "--version" || a === "-version") {
			opts.version = true;
		}
	}
	return opts;
}

function main() {
	const opts = parseArgs(process.argv.slice(2));

	if (opts.version) {
		process.stdout.write("lint-filenames v1.0.0 (ls-lint replacement)\n");
		process.exit(0);
	}

	const configFiles = opts.configs.length ? opts.configs : [".ls-lint.json"];
	const config = mergeConfigs(configFiles);
	const index = buildIndex(config.ls);
	const ignoreSet = new Set(config.ignore);

	if (opts.debug) {
		process.stdout.write(
			"=============================\nls index\n-----------------------------\n",
		);
		for (const [dir, rules] of Object.entries(index)) {
			const label = dir === "" ? "." : dir;
			process.stdout.write(
				`${label}: ${Object.entries(rules)
					.map(([ext, names]) => `${ext}: ${names.join(", ")}`)
					.join(" ")}\n`,
			);
		}
	}

	const errors = lintWorkdir(
		opts.workdir === "." ? "." : opts.workdir,
		index,
		ignoreSet,
		opts.debug,
	);

	if (errors.length === 0) process.exit(0);

	const output =
		opts.outputFormat === "json" ? formatJson(errors) : formatText(errors);

	if (opts.warn) {
		process.stdout.write(output);
		process.exit(0);
	}
	process.stderr.write(output);
	process.exit(1);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
	try {
		main();
	} catch (err) {
		process.stderr.write(`lint-filenames: ${err.message ?? err}\n`);
		process.exit(1);
	}
}
