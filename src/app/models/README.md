This folder contains the domain model types and mapping helpers for Hacker News (Firebase) and Algolia HN Search.

- hn.ts: HNItem, HNUser and type guards, plus mapToHNItem.
- algolia.ts: AlgoliaHitRaw, AlgoliaSearchResponse and mapHitToStory helper.

Prefer importing directly from the specific file, e.g.:

import { HNItem } from '../models/hn';
import { AlgoliaSearchResponse } from '../models/algolia';
