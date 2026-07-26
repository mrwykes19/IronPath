import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Card } from './Card';
import { PrimaryButton } from './PrimaryButton';
import { useApp } from '../state/AppContext';
import { colors } from '../theme/colors';
import { CardioDevice } from '../types';
import { formatDuration } from '../utils/math';
import { ActivityGraphic } from './Visuals';

const options: Array<{ id: CardioDevice; label: string }> = [
  { id: 'treadmill-run', label: 'Run' },
  { id: 'treadmill-walk', label: 'Walk' },
  { id: 'bike', label: 'Bike' },
  { id: 'elliptical', label: 'Elliptical' },
  { id: 'rower', label: 'Rower' },
  { id: 'stair-climber', label: 'Stairs' }
];

const labelFor = (device?: CardioDevice) => options.find((item) => item.id === device)?.label ?? 'Cardio';
const todayDate = () => new Date().toISOString().slice(0, 10);

export const CardioTracker = () => {
  const { state, startCardio, finishCardio, addManualCardio, cancelCardio } = useApp();
  const [expanded, setExpanded] = useState(Boolean(state.activeCardio));
  const [mode, setMode] = useState<'timer' | 'manual'>('timer');
  const [selected, setSelected] = useState<CardioDevice>('treadmill-run');
  const [elapsed, setElapsed] = useState(0);
  const [distance, setDistance] = useState('');
  const [notes, setNotes] = useState('');
  const [manualDate, setManualDate] = useState(todayDate());
  const [manualDuration, setManualDuration] = useState('');
  const [manualDistance, setManualDistance] = useState('');
  const [manualCalories, setManualCalories] = useState('');
  const [manualNotes, setManualNotes] = useState('');

  useEffect(() => {
    if (!state.activeCardio) {
      setElapsed(0);
      return;
    }
    const update = () => setElapsed(Math.max(0, Math.floor((Date.now() - new Date(state.activeCardio!.startedAt).getTime()) / 1000)));
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [state.activeCardio]);

  const recent = useMemo(() => (state.cardioSessions ?? []).slice(-1)[0], [state.cardioSessions]);

  const saveTimer = () => {
    finishCardio(Number(distance) || undefined, notes);
    setDistance('');
    setNotes('');
    setExpanded(false);
  };

  const saveManual = () => {
    const durationMinutes = Number(manualDuration);
    if (!manualDate || !durationMinutes || durationMinutes <= 0) {
      const message = 'Enter a valid date and duration before saving.';
      Platform.OS === 'web' ? globalThis.alert?.(message) : Alert.alert('Missing details', message);
      return;
    }
    addManualCardio({
      device: selected,
      date: manualDate,
      durationMinutes,
      distanceMiles: Number(manualDistance) || undefined,
      calories: Number(manualCalories) || undefined,
      notes: manualNotes
    });
    setManualDate(todayDate());
    setManualDuration('');
    setManualDistance('');
    setManualCalories('');
    setManualNotes('');
    setExpanded(false);
    setMode('timer');
    const message = 'Past cardio session saved.';
    Platform.OS === 'web' ? globalThis.alert?.(message) : Alert.alert('Cardio saved', message);
  };

  return (
    <Card style={styles.card}>
      <Pressable style={styles.header} onPress={() => setExpanded((value) => !value)}>
        <View style={styles.icon}><ActivityGraphic device={state.activeCardio?.device ?? selected} active size={44} /></View>
        <View style={styles.flex}>
          <Text style={styles.eyebrow}>DON'T FORGET CARDIO</Text>
          <Text style={styles.title}>{state.activeCardio ? `${labelFor(state.activeCardio.device)} in progress` : 'Track cardio your way'}</Text>
          <Text style={styles.copy}>{state.activeCardio ? formatDuration(elapsed) : recent?.distanceMiles ? `Last: ${recent.distanceMiles.toFixed(2)} mi in ${formatDuration(recent.durationSeconds ?? 0)}` : 'Start a timer or add a session you forgot to track.'}</Text>
        </View>
        <Text style={styles.chevron}>{expanded ? '⌃' : '⌄'}</Text>
      </Pressable>

      {expanded ? (
        <View style={styles.body}>
          {!state.activeCardio ? (
            <>
              <View style={styles.modeRow}>
                <Pressable onPress={() => setMode('timer')} style={[styles.modeButton, mode === 'timer' && styles.modeButtonActive]}>
                  <Text style={[styles.modeText, mode === 'timer' && styles.modeTextActive]}>Start timer</Text>
                </Pressable>
                <Pressable onPress={() => setMode('manual')} style={[styles.modeButton, mode === 'manual' && styles.modeButtonActive]}>
                  <Text style={[styles.modeText, mode === 'manual' && styles.modeTextActive]}>Add past cardio</Text>
                </Pressable>
              </View>

              <Text style={styles.label}>CHOOSE ACTIVITY</Text>
              <View style={styles.deviceGrid}>
                {options.map((item) => (
                  <Pressable key={item.id} onPress={() => setSelected(item.id)} style={[styles.device, selected === item.id && styles.deviceActive]}>
                    <ActivityGraphic device={item.id} active={selected === item.id} size={48} />
                    <Text style={[styles.deviceText, selected === item.id && styles.deviceTextActive]}>{item.label}</Text>
                  </Pressable>
                ))}
              </View>

              {mode === 'timer' ? (
                <PrimaryButton title={`Start ${labelFor(selected)} timer`} onPress={() => startCardio(selected)} />
              ) : (
                <View style={styles.manualForm}>
                  <View style={styles.twoColumn}>
                    <View style={styles.field}>
                      <Text style={styles.fieldLabel}>Date</Text>
                      <TextInput value={manualDate} onChangeText={setManualDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.muted} style={styles.input} />
                    </View>
                    <View style={styles.field}>
                      <Text style={styles.fieldLabel}>Duration</Text>
                      <TextInput value={manualDuration} onChangeText={setManualDuration} keyboardType="decimal-pad" placeholder="Minutes" placeholderTextColor={colors.muted} style={styles.input} />
                    </View>
                  </View>
                  <View style={styles.twoColumn}>
                    <View style={styles.field}>
                      <Text style={styles.fieldLabel}>Distance</Text>
                      <TextInput value={manualDistance} onChangeText={setManualDistance} keyboardType="decimal-pad" placeholder="Miles" placeholderTextColor={colors.muted} style={styles.input} />
                    </View>
                    <View style={styles.field}>
                      <Text style={styles.fieldLabel}>Calories</Text>
                      <TextInput value={manualCalories} onChangeText={setManualCalories} keyboardType="decimal-pad" placeholder="Optional" placeholderTextColor={colors.muted} style={styles.input} />
                    </View>
                  </View>
                  <TextInput value={manualNotes} onChangeText={setManualNotes} placeholder="Optional note" placeholderTextColor={colors.muted} style={[styles.input, styles.notesInput]} multiline />
                  <PrimaryButton title="Save past cardio" onPress={saveManual} />
                </View>
              )}
            </>
          ) : (
            <>
              <View style={styles.timerBox}>
                <Text style={styles.timerLabel}>{labelFor(state.activeCardio.device).toUpperCase()}</Text>
                <Text style={styles.timer}>{formatDuration(elapsed)}</Text>
                <Text style={styles.timerHint}>Keep IronPath open or return when you finish.</Text>
              </View>
              <Text style={styles.label}>DISTANCE AFTER SESSION</Text>
              <TextInput value={distance} onChangeText={setDistance} keyboardType="decimal-pad" placeholder="Miles completed" placeholderTextColor={colors.muted} style={styles.input} />
              <TextInput value={notes} onChangeText={setNotes} placeholder="Optional note" placeholderTextColor={colors.muted} style={styles.input} />
              <PrimaryButton title="Finish and save cardio" onPress={saveTimer} />
              <PrimaryButton title="Cancel cardio session" onPress={() => { cancelCardio(); setExpanded(false); }} secondary />
            </>
          )}
        </View>
      ) : null}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: '#07101A', borderColor: colors.borderStrong, padding: 0, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15, backgroundColor: '#081321' },
  icon: { width: 50, height: 50, borderRadius: 16, backgroundColor: '#050B12', borderWidth: 1, borderColor: colors.accent, alignItems: 'center', justifyContent: 'center', shadowColor: colors.accent, shadowOpacity: 0.22, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  iconText: { color: colors.accent, fontSize: 18, fontWeight: '900' },
  flex: { flex: 1 },
  eyebrow: { color: colors.accent, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  title: { color: colors.text, fontSize: 16, fontWeight: '900', marginTop: 3 },
  copy: { color: colors.muted, fontSize: 10, marginTop: 3 },
  chevron: { color: colors.muted, fontSize: 17 },
  body: { borderTopWidth: 1, borderTopColor: colors.border, padding: 14, gap: 10 },
  label: { color: colors.mutedSoft, fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  modeRow: { flexDirection: 'row', gap: 8 },
  modeButton: { flex: 1, minHeight: 40, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.panel, alignItems: 'center', justifyContent: 'center' },
  modeButtonActive: { backgroundColor: colors.accentDeep, borderColor: colors.accent },
  modeText: { color: colors.muted, fontSize: 11, fontWeight: '800' },
  modeTextActive: { color: colors.accent },
  deviceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  device: { width: '31.5%', minHeight: 82, borderRadius: 13, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', gap: 3 },
  deviceActive: { backgroundColor: colors.accentDeep, borderColor: colors.accent },
  deviceIcon: { color: colors.muted, fontSize: 17, fontWeight: '900' },
  deviceText: { color: colors.muted, fontSize: 9, fontWeight: '800' },
  deviceTextActive: { color: colors.accent },
  manualForm: { gap: 10 },
  twoColumn: { flexDirection: 'row', gap: 8 },
  field: { flex: 1, gap: 5 },
  fieldLabel: { color: colors.muted, fontSize: 9, fontWeight: '800' },
  timerBox: { backgroundColor: colors.bg, borderRadius: 16, borderWidth: 1, borderColor: colors.borderStrong, padding: 16, alignItems: 'center' },
  timerLabel: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  timer: { color: colors.text, fontSize: 38, fontWeight: '900', fontVariant: ['tabular-nums'], marginTop: 5 },
  timerHint: { color: colors.muted, fontSize: 9, marginTop: 5 },
  input: { minHeight: 46, borderRadius: 13, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, color: colors.text, paddingHorizontal: 12 },
  notesInput: { minHeight: 74, paddingTop: 12, textAlignVertical: 'top' }
});
