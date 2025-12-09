// SPDX-License-Identifier: MIT
// Copyright (C) 2025 Alysson Souza
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { LibreDirectApiClient } from './libredirect-api.client';
import { LIBREDIRECT_INSTANCES_URL, LibreDirectInstances } from '../models/privacy-redirect';

describe('LibreDirectApiClient', () => {
  let service: LibreDirectApiClient;
  let httpMock: HttpTestingController;

  const mockInstances: LibreDirectInstances = {
    nitter: {
      clearnet: ['https://nitter.example.com', 'https://nitter2.example.com'],
      tor: ['http://nitter.onion'],
      i2p: [],
      loki: [],
    },
    invidious: {
      clearnet: ['https://invidious.example.com'],
      tor: [],
      i2p: [],
      loki: [],
    },
  };

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        LibreDirectApiClient,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(LibreDirectApiClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('fetchInstances', () => {
    it('should fetch instances from the API', () => {
      service.fetchInstances().subscribe((result) => {
        expect(result).toEqual(mockInstances);
      });

      const req = httpMock.expectOne(LIBREDIRECT_INSTANCES_URL);
      expect(req.request.method).toBe('GET');
      req.flush(mockInstances);
    });

    it('should cache instances in localStorage', () => {
      service.fetchInstances().subscribe();

      const req = httpMock.expectOne(LIBREDIRECT_INSTANCES_URL);
      req.flush(mockInstances);

      const cached = localStorage.getItem('libredirect.instances.v1');
      expect(cached).not.toBeNull();
      const parsed = JSON.parse(cached!);
      expect(parsed.data).toEqual(mockInstances);
      expect(parsed.timestamp).toBeDefined();
    });

    it('should return cached instances if not expired', () => {
      // Pre-populate cache
      const cachedData = {
        data: mockInstances,
        timestamp: Date.now(),
      };
      localStorage.setItem('libredirect.instances.v1', JSON.stringify(cachedData));

      service.fetchInstances().subscribe((result) => {
        expect(result).toEqual(mockInstances);
      });

      // No HTTP request should be made
      httpMock.expectNone(LIBREDIRECT_INSTANCES_URL);
    });

    it('should refetch if cache is expired', () => {
      // Pre-populate with expired cache (25 hours old)
      const expiredData = {
        data: mockInstances,
        timestamp: Date.now() - 25 * 60 * 60 * 1000,
      };
      localStorage.setItem('libredirect.instances.v1', JSON.stringify(expiredData));

      const newInstances = {
        ...mockInstances,
        newFrontend: { clearnet: [], tor: [], i2p: [], loki: [] },
      };

      service.fetchInstances().subscribe((result) => {
        expect(result).toEqual(newInstances);
      });

      const req = httpMock.expectOne(LIBREDIRECT_INSTANCES_URL);
      req.flush(newInstances);
    });

    it('should return stale cache on network error', () => {
      // Pre-populate with expired cache
      const cachedData = {
        data: mockInstances,
        timestamp: Date.now() - 25 * 60 * 60 * 1000,
      };
      localStorage.setItem('libredirect.instances.v1', JSON.stringify(cachedData));

      service.fetchInstances().subscribe((result) => {
        expect(result).toEqual(mockInstances);
      });

      const req = httpMock.expectOne(LIBREDIRECT_INSTANCES_URL);
      req.error(new ProgressEvent('Network error'));
    });

    it('should return null on network error with no cache', () => {
      service.fetchInstances().subscribe((result) => {
        expect(result).toBeNull();
      });

      const req = httpMock.expectOne(LIBREDIRECT_INSTANCES_URL);
      req.error(new ProgressEvent('Network error'));
    });
  });

  describe('getClearnetInstances', () => {
    it('should return clearnet instances for a valid frontend', () => {
      const instances = service.getClearnetInstances(mockInstances, 'nitter');
      expect(instances).toEqual(['https://nitter.example.com', 'https://nitter2.example.com']);
    });

    it('should return empty array for unknown frontend', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const instances = service.getClearnetInstances(mockInstances, 'unknown' as any);
      expect(instances).toEqual([]);
    });

    it('should filter out non-https URLs', () => {
      const instancesWithHttp: LibreDirectInstances = {
        nitter: {
          clearnet: ['https://valid.com', 'http://insecure.com', 'not-a-url'],
          tor: [],
          i2p: [],
          loki: [],
        },
      };

      const instances = service.getClearnetInstances(instancesWithHttp, 'nitter');
      expect(instances).toEqual(['https://valid.com']);
    });
  });

  describe('clearCache', () => {
    it('should remove cached instances from localStorage', () => {
      localStorage.setItem(
        'libredirect.instances.v1',
        JSON.stringify({ data: mockInstances, timestamp: Date.now() }),
      );

      service.clearCache();

      expect(localStorage.getItem('libredirect.instances.v1')).toBeNull();
    });
  });
});
