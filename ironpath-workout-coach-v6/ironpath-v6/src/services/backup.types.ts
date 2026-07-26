import { AppState } from '../types';

export const IRONPATH_BACKUP_FORMAT = 'ironpath-backup';
export const IRONPATH_BACKUP_VERSION = 1;
export const IRONPATH_APP_VERSION = '0.5.5';

export interface IronPathBackupDocument {
  format: typeof IRONPATH_BACKUP_FORMAT;
  backupVersion: typeof IRONPATH_BACKUP_VERSION;
  appVersion: string;
  exportedAt: string;
  data: AppState;
}

export interface BackupSummary {
  workoutCount: number;
  weightEntryCount: number;
  hasActiveWorkout: boolean;
  exportedAt: string;
  appVersion: string;
}

export type BackupReadResult =
  | { ok: true; backup: IronPathBackupDocument; summary: BackupSummary; filename: string }
  | { ok: false; cancelled?: boolean; message: string };

export type BackupWriteResult =
  | { ok: true; exportedAt: string; filename: string; method: 'share' | 'download' }
  | { ok: false; cancelled?: boolean; message: string };
