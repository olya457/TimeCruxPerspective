import React from 'react';
import { Platform } from 'react-native';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParams } from '../types';
import { colors } from '../theme';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { useReducedMotion } from '../components/Motion';
import { Icon } from '../components/UI';
import {
  SituationsScreen,
  ReflectionDetailScreen,
} from '../screens/SituationsScreen';
import { ReflectionScreen } from '../screens/ReflectionScreen';
import {
  PerspectivesScreen,
  PerspectiveSetupScreen,
  CompareScreen,
} from '../screens/PerspectivesScreen';
import {
  ChallengeScreen,
  ChallengePlayScreen,
  ChallengeResultScreen,
} from '../screens/ChallengeScreen';
import { ExploreScreen, ArticleScreen } from '../screens/ExploreScreen';
import { ChoicesScreen, ChoiceScreen } from '../screens/ChoicesScreen';
const Stack = createNativeStackNavigator<RootStackParams>();
const Tabs = createBottomTabNavigator();
const theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.gold,
    background: colors.bg,
    card: colors.bg,
    text: colors.text,
    border: colors.border,
  },
};
function MainTabs() {
  const insets = useSafeAreaInsets();
  const { narrow } = useResponsiveLayout();
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarLabelPosition: 'below-icon',
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: '#787375',
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.border,
          height: 60 + insets.bottom,
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 8),
          ...(Platform.OS === 'android' && {
            height: 60,
            marginLeft: Math.max(insets.left, 16),
            marginRight: Math.max(insets.right, 16),
            marginBottom: insets.bottom + 20,
            paddingBottom: 8,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: colors.border,
            elevation: 8,
            shadowColor: '#000000',
          }),
        },
        tabBarLabelStyle: { fontSize: narrow ? 9 : 10, marginTop: 3 },
        tabBarIcon: ({ color }) => (
          <Icon name={route.name} color={color} size={21} />
        ),
      })}
    >
      <Tabs.Screen name="Situations" component={SituationsScreen} />
      <Tabs.Screen name="Perspectives" component={PerspectivesScreen} />
      <Tabs.Screen name="Challenge" component={ChallengeScreen} />
      <Tabs.Screen name="Explore" component={ExploreScreen} />
      <Tabs.Screen name="Choices" component={ChoicesScreen} />
    </Tabs.Navigator>
  );
}
export function AppNavigator() {
  const reduced = useReducedMotion();
  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: reduced ? 'none' : 'slide_from_right',
        }}
      >
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="Reflection" component={ReflectionScreen} />
        <Stack.Screen
          name="ReflectionDetail"
          component={ReflectionDetailScreen}
        />
        <Stack.Screen
          name="PerspectiveSetup"
          component={PerspectiveSetupScreen}
        />
        <Stack.Screen name="Compare" component={CompareScreen} />
        <Stack.Screen
          name="ChallengePlay"
          component={ChallengePlayScreen}
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen
          name="ChallengeResult"
          component={ChallengeResultScreen}
        />
        <Stack.Screen name="Article" component={ArticleScreen} />
        <Stack.Screen name="Choice" component={ChoiceScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
