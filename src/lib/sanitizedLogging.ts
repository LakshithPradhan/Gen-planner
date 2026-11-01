interface SanitizedErrorDetails {
  name: string;
  status?: number;
}

const SAFE_ERROR_NAMES = new Set([
  'Error',
  'SyntaxError',
  'TypeError',
  'RangeError',
  'URIError',
  'ReferenceError',
  'APIError',
  'APIConnectionError',
  'APIConnectionTimeoutError',
  'AuthenticationError',
  'BadRequestError',
  'ConflictError',
  'InternalServerError',
  'NotFoundError',
  'PermissionDeniedError',
  'RateLimitError',
  'UnprocessableEntityError',
  'GoogleGenerativeAIError',
  'GoogleGenerativeAIResponseError',
]);

export type SanitizedErrorSeverity = 'warning' | 'error';

export function logSanitizedError(
  context: string,
  error: unknown,
  severity: SanitizedErrorSeverity
): void {
  const details: SanitizedErrorDetails = { name: 'UnknownError' };
  if (error instanceof Error) {
    if (SAFE_ERROR_NAMES.has(error.name)) details.name = error.name;

    const status = 'status' in error
      ? error.status
      : 'statusCode' in error
        ? error.statusCode
        : undefined;
    if (typeof status === 'number' && Number.isInteger(status) && status >= 100 && status <= 599) {
      details.status = status;
    }
  }

  const log = severity === 'error' ? console.error : console.warn;
  log(`${context} failed`, details);
}
