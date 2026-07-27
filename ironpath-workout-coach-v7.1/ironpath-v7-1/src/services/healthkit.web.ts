import { HealthKitResult } from './healthkit.types';

export const connectHealthKit = async (): Promise<HealthKitResult<boolean>> => ({
  ok: false,
  message: 'Apple Health is available only in the native iPhone build.'
});

export const importLatestWeight = async (): Promise<HealthKitResult<number>> => ({
  ok: false,
  message: 'Apple Health is not available in the web version.'
});

export const saveWeightToHealthKit = async (_weightLb: number): Promise<HealthKitResult<boolean>> => ({
  ok: false,
  message: 'Apple Health is not available in the web version.'
});
