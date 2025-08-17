// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
export interface OpenGraphData {
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  favicon?: string;
  url?: string;
}

export type QuotaPeriod = 'hour' | 'day' | 'month';
