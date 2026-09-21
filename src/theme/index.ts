import { StyleSheet } from 'react-native';
export const colors = {
  bg: '#0b090b',
  panel: '#191617',
  text: '#f4f0e9',
  muted: '#97918f',
  gold: '#eac05b',
  border: '#3b3020',
  green: '#10372d',
  red: '#3e111c',
  danger: '#a72843',
};
export const gold = ['#fff0c5', '#edc456', '#c5942a'];
export const assets = {
  background: require('../assets/time-crux-background.png'),
  loader: require('../assets/time-crux-loader-background.png'),
  logo: require('../assets/time-crux-logo.png'),
  onboarding: [
    require('../assets/time-crux-onboarding-pause.png'),
    require('../assets/time-crux-onboarding-perspectives.png'),
    require('../assets/time-crux-onboarding-challenge.png'),
  ],
  onboardingBg: [
    require('../assets/time-crux-onboarding-pause-background.png'),
    require('../assets/time-crux-onboarding-perspectives-background.png'),
    require('../assets/time-crux-onboarding-challenge-background.png'),
  ],
};
export const styles = StyleSheet.create({
  fill: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  between: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: -0.8,
  },
  heading: {
    fontSize: 21,
    lineHeight: 28,
    fontWeight: '500',
    color: colors.text,
    letterSpacing: -0.4,
  },
  body: { fontSize: 15, lineHeight: 23, color: colors.text },
  muted: { fontSize: 13, lineHeight: 20, color: colors.muted },
  label: { fontSize: 10, letterSpacing: 2, color: colors.gold, lineHeight: 17 },
  card: {
    backgroundColor: colors.panel,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 10,
  },
  input: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 23,
    minHeight: 130,
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#68522a',
    backgroundColor: '#100e10',
    textAlignVertical: 'top',
  },
  separator: { height: 1, backgroundColor: colors.border, marginVertical: 8 },
});
