import path from 'node:path';

export const PROJECT_ROOT = path
    .parse(import.meta.url)
    ?.dir.substring('file://'.length);
