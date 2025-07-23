import { describe, it, expect } from 'vitest';
import {
  RequestHtmlSchema,
  HtmlResponseSchema,
  StyleRequestSchema,
  ProgressSchema,
  ApplyPatchSchema,
  AckSchema,
  parseMessage,
} from './messaging';

describe('messaging schemas', () => {
  it('validates RequestHtml', () => {
    expect(RequestHtmlSchema.safeParse({ type: 'requestHtml' }).success).toBe(true);
    expect(RequestHtmlSchema.safeParse({ type: 'wrong' }).success).toBe(false);
  });

  it('validates HtmlResponse', () => {
    expect(HtmlResponseSchema.safeParse({ type: 'html', html: '<div></div>' }).success).toBe(true);
    expect(HtmlResponseSchema.safeParse({ type: 'html' }).success).toBe(false);
  });

  it('validates StyleRequest', () => {
    expect(StyleRequestSchema.safeParse({ type: 'style', html: '<b></b>', styleName: 'Dark' }).success).toBe(true);
    expect(StyleRequestSchema.safeParse({ type: 'style', html: '<b></b>' }).success).toBe(false);
  });

  it('validates Progress', () => {
    expect(ProgressSchema.safeParse({ type: 'progress', message: 'ok' }).success).toBe(true);
    expect(ProgressSchema.safeParse({ type: 'progress', error: 'fail' }).success).toBe(true);
  });

  it('validates ApplyPatch', () => {
    expect(ApplyPatchSchema.safeParse({ type: 'applyPatch', css: 'body{}' }).success).toBe(true);
    expect(ApplyPatchSchema.safeParse({ type: 'applyPatch', css: 'body{}', patches: [{ selector: 'div', replace: '<b></b>' }] }).success).toBe(true);
    expect(ApplyPatchSchema.safeParse({ type: 'applyPatch' }).success).toBe(false);
  });

  it('validates Ack', () => {
    expect(AckSchema.safeParse({ type: 'ack', success: true }).success).toBe(true);
    expect(AckSchema.safeParse({ type: 'ack', error: 'fail' }).success).toBe(true);
  });
});

describe('parseMessage', () => {
  it('parses valid message', () => {
    expect(parseMessage({ type: 'requestHtml' })).toEqual({ type: 'requestHtml' });
    expect(parseMessage({ type: 'html', html: 'x' })).toEqual({ type: 'html', html: 'x' });
  });
  it('returns null for invalid', () => {
    expect(parseMessage({ type: 'unknown' })).toBeNull();
  });
}); 