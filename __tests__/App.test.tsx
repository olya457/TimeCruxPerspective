import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppStore, useStore } from '../src/storage/AppStore';
import { OnboardingScreen, LoaderScreen } from '../src/screens/WelcomeScreen';
import { Reflection } from '../src/types';
let store: ReturnType<typeof useStore>;
function Probe() {
  store = useStore();
  return <Text>{store.ready ? 'ready' : 'loading'}</Text>;
}
beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});
test('starts with no demo history and persists user changes across mounts', async () => {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    tree = ReactTestRenderer.create(
      <AppStore>
        <Probe />
      </AppStore>,
    );
  });
  expect(store.state.reflections).toEqual([]);
  const reflection: Reflection = {
    id: 'user-reflection',
    sourceId: 'situations-1',
    title: 'My decision',
    category: 'Boundaries',
    kind: 'situation',
    answers: { '1': 'My own answer' },
    conclusion: 'My conclusion',
    note: '',
    step: 0,
    completed: true,
    createdAt: '2026-09-21',
    updatedAt: '2026-09-21',
  };
  await act(async () => {
    store.saveReflection(reflection);
    store.toggle('savedCards', 'cards-1');
  });
  await act(async () => {
    tree.unmount();
  });
  await act(async () => {
    tree = ReactTestRenderer.create(
      <AppStore>
        <Probe />
      </AppStore>,
    );
  });
  expect(store.state.reflections).toEqual([reflection]);
  expect(store.state.savedCards).toEqual(['cards-1']);
  await act(async () => {
    store.removeReflection(reflection.id);
  });
  expect(store.state.reflections).toHaveLength(0);
  await act(async () => tree.unmount());
});
test('onboarding has all three steps and Start completes it', async () => {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    tree = ReactTestRenderer.create(
      <AppStore>
        <Probe />
        <OnboardingScreen />
      </AppStore>,
    );
  });
  const press = (label: string) =>
    tree.root
      .findAll(
        n =>
          n.props.accessibilityRole === 'button' &&
          n.props.accessibilityLabel === label,
      )[0]
      .props.onPress();
  await act(async () => press('Next  →'));
  expect(
    tree.root
      .findAllByType(Text)
      .some(n => n.props.children === 'The same event,\nread six ways'),
  ).toBe(true);
  await act(async () => press('Next  →'));
  await act(async () => press('Start  →'));
  expect(store.state.onboarded).toBe(true);
  await act(async () => tree.unmount());
});
test('loader waits for WebView animation completion', async () => {
  const complete = jest.fn();
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    tree = ReactTestRenderer.create(<LoaderScreen onComplete={complete} />);
  });
  expect(complete).not.toHaveBeenCalled();
  const webview = tree.root.findByType('WebView' as React.ElementType);
  expect(webview.props.source.html).toContain('4000');
  await act(async () =>
    webview.props.onMessage({ nativeEvent: { data: 'complete' } }),
  );
  expect(complete).toHaveBeenCalledTimes(1);
  await act(async () => tree.unmount());
});
