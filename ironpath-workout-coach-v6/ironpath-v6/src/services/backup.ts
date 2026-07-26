import { AppState } from '../types';
import { BackupReadResult, BackupWriteResult } from './backup.types';

export const exportBackupFile = async (_state: AppState): Promise<BackupWriteResult> => ({
  ok: false,
  message: 'Backup files are currently available in the IronPath web app. Native file support can be added to a future iPhone build.'
});

export const selectBackupFile = async (): Promise<BackupReadResult> => ({
  ok: false,
  message: 'Backup files are currently available in the IronPath web app. Native file support can be added to a future iPhone build.'
});
