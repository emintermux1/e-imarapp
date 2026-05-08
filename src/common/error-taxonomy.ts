export enum IntegrationErrorCode {
  Unavailable = 'unavailable',
  RequiresCredentials = 'requires_credentials',
  CaptchaRequired = 'captcha_required',
  RateLimited = 'rate_limited',
  UnsupportedFormat = 'unsupported_format',
  EndpointChanged = 'endpoint_changed',
  NotConfigured = 'not_configured'
}

export interface IntegrationIssue {
  code: IntegrationErrorCode;
  message: string;
  sourceId?: string;
  endpoint?: string;
}
