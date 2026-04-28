import { describe, it, expect } from 'vitest';
import {
  ymd,
  todayYmd,
  dayRangeDotted,
  dayRangeIso,
  ymdWindow,
  paginate,
  paginateIter,
  withRetry,
  isRetryableError,
  RecreatexHttpError,
  RecreatexApiError,
  uuidv4,
  buildContext,
  STABLE_SESSION_ID,
} from '../../src/core/index.js';

describe('date helpers', () => {
  it('ymd formats YYYY-MM-DD in Berlin tz', () => {
    expect(ymd(new Date('2026-04-12T05:00:00Z'))).toBe('2026-04-12');
  });

  it('dayRangeDotted matches Manager date format', () => {
    const r = dayRangeDotted('2026-04-12');
    expect(r.from).toBe('2026-04-12 00:00:00.000');
    expect(r.until).toBe('2026-04-12 23:59:59.000');
  });

  it('dayRangeIso matches Expositions date format', () => {
    const r = dayRangeIso('2026-04-12');
    expect(r.from).toBe('2026-04-12T00:00:00');
    expect(r.until).toBe('2026-04-12T23:59:59');
  });

  it('ymdWindow centres on today', () => {
    const w = ymdWindow(30, 90, new Date('2026-04-12T12:00:00Z'));
    expect(w.fromYmd).toBe('2026-03-13');
    expect(w.untilYmd).toBe('2026-07-11');
  });

  it('todayYmd returns a date string', () => {
    expect(todayYmd()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('pagination', () => {
  it('paginate stops on partial page', async () => {
    let pages = 0;
    const all = await paginate(
      async () => {
        pages++;
        return pages === 1 ? Array(10).fill('x') : Array(3).fill('y');
      },
      { pageSize: 10, maxPages: 99 },
    );
    expect(all).toHaveLength(13);
    expect(pages).toBe(2);
  });

  it('paginate respects maxPages', async () => {
    const all = await paginate(async () => Array(10).fill('x'), { pageSize: 10, maxPages: 3 });
    expect(all).toHaveLength(30);
  });

  it('paginateIter yields items lazily', async () => {
    const yielded: string[] = [];
    let pages = 0;
    for await (const item of paginateIter<string>(
      async () => {
        pages++;
        return pages > 2 ? [] : ['a', 'b', 'c'];
      },
      { pageSize: 3, maxPages: 5 },
    )) {
      yielded.push(item);
      if (yielded.length === 5) break;
    }
    expect(yielded).toEqual(['a', 'b', 'c', 'a', 'b']);
  });
});

describe('retry', () => {
  it('isRetryableError says no for 4xx', () => {
    expect(isRetryableError(new RecreatexHttpError(400, 'foo'))).toBe(false);
    expect(isRetryableError(new RecreatexHttpError(500, 'foo'))).toBe(true);
    expect(isRetryableError(new RecreatexApiError('x', 'foo', null))).toBe(false);
    expect(isRetryableError(new TypeError('network'))).toBe(true);
  });

  it('withRetry retries up to attempts times', async () => {
    let n = 0;
    const result = await withRetry(
      async () => {
        n++;
        if (n < 3) throw new TypeError('flake');
        return 'ok';
      },
      { attempts: 3, backoffMs: 1, maxBackoffMs: 1 },
    );
    expect(result).toBe('ok');
    expect(n).toBe(3);
  });
});

describe('context', () => {
  it('buildContext defaults to STABLE_SESSION_ID', () => {
    const c = buildContext({ shopId: 'a', password: 'b' });
    expect(c.SessionId).toBe(STABLE_SESSION_ID);
    expect(c.Language).toBe('de');
  });

  it('buildContext invokes session factory', () => {
    const c = buildContext({ shopId: 'a', password: 'b', sessionId: () => 'fixed' });
    expect(c.SessionId).toBe('fixed');
  });

  it('uuidv4 returns shape-correct UUIDs', () => {
    const u = uuidv4();
    expect(u).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
});
