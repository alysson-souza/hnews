#!/usr/bin/env node
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { generateUserscript } from '../src/app/pages/userscript/userscript-template.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Configuration
const DEFAULT_BASE_URL = 'https://alysson-souza.github.io/hnews';
const BASE_URL = process.env.BASE_URL || DEFAULT_BASE_URL;
const OUTPUT_FILE = 'hnews-redirect.user.js';

// Read package.json for version
const packageJson = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf8'));
const version = packageJson.version ?? '1.0.0';

// Generate content
const content = generateUserscript(BASE_URL, version);

// Write file
const publicDir = join(rootDir, 'public');
mkdirSync(publicDir, { recursive: true });
writeFileSync(join(publicDir, OUTPUT_FILE), content, 'utf8');

console.log(`Generated ${OUTPUT_FILE} with BASE_URL=${BASE_URL} and version=${version}`);
