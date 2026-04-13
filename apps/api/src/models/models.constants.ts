import { resolve } from 'node:path';

export const DEFAULT_MODELS_STORAGE_FILE = resolve(
  __dirname,
  '..',
  '..',
  '.data',
  'models.json',
);

export const MODELS_STORAGE_FILE =
  process.env.MODELS_STORAGE_FILE?.trim() || DEFAULT_MODELS_STORAGE_FILE;
