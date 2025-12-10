#!/usr/bin/env node
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

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
const content = `// ==UserScript==
// @name         HNews Redirect
// @namespace    https://github.com/alysson-souza/hnews
// @version      ${version}
// @description  Automatically redirect Hacker News to HNews alternative frontend
// @author       Alysson Souza
// @match        https://news.ycombinator.com/*
// @icon         https://news.ycombinator.com/favicon.ico
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    const BASE_URL = '${BASE_URL}';
    const currentUrl = window.location.href;
    const hnUrl = 'https://news.ycombinator.com';

    // Parse the current HN URL and convert to HNews URL
    const url = new URL(currentUrl);
    const pathname = url.pathname;
    const search = url.search;

    // Map HN routes to HNews routes
    let newPath = pathname;
    let newSearch = '';

    // Handle item pages: /item?id=123 -> /item/123
    if (pathname === '/item' && search) {
        const params = new URLSearchParams(search);
        const id = params.get('id');
        if (id) {
            newPath = \`/item/\${id}\`;
        }
    }
    // Handle user pages: /user?id=username -> /user/username
    else if (pathname === '/user' && search) {
        const params = new URLSearchParams(search);
        const id = params.get('id');
        if (id) {
            newPath = \`/user/\${id}\`;
        }
    }
    // Handle story list pages
    else if (pathname === '/news' || pathname === '/') {
        newPath = '/top';
    } else if (pathname === '/newest') {
        newPath = '/newest';
    } else if (pathname === '/best') {
        newPath = '/best';
    } else if (pathname === '/ask') {
        newPath = '/ask';
    } else if (pathname === '/show') {
        newPath = '/show';
    } else if (pathname === '/jobs') {
        newPath = '/jobs';
    }

    // Redirect to HNews
    const hnewsUrl = \`\${BASE_URL}\${newPath}\${newSearch}\`;
    window.location.replace(hnewsUrl);
})();
`;

// Write file
const publicDir = join(rootDir, 'public');
mkdirSync(publicDir, { recursive: true });
writeFileSync(join(publicDir, OUTPUT_FILE), content, 'utf8');

console.log(`Generated ${OUTPUT_FILE} with BASE_URL=${BASE_URL} and version=${version}`);
