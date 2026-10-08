import * as migration_20260712_112526_initial from './20260712_112526_initial';
import * as migration_20260902_153024_posts_ingest from './20260902_153024_posts_ingest';
import * as migration_20260930_135611 from './20260930_135611';
import * as migration_20260930_181305 from './20260930_181305';
import * as migration_20261008_062812 from './20261008_062812';

export const migrations = [
  {
    up: migration_20260712_112526_initial.up,
    down: migration_20260712_112526_initial.down,
    name: '20260712_112526_initial',
  },
  {
    up: migration_20260902_153024_posts_ingest.up,
    down: migration_20260902_153024_posts_ingest.down,
    name: '20260902_153024_posts_ingest',
  },
  {
    up: migration_20260930_135611.up,
    down: migration_20260930_135611.down,
    name: '20260930_135611',
  },
  {
    up: migration_20260930_181305.up,
    down: migration_20260930_181305.down,
    name: '20260930_181305',
  },
  {
    up: migration_20261008_062812.up,
    down: migration_20261008_062812.down,
    name: '20261008_062812'
  },
];
