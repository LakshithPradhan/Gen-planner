import { afterEach, describe, expect, it, vi } from 'vitest';
import { logSanitizedError } from '../lib/sanitizedLogging';

describe('sanitized error logging', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logs recoverable errors as warnings and excludes sensitive error content', () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const failure = Object.assign(
      new Error('raw user message and api_key=secret-value'),
      {
        name: 'APIError',
        status: 503,
        response: { body: 'sensitive provider response' },
      }
    );

    logSanitizedError('Anthropic plan request', failure, 'warning');

    expect(warning).toHaveBeenCalledOnce();
    expect(warning).toHaveBeenCalledWith('Anthropic plan request failed', {
      name: 'APIError',
      status: 503,
    });
    expect(errorLog).not.toHaveBeenCalled();
    expect(JSON.stringify(warning.mock.calls)).not.toContain('secret-value');
    expect(JSON.stringify(warning.mock.calls)).not.toContain('sensitive provider response');
    expect(JSON.stringify(warning.mock.calls)).not.toContain('raw user message');
  });

  it('logs unexpected endpoint failures as errors using only allow-listed details', () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const failure = Object.assign(
      new Error('private request body'),
      { name: 'UnrecognizedProviderError', statusCode: 500 }
    );

    logSanitizedError('Plan generation', failure, 'error');

    expect(errorLog).toHaveBeenCalledOnce();
    expect(errorLog).toHaveBeenCalledWith('Plan generation failed', {
      name: 'UnknownError',
      status: 500,
    });
    expect(warning).not.toHaveBeenCalled();
    expect(JSON.stringify(errorLog.mock.calls)).not.toContain('private request body');
  });
});
