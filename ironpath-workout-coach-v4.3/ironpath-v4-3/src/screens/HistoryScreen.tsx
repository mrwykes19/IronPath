import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card } from '../components/Card';
import { calculateVolume } from '../engine/planner';
import { personalRecords, sessionDurationMinutes } from '../engine/analytics';
import { useApp } from '../state/AppContext';
import { colors } from '../theme/colors';

const sameDay = (a: string, b: Date) => new Date(a).toDateString() === b.toDateString();

export const HistoryScreen = ({ goBack }: { goBack: () => void }) => {
  const { state } = useApp();
  const [month, setMonth] = useState(new Date());
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const completed = state.sessions.filter((session) => session.completedAt).slice().sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());
  const prs = personalRecords(state);
  const selected = completed.find((session) => session.id === selectedId);

  const calendarDays = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const startOffset = first.getDay();
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return Array.from({ length: 42 }, (_, index) => {
      const day = index - startOffset + 1;
      if (day < 1 || day > daysInMonth) return undefined;
      const date = new Date(month.getFullYear(), month.getMonth(), day);
      const sessions = completed.filter((session) => sameDay(session.completedAt!, date));
      const hasPr = prs.some((record) => sameDay(record.date, date));
      return { day, date, sessions, hasPr };
    });
  }, [completed, month, prs]);

  const shiftMonth = (amount: number) => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.topBar}>
        <Pressable onPress={goBack} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable>
        <View style={styles.flex}>
          <Text style={styles.eyebrow}>TRAINING LOG</Text>
          <Text style={styles.title}>History</Text>
        </View>
      </View>

      <Card>
        <View style={styles.monthHeader}>
          <Pressable onPress={() => shiftMonth(-1)} style={styles.monthButton}><Text style={styles.monthArrow}>‹</Text></Pressable>
          <Text style={styles.monthTitle}>{month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</Text>
          <Pressable onPress={() => shiftMonth(1)} style={styles.monthButton}><Text style={styles.monthArrow}>›</Text></Pressable>
        </View>
        <View style={styles.weekRow}>{['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => <Text key={`${day}-${index}`} style={styles.weekDay}>{day}</Text>)}</View>
        <View style={styles.calendar}>
          {calendarDays.map((entry, index) => (
            <Pressable
              key={index}
              disabled={!entry || !entry.sessions.length}
              onPress={() => entry?.sessions[0] && setSelectedId(entry.sessions[0].id)}
              style={[styles.day, entry?.sessions.length ? styles.dayWorkout : undefined, entry && sameDay(new Date().toISOString(), entry.date) ? styles.dayToday : undefined]}
            >
              <Text style={[styles.dayText, entry?.sessions.length ? styles.dayTextWorkout : undefined]}>{entry?.day ?? ''}</Text>
              {entry?.hasPr ? <Text style={styles.prMarker}>PR</Text> : entry?.sessions.length ? <View style={styles.dot} /> : null}
            </Pressable>
          ))}
        </View>
        <View style={styles.legend}><View style={styles.dot} /><Text style={styles.legendText}>Workout</Text><Text style={styles.prMarker}>PR</Text><Text style={styles.legendText}>Personal record</Text></View>
      </Card>

      {selected ? (
        <Card style={styles.selectedCard}>
          <Text style={styles.selectedEyebrow}>SELECTED SESSION</Text>
          <Text style={styles.sessionName}>{selected.name}</Text>
          <Text style={styles.sessionDate}>{new Date(selected.completedAt!).toLocaleString()}</Text>
          <View style={styles.metricRow}>
            <View><Text style={styles.metricValue}>{Math.round(calculateVolume(selected)).toLocaleString()}</Text><Text style={styles.metricLabel}>Volume ({state.profile.unit})</Text></View>
            <View><Text style={styles.metricValue}>{sessionDurationMinutes(selected)}</Text><Text style={styles.metricLabel}>Minutes</Text></View>
            <View><Text style={styles.metricValue}>{selected.calories ?? '—'}</Text><Text style={styles.metricLabel}>Calories</Text></View>
          </View>
          {selected.notes ? <Text style={styles.note}>“{selected.notes}”</Text> : null}
        </Card>
      ) : null}

      <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Recent sessions</Text><Text style={styles.sectionMeta}>{completed.length} total</Text></View>
      {completed.length ? completed.map((session) => {
        const sessionHasPr = prs.some((record) => record.date === session.completedAt);
        return (
          <Pressable key={session.id} onPress={() => setSelectedId(session.id)}>
            <Card style={selectedId === session.id ? styles.selectedOutline : undefined}>
              <View style={styles.sessionRow}>
                <View style={styles.dateBox}><Text style={styles.dateDay}>{new Date(session.completedAt!).getDate()}</Text><Text style={styles.dateMonth}>{new Date(session.completedAt!).toLocaleDateString(undefined, { month: 'short' }).toUpperCase()}</Text></View>
                <View style={styles.flex}>
                  <View style={styles.nameRow}><Text style={styles.sessionNameSmall}>{session.name}</Text>{sessionHasPr ? <Text style={styles.prBadge}>PR</Text> : null}</View>
                  <Text style={styles.sessionMeta}>{session.exercises.length} exercises · {sessionDurationMinutes(session)} min · {Math.round(calculateVolume(session)).toLocaleString()} {state.profile.unit}</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </View>
            </Card>
          </Pressable>
        );
      }) : <Card><Text style={styles.empty}>Complete a workout and it will appear here.</Text></Card>}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 18, gap: 12, paddingBottom: 116 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  back: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.panelRaised, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  backText: { color: colors.text, fontSize: 32, lineHeight: 34 },
  flex: { flex: 1 },
  eyebrow: { color: colors.accent, fontSize: 11, fontWeight: '900', letterSpacing: 1.3 },
  title: { color: colors.text, fontSize: 30, fontWeight: '900' },
  monthHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panelRaised, borderRadius: 12 },
  monthArrow: { color: colors.text, fontSize: 28 },
  monthTitle: { color: colors.text, fontWeight: '900', fontSize: 17 },
  weekRow: { flexDirection: 'row' },
  weekDay: { width: '14.285%', textAlign: 'center', color: colors.mutedSoft, fontSize: 10, fontWeight: '900' },
  calendar: { flexDirection: 'row', flexWrap: 'wrap', gap: 0 },
  day: { width: '14.285%', height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 13, gap: 2 },
  dayWorkout: { backgroundColor: colors.panelRaised },
  dayToday: { borderWidth: 1, borderColor: colors.accent },
  dayText: { color: colors.muted, fontWeight: '700' },
  dayTextWorkout: { color: colors.text, fontWeight: '900' },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.accent },
  prMarker: { color: colors.warning, fontSize: 8, fontWeight: '900' },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 4 },
  legendText: { color: colors.muted, fontSize: 10, marginRight: 10 },
  selectedCard: { backgroundColor: colors.accentDeep, borderColor: colors.borderStrong },
  selectedEyebrow: { color: colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  sessionName: { color: colors.text, fontSize: 22, fontWeight: '900' },
  sessionDate: { color: colors.muted, fontSize: 12 },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 6 },
  metricValue: { color: colors.text, fontWeight: '900', fontSize: 16 },
  metricLabel: { color: colors.muted, fontSize: 9, marginTop: 2 },
  note: { color: colors.muted, lineHeight: 19, borderLeftWidth: 2, borderLeftColor: colors.accent, paddingLeft: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  sectionTitle: { color: colors.text, fontSize: 19, fontWeight: '900' },
  sectionMeta: { color: colors.muted, fontSize: 11 },
  selectedOutline: { borderColor: colors.accent },
  sessionRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dateBox: { width: 44, height: 48, borderRadius: 14, backgroundColor: colors.panelRaised, alignItems: 'center', justifyContent: 'center' },
  dateDay: { color: colors.text, fontSize: 17, fontWeight: '900' },
  dateMonth: { color: colors.accent, fontSize: 8, fontWeight: '900' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sessionNameSmall: { color: colors.text, fontSize: 15, fontWeight: '900' },
  prBadge: { color: colors.warning, backgroundColor: '#3D3220', borderRadius: 6, overflow: 'hidden', paddingHorizontal: 6, paddingVertical: 2, fontSize: 9, fontWeight: '900' },
  sessionMeta: { color: colors.muted, fontSize: 11, marginTop: 4 },
  chevron: { color: colors.muted, fontSize: 24 },
  empty: { color: colors.muted, paddingVertical: 20, textAlign: 'center' }
});
