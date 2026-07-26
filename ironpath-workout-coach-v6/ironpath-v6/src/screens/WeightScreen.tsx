import React, { useMemo, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Card } from '../components/Card';
import { PrimaryButton } from '../components/PrimaryButton';
import { TrendBars } from '../components/TrendBars';
import { EmptyStateGraphic } from '../components/Visuals';
import { importLatestWeight, saveWeightToHealthKit } from '../services/healthkit';
import { useApp } from '../state/AppContext';
import { colors } from '../theme/colors';
import { sevenDayAverage } from '../utils/math';

const notify = (title: string, message: string) => Platform.OS === 'web' ? globalThis.alert?.(`${title}\n\n${message}`) : Alert.alert(title, message);

export const WeightScreen = () => {
  const { state, addWeight } = useApp();
  const [value, setValue] = useState(state.profile.currentWeight?.toString() ?? '');
  const entries = [...state.weightEntries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const current = entries.at(-1)?.weight ?? state.profile.currentWeight;
  const starting = entries[0]?.weight ?? state.profile.currentWeight;
  const change = current && starting ? current - starting : undefined;
  const average = sevenDayAverage(entries);
  const latest = entries.slice(-10);
  const normalizedValues = useMemo(() => {
    if (!latest.length) return [];
    const min = Math.min(...latest.map((entry) => entry.weight));
    return latest.map((entry) => entry.weight - min + 1);
  }, [latest]);

  const save = async () => {
    const weight = Number(value);
    if (!weight || weight < 50 || weight > 700) return notify('Check weight', 'Enter a realistic body weight.');
    addWeight(weight);
    if (state.healthKitConnected) await saveWeightToHealthKit(weight);
    notify('Weight saved', `${weight.toFixed(1)} ${state.profile.unit} was added to your trend.`);
  };

  const importWeight = async () => {
    const result = await importLatestWeight();
    if (result.ok && result.value) {
      addWeight(result.value, 'healthkit');
      setValue(result.value.toString());
    }
    notify(result.ok ? 'Weight imported' : 'Could not import', result.message);
  };

  const goal = state.profile.goalWeight;
  const remaining = current && goal ? current - goal : undefined;
  const totalGoalChange = starting && goal ? Math.abs(starting - goal) : 0;
  const completedChange = starting && current ? Math.abs(starting - current) : 0;
  const goalPercent = totalGoalChange ? Math.min(100, Math.round((completedChange / totalGoalChange) * 100)) : 0;
  const thirtyDaysAgo = Date.now() - 30 * 86400000;
  const monthEntries = entries.filter((entry) => new Date(entry.date).getTime() >= thirtyDaysAgo);
  const monthChange = monthEntries.length > 1 ? monthEntries.at(-1)!.weight - monthEntries[0]!.weight : 0;
  const weeklyRate = entries.length > 1 ? ((current ?? 0) - (starting ?? 0)) / Math.max(1, (new Date(entries.at(-1)!.date).getTime() - new Date(entries[0]!.date).getTime()) / (7 * 86400000)) : 0;

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.headingRow}>
        <View style={styles.flex}><Text style={styles.title}>Weight</Text><Text style={styles.subtitle}>Track the trend, not a single day.</Text></View>
        <View style={styles.headingIcon}><Text style={styles.headingIconText}>▥</Text></View>
      </View>

      <Card style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View><Text style={styles.cardEyebrow}>CURRENT WEIGHT</Text><Text style={styles.currentWeight}>{current ? current.toFixed(1) : '—'} <Text style={styles.unit}>{state.profile.unit}</Text></Text></View>
          <View style={styles.averageBox}><Text style={styles.averageLabel}>7-DAY AVG</Text><Text style={styles.averageValue}>{average ? average.toFixed(1) : '—'}</Text></View>
        </View>
        {normalizedValues.length ? <TrendBars values={normalizedValues} labels={latest.map((entry) => new Date(entry.date).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' }))} /> : <View style={styles.emptyWrap}><EmptyStateGraphic kind="weight" /><Text style={styles.empty}>Add your first weigh-in to begin the chart.</Text></View>}
      </Card>

      <Card>
        <View style={styles.goalHeader}><View><Text style={styles.cardEyebrow}>GOAL PROGRESS</Text><Text style={styles.cardTitle}>{goal ? `Goal: ${goal} ${state.profile.unit}` : 'Set a goal weight in Settings'}</Text></View><Text style={styles.goalPercent}>{goalPercent}%</Text></View>
        <View style={styles.track}><View style={[styles.fill, { width: `${goalPercent}%` }]} /></View>
        <View style={styles.goalFooter}><Text style={styles.goalDetail}>{remaining !== undefined ? `${Math.max(0, remaining).toFixed(1)} ${state.profile.unit} to go` : 'No goal set'}</Text><Text style={styles.goalDetail}>{change !== undefined ? `${Math.abs(change).toFixed(1)} ${state.profile.unit} changed` : '—'}</Text></View>
      </Card>

      <View style={styles.summaryGrid}>
        <Card style={styles.summaryCard}><Text style={styles.summaryLabel}>THIS MONTH</Text><Text style={styles.summaryValue}>{monthChange > 0 ? '+' : ''}{monthChange.toFixed(1)}</Text><Text style={styles.summaryDetail}>{state.profile.unit}</Text></Card>
        <Card style={styles.summaryCard}><Text style={styles.summaryLabel}>SINCE START</Text><Text style={styles.summaryValue}>{change !== undefined ? `${change > 0 ? '+' : ''}${change.toFixed(1)}` : '—'}</Text><Text style={styles.summaryDetail}>{state.profile.unit}</Text></Card>
        <Card style={styles.summaryCard}><Text style={styles.summaryLabel}>AVG / WEEK</Text><Text style={styles.summaryValue}>{weeklyRate > 0 ? '+' : ''}{weeklyRate.toFixed(1)}</Text><Text style={styles.summaryDetail}>{state.profile.unit}</Text></Card>
      </View>

      <Card>
        <Text style={styles.cardTitle}>Add weigh-in</Text>
        <TextInput value={value} onChangeText={setValue} keyboardType="decimal-pad" placeholder={`Weight in ${state.profile.unit}`} placeholderTextColor={colors.muted} style={styles.input} />
        <PrimaryButton title="Save weigh-in" onPress={() => void save()} />
        <PrimaryButton title="Import latest from Apple Health" onPress={() => void importWeight()} secondary />
      </Card>

      <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>History</Text><Text style={styles.sectionMeta}>{entries.length} entries</Text></View>
      {entries.slice().reverse().slice(0, 20).map((entry) => (
        <Card key={entry.id}>
          <View style={styles.historyRow}>
            <View style={styles.dateBadge}><Text style={styles.dateDay}>{new Date(entry.date).getDate()}</Text><Text style={styles.dateMonth}>{new Date(entry.date).toLocaleDateString(undefined, { month: 'short' }).toUpperCase()}</Text></View>
            <View style={styles.flex}><Text style={styles.historyWeight}>{entry.weight.toFixed(1)} {state.profile.unit}</Text><Text style={styles.historyDate}>{new Date(entry.date).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</Text></View>
            <Text style={styles.source}>{entry.source === 'healthkit' ? 'APPLE HEALTH' : 'MANUAL'}</Text>
          </View>
        </Card>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 18, gap: 12, paddingBottom: 116 },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { color: colors.text, fontSize: 29, fontWeight: '900', letterSpacing: -0.8 },
  subtitle: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 3 },
  headingIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.panelRaised, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  headingIconText: { color: colors.accent, fontSize: 17 },
  heroCard: { backgroundColor: colors.accentDeep, borderColor: colors.borderStrong },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardEyebrow: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
  currentWeight: { color: colors.text, fontSize: 32, fontWeight: '900', marginTop: 3 },
  unit: { color: colors.muted, fontSize: 14 },
  averageBox: { backgroundColor: colors.panelRaised, borderRadius: 14, padding: 10, alignItems: 'flex-end', borderWidth: 1, borderColor: colors.border },
  averageLabel: { color: colors.muted, fontSize: 8, fontWeight: '900' },
  averageValue: { color: colors.accent, fontSize: 18, fontWeight: '900', marginTop: 2 },
  cardTitle: { color: colors.text, fontSize: 18, fontWeight: '900' },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  goalPercent: { color: colors.accent, fontSize: 20, fontWeight: '900' },
  track: { height: 10, backgroundColor: colors.panelRaised, borderRadius: 6, overflow: 'hidden', marginTop: 5 },
  fill: { height: '100%', backgroundColor: colors.accent, borderRadius: 6 },
  goalFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  goalDetail: { color: colors.muted, fontSize: 10 },
  summaryGrid: { flexDirection: 'row', gap: 8 },
  summaryCard: { flex: 1, minHeight: 102 },
  summaryLabel: { color: colors.mutedSoft, fontSize: 8, fontWeight: '900' },
  summaryValue: { color: colors.text, fontSize: 20, fontWeight: '900', marginTop: 7 },
  summaryDetail: { color: colors.accent, fontSize: 10, marginTop: 'auto' },
  input: { minHeight: 50, borderRadius: 14, backgroundColor: colors.panelRaised, borderWidth: 1, borderColor: colors.border, color: colors.text, paddingHorizontal: 13, fontSize: 17, fontWeight: '700' },
  emptyWrap: { alignItems: 'center', gap: 10, paddingVertical: 16 },
  empty: { color: colors.muted, textAlign: 'center', paddingVertical: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 },
  sectionTitle: { color: colors.text, fontSize: 19, fontWeight: '900' },
  sectionMeta: { color: colors.muted, fontSize: 10 },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  dateBadge: { width: 42, height: 46, borderRadius: 13, backgroundColor: colors.panelRaised, alignItems: 'center', justifyContent: 'center' },
  dateDay: { color: colors.text, fontWeight: '900', fontSize: 16 },
  dateMonth: { color: colors.accent, fontWeight: '900', fontSize: 8 },
  flex: { flex: 1 },
  historyWeight: { color: colors.text, fontSize: 17, fontWeight: '900' },
  historyDate: { color: colors.muted, fontSize: 11, marginTop: 2 },
  source: { color: colors.accent, fontSize: 8, fontWeight: '900' }
});
