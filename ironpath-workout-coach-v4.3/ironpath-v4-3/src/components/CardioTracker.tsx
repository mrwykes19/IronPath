import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Card } from './Card';
import { PrimaryButton } from './PrimaryButton';
import { useApp } from '../state/AppContext';
import { colors } from '../theme/colors';
import { CardioDevice } from '../types';
import { formatDuration } from '../utils/math';

const options: Array<{ id: CardioDevice; label: string; icon: string }> = [
  { id: 'treadmill-run', label: 'Run', icon: '↗' },
  { id: 'treadmill-walk', label: 'Walk', icon: '→' },
  { id: 'bike', label: 'Bike', icon: '◉' },
  { id: 'elliptical', label: 'Elliptical', icon: '◇' },
  { id: 'rower', label: 'Rower', icon: '≋' },
  { id: 'stair-climber', label: 'Stairs', icon: '⌁' }
];

const labelFor = (device?: CardioDevice) => options.find((item) => item.id === device)?.label ?? 'Cardio';

export const CardioTracker = () => {
  const { state, startCardio, finishCardio, cancelCardio } = useApp();
  const [expanded, setExpanded] = useState(Boolean(state.activeCardio));
  const [selected, setSelected] = useState<CardioDevice>('treadmill-run');
  const [elapsed, setElapsed] = useState(0);
  const [distance, setDistance] = useState('');
  const [notes, setNotes] = useState('');

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

  const save = () => {
    finishCardio(Number(distance) || undefined, notes);
    setDistance('');
    setNotes('');
    setExpanded(false);
  };

  return (
    <Card style={styles.card}>
      <Pressable style={styles.header} onPress={() => setExpanded((value) => !value)}>
        <View style={styles.icon}><Text style={styles.iconText}>♥</Text></View>
        <View style={styles.flex}>
          <Text style={styles.eyebrow}>DON'T FORGET CARDIO</Text>
          <Text style={styles.title}>{state.activeCardio ? `${labelFor(state.activeCardio.device)} in progress` : 'Add a cardio session'}</Text>
          <Text style={styles.copy}>{state.activeCardio ? formatDuration(elapsed) : recent?.distanceMiles ? `Last: ${recent.distanceMiles.toFixed(2)} mi in ${formatDuration(recent.durationSeconds ?? 0)}` : 'Track time now and enter your distance when you finish.'}</Text>
        </View>
        <Text style={styles.chevron}>{expanded ? '⌃' : '⌄'}</Text>
      </Pressable>

      {expanded ? (
        <View style={styles.body}>
          {!state.activeCardio ? (
            <>
              <Text style={styles.label}>CHOOSE DEVICE</Text>
              <View style={styles.deviceGrid}>
                {options.map((item) => (
                  <Pressable key={item.id} onPress={() => setSelected(item.id)} style={[styles.device, selected === item.id && styles.deviceActive]}>
                    <Text style={[styles.deviceIcon, selected === item.id && styles.deviceTextActive]}>{item.icon}</Text>
                    <Text style={[styles.deviceText, selected === item.id && styles.deviceTextActive]}>{item.label}</Text>
                  </Pressable>
                ))}
              </View>
              <PrimaryButton title={`Start ${labelFor(selected)} timer`} onPress={() => startCardio(selected)} />
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
              <PrimaryButton title="Finish and save cardio" onPress={save} />
              <PrimaryButton title="Cancel cardio session" onPress={() => { cancelCardio(); setExpanded(false); }} secondary />
            </>
          )}
        </View>
      ) : null}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: colors.panelSoft, borderColor: colors.borderStrong, padding: 0, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  icon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.accentDeep, borderWidth: 1, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  iconText: { color: colors.accent, fontSize: 18, fontWeight: '900' },
  flex: { flex: 1 },
  eyebrow: { color: colors.accent, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  title: { color: colors.text, fontSize: 16, fontWeight: '900', marginTop: 3 },
  copy: { color: colors.muted, fontSize: 10, marginTop: 3 },
  chevron: { color: colors.muted, fontSize: 17 },
  body: { borderTopWidth: 1, borderTopColor: colors.border, padding: 14, gap: 10 },
  label: { color: colors.mutedSoft, fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  deviceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  device: { width: '31.5%', minHeight: 62, borderRadius: 13, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', gap: 3 },
  deviceActive: { backgroundColor: colors.accentDeep, borderColor: colors.accent },
  deviceIcon: { color: colors.muted, fontSize: 17, fontWeight: '900' },
  deviceText: { color: colors.muted, fontSize: 9, fontWeight: '800' },
  deviceTextActive: { color: colors.accent },
  timerBox: { backgroundColor: colors.bg, borderRadius: 16, borderWidth: 1, borderColor: colors.borderStrong, padding: 16, alignItems: 'center' },
  timerLabel: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  timer: { color: colors.text, fontSize: 38, fontWeight: '900', fontVariant: ['tabular-nums'], marginTop: 5 },
  timerHint: { color: colors.muted, fontSize: 9, marginTop: 5 },
  input: { minHeight: 46, borderRadius: 13, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, color: colors.text, paddingHorizontal: 12 }
});
