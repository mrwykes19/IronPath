import {
  getMostRecentQuantitySample,
  isHealthDataAvailable,
  requestAuthorization,
  saveQuantitySample
} from '@kingstinct/react-native-healthkit';
import { HealthKitResult } from './healthkit.types';

export const connectHealthKit = async (): Promise<HealthKitResult<boolean>> => {
  try {
    const available = await isHealthDataAvailable();
    if (!available) return { ok: false, message: 'Apple Health is not available on this device.' };

    await requestAuthorization({
      toRead: ['HKQuantityTypeIdentifierBodyMass', 'HKQuantityTypeIdentifierActiveEnergyBurned'],
      toShare: ['HKQuantityTypeIdentifierBodyMass']
    });
    return { ok: true, value: true, message: 'Apple Health permissions requested.' };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'HealthKit authorization failed.' };
  }
};

export const importLatestWeight = async (): Promise<HealthKitResult<number>> => {
  try {
    const sample = await getMostRecentQuantitySample('HKQuantityTypeIdentifierBodyMass');
    if (!sample?.quantity) return { ok: false, message: 'No body-weight sample was found.' };

    const unit = String(sample.unit ?? '').toLowerCase();
    const pounds = unit.includes('kg') ? Number(sample.quantity) * 2.2046226218 : Number(sample.quantity);
    return { ok: true, value: Math.round(pounds * 10) / 10, message: 'Latest body weight imported from Apple Health.' };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'Could not read body weight.' };
  }
};

export const saveWeightToHealthKit = async (weightLb: number): Promise<HealthKitResult<boolean>> => {
  try {
    const now = new Date();
    await saveQuantitySample('HKQuantityTypeIdentifierBodyMass', 'lb', weightLb, {
      startDate: now,
      endDate: now
    });
    return { ok: true, value: true, message: 'Body weight saved to Apple Health.' };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'Could not save body weight.' };
  }
};
