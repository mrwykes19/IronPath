import React, { useMemo, useState } from 'react';
import { Alert, Image, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Card } from '../components/Card';
import { PrimaryButton } from '../components/PrimaryButton';
import { TrendBars } from '../components/TrendBars';
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
  const previous = entries.length > 1 ? entries.at(-2)?.weight : undefined;
  const starting = entries[0]?.weight ?? state.profile.currentWeight;
  const change = current && starting ? current - starting : undefined;
  const average = sevenDayAverage(entries);
  const latest = entries.slice(-10);
  const normalizedValues = useMemo(() => {
    if (!latest.length) return [];
    const min = Math.min(...latest.map((entry) => entry.weight));
    return latest.map((entry) => entry.weight - min + 1);
  }, [latest]);

  const goal = state.profile.goalWeight;
  const remaining = current && goal ? current - goal : undefined;
  const totalGoalChange = starting && goal ? Math.abs(starting - goal) : 0;
  const completedChange = starting && current ? Math.abs(starting - current) : 0;
  const goalPercent = totalGoalChange ? Math.min(100, Math.round((completedChange / totalGoalChange) * 100)) : 0;
  const thirtyDaysAgo = Date.now() - 30 * 86400000;
  const monthEntries = entries.filter((entry) => new Date(entry.date).getTime() >= thirtyDaysAgo);
  const monthChange = monthEntries.length > 1 ? monthEntries.at(-1)!.weight - monthEntries[0]!.weight : 0;
  const weeklyRate = entries.length > 1 ? ((current ?? 0) - (starting ?? 0)) / Math.max(1, (new Date(entries.at(-1)!.date).getTime() - new Date(entries[0]!.date).getTime()) / (7 * 86400000)) : 0;

  const trendDelta = current !== undefined && previous !== undefined ? current - previous : undefined;
  const trendDirection = trendDelta === undefined || trendDelta === 0 ? 'flat' : trendDelta < 0 ? 'down' : 'up';
  const trendArrow = trendDirection === 'down' ? '↓' : trendDirection === 'up' ? '↑' : '→';
  const trendColor = trendDirection === 'down' ? '#34D17B' : trendDirection === 'up' ? '#E5535F' : colors.accent;
  const trendValue = trendDelta === undefined ? '—' : `${Math.abs(trendDelta).toFixed(1)} ${state.profile.unit}`;
  const trendNote = trendDelta === undefined ? 'Add another weigh-in' : trendDirection === 'flat' ? 'No change' : 'Since last weigh-in';

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

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.headingRow}>
        <View style={styles.flex}>
          <Text style={styles.title}>Weight</Text>
          <Text style={styles.subtitle}>Track the trend, not a single day.</Text>
        </View>
      </View>

      <Card style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.cardEyebrow}>CURRENT WEIGHT</Text>
            <Text style={styles.currentWeight}>{current ? current.toFixed(1) : '—'} <Text style={styles.unit}>{state.profile.unit}</Text></Text>
            <Text style={styles.averageText}>{average ? `7-day average ${average.toFixed(1)} ${state.profile.unit}` : 'Add another weigh-in to unlock a 7-day average.'}</Text>
          </View>
          <View style={styles.trendBox}>
            <Text style={styles.trendLabel}>TREND</Text>
            <View style={styles.trendValueRow}>
              <Text style={[styles.trendArrow, { color: trendColor }]}>{trendArrow}</Text>
              <Text style={[styles.trendValue, { color: trendColor }]}>{trendValue}</Text>
            </View>
            <Text style={styles.trendNote}>{trendNote}</Text>
          </View>
        </View>
        {normalizedValues.length ? (
          <TrendBars values={normalizedValues} labels={latest.map((entry) => new Date(entry.date).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' }))} />
        ) : (
          <View style={styles.emptyWrap}>
            <Image source={require('../../assets/v64/weight.png')} resizeMode="contain" style={styles.emptyGraphicImage} />
            <Text style={styles.empty}>Add another weigh-in to begin your chart.</Text>
          </View>
        )}
      </Card>

      <Card>
        <View style={styles.goalHeader}>
          <View>
            <Text style={styles.cardEyebrow}>GOAL PROGRESS</Text>
            <Text style={styles.cardTitle}>{goal ? `Goal: ${goal} ${state.profile.unit}` : 'Set a goal weight in Settings'}</Text>
          </View>
          <Text style={styles.goalPercent}>{goalPercent}%</Text>
        </View>
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
  heroCard: { backgroundColor: colors.accentDeep, borderColor: colors.borderStrong },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  cardEyebrow: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
  currentWeight: { color: colors.text, fontSize: 32, fontWeight: '900', marginTop: 3 },
  unit: { color: colors.muted, fontSize: 14 },
  averageText: { color: colors.muted, fontSize: 10, marginTop: 8, lineHeight: 14, maxWidth: 190 },
  trendBox: { minWidth: 112, backgroundColor: colors.panelRaised, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, alignItems: 'flex-end', borderWidth: 1, borderColor: colors.border },
  trendLabel: { color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  trendValueRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
  trendArrow: { fontSize: 17, fontWeight: '900' },
  trendValue: { fontSize: 16, fontWeight: '900' },
  trendNote: { color: colors.muted, fontSize: 9, marginTop: 4 },
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
  emptyWrap: { alignItems: 'center', gap: 10, paddingTop: 18, paddingBottom: 10 },
  emptyGraphicImage: { width: 150, height: 150 },
  empty: { color: colors.muted, textAlign: 'center', paddingVertical: 4 },
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
