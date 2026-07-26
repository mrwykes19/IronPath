import { AppState } from '../types';
import { createBackupDocument, getBackupFilename, parseBackupText } from './backupCore';
import { BackupReadResult, BackupWriteResult } from './backup.types';

const isAbortError = (error: unknown) => error instanceof Error && error.name === 'AbortError';

export const exportBackupFile = async (state: AppState): Promise<BackupWriteResult> => {
  const backup = createBackupDocument(state);
  const filename = getBackupFilename(backup.exportedAt);
  const json = JSON.stringify(backup, null, 2);
  const file = new File([json], filename, { type: 'application/json' });

  try {
    const shareData = { title: 'IronPath Backup', text: 'IronPath workout and weight backup', files: [file] };
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (!navigator.canShare || navigator.canShare(shareData))) {
      await navigator.share(shareData);
      return { ok: true, exportedAt: backup.exportedAt, filename, method: 'share' };
    }
  } catch (error) {
    if (isAbortError(error)) return { ok: false, cancelled: true, message: 'Backup export was cancelled.' };
  }

  try {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    return { ok: true, exportedAt: backup.exportedAt, filename, method: 'download' };
  } catch {
    return { ok: false, message: 'IronPath could not create the backup file in this browser.' };
  }
};

export const selectBackupFile = async (): Promise<BackupReadResult> => new Promise((resolve) => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,application/json';
  input.style.display = 'none';
  let settled = false;

  const onWindowFocus = () => {
    window.setTimeout(() => {
      if (!settled && !input.files?.length) finish({ ok: false, cancelled: true, message: 'Backup selection was cancelled.' });
    }, 500);
  };

  const finish = (result: BackupReadResult) => {
    if (settled) return;
    settled = true;
    window.removeEventListener('focus', onWindowFocus);
    input.remove();
    resolve(result);
  };

  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    if (!file) {
      finish({ ok: false, cancelled: true, message: 'No backup file was selected.' });
      return;
    }

    try {
      const text = await file.text();
      const parsed = parseBackupText(text);
      finish({ ok: true, ...parsed, filename: file.name });
    } catch (error) {
      finish({ ok: false, message: error instanceof Error ? error.message : 'The backup could not be read.' });
    }
  }, { once: true });

  window.addEventListener('focus', onWindowFocus);
  document.body.appendChild(input);
  input.click();
});
