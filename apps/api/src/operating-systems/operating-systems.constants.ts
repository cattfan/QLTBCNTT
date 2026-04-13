import { resolve } from 'node:path';

export const DEFAULT_OPERATING_SYSTEMS_STORAGE_FILE = resolve(
  __dirname,
  '..',
  '..',
  '.data',
  'operating-systems.json',
);

export const OPERATING_SYSTEMS_STORAGE_FILE =
  process.env.OPERATING_SYSTEMS_STORAGE_FILE?.trim() ||
  DEFAULT_OPERATING_SYSTEMS_STORAGE_FILE;
