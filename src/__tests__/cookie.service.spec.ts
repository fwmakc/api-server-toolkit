import { Cookie } from '../common/service/cookie.service';

describe('Cookie', () => {
  let cookie: Cookie;
  let mockReq: any;
  let mockRes: any;

  beforeEach(() => {
    mockReq = { cookies: {} };
    mockRes = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    };
    cookie = new Cookie(mockReq, mockRes);
  });

  describe('set', () => {
    it('sets a cookie with httpOnly and path /', () => {
      cookie.set('token', 'abc');
      expect(mockRes.cookie).toHaveBeenCalledWith('token', 'abc', {
        httpOnly: true,
        path: '/',
        secure: false,
      });
    });

    it('sets a numeric cookie value', () => {
      cookie.set('count', 42);
      expect(mockRes.cookie).toHaveBeenCalledWith('count', 42, {
        httpOnly: true,
        path: '/',
        secure: false,
      });
    });
  });

  describe('setJson', () => {
    it('sets a JSON-stringified cookie', () => {
      const data = { key: 'value' };
      cookie.setJson('session', data);
      expect(mockRes.cookie).toHaveBeenCalledWith('session', JSON.stringify(data), {
        httpOnly: true,
        path: '/',
        secure: false,
      });
    });
  });

  describe('get', () => {
    it('returns cookie value from request', () => {
      mockReq.cookies['token'] = 'abc';
      expect(cookie.get('token')).toBe('abc');
    });

    it('returns undefined for missing cookie', () => {
      expect(cookie.get('missing')).toBeUndefined();
    });
  });

  describe('getJson', () => {
    it('returns parsed JSON from cookie', () => {
      mockReq.cookies['session'] = JSON.stringify({ key: 'value' });
      expect(cookie.getJson('session')).toEqual({ key: 'value' });
    });

    it('returns null for missing cookie', () => {
      expect(cookie.getJson('missing')).toBeNull();
    });

    it('returns null for empty cookie string', () => {
      mockReq.cookies['session'] = '';
      expect(cookie.getJson('session')).toBeNull();
    });
  });

  describe('reset', () => {
    it('calls clearCookie on response', () => {
      cookie.reset('token');
      expect(mockRes.clearCookie).toHaveBeenCalledWith('token');
    });
  });
});
