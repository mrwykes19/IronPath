import React, { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Card } from '../components/Card';
import { PrimaryButton } from '../components/PrimaryButton';
import { connectHealthKit } from '../services/healthkit';
import { useApp } from '../state/AppContext';
import { colors } from '../theme/colors';
import { Experience, Goal } from '../types';

const notify = (title: string, message: string) => Platform.OS === 'web' ? globalThis.alert?.(`${title}\n\n${message}`) : Alert.alert(title, message);

export const SettingsScreen = () => {
  const { state, updateProfile, setHealthKitConnected, resetAllData } = useApp();
  const [goalWeight, setGoalWeight] = useState(state.profile.goalWeight?.toString() ?? '');

  const connect = async () => {
    const result = await connectHealthKit();
    setHealthKitConnected(result.ok);
    notify(result.ok ? 'Apple Health connected' : 'Apple Health unavailable', result.message);
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View>
        <Text style={styles.eyebrow}>IRONPATH</Text>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Tune the program to your gym, progression style, and goals.</Text>
      </View>

      <Card style={styles.heroCard}>
        <View style={styles.programRow}><View style={styles.programIcon}><Text style={styles.programIconText}>IP</Text></View><View style={styles.flex}><Text style={styles.cardEyebrow}>ACTIVE PROGRAM</Text><Text style={styles.programName}>Strength Builder</Text><Text style={styles.copy}>Four-day Upper / Lower rotation</Text></View></View>
        <View style={styles.programStats}><View><Text style={styles.programStat}>{state.profile.trainingDays}</Text><Text style={styles.programLabel}>Days/week</Text></View><View><Text style={styles.programStat}>{state.profile.sessionMinutes}</Text><Text style={styles.programLabel}>Minutes</Text></View><View><Text style={styles.programStat}>{state.profile.defaultRir ?? 2}</Text><Text style={styles.programLabel}>Default RIR</Text></View></View>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Primary goal</Text>
        <View style={styles.options}>
          {(['balanced', 'strength', 'muscle', 'fat-loss'] as Goal[]).map((goal) => (
            <Pressable key={goal} onPress={() => updateProfile({ goal })} style={[styles.option, state.profile.goal === goal && styles.optionActive]}>
              <Text style={[styles.optionText, state.profile.goal === goal && styles.optionTextActive]}>{goal.replace('-', ' ')}</Text>
            </Pressable>
          ))}
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
          <View style={styles.flex}><Text style={styles.cardTitle}>Apple Health</Text><Text style={styles.copy}>{state.healthKitConnected ? 'Connected for body weight and authorized health data.' : 'Available later in the native iPhone build. The Netlify version remains fully usable without it.'}</Text></View>
          <View style={[styles.dot, state.healthKitConnected && styles.dotConnected]} />
        </View>
        <PrimaryButton title={state.healthKitConnected ? 'Review Apple Health permissions' : 'Connect Apple Health'} onPress={() => void connect()} secondary />
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Local data</Text>
        <Text style={styles.copy}>Workouts and weigh-ins are stored in this browser. Avoid clearing website data until cloud backup is added.</Text>
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
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { borderRadius: 13, backgroundColor: colors.panelRaised, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 10 },
  optionActive: { backgroundColor: colors.accent, borderColor: colors.accentStrong },
  optionText: { color: colors.muted, fontWeight: '800', textTransform: 'capitalize' },
  optionTextActive: { color: colors.black },
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
