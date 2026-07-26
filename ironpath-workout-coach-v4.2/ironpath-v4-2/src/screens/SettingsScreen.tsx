import React, { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Card } from '../components/Card';
import { goalProgramProfiles } from '../data/program';
import { PrimaryButton } from '../components/PrimaryButton';
import { exportBackupFile, selectBackupFile } from '../services/backup';
import { BackupSummary, IronPathBackupDocument } from '../services/backup.types';
import { connectHealthKit } from '../services/healthkit';
import { useApp } from '../state/AppContext';
import { colors } from '../theme/colors';
import { BackupRestoreMode, Experience, Goal } from '../types';

const notify = (title: string, message: string) => Platform.OS === 'web' ? globalThis.alert?.(`${title}\n\n${message}`) : Alert.alert(title, message);

const formatDateTime = (iso?: string) => {
  if (!iso) return 'No backup created yet';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Backup date unavailable';
  return date.toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
};

interface PendingImport {
  backup: IronPathBackupDocument;
  summary: BackupSummary;
  filename: string;
}

export const SettingsScreen = () => {
  const { state, updateProfile, setHealthKitConnected, markBackupCreated, restoreBackup, resetAllData } = useApp();
  const [goalWeight, setGoalWeight] = useState(state.profile.goalWeight?.toString() ?? '');
  const [backupBusy, setBackupBusy] = useState(false);
  const [pendingImport, setPendingImport] = useState<PendingImport>();

  const applyGoal = (goal: Goal) => {
    if (goal === state.profile.goal) return;
    const profile = goalProgramProfiles[goal];
    const message = `${profile.changes} Completed workouts will not change${state.activeSession ? ', and your current workout will stay as it is' : ''}. Apply this goal to future workouts?`;
    const commit = () => {
      updateProfile({ goal });
      notify('Primary goal updated', `${profile.name} will be used for future workouts.`);
    };

    if (Platform.OS === 'web') {
      if (globalThis.confirm?.(message)) commit();
      return;
    }

    Alert.alert(`Switch to ${profile.shortLabel}?`, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Apply to future workouts', onPress: commit }
    ]);
  };

  const connect = async () => {
    const result = await connectHealthKit();
    setHealthKitConnected(result.ok);
    notify(result.ok ? 'Apple Health connected' : 'Apple Health unavailable', result.message);
  };

  const exportData = async () => {
    setBackupBusy(true);
    try {
      const result = await exportBackupFile(state);
      if (!result.ok) {
        if (!result.cancelled) notify('Backup not created', result.message);
        return;
      }
      markBackupCreated(result.exportedAt);
      notify('Backup created', result.method === 'share'
        ? `${result.filename} is ready in the share sheet. Save it to Files or iCloud Drive.`
        : `${result.filename} was downloaded. Keep it somewhere safe.`);
    } finally {
      setBackupBusy(false);
    }
  };

  const chooseImport = async () => {
    setBackupBusy(true);
    try {
      const result = await selectBackupFile();
      if (!result.ok) {
        if (!result.cancelled) notify('Backup not opened', result.message);
        return;
      }
      setPendingImport({ backup: result.backup, summary: result.summary, filename: result.filename });
    } finally {
      setBackupBusy(false);
    }
  };

  const performRestore = (mode: BackupRestoreMode) => {
    if (!pendingImport) return;
    restoreBackup(pendingImport.backup.data, mode);
    const action = mode === 'merge' ? 'merged with' : 'replaced';
    notify('Backup restored', `${pendingImport.summary.workoutCount} workouts and ${pendingImport.summary.weightEntryCount} weight entries were ${action} the data on this device.`);
    setPendingImport(undefined);
  };

  const confirmRestore = (mode: BackupRestoreMode) => {
    if (mode === 'merge') {
      performRestore(mode);
      return;
    }

    const message = 'Replace will remove the workouts, weigh-ins, settings, and any unfinished workout currently stored on this device.';
    if (Platform.OS === 'web') {
      if (globalThis.confirm?.(message)) performRestore(mode);
      return;
    }
    Alert.alert('Replace current data?', message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Replace', style: 'destructive', onPress: () => performRestore(mode) }
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View>
        <Text style={styles.eyebrow}>IRONPATH</Text>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Tune the program, protect your history, and control how IronPath works.</Text>
      </View>

      <Card style={styles.heroCard}>
        <View style={styles.programRow}><View style={styles.programIcon}><Text style={styles.programIconText}>IP</Text></View><View style={styles.flex}><Text style={styles.cardEyebrow}>ACTIVE PROGRAM</Text><Text style={styles.programName}>{goalProgramProfiles[state.profile.goal].name}</Text><Text style={styles.copy}>{goalProgramProfiles[state.profile.goal].description}</Text></View></View>
        <View style={styles.programStats}><View><Text style={styles.programStat}>{state.profile.trainingDays}</Text><Text style={styles.programLabel}>Days/week</Text></View><View><Text style={styles.programStat}>{state.profile.sessionMinutes}</Text><Text style={styles.programLabel}>Minutes</Text></View><View><Text style={styles.programStat}>{state.profile.defaultRir ?? 2}</Text><Text style={styles.programLabel}>Default RIR</Text></View></View>
      </Card>

      <Card style={styles.backupCard}>
        <View style={styles.sectionHeadingRow}>
          <View style={styles.backupIcon}><Text style={styles.backupIconText}>⇅</Text></View>
          <View style={styles.flex}>
            <Text style={styles.cardEyebrow}>DATA & BACKUP</Text>
            <Text style={styles.cardTitle}>Protect your IronPath history</Text>
          </View>
        </View>
        <Text style={styles.copy}>Export a private backup to Files or iCloud Drive. Import it later after changing phones, clearing Safari data, or moving to a different IronPath link.</Text>

        <View style={styles.backupStatus}>
          <View><Text style={styles.statusLabel}>LAST BACKUP</Text><Text style={styles.statusValue}>{formatDateTime(state.lastBackupAt)}</Text></View>
          <View style={styles.localBadge}><View style={styles.localDot} /><Text style={styles.localBadgeText}>Local-first</Text></View>
        </View>

        <View style={styles.backupButtons}>
          <PrimaryButton title={backupBusy ? 'Working…' : 'Export backup'} onPress={() => void exportData()} disabled={backupBusy} style={styles.backupButton} />
          <PrimaryButton title="Import backup" onPress={() => void chooseImport()} disabled={backupBusy} secondary style={styles.backupButton} />
        </View>
        <Text style={styles.backupHint}>The backup is a readable JSON file containing your workouts, weight entries, settings, notes, and progression history. It is not uploaded to IronPath.</Text>
      </Card>

      {pendingImport ? (
        <Card style={styles.importCard}>
          <View style={styles.importTop}>
            <View style={styles.importCheck}><Text style={styles.importCheckText}>✓</Text></View>
            <View style={styles.flex}>
              <Text style={styles.cardEyebrow}>BACKUP VERIFIED</Text>
              <Text style={styles.cardTitle}>{pendingImport.filename}</Text>
              <Text style={styles.copy}>Created {formatDateTime(pendingImport.summary.exportedAt)} with IronPath {pendingImport.summary.appVersion}</Text>
            </View>
          </View>
          <View style={styles.importMetrics}>
            <View style={styles.importMetric}><Text style={styles.importMetricValue}>{pendingImport.summary.workoutCount}</Text><Text style={styles.importMetricLabel}>Workouts</Text></View>
            <View style={styles.importMetric}><Text style={styles.importMetricValue}>{pendingImport.summary.weightEntryCount}</Text><Text style={styles.importMetricLabel}>Weigh-ins</Text></View>
            <View style={styles.importMetric}><Text style={styles.importMetricValue}>{pendingImport.summary.hasActiveWorkout ? 'Yes' : 'No'}</Text><Text style={styles.importMetricLabel}>Active workout</Text></View>
          </View>
          <Text style={styles.copy}><Text style={styles.strong}>Merge</Text> combines workout and weight history while applying the backup’s profile settings. <Text style={styles.strong}>Replace</Text> makes this device match the backup.</Text>
          <PrimaryButton title="Merge with current data" onPress={() => confirmRestore('merge')} />
          <PrimaryButton title="Replace all current data" onPress={() => confirmRestore('replace')} secondary />
          <Pressable onPress={() => setPendingImport(undefined)} style={styles.cancelImport}><Text style={styles.cancelImportText}>Cancel import</Text></Pressable>
        </Card>
      ) : null}

      <Card>
        <View style={styles.goalHeading}>
          <View style={styles.flex}>
            <Text style={styles.cardTitle}>Primary goal</Text>
            <Text style={styles.copy}>This now changes the sets, rep targets, rest periods, and estimated duration of future workouts.</Text>
          </View>
          <View style={styles.liveBadge}><Text style={styles.liveBadgeText}>ACTIVE</Text></View>
        </View>
        <View style={styles.goalOptions}>
          {(['balanced', 'strength', 'muscle', 'fat-loss'] as Goal[]).map((goal) => {
            const profile = goalProgramProfiles[goal];
            const active = state.profile.goal === goal;
            return (
              <Pressable key={goal} onPress={() => applyGoal(goal)} style={[styles.goalOption, active && styles.goalOptionActive]}>
                <View style={styles.goalOptionTop}>
                  <Text style={[styles.goalOptionTitle, active && styles.goalOptionTitleActive]}>{profile.shortLabel}</Text>
                  {active ? <Text style={styles.goalCheck}>✓</Text> : null}
                </View>
                <Text style={[styles.goalOptionCopy, active && styles.goalOptionCopyActive]}>{profile.description}</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.goalImpact}>
          <Text style={styles.goalImpactLabel}>CURRENT PROGRAM EFFECT</Text>
          <Text style={styles.goalImpactText}>{goalProgramProfiles[state.profile.goal].changes}</Text>
        </View>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Experience</Text>
        <View style={styles.options}>
          {(['beginner', 'intermediate', 'advanced'] as Experience[]).map((experience) => (
            <Pressable key={experience} onPress={() => updateProfile({ experience })} style={[styles.option, state.profile.experience === experience && styles.optionActive]}>
              <Text style={[styles.optionText, state.profile.experience === experience && styles.optionTextActive]}>{experience}</Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Training preferences</Text>
        <Text style={styles.copy}>These settings control the starting point and the size of recommended increases.</Text>
        <View style={styles.fieldRow}>
          <View style={styles.field}><Text style={styles.label}>Upper-body jump</Text><TextInput value={state.profile.upperIncrement.toString()} onChangeText={(value) => updateProfile({ upperIncrement: Number(value) || 5 })} keyboardType="decimal-pad" style={styles.input} /></View>
          <View style={styles.field}><Text style={styles.label}>Lower-body jump</Text><TextInput value={state.profile.lowerIncrement.toString()} onChangeText={(value) => updateProfile({ lowerIncrement: Number(value) || 10 })} keyboardType="decimal-pad" style={styles.input} /></View>
        </View>
        <Text style={styles.label}>Default reps in reserve</Text>
        <View style={styles.rirRow}>{[0, 1, 2, 3, 4].map((rir) => <Pressable key={rir} onPress={() => updateProfile({ defaultRir: rir })} style={[styles.rirButton, state.profile.defaultRir === rir && styles.rirActive]}><Text style={[styles.rirText, state.profile.defaultRir === rir && styles.rirTextActive]}>{rir}</Text></Pressable>)}</View>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Goal weight</Text>
        <TextInput value={goalWeight} onChangeText={setGoalWeight} keyboardType="decimal-pad" style={styles.input} placeholder={`Goal weight in ${state.profile.unit}`} placeholderTextColor={colors.muted} />
        <PrimaryButton title="Save goal weight" onPress={() => updateProfile({ goalWeight: Number(goalWeight) || undefined })} />
      </Card>

      <Card>
        <View style={styles.connectionRow}>
          <View style={styles.flex}><Text style={styles.cardTitle}>Apple Health</Text><Text style={styles.copy}>{state.healthKitConnected ? 'Connected for body weight and authorized health data.' : 'Available later in the native iPhone build. The web version remains fully usable without it.'}</Text></View>
          <View style={[styles.dot, state.healthKitConnected && styles.dotConnected]} />
        </View>
        <PrimaryButton title={state.healthKitConnected ? 'Review Apple Health permissions' : 'Connect Apple Health'} onPress={() => void connect()} secondary />
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Reset local data</Text>
        <Text style={styles.copy}>This permanently removes the workouts, weigh-ins, and settings stored for this IronPath link on this device. Export a backup first.</Text>
        <PrimaryButton title="Reset all local data" onPress={() => void resetAllData()} secondary />
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 18, gap: 12, paddingBottom: 116 },
  eyebrow: { color: colors.accent, fontSize: 11, fontWeight: '900', letterSpacing: 1.4 },
  title: { color: colors.text, fontSize: 31, fontWeight: '900', marginTop: 3 },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 4 },
  heroCard: { backgroundColor: colors.accentDeep, borderColor: colors.borderStrong },
  programRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  programIcon: { width: 54, height: 54, borderRadius: 18, backgroundColor: colors.panelRaised, borderWidth: 1, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  programIconText: { color: colors.accent, fontWeight: '900', fontSize: 20, fontStyle: 'italic' },
  flex: { flex: 1 },
  cardEyebrow: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  programName: { color: colors.text, fontSize: 20, fontWeight: '900', marginTop: 2 },
  programStats: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.panelSoft, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: colors.border },
  programStat: { color: colors.text, fontSize: 18, fontWeight: '900' },
  programLabel: { color: colors.muted, fontSize: 9, marginTop: 2 },
  cardTitle: { color: colors.text, fontSize: 18, fontWeight: '900' },
  copy: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  strong: { color: colors.text, fontWeight: '900' },
  backupCard: { backgroundColor: '#0A1526', borderColor: colors.borderStrong },
  sectionHeadingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backupIcon: { width: 46, height: 46, borderRadius: 15, backgroundColor: colors.accentDark, borderWidth: 1, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  backupIconText: { color: colors.accent, fontWeight: '900', fontSize: 22 },
  backupStatus: { backgroundColor: colors.panelSoft, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  statusLabel: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  statusValue: { color: colors.text, fontSize: 13, fontWeight: '800', marginTop: 3 },
  localBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.panelRaised, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6 },
  localDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.success },
  localBadgeText: { color: colors.muted, fontSize: 10, fontWeight: '800' },
  backupButtons: { flexDirection: 'row', gap: 10 },
  backupButton: { flex: 1 },
  backupHint: { color: colors.muted, fontSize: 10, lineHeight: 15 },
  importCard: { backgroundColor: '#0D1B30', borderColor: colors.accent },
  importTop: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  importCheck: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  importCheckText: { color: colors.black, fontSize: 21, fontWeight: '900' },
  importMetrics: { flexDirection: 'row', gap: 8 },
  importMetric: { flex: 1, backgroundColor: colors.panelSoft, borderRadius: 13, borderWidth: 1, borderColor: colors.border, paddingVertical: 10, alignItems: 'center' },
  importMetricValue: { color: colors.text, fontSize: 18, fontWeight: '900' },
  importMetricLabel: { color: colors.muted, fontSize: 9, marginTop: 2 },
  cancelImport: { minHeight: 38, alignItems: 'center', justifyContent: 'center' },
  cancelImportText: { color: colors.muted, fontSize: 12, fontWeight: '800' },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { borderRadius: 13, backgroundColor: colors.panelRaised, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 10 },
  optionActive: { backgroundColor: colors.accent, borderColor: colors.accentStrong },
  optionText: { color: colors.muted, fontWeight: '800', textTransform: 'capitalize' },
  optionTextActive: { color: colors.black },
  goalHeading: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  liveBadge: { backgroundColor: colors.accentDark, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6 },
  liveBadgeText: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  goalOptions: { gap: 8 },
  goalOption: { backgroundColor: colors.panelSoft, borderWidth: 1, borderColor: colors.border, borderRadius: 15, padding: 12, gap: 5 },
  goalOptionActive: { backgroundColor: colors.accentDeep, borderColor: colors.accent },
  goalOptionTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  goalOptionTitle: { color: colors.text, fontSize: 14, fontWeight: '900' },
  goalOptionTitleActive: { color: colors.accent },
  goalCheck: { color: colors.accent, fontSize: 16, fontWeight: '900' },
  goalOptionCopy: { color: colors.muted, fontSize: 11, lineHeight: 16 },
  goalOptionCopyActive: { color: colors.text },
  goalImpact: { backgroundColor: colors.panelRaised, borderRadius: 13, borderWidth: 1, borderColor: colors.border, padding: 11, gap: 4 },
  goalImpactLabel: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  goalImpactText: { color: colors.muted, fontSize: 11, lineHeight: 16 },
  fieldRow: { flexDirection: 'row', gap: 12 },
  field: { flex: 1, gap: 6 },
  label: { color: colors.muted, fontSize: 11, fontWeight: '800' },
  input: { minHeight: 48, borderRadius: 14, backgroundColor: colors.panelRaised, borderWidth: 1, borderColor: colors.border, color: colors.text, paddingHorizontal: 13, fontSize: 16, fontWeight: '700' },
  rirRow: { flexDirection: 'row', gap: 8 },
  rirButton: { flex: 1, height: 42, borderRadius: 13, backgroundColor: colors.panelRaised, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  rirActive: { backgroundColor: colors.accent, borderColor: colors.accentStrong },
  rirText: { color: colors.muted, fontWeight: '900' },
  rirTextActive: { color: colors.black },
  connectionRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dot: { width: 13, height: 13, borderRadius: 7, backgroundColor: colors.danger },
  dotConnected: { backgroundColor: colors.success }
});
