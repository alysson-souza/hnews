// SPDX-License-Identifier: MIT
// Copyright (C) 2026 Alysson Souza

/** Triggers a browser download of `json` as `filename`. */
export function downloadJsonFile(filename: string, json: string): void {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
