import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParams } from '../src/types';
import { Text } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppStore, useStore } from '../src/storage/AppStore';
import { ChallengePlayScreen } from '../src/screens/ChallengeScreen';
import { ChoiceScreen } from '../src/screens/ChoicesScreen';
import { ReflectionScreen } from '../src/screens/ReflectionScreen';
import { QuestionInput } from '../src/components/QuestionInput';
import { Button, Chips } from '../src/components/UI';
import choices from '../src/data/choices.json';
let store: ReturnType<typeof useStore>;
function Probe() {
  store = useStore();
  return <Text>probe</Text>;
}
function Ready({ children }: React.PropsWithChildren) {
  const { ready } = useStore();
  return ready ? <>{children}</> : null;
}
const navigation = {
  goBack: jest.fn(),
  navigate: jest.fn(),
  replace: jest.fn(),
  addListener: jest.fn(() => () => {}),
  dispatch: jest.fn(),
};
beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});
test('guided answers save as a draft, resume and become a completed user reflection', async () => {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  const render = (reflectionId?: string) => (
    <AppStore>
      <Probe />
      <Ready>
        <ReflectionScreen
          {...({
            route: { params: { sourceId: 'situations-1', reflectionId } },
            navigation,
          } as unknown as NativeStackScreenProps<
            RootStackParams,
            'Reflection'
          >)}
        />
      </Ready>
    </AppStore>
  );
  await act(async () => {
    tree = ReactTestRenderer.create(render());
  });
  await act(async () =>
    tree.root
      .findByType(QuestionInput)
      .props.onChange('I worry this could damage our friendship.'),
  );
  await act(async () => tree.unmount());
  await act(async () => {
    tree = ReactTestRenderer.create(
      <AppStore>
        <Probe />
      </AppStore>,
    );
  });
  const draft = store.state.reflections[0];
  expect(draft.completed).toBe(false);
  expect(draft.answers['1']).toBe('I worry this could damage our friendship.');
  await act(async () => tree.unmount());
  await act(async () => {
    tree = ReactTestRenderer.create(render(draft.id));
  });
  const press = (title: string) =>
    tree.root
      .findAllByType(Button)
      .find(b => b.props.title === title)!
      .props.onPress();
  await act(async () => press('Continue'));
  await act(async () =>
    tree.root.findByType(QuestionInput).props.onChange('Losing a friendship'),
  );
  await act(async () => press('Continue'));
  await act(async () =>
    tree.root
      .findByType(QuestionInput)
      .props.onChange(['Care', 'My own budget', 'Honesty']),
  );
  await act(async () => press('Continue'));
  await act(async () =>
    tree.root
      .findByType(QuestionInput)
      .props.onChange('I would understand immediately.'),
  );
  await act(async () => press('Continue'));
  await act(async () =>
    tree.root
      .findByType(QuestionInput)
      .props.onChange('I will offer another kind of help.'),
  );
  await act(async () => press('See my reflection'));
  await act(async () => press('Save reflection'));
  expect(store.state.reflections).toHaveLength(1);
  expect(store.state.reflections[0].completed).toBe(true);
  expect(store.state.reflections[0].conclusion).toBe(
    'I will offer another kind of help.',
  );
  expect(navigation.replace).toHaveBeenCalledWith('ReflectionDetail', {
    id: draft.id,
  });
  await act(async () => tree.unmount());
});
test('choices summary uses the selected option and value, never a supplied example', async () => {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    tree = ReactTestRenderer.create(
      <AppStore>
        <Probe />
      </AppStore>,
    );
  });
  await act(async () =>
    store.update(s => ({
      ...s,
      choiceDrafts: {
        'choices-1': {
          option: 0,
          priorities: [10, 90, 80, 20, 70],
          value: 'Ambition',
          confidence: 83,
        },
      },
    })),
  );
  await act(async () => {
    tree.update(
      <AppStore>
        <Probe />
        <ChoiceScreen
          {...({
            route: { params: { id: 'choices-1' } },
            navigation,
          } as unknown as NativeStackScreenProps<RootStackParams, 'Choice'>)}
        />
      </AppStore>,
    );
  });
  const press = (title: string) =>
    tree.root
      .findAllByType(Button)
      .find(b => b.props.title === title)!
      .props.onPress();
  await act(async () => press('Weigh this compromise'));
  expect(tree.root.findByType(Chips).props.value).toBe('Ambition');
  await act(async () => press('See what this says'));
  await act(async () => press('Save to reflections'));
  const reflection = store.state.reflections[0];
  expect(reflection.conclusion).toContain('Take the offer');
  expect(reflection.conclusion).toContain('Ambition');
  expect(reflection.conclusion).toContain('83%');
  expect(reflection.conclusion).not.toBe(choices[0].resultExample);
  expect(store.state.choiceDrafts['choices-1']).toBeUndefined();
  await act(async () => tree.unmount());
});

test('challenge pause freezes time and an unanswered timeout saves actual zero results', async () => {
  jest.useFakeTimers();
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    tree = ReactTestRenderer.create(
      <AppStore>
        <Probe />
        <Ready>
          <ChallengePlayScreen
            {...({
              route: {
                params: {
                  count: 1,
                  difficulty: 'Easy',
                  timed: true,
                  seconds: 5,
                },
              },
              navigation,
            } as unknown as NativeStackScreenProps<
              RootStackParams,
              'ChallengePlay'
            >)}
          />
        </Ready>
      </AppStore>,
    );
  });
  const press = (title: string) =>
    tree.root
      .findAllByType(Button)
      .find(b => b.props.title === title)!
      .props.onPress();
  await act(async () => jest.advanceTimersByTime(1000));
  await act(async () => press('Pause'));
  await act(async () => jest.advanceTimersByTime(10000));
  expect(store.state.challenges).toHaveLength(0);
  await act(async () => press('Resume'));
  await act(async () => jest.advanceTimersByTime(4000));
  await act(async () => press('See results'));
  expect(store.state.challenges[0]).toMatchObject({
    correct: 0,
    total: 3,
    score: 0,
    seconds: 5,
  });
  expect(store.state.challenges[0].misses).toHaveLength(3);
  await act(async () => tree.unmount());
  jest.useRealTimers();
});
