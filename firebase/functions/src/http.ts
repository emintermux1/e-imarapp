import { Response } from 'express';
import { GatewayError, GatewayResponse, SourceAttribution } from './types';

export const ok = <T>(res: Response, data: T, attribution?: SourceAttribution[]): void => {
  const body: GatewayResponse<T> = { status: 'ok', data };
  if (attribution && attribution.length > 0) {
    body.attribution = attribution;
  }
  res.status(200).json(body);
};

export const fail = (res: Response, status: number, error: GatewayError): void => {
  const body: GatewayResponse<never> = { status: 'error', error };
  res.status(status).json(body);
};
