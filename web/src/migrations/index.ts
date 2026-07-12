import * as migration_20260712_112526_initial from './20260712_112526_initial';

export const migrations = [
  {
    up: migration_20260712_112526_initial.up,
    down: migration_20260712_112526_initial.down,
    name: '20260712_112526_initial'
  },
];
