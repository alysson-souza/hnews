// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
