import React, { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { AppProvider, useApp } from './src/state/AppContext';
import { TodayScreen } from './src/screens/TodayScreen';
import { WorkoutScreen } from './src/screens/WorkoutScreen';
import { ProgressScreen } from './src/screens/ProgressScreen';
import { WeightScreen } from './src/screens/WeightScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { colors } from './src/theme/colors';

type Tab = 'today' | 'train' | 'progress' | 'weight' | 'settings';
type ViewMode = Tab | 'history';

const tabs: Array<{ id: Tab; label: string; icon: string }> = [
  { id: 'today', label: 'Today', icon: '⌂' },
  { id: 'train', label: 'Train', icon: '↟' },
  { id: 'progress', label: 'Gains', icon: '▥' },
  { id: 'weight', label: 'Weight', icon: '◎' },
  { id: 'settings', label: 'Settings', icon: '⚙' }
];

const Shell = () => {
  const { hydrated, state } = useApp();
  const [view, setView] = useState<ViewMode>('today');

  if (!hydrated) return <View style={styles.loading}><ActivityIndicator size="large" color={colors.accent} /></View>;

  const activeTab: Tab = view === 'history' ? 'today' : view;
  const screen = view === 'history'
    ? <HistoryScreen goBack={() => setView('today')} />
    : view === 'today'
      ? <TodayScreen openTrain={() => setView('train')} openHistory={() => setView('history')} openSettings={() => setView('settings')} />
      : view === 'train'
        ? <WorkoutScreen goToday={() => setView('today')} />
        : view === 'progress'
          ? <ProgressScreen />
          : view === 'weight'
            ? <WeightScreen />
            : <SettingsScreen />;

  return (
    <View style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <View style={styles.desktopBackdrop}>
        <View style={styles.desktopStage}>
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
    </View>
  );
};

export default function App() {
  return <AppProvider><Shell /></AppProvider>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#020306', ...(Platform.OS === 'web' ? ({ height: '100dvh', minHeight: '100dvh' } as any) : null) },
  desktopBackdrop: { flex: 1, backgroundColor: '#020306', alignItems: 'center' },
  desktopStage: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'stretch'
  },
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 440 : undefined,
    alignSelf: 'center',
    borderLeftWidth: Platform.OS === 'web' ? 1 : 0,
    borderRightWidth: Platform.OS === 'web' ? 1 : 0,
    borderColor: colors.border,
    shadowColor: colors.black,
    shadowOpacity: Platform.OS === 'web' ? 0.68 : 0,
    shadowRadius: 38,
    shadowOffset: { width: 0, height: 0 },
    overflow: 'hidden',
    paddingTop: Platform.OS === 'web' ? ('env(safe-area-inset-top)' as any) : 0
  },
  content: { flex: 1, paddingBottom: 82 },
  loading: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  nav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 78,
    height: Platform.OS === 'web' ? 'calc(78px + env(safe-area-inset-bottom))' as any : 78,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: '#040913',
    borderTopWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingBottom: Platform.OS === 'web' ? 'env(safe-area-inset-bottom)' as any : 4,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOpacity: 0.52,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -2 },
    elevation: 18,
    zIndex: 100
  },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, height: 60 },
  iconWrap: { width: 36, height: 30, borderRadius: 11, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  iconWrapActive: { backgroundColor: colors.accentDeep, borderWidth: 1, borderColor: colors.borderStrong },
  icon: { color: colors.mutedSoft, fontSize: 16, fontWeight: '900' },
  navLabel: { color: colors.mutedSoft, fontSize: 9, fontWeight: '800' },
  active: { color: colors.accent },
  liveDot: { position: 'absolute', right: 3, top: 2, width: 6, height: 6, borderRadius: 3, backgroundColor: colors.warning }
});
