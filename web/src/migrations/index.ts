import * as migration_20260712_112526_initial from './20260712_112526_initial';
import * as migration_20260902_153024_posts_ingest from './20260902_153024_posts_ingest';

export const migrations = [
  {
    up: migration_20260712_112526_initial.up,
    down: migration_20260712_112526_initial.down,
    name: '20260712_112526_initial',
  },
  {
    up: migration_20260902_153024_posts_ingest.up,
    down: migration_20260902_153024_posts_ingest.down,
    name: '20260902_153024_posts_ingest'
  },
];
