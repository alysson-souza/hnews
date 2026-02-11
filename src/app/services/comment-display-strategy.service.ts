// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { Injectable } from '@angular/core';
import { HNItem } from '../models/hn';

export interface CommentDisplayStrategyResult {
  smallThreadMode: boolean;
  initialVisibleTopLevelCount: number;
}

@Injectable({
  providedIn: 'root',
})
export class CommentDisplayStrategyService {
  isSmallThread(descendantsCount: number | undefined, threshold: number): boolean {
    const descendants = descendantsCount ?? 0;
    return descendants > 0 && descendants <= threshold;
  }

  getInitialVisibleTopLevelCount(params: {
    totalTopLevel: number;
    pageSize: number;
    smallThreadMode: boolean;
  }): number {
    if (params.smallThreadMode) {
      return params.totalTopLevel;
    }

    return Math.min(params.pageSize, params.totalTopLevel || params.pageSize);
  }

  resolveForItem(
    item: HNItem,
    params: {
      pageSize: number;
      smallThreadDescendantsThreshold: number;
    },
  ): CommentDisplayStrategyResult {
    const smallThreadMode = this.isSmallThread(
      item.descendants,
      params.smallThreadDescendantsThreshold,
    );
    const totalTopLevel = item.kids?.length ?? 0;
    const initialVisibleTopLevelCount = this.getInitialVisibleTopLevelCount({
      totalTopLevel,
      pageSize: params.pageSize,
      smallThreadMode,
    });

    return {
      smallThreadMode,
      initialVisibleTopLevelCount,
    };
  }
}
