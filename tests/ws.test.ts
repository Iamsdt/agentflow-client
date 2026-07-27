import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WS_BEARER_SUBPROTOCOL, resolveBearerToken, buildWsUrl, openWebSocket } from '../src/ws.js';

describe('resolveBearerToken', () => {
  it('uses authToken when no auth is configured', () => {
    expect(resolveBearerToken({ authToken: 'tok' })).toBe('tok');
  });
  it('uses bearer auth when no authToken is configured', () => {
    expect(resolveBearerToken({ auth: { type: 'bearer', token: 'b' } })).toBe('b');
  });
  it('returns null when no token', () => {
    expect(resolveBearerToken({})).toBeNull();
  });

  // `auth` takes precedence over `authToken`, matching buildHeaders on the HTTP path.
  describe('when both auth and authToken are set', () => {
    it('prefers the bearer token from auth over authToken', () => {
      expect(resolveBearerToken({ authToken: 'tok', auth: { type: 'bearer', token: 'b' } })).toBe(
        'b'
      );
    });

    it('returns null for basic auth rather than falling back to authToken', () => {
      expect(
        resolveBearerToken({
          authToken: 'tok',
          auth: { type: 'basic', username: 'u', password: 'p' },
        })
      ).toBeNull();
    });

    it('returns null for header auth rather than falling back to authToken', () => {
      expect(
        resolveBearerToken({
          authToken: 'tok',
          auth: { type: 'header', name: 'X-API-Key', value: 'k' },
        })
      ).toBeNull();
    });
  });
});

describe('buildWsUrl', () => {
  it('rewrites http -> ws and appends path', () => {
    expect(buildWsUrl({ baseUrl: 'http://localhost:8000' }, '/v1/graph/ws')).toBe(
      'ws://localhost:8000/v1/graph/ws'
    );
  });
  it('rewrites https -> wss and strips trailing slash', () => {
    expect(buildWsUrl({ baseUrl: 'https://api.example.com/' }, '/v1/graph/live')).toBe(
      'wss://api.example.com/v1/graph/live'
    );
  });
  it('never leaks the token into the URL', () => {
    const url = buildWsUrl({ baseUrl: 'http://h' }, '/v1/graph/ws');
    expect(url).not.toContain('secret');
    expect(url).not.toContain('token=');
  });
});

describe('openWebSocket', () => {
  let calls: any[];
  class FakeWS {
    static OPEN = 1;
    constructor(
      public url: string,
      public protocols?: any,
      public options?: any
    ) {
      calls.push({ url, protocols, options });
    }
  }
  beforeEach(() => {
    calls = [];
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('passes the bearer subprotocol when a token is present', () => {
    openWebSocket('ws://h/v1/graph/ws', {
      baseUrl: 'http://h',
      authToken: 'jwt123',
      webSocketImpl: FakeWS as any,
    });
    expect(calls[0].protocols).toEqual([WS_BEARER_SUBPROTOCOL, 'jwt123']);
  });

  it('passes no subprotocol when there is no token', () => {
    openWebSocket('ws://h/v1/graph/ws', {
      baseUrl: 'http://h',
      webSocketImpl: FakeWS as any,
    });
    expect(calls[0].protocols).toBeUndefined();
  });

  it('uses the injected impl over the global', () => {
    vi.stubGlobal(
      'WebSocket',
      class {
        constructor() {
          throw new Error('global should not be used');
        }
      }
    );
    const ws = openWebSocket('ws://h', {
      baseUrl: 'http://h',
      webSocketImpl: FakeWS as any,
    });
    expect(ws).toBeInstanceOf(FakeWS);
  });

  it('throws a helpful error when no impl is available', () => {
    vi.stubGlobal('WebSocket', undefined);
    expect(() => openWebSocket('ws://h', { baseUrl: 'http://h' })).toThrow(
      /No WebSocket implementation/
    );
  });
});
