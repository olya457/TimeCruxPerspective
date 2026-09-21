import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
  StyleProp,
  ScrollViewProps,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { NavigationContext } from '@react-navigation/native';
import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import { AnimatedContent, Motion, useReducedMotion } from './Motion';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors, gold, styles as s } from '../theme';
export function Icon({
  name,
  color = colors.gold,
  size = 22,
}: {
  name: string;
  color?: string;
  size?: number;
}) {
  const paths: Record<string, string> = {
    back: 'M14 5l-7 7 7 7',
    close: 'M6 6l12 12M18 6L6 18',
    check: 'M5 12l4 4L19 6',
    share: 'M12 16V3m-4 4 4-4 4 4M5 12v8h14v-8',
    trash: 'M4 6h16M9 6V3h6v3M7 6l1 15h8l1-15M10 10v7m4-7v7',
    Situations: 'M5 4h14a2 2 0 0 1 2 2v12H8l-5 3V6a2 2 0 0 1 2-2M7 9h10M7 13h7',
    Perspectives:
      'M14 5a7 7 0 1 0 0 14M10 5a7 7 0 1 1 0 14M12 5a9 9 0 0 0 0 14M12 5a9 9 0 0 1 0 14',
    Challenge: 'M12 2l10 10-10 10L2 12zM12 7l5 5-5 5-5-5z',
    Explore: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20M16 8l-3 5-5 3 3-5z',
    Choices: 'M12 3v18M4 6h16M6 6l-4 9h8L6 6m12 0-4 9h8l-4-9M8 21h8',
    plus: 'M12 4v16M4 12h16',
    pause: 'M9 5v14M15 5v14',
    spark: 'M12 3l3 6 6 3-6 3-3 6-3-6-6-3 6-3z',
    bookmark: 'M6 3h12v18l-6-4-6 4z',
    up: 'M6 14l6-6 6 6',
    down: 'M6 10l6 6 6-6',
  };
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name] ? (
        <Path d={paths[name]} />
      ) : (
        <Circle cx={12} cy={12} r={8} />
      )}
    </Svg>
  );
}
export function Screen({
  children,
  footer,
  scroll = true,
  onScroll,
  animationKey = 'screen',
}: React.PropsWithChildren<{
  footer?: React.ReactNode;
  scroll?: boolean;
  onScroll?: ScrollViewProps['onScroll'];
  animationKey?: string | number;
}>) {
  const layout = useResponsiveLayout();
  const navigation = useContext(NavigationContext);
  const tabHeight = useContext(BottomTabBarHeightContext);
  const reduced = useReducedMotion();
  const [focusVersion, setFocusVersion] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  useEffect(
    () => navigation?.addListener('focus', () => setFocusVersion(v => v + 1)),
    [navigation],
  );
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [animationKey]);
  const replayKey = `${animationKey}-${focusVersion}`;
  const contentStyle = [
    u.content,
    { padding: layout.horizontalPadding, gap: layout.gap },
  ];
  const content = (
    <AnimatedContent replayKey={replayKey} reduced={reduced}>
      {children}
    </AnimatedContent>
  );
  return (
    <View style={s.screen}>
      <SafeAreaView
        style={s.fill}
        edges={
          tabHeight
            ? ['top', 'left', 'right']
            : ['top', 'left', 'right', 'bottom']
        }
      >
        <KeyboardAvoidingView
          style={s.fill}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {scroll ? (
            <ScrollView
              ref={scrollRef}
              keyboardDismissMode="on-drag"
              keyboardShouldPersistTaps="handled"
              onScroll={onScroll}
              scrollEventThrottle={32}
              contentContainerStyle={contentStyle}
            >
              {content}
            </ScrollView>
          ) : (
            <View style={[...contentStyle, s.fill]}>{content}</View>
          )}
          {footer && (
            <Motion
              index={3}
              replayKey={replayKey}
              reduced={reduced}
              style={[
                u.footer,
                {
                  paddingHorizontal: layout.horizontalPadding,
                  paddingBottom: layout.compact ? 10 : 20,
                },
              ]}
            >
              {footer}
            </Motion>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
export function Button({
  title,
  onPress,
  secondary,
  disabled,
  small,
  style,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  small?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { compact } = useResponsiveLayout();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      accessibilityLabel={title}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        u.button,
        !secondary && u.glow,
        disabled && u.disabled,
        pressed && u.pressed,
        style,
      ]}
    >
      <View
        style={[
          u.buttonInner,
          secondary && u.secondary,
          compact && u.buttonCompact,
          small && u.small,
        ]}
      >
        {!secondary && (
          <LinearGradient
            pointerEvents="none"
            colors={gold}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={u.buttonGradient}
          />
        )}
        <Text style={secondary ? u.secondaryText : u.buttonText}>{title}</Text>
      </View>
    </Pressable>
  );
}
export function IconButton({
  name,
  onPress,
  label,
}: {
  name: string;
  onPress: () => void;
  label: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={u.iconButton}
    >
      <Icon name={name} />
    </Pressable>
  );
}
export function Header({
  title,
  subtitle,
  onBack,
  right,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  const { titleSize } = useResponsiveLayout();
  return (
    <View style={[s.between, u.header]}>
      <View style={[s.row, s.fill]}>
        {onBack && <IconButton name="back" label="Go back" onPress={onBack} />}
        <View style={s.fill}>
          <Text style={onBack ? s.muted : [s.title, { fontSize: titleSize }]}>
            {title}
          </Text>
          {subtitle && <Text style={s.label}>{subtitle}</Text>}
        </View>
      </View>
      {right}
    </View>
  );
}
export function GradientBackground({
  colors: gradientColors,
  radius = 20,
}: {
  colors: string[];
  radius?: number;
}) {
  return (
    <LinearGradient
      pointerEvents="none"
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[u.gradientBackground, { borderRadius: radius }]}
    />
  );
}
export function Card({
  children,
  accent,
  style,
}: React.PropsWithChildren<{
  accent?: 'red' | 'green';
  style?: StyleProp<ViewStyle>;
}>) {
  const { compact } = useResponsiveLayout();
  const cardStyle = [s.card, compact && u.cardCompact, style];
  return (
    <View style={cardStyle}>
      {accent && (
        <GradientBackground
          colors={
            accent === 'red' ? ['#491020', '#261b12'] : ['#103a30', '#101416']
          }
          radius={19}
        />
      )}
      {children}
    </View>
  );
}
export function Label({ children }: React.PropsWithChildren) {
  return <Text style={s.label}>{children}</Text>;
}
export function Chips({
  items,
  value,
  onChange,
}: {
  items: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      nestedScrollEnabled
      keyboardShouldPersistTaps="handled"
      style={u.chipScroll}
      contentContainerStyle={u.chipRow}
    >
      {items.map(item => (
        <Pressable
          key={item}
          onPress={() => onChange(item)}
          accessibilityRole="button"
          accessibilityState={{ selected: item === value }}
          style={[u.chip, u.chipFixed, item === value && u.chipActive]}
        >
          <Text
            numberOfLines={1}
            style={[s.muted, item === value && u.goldText]}
          >
            {item}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
export function Segments({
  items,
  value,
  onChange,
}: {
  items: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={u.segments}>
      {items.map(item => (
        <Pressable
          key={item}
          onPress={() => onChange(item)}
          style={s.fill}
          accessibilityRole="tab"
          accessibilityState={{ selected: item === value }}
        >
          <View style={u.segment}>
            {item === value && (
              <LinearGradient
                pointerEvents="none"
                colors={gold}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[u.gradientBackground, u.segmentRadius]}
              />
            )}
            <Text
              style={[
                u.segmentText,
                item === value ? u.segmentActive : s.muted,
              ]}
            >
              {item}
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}
export function Progress({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  const max = Math.max(1, total);
  const value = Math.min(max, Math.max(0, current));
  if (total > 20) {
    return (
      <View
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max, now: value }}
        style={u.progressTrack}
      >
        <View style={[u.progressFill, { width: `${(value / max) * 100}%` }]} />
      </View>
    );
  }
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max, now: value }}
      style={u.progress}
    >
      {Array.from({ length: max }, (_, i) => (
        <View key={i} style={[u.progressPart, i < value && u.progressActive]} />
      ))}
    </View>
  );
}
export function Input({
  value,
  onChangeText,
  placeholder,
  maxLength = 500,
  numeric,
  compact,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  numeric?: boolean;
  compact?: boolean;
}) {
  const { compact: smallScreen } = useResponsiveLayout();
  return (
    <View>
      <TextInput
        accessibilityLabel={placeholder || 'Your answer'}
        value={value}
        onChangeText={onChangeText}
        placeholder={
          placeholder || 'Start typing — there is no right answer here…'
        }
        placeholderTextColor="#77716d"
        maxLength={maxLength}
        keyboardAppearance="dark"
        multiline={!numeric}
        keyboardType={numeric ? 'decimal-pad' : 'default'}
        style={[
          s.input,
          smallScreen && u.smallScreenInput,
          compact && u.compact,
        ]}
      />
      <Text style={u.count}>
        {value.length} / {maxLength}
      </Text>
    </View>
  );
}
export function Empty({ title, detail }: { title: string; detail: string }) {
  return (
    <View style={u.empty}>
      <View style={u.emptyIcon}>
        <Icon name="plus" size={34} />
      </View>
      <Text style={s.heading}>{title}</Text>
      <Text style={[s.muted, u.center]}>{detail}</Text>
    </View>
  );
}
const u = StyleSheet.create({
  gradientBackground: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  segmentRadius: { borderRadius: 10 },
  segmentText: {
    textAlign: 'center',
    lineHeight: 20,
    includeFontPadding: false,
  },
  chipScroll: { flexGrow: 0, width: '100%' },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  chipFixed: { flexShrink: 0 },
  cardCompact: { padding: 13, gap: 8 },
  smallScreenInput: { minHeight: 106, padding: 12 },
  content: {
    padding: 20,
    gap: 16,
    flexGrow: 1,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  footer: {
    padding: 20,
    paddingTop: 10,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    gap: 10,
  },
  button: { borderRadius: 28, overflow: 'visible', flexShrink: 1, minWidth: 0 },
  buttonGradient: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 28,
  },
  buttonCompact: { paddingHorizontal: 14, minHeight: 48 },
  buttonInner: {
    minHeight: 52,
    minWidth: 104,
    overflow: 'hidden',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  buttonText: {
    color: '#251605',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22,
    includeFontPadding: false,
  },
  secondaryText: {
    color: colors.gold,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    includeFontPadding: false,
  },
  secondary: {
    borderWidth: 1,
    borderColor: '#5d4926',
    backgroundColor: '#100d10',
  },
  small: {
    minHeight: 44,
    minWidth: 0,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  glow: {
    shadowColor: '#efbf51',
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 3,
  },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.75 },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: '#ffffff09',
  },
  header: { marginBottom: 3, minHeight: 44 },
  chip: {
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 7,
    backgroundColor: '#1c191a',
    borderWidth: 1,
    borderColor: '#302b2b',
  },
  chipActive: { borderColor: '#9c782b', backgroundColor: '#322715' },
  goldText: { color: colors.gold },
  segments: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#ffffff0c',
  },
  segment: {
    minHeight: 44,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  segmentActive: { color: '#231408', fontSize: 13 },
  progressTrack: {
    height: 3,
    backgroundColor: '#ffffff22',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: { height: 3, backgroundColor: colors.gold, borderRadius: 2 },
  progress: { flexDirection: 'row', gap: 4 },
  progressPart: {
    flex: 1,
    height: 3,
    backgroundColor: '#ffffff22',
    borderRadius: 2,
  },
  progressActive: { backgroundColor: colors.gold },
  count: { color: colors.muted, fontSize: 10, textAlign: 'right', padding: 5 },
  compact: { minHeight: 76 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 18 },
  emptyIcon: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#70571e',
  },
  center: { textAlign: 'center' },
});
