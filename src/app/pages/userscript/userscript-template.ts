// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Alysson Souza

/**
 * Generates the HNews redirect userscript content.
 * Pure function with no Angular or Node dependencies — just a template string.
 */
export function generateUserscript(baseUrl: string, version: string): string {
  return `// ==UserScript==
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

    const BASE_URL = '${baseUrl}';
    const currentUrl = window.location.href;
    const STORY_TYPE_PATHS = {
        '/': '/top',
        '/news': '/top',
        '/front': '/top',
        '/newest': '/newest',
        '/new': '/newest',
        '/best': '/best',
        '/ask': '/ask',
        '/show': '/show',
        '/jobs': '/jobs',
    };

    // Parse the current HN URL and convert to HNews URL
    const url = new URL(currentUrl);
    const pathname = url.pathname;
    const search = url.search;

    // Map HN routes to HNews routes
    let newPath = null;

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
    else if (Object.hasOwn(STORY_TYPE_PATHS, pathname)) {
        newPath = STORY_TYPE_PATHS[pathname];
    }

    // Unsupported HN pages should stay on Hacker News.
    if (!newPath) {
        return;
    }

    // Redirect to HNews
    const hnewsUrl = \`\${BASE_URL}\${newPath}\`;
    window.location.replace(hnewsUrl);
})();
`;
}
