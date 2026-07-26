import React, { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, SafeAreaView, StatusBar, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { AppProvider, useApp } from './src/state/AppContext';
import { TodayScreen } from './src/screens/TodayScreen';
import { WorkoutScreen } from './src/screens/WorkoutScreen';
import { ProgressScreen } from './src/screens/ProgressScreen';
import { WeightScreen } from './src/screens/WeightScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { colors } from './src/theme/colors';
import { BrandMark } from './src/components/Visuals';

type Tab = 'today' | 'train' | 'progress' | 'weight' | 'settings';
type ViewMode = Tab | 'history';

const tabs: Array<{ id: Tab; label: string; icon: string }> = [
  { id: 'today', label: 'Today', icon: '⌂' },
  { id: 'train', label: 'Train', icon: '↟' },
  { id: 'progress', label: 'Gains', icon: '▥' },
  { id: 'weight', label: 'Weight', icon: '◎' },
  { id: 'settings', label: 'Settings', icon: '⚙' }
];

const BrandRail = () => (
  <View style={styles.brandRail}>
    <View>
      <BrandMark large />
      <Text style={styles.brandWord}><Text style={styles.brandIron}>IRON</Text>PATH</Text>
      <Text style={styles.brandTagline}>PLAN. TRAIN. PROGRESS.</Text>
    </View>
    <View style={styles.brandRule} />
    <Text style={styles.brandCopy}>A premium strength companion built around clear workouts, useful progression, and measurable results.</Text>
    <View style={styles.brandFeatures}>
      {[
        ['◆', 'SMART PROGRAMMING'],
        ['↗', 'PROGRESSION GUIDANCE'],
        ['◇', 'PERSONAL RECORDS'],
        ['▥', 'CLEAN ANALYTICS'],
        ['⌁', 'LOCAL-FIRST DATA']
      ].map(([icon, label]) => (
        <View key={label} style={styles.brandFeatureRow}>
          <View style={styles.brandFeatureIconWrap}><Text style={styles.brandFeatureIcon}>{icon}</Text></View>
          <Text style={styles.brandFeatureText}>{label}</Text>
        </View>
      ))}
    </View>
    <View style={styles.brandFooter}>
      <Text style={styles.brandFooterTitle}>FOCUSED BY DESIGN.</Text>
      <Text style={styles.brandFooterCopy}>Deep black, restrained blue, and only the information that helps you train.</Text>
    </View>
  </View>
);

const Shell = () => {
  const { hydrated, state } = useApp();
  const [view, setView] = useState<ViewMode>('today');
  const { width } = useWindowDimensions();
  const showBrandRail = Platform.OS === 'web' && width >= 920;

  if (!hydrated) return <View style={styles.loading}><ActivityIndicator size="large" color={colors.accent} /></View>;

  const activeTab: Tab = view === 'history' ? 'today' : view;
  const screen = view === 'history'
    ? <HistoryScreen goBack={() => setView('today')} />
    : view === 'today'
      ? <TodayScreen openTrain={() => setView('train')} openHistory={() => setView('history')} />
      : view === 'train'
        ? <WorkoutScreen goToday={() => setView('today')} />
        : view === 'progress'
          ? <ProgressScreen />
          : view === 'weight'
            ? <WeightScreen />
            : <SettingsScreen />;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <View style={styles.desktopBackdrop}>
        <View style={[styles.desktopStage, !showBrandRail && styles.desktopStageCompact]}>
          {showBrandRail ? <BrandRail /> : null}
          <View style={styles.container}>
            <View style={styles.content}>{screen}</View>
            <View style={styles.nav}>
              {tabs.map((item) => {
                const active = item.id === activeTab;
                return (
                  <Pressable
                    key={item.id}
                    focusable={false}
                    style={[styles.navItem, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
                    onPress={() => setView(item.id)}
                  >
                    <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
                      <Text style={[styles.icon, active && styles.active]}>{item.icon}</Text>
                      {item.id === 'train' && state.activeSession ? <View style={styles.liveDot} /> : null}
                    </View>
                    <Text style={[styles.navLabel, active && styles.active]}>{item.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default function App() {
  return <AppProvider><Shell /></AppProvider>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#020306' },
  desktopBackdrop: { flex: 1, backgroundColor: '#020306', alignItems: 'center' },
  desktopStage: {
    flex: 1,
    width: '100%',
    maxWidth: 1040,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'stretch',
    gap: 42,
    paddingHorizontal: 30
  },
  desktopStageCompact: { paddingHorizontal: 0 },
  brandRail: { width: 278, justifyContent: 'center', paddingVertical: 54, gap: 23 },
  brandMonogram: { color: colors.accent, fontSize: 58, fontWeight: '900', fontStyle: 'italic', letterSpacing: -8 },
  brandWord: { color: colors.accent, fontSize: 35, fontWeight: '900', fontStyle: 'italic', letterSpacing: -1.6, marginTop: -7 },
  brandIron: { color: colors.text },
  brandTagline: { color: colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 2.2, marginTop: 6 },
  brandRule: { width: 38, height: 3, backgroundColor: colors.accentStrong, borderRadius: 3, shadowColor: colors.accentStrong, shadowOpacity: 0.4, shadowRadius: 8 },
  brandCopy: { color: colors.muted, fontSize: 14, lineHeight: 22, maxWidth: 250 },
  brandFeatures: { gap: 14 },
  brandFeatureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  brandFeatureIconWrap: { width: 30, height: 30, borderRadius: 10, backgroundColor: colors.accentDeep, borderWidth: 1, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  brandFeatureIcon: { color: colors.accent, fontSize: 14, textAlign: 'center' },
  brandFeatureText: { color: colors.text, fontSize: 10.5, fontWeight: '800', letterSpacing: 0.8 },
  brandFooter: { marginTop: 15, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 16, gap: 5 },
  brandFooterTitle: { color: colors.text, fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  brandFooterCopy: { color: colors.mutedSoft, fontSize: 11, lineHeight: 16 },
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 440 : undefined,
    borderLeftWidth: Platform.OS === 'web' ? 1 : 0,
    borderRightWidth: Platform.OS === 'web' ? 1 : 0,
    borderColor: colors.border,
    shadowColor: colors.black,
    shadowOpacity: Platform.OS === 'web' ? 0.68 : 0,
    shadowRadius: 38,
    shadowOffset: { width: 0, height: 0 }
  },
  content: { flex: 1 },
  loading: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  nav: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: Platform.OS === 'web' ? 10 : 7,
    height: 68,
    borderRadius: 22,
    backgroundColor: '#070B12F7',
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    shadowColor: colors.black,
    shadowOpacity: 0.52,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 9
  },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, height: 58 },
  iconWrap: { width: 36, height: 30, borderRadius: 11, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  iconWrapActive: { backgroundColor: colors.accentDeep, borderWidth: 1, borderColor: colors.borderStrong },
  icon: { color: colors.mutedSoft, fontSize: 16, fontWeight: '900' },
  navLabel: { color: colors.mutedSoft, fontSize: 9, fontWeight: '800' },
  active: { color: colors.accent },
  liveDot: { position: 'absolute', right: 3, top: 2, width: 6, height: 6, borderRadius: 3, backgroundColor: colors.warning }
});
