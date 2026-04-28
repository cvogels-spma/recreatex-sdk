import { describe, it, expect, vi } from 'vitest';
import {
  ReCreateXClient,
  RecreatexHttpError,
  RecreatexApiError,
  RecreatexTimeoutError,
} from '../../src/core/index.js';

function mockFetch(handler: (url: string, init: RequestInit) => Response | Promise<Response>) {
  return vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    return handler(url, init ?? {});
  }) as unknown as typeof fetch;
}

const baseConfig = {
  baseUrl: 'https://test.recreatex.example',
  shopId: 'shop-id',
  password: 'secret',
};

describe('ReCreateXClient', () => {
  it('injects Context into the request body', async () => {
    const fetch = mockFetch(async (_url, init) => {
      const body = JSON.parse(init.body as string);
      expect(body.Context).toEqual({
        Language: 'de',
        ShopId: 'shop-id',
        SessionId: '00000000-0000-0000-0000-000000000001',
        Password: 'secret',
      });
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });
    const rx = new ReCreateXClient({ ...baseConfig, fetch });
    await rx.post('Json/Foo/Bar', { foo: 1 });
    expect(fetch).toHaveBeenCalledOnce();
  });

  it('throws RecreatexHttpError on non-2xx', async () => {
    const fetch = mockFetch(async () => new Response('boom', { status: 500 }));
    const rx = new ReCreateXClient({ ...baseConfig, fetch, retry: { attempts: 1 } });
    await expect(rx.post('Json/Foo/Bar', {})).rejects.toBeInstanceOf(RecreatexHttpError);
  });

  it('throws RecreatexApiError when succes:false', async () => {
    const fetch = mockFetch(
      async () => new Response(JSON.stringify({ succes: false, message: 'nope' }), { status: 200 }),
    );
    const rx = new ReCreateXClient({ ...baseConfig, fetch });
    await expect(rx.post('Json/Foo/Bar', {})).rejects.toBeInstanceOf(RecreatexApiError);
  });

  it('throws RecreatexApiError when basket validation fails', async () => {
    const fetch = mockFetch(
      async () =>
        new Response(
          JSON.stringify({
            Result: {
              BasketValidationResult: {
                IsValid: false,
                Message: 'Article null',
                brokenRuleName: 'ArticleRequired',
              },
            },
          }),
          { status: 200 },
        ),
    );
    const rx = new ReCreateXClient({ ...baseConfig, fetch });
    try {
      await rx.post('Json/General/CheckoutBasket', {});
      throw new Error('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(RecreatexApiError);
      if (err instanceof RecreatexApiError) {
        expect(err.brokenRuleName).toBe('ArticleRequired');
      }
    }
  });

  it('retries on 502 and succeeds on the second attempt', async () => {
    let n = 0;
    const fetch = mockFetch(async () => {
      n++;
      if (n === 1) return new Response('bad gateway', { status: 502 });
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });
    const rx = new ReCreateXClient({
      ...baseConfig,
      fetch,
      retry: { attempts: 3, backoffMs: 1, maxBackoffMs: 1 },
    });
    await rx.post('Json/Foo/Bar', {});
    expect(n).toBe(2);
  });

  it('does NOT retry on 4xx', async () => {
    let n = 0;
    const fetch = mockFetch(async () => {
      n++;
      return new Response('nope', { status: 404 });
    });
    const rx = new ReCreateXClient({
      ...baseConfig,
      fetch,
      retry: { attempts: 3, backoffMs: 1 },
    });
    await expect(rx.post('Json/Foo/Bar', {})).rejects.toBeInstanceOf(RecreatexHttpError);
    expect(n).toBe(1);
  });

  it('honours custom timeoutMs and emits RecreatexTimeoutError', async () => {
    const fetch = vi.fn(async (_input: unknown, init?: RequestInit) => {
      // never resolve — let the AbortController do its job
      return await new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          reject(init?.signal?.reason ?? new Error('aborted'));
        });
      });
    }) as unknown as typeof fetch;
    const rx = new ReCreateXClient({
      ...baseConfig,
      fetch,
      timeoutMs: 5,
      retry: { attempts: 1 },
    });
    await expect(rx.post('Json/Foo/Bar', {})).rejects.toBeInstanceOf(RecreatexTimeoutError);
  });

  it('rejects empty baseUrl', () => {
    expect(() => new ReCreateXClient({ ...baseConfig, baseUrl: '' })).toThrow();
  });
});
