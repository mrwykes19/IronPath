export interface HealthKitResult<T> {
  ok: boolean;
  value?: T;
  message: string;
}
