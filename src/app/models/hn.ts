// SPDX-License-Identifier: MIT
// Domain models for Hacker News Firebase API

export type HNItemType = 'job' | 'story' | 'comment' | 'poll' | 'pollopt';

export interface HNItem {
  id: number;
  deleted?: boolean;
  type: HNItemType;
  by?: string;
  time: number; // unix seconds
  text?: string;
  dead?: boolean;
  parent?: number;
  poll?: number;
  kids?: number[];
  url?: string;
  score?: number;
  title?: string;
  parts?: number[];
  descendants?: number;
}

export interface HNUser {
  id: string;
  created: number; // unix seconds
  karma: number;
  about?: string;
  submitted?: number[];
}

// Type guards for convenience in UI and stores
export const isStory = (item: HNItem | null | undefined): item is HNItem & { type: 'story' } =>
  !!item && item.type === 'story';

export const isComment = (item: HNItem | null | undefined): item is HNItem & { type: 'comment' } =>
  !!item && item.type === 'comment';

export const isJob = (item: HNItem | null | undefined): item is HNItem & { type: 'job' } =>
  !!item && item.type === 'job';

// Lightweight runtime mapper to protect against API shape quirks
export function mapToHNItem(raw: unknown): HNItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Partial<HNItem> & { type?: string };

  if (typeof obj.id !== 'number' || !Number.isFinite(obj.id)) return null;
  if (typeof obj.time !== 'number' || !Number.isFinite(obj.time)) return null;

  const allowedTypes: HNItemType[] = ['job', 'story', 'comment', 'poll', 'pollopt'];
  const type = (obj.type as HNItemType | undefined) || 'story';
  if (!allowedTypes.includes(type)) return null;

  const kids = Array.isArray(obj.kids)
    ? (obj.kids.filter((k) => typeof k === 'number' && Number.isFinite(k)) as number[])
    : undefined;

  const parts = Array.isArray(obj.parts)
    ? (obj.parts.filter((p) => typeof p === 'number' && Number.isFinite(p)) as number[])
    : undefined;

  const item: HNItem = {
    id: obj.id,
    type,
    time: obj.time,
    by: typeof obj.by === 'string' ? obj.by : undefined,
    text: typeof obj.text === 'string' ? obj.text : undefined,
    title: typeof obj.title === 'string' ? obj.title : undefined,
    url: typeof obj.url === 'string' ? obj.url : undefined,
    score: typeof obj.score === 'number' ? obj.score : undefined,
    descendants: typeof obj.descendants === 'number' ? obj.descendants : undefined,
    dead: obj.dead === true ? true : undefined,
    deleted: obj.deleted === true ? true : undefined,
    parent: typeof obj.parent === 'number' ? obj.parent : undefined,
    poll: typeof obj.poll === 'number' ? obj.poll : undefined,
    kids,
    parts,
  };

  return item;
}
