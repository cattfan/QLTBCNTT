import { resolve } from 'node:path';

export const DEFAULT_DEVICE_TYPES_STORAGE_FILE = resolve(
  __dirname,
  '..',
  '..',
  '.data',
  'device-types.json',
);

export const DEVICE_TYPES_STORAGE_FILE =
  process.env.DEVICE_TYPES_STORAGE_FILE?.trim() ||
  DEFAULT_DEVICE_TYPES_STORAGE_FILE;
