import { HealthKitResult } from './healthkit.types';

export const connectHealthKit = async (): Promise<HealthKitResult<boolean>> => ({
  ok: false,
  message: 'Apple Health integration is supported only on iPhone.'
});

export const importLatestWeight = async (): Promise<HealthKitResult<number>> => ({
  ok: false,
  message: 'Apple Health integration is supported only on iPhone.'
});

export const saveWeightToHealthKit = async (_weightLb: number): Promise<HealthKitResult<boolean>> => ({
  ok: false,
  message: 'Apple Health integration is supported only on iPhone.'
});
