import { resolve } from 'node:path';

export const DEFAULT_DEPARTMENTS_STORAGE_FILE = resolve(
  __dirname,
  '..',
  '..',
  '.data',
  'departments.json',
);

export const DEPARTMENTS_STORAGE_FILE =
  process.env.DEPARTMENTS_STORAGE_FILE?.trim() ||
  DEFAULT_DEPARTMENTS_STORAGE_FILE;
