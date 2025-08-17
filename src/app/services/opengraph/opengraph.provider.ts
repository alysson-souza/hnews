// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Observable } from 'rxjs';
import { OpenGraphData } from './opengraph.types';

export interface OpenGraphProvider {
  name: string;
  isEnabled(): boolean;
  fetch(url: string): Observable<OpenGraphData>;
}
