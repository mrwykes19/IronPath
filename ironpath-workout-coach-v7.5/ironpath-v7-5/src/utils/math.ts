export const roundToIncrement = (value: number, increment: number) => {
  if (!increment) return value;
  return Math.max(0, Math.round(value / increment) * increment);
};

export const average = (values: number[]) => {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

export const estimatedOneRepMax = (weight: number, reps: number) => {
  if (weight <= 0 || reps <= 0) return 0;
  return weight * (1 + reps / 30);
};

export const projectedReps = (estimatedMax: number, targetWeight: number) => {
  if (estimatedMax <= 0 || targetWeight <= 0 || estimatedMax <= targetWeight) return 1;
  return Math.max(1, Math.min(30, Math.round(30 * (estimatedMax / targetWeight - 1))));
};

export const sevenDayAverage = (entries: Array<{ date: string; weight: number }>) => {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recent = entries.filter((entry) => new Date(entry.date).getTime() >= cutoff);
  return recent.length ? average(recent.map((entry) => entry.weight)) : undefined;
};

export const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const remainder = Math.max(0, seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainder}`;
};
