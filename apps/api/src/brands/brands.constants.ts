import { resolve } from 'node:path';

export const DEFAULT_BRANDS_STORAGE_FILE = resolve(
  __dirname,
  '..',
  '..',
  '.data',
  'brands.json',
);

export const BRANDS_STORAGE_FILE =
  process.env.BRANDS_STORAGE_FILE?.trim() || DEFAULT_BRANDS_STORAGE_FILE;
