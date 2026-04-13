import { resolve } from 'node:path';

process.env.AUTH_STORAGE_FILE = resolve(
  __dirname,
  '.data',
  'accounts.e2e.json',
);
process.env.DEPARTMENTS_STORAGE_FILE = resolve(
  __dirname,
  '.data',
  'departments.e2e.json',
);
process.env.DEVICE_TYPES_STORAGE_FILE = resolve(
  __dirname,
  '.data',
  'device-types.e2e.json',
);
process.env.BRANDS_STORAGE_FILE = resolve(
  __dirname,
  '.data',
  'brands.e2e.json',
);
process.env.MODELS_STORAGE_FILE = resolve(
  __dirname,
  '.data',
  'models.e2e.json',
);
process.env.OPERATING_SYSTEMS_STORAGE_FILE = resolve(
  __dirname,
  '.data',
  'operating-systems.e2e.json',
);
