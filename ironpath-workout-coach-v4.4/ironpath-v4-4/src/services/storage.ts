import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from '../types';

const STORAGE_KEY = '@ironpath/state/v1';

export const saveState = async (state: AppState) => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const loadState = async (): Promise<AppState | undefined> => {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as AppState;
  } catch {
    return undefined;
  }
};

export const clearState = async () => AsyncStorage.removeItem(STORAGE_KEY);
