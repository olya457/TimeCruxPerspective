import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  AppState,
  Modal,
  ScrollView,
  PanResponder,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Motion, useReducedMotion } from '../components/Motion';
import Slider from '@react-native-community/slider';
import Svg, { Circle } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import quizzes from '../data/quizzes.json';
import { ChallengeResult, RootStackParams } from '../types';
import { useStore } from '../storage/AppStore';
import { colors, styles as s } from '../theme';
import {
  Button,
  Card,
  Chips,
  Header,
  Icon,
  IconButton,
  Label,
  Progress,
  Screen,
} from '../components/UI';
import { duration, shuffle, uid } from '../utils';
export function ChallengeScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParams>>();
  const [count, setCount] = useState('6');
  const [difficulty, setDifficulty] = useState('Considered');
  const [timed, setTimed] = useState(true);
  const [seconds, setSeconds] = useState(45);
  const { state } = useStore();
  return (
    <Screen>
      <Header title="Challenge" />
      <Card accent="red">
        <Label>TODAY’S SET · BIASES & FRAMING</Label>
        <Text style={s.heading}>Match the thought to the response</Text>
        <Text style={s.muted}>
          Drag each response onto the situation it fits. You can also tap a
          response, then a situation.
        </Text>
      </Card>
      <Label>CONFIGURE</Label>
      <Card>
        <View style={s.between}>
          <Text style={s.body}>Number of tasks</Text>
          <Text style={s.label}>{count}</Text>
        </View>
        <Chips
          items={['4', '6', '10', '15']}
          value={count}
          onChange={setCount}
        />
      </Card>
      <Card>
        <Text style={s.body}>Difficulty</Text>
        <Chips
          items={['Easy', 'Considered', 'Ruthless']}
          value={difficulty}
          onChange={setDifficulty}
        />
        <Text style={s.muted}>
          {difficulty === 'Easy'
            ? 'Three responses, no distractors.'
            : difficulty === 'Considered'
            ? 'Five responses, two distractors.'
            : 'Seven responses, four distractors.'}
        </Text>
      </Card>
      <Card>
        <View style={s.between}>
          <View>
            <Text style={s.body}>Timed mode</Text>
            <Text style={s.muted}>Turn the clock off entirely</Text>
          </View>
          <Switch
            accessibilityLabel="Timed mode"
            value={timed}
            onValueChange={setTimed}
            trackColor={{ false: '#383136', true: '#d6ad52' }}
          />
        </View>
        {timed && (
          <>
            <Slider
              accessibilityLabel="Seconds per task"
              value={seconds}
              minimumValue={15}
              maximumValue={120}
              step={15}
              minimumTrackTintColor={colors.gold}
              maximumTrackTintColor="#42372a"
              thumbTintColor="#f0d38b"
              onValueChange={setSeconds}
            />
            <Text style={s.muted}>{seconds}s per task</Text>
          </>
        )}
      </Card>
      <Button
        title="Start challenge"
        onPress={() =>
          navigation.navigate('ChallengePlay', {
            count: Number(count),
            difficulty,
            timed,
            seconds,
          })
        }
      />
      {state.challenges.length > 0 && (
        <>
          <Label>YOUR RECENT SETS</Label>
          {state.challenges.slice(0, 5).map(r => (
            <Pressable
              key={r.id}
              onPress={() =>
                navigation.navigate('ChallengeResult', { id: r.id })
              }
            >
              <Card>
                <View style={s.between}>
                  <Text style={s.body}>
                    {Math.round((r.correct / r.total) * 100)}% accuracy
                  </Text>
                  <Text style={s.label}>{r.score} points</Text>
                </View>
                <Text style={s.muted}>
                  {new Date(r.date).toLocaleDateString()} ·{' '}
                  {duration(r.seconds)}
                </Text>
              </Card>
            </Pressable>
          ))}
        </>
      )}
    </Screen>
  );
}
type Match = { text: string; target: number | null };
function DraggableResponse({
  match,
  selected,
  onTap,
  onDrop,
}: {
  match: Match;
  selected: boolean;
  onTap: () => void;
  onDrop: (text: string, x: number, y: number) => void;
}) {
  const pan = useRef(new Animated.ValueXY()).current;
  const handlers = useRef({ onTap, onDrop });
  handlers.current = { onTap, onDrop };
  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderMove: (_, g) => pan.setValue({ x: g.dx, y: g.dy }),
        onPanResponderRelease: (_, g) => {
          if (Math.abs(g.dx) + Math.abs(g.dy) < 8) {
            handlers.current.onTap();
          } else {
            handlers.current.onDrop(match.text, g.moveX, g.moveY);
          }
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();
        },
        onPanResponderTerminate: () => pan.setValue({ x: 0, y: 0 }),
      }),
    [match.text, pan],
  );
  return (
    <Animated.View
      {...responder.panHandlers}
      accessible
      accessibilityRole="button"
      accessibilityLabel={match.text}
      accessibilityHint="Tap to select, then tap a statement, or drag to a statement"
      onAccessibilityTap={onTap}
      style={[
        c.response,
        selected && c.selected,
        { transform: pan.getTranslateTransform() },
      ]}
    >
      <Text style={s.muted}>{match.text}</Text>
    </Animated.View>
  );
}
export function ChallengePlayScreen({
  route,
  navigation,
}: NativeStackScreenProps<RootStackParams, 'ChallengePlay'>) {
  const config = route.params;
  const reduced = useReducedMotion();
  const { update } = useStore();
  const [tasks] = useState(() => shuffle(quizzes).slice(0, config.count));
  const [task, setTask] = useState(0);
  const [matches, setMatches] = useState<Record<number, string>>({});
  const [selected, setSelected] = useState('');
  const [paused, setPaused] = useState(false);
  const [timed, setTimed] = useState(config.timed);
  const [remaining, setRemaining] = useState(config.seconds);
  const [checked, setChecked] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [misses, setMisses] = useState<ChallengeResult['misses']>([]);
  const finishing = useRef(false);
  const targets = useRef<Record<number, View | null>>({});
  const quiz = tasks[task];
  const options = useMemo(() => {
    const base =
      config.difficulty === 'Easy'
        ? quiz.matches.filter(m => m.target !== null)
        : quiz.matches;
    const extra =
      config.difficulty === 'Ruthless'
        ? shuffle(
            Array.from(
              new Map(
                quizzes
                  .filter(q => q.id !== quiz.id)
                  .flatMap(q => q.matches.filter(m => m.target === null))
                  .map(m => [m.text, m]),
              ).values(),
            ),
          )
            .filter(m => !base.some(b => b.text === m.text))
            .slice(0, 2)
        : [];
    return shuffle([...base, ...extra]);
  }, [quiz, config.difficulty]);
  const assign = (index: number, text: string) =>
    setMatches(old => {
      const next = { ...old };
      Object.keys(next).forEach(k => {
        if (next[Number(k)] === text) {
          delete next[Number(k)];
        }
      });
      next[index] = text;
      return next;
    });
  const checkRef = useRef(() => {});
  checkRef.current = () => {
    if (checked || finishing.current) {
      return;
    }
    setChecked(true);
    let hits = 0;
    const wrong: ChallengeResult['misses'] = [];
    quiz.statements.forEach((statement, i) => {
      const expected = quiz.matches.find(m => m.target === i)!.text;
      if (matches[i] === expected) {
        hits++;
      } else {
        wrong.push({ statement, expected, actual: matches[i] || 'No answer' });
      }
    });
    setCorrect(old => old + hits);
    setMisses(old => [...old, ...wrong]);
  };
  useEffect(() => {
    const interval = setInterval(() => {
      if (!paused && !checked) {
        setSeconds(v => v + 1);
        if (timed) {
          setRemaining(v => Math.max(0, v - 1));
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [paused, checked, timed]);
  useEffect(() => {
    if (timed && remaining === 0 && !checked) {
      checkRef.current();
    }
  }, [remaining, timed, checked]);
  useEffect(() => {
    const sub = AppState.addEventListener('change', status => {
      if (status !== 'active') {
        setPaused(true);
      }
    });
    return () => sub.remove();
  }, []);
  const exit = () =>
    Alert.alert(
      'End challenge?',
      'This unfinished set will not be added to your results.',
      [
        { text: 'Keep playing', style: 'cancel' },
        {
          text: 'End challenge',
          style: 'destructive',
          onPress: () => {
            finishing.current = true;
            navigation.goBack();
          },
        },
      ],
    );
  useEffect(
    () =>
      navigation.addListener('beforeRemove', e => {
        if (finishing.current) {
          return;
        }
        e.preventDefault();
        setPaused(true);
        Alert.alert(
          'End challenge?',
          'Your unfinished set will not be saved.',
          [
            { text: 'Keep playing', style: 'cancel' },
            {
              text: 'End challenge',
              style: 'destructive',
              onPress: () => {
                finishing.current = true;
                navigation.dispatch(e.data.action);
              },
            },
          ],
        );
      }),
    [navigation],
  );
  const next = () => {
    if (task + 1 === tasks.length) {
      finishing.current = true;
      const id = uid();
      const result = {
        id,
        date: new Date().toISOString(),
        correct,
        total: tasks.length * 3,
        score:
          correct *
          (config.difficulty === 'Easy'
            ? 40
            : config.difficulty === 'Considered'
            ? 60
            : 80),
        seconds,
        misses,
      };
      update(st => ({ ...st, challenges: [result, ...st.challenges] }));
      navigation.replace('ChallengeResult', { id });
    } else {
      setTask(task + 1);
      setMatches({});
      setSelected('');
      setRemaining(config.seconds);
      setChecked(false);
    }
  };
  const drop = (text: string, x: number, y: number) => {
    Object.entries(targets.current).forEach(([i, view]) =>
      view?.measureInWindow((left, top, width, height) => {
        if (x >= left && x <= left + width && y >= top && y <= top + height) {
          assign(Number(i), text);
        }
      }),
    );
  };
  return (
    <Screen
      animationKey={task}
      footer={
        <View style={s.row}>
          <Button secondary title="Pause" onPress={() => setPaused(true)} />
          <Button
            title={
              checked
                ? task + 1 === tasks.length
                  ? 'See results'
                  : 'Next task'
                : 'Check matches'
            }
            disabled={
              !checked && Object.keys(matches).length !== quiz.statements.length
            }
            onPress={() => (checked ? next() : checkRef.current())}
            style={s.fill}
          />
        </View>
      }
    >
      <Header
        title={`Task ${task + 1} of ${tasks.length}`}
        subtitle={config.difficulty.toUpperCase()}
        onBack={() => setPaused(true)}
        right={
          <View style={s.row}>
            <Text style={s.label}>{timed ? duration(remaining) : '∞'}</Text>
            <IconButton name="close" label="End challenge" onPress={exit} />
          </View>
        }
      />
      <Progress current={task + 1} total={tasks.length} />
      <Text style={s.heading}>
        Drag each response onto the situation it fits
      </Text>
      {quiz.statements.map((statement, i) => {
        const expected = quiz.matches.find(m => m.target === i)!.text;
        const right = matches[i] === expected;
        return (
          <View
            key={statement}
            ref={v => {
              targets.current[i] = v;
            }}
            collapsable={false}
          >
            <Pressable
              onPress={() => {
                if (!checked && selected) {
                  assign(i, selected);
                  setSelected('');
                }
              }}
              accessibilityRole="button"
              accessibilityLabel={`${statement}. ${
                matches[i] || 'Drop response here'
              }`}
            >
              <Card accent={checked ? (right ? 'green' : 'red') : undefined}>
                <Text style={s.body}>{statement}</Text>
                <Text
                  style={{
                    color: matches[i] ? colors.gold : colors.muted,
                    fontSize: 13,
                  }}
                >
                  {matches[i] || 'Drop here, or tap after selecting a response'}
                  {checked ? (right ? '  ✓' : '  ✕') : ''}
                </Text>
                {checked && !right && (
                  <Text style={s.muted}>Best match: {expected}</Text>
                )}
              </Card>
            </Pressable>
          </View>
        );
      })}
      {!checked && (
        <View style={c.tray}>
          <Label>RESPONSES · DRAG UP OR TAP</Label>
          <View style={[s.wrap, { overflow: 'visible' }]}>
            {options
              .filter(m => !Object.values(matches).includes(m.text))
              .map(m => (
                <DraggableResponse
                  key={m.text}
                  match={m}
                  selected={selected === m.text}
                  onTap={() => setSelected(selected === m.text ? '' : m.text)}
                  onDrop={drop}
                />
              ))}
          </View>
          {Object.keys(matches).length > 0 && (
            <Text style={s.muted} onPress={() => setMatches({})}>
              Reset matches
            </Text>
          )}
        </View>
      )}
      <Modal
        visible={paused}
        transparent
        animationType="fade"
        onRequestClose={() => setPaused(false)}
      >
        <SafeAreaView style={c.overlay}>
          <ScrollView contentContainerStyle={c.pauseScroll}>
            <Motion
              reduced={reduced}
              replayKey={Number(paused)}
              direction="down"
              style={c.pauseContent}
            >
              <View style={c.pauseIcon}>
                <Icon name="pause" size={42} />
              </View>
              <Text style={s.title}>Paused</Text>
              <Text style={[s.muted, { textAlign: 'center' }]}>
                The timer is stopped. Nothing is lost — take as long as you
                need.
              </Text>
              <View style={s.row}>
                <Card style={s.fill}>
                  <Text style={s.heading}>
                    {task + 1}/{tasks.length}
                  </Text>
                  <Label>TASKS</Label>
                </Card>
                <Card style={s.fill}>
                  <Text style={s.heading}>
                    {timed ? duration(remaining) : '∞'}
                  </Text>
                  <Label>ON THE CLOCK</Label>
                </Card>
              </View>
              <Button title="Resume" onPress={() => setPaused(false)} />
              {timed && (
                <Button
                  secondary
                  title="Switch off the timer"
                  onPress={() => {
                    setTimed(false);
                    setPaused(false);
                  }}
                />
              )}
              <Text
                style={{ color: '#d18797', textAlign: 'center', padding: 15 }}
                onPress={exit}
              >
                End challenge
              </Text>
            </Motion>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </Screen>
  );
}
export function ChallengeResultScreen({
  route,
  navigation,
}: NativeStackScreenProps<RootStackParams, 'ChallengeResult'>) {
  const { state } = useStore();
  const result = state.challenges.find(r => r.id === route.params.id)!;
  const [review, setReview] = useState(false);
  const best = Math.max(...state.challenges.map(r => r.score));
  const accuracy = Math.round((result.correct / result.total) * 100);
  const circumference = 2 * Math.PI * 70;
  return (
    <Screen
      footer={
        <View style={s.row}>
          <Button
            secondary
            title={review ? 'Hide review' : 'Review misses'}
            onPress={() => setReview(!review)}
          />
          <Button
            title="Play again"
            onPress={() => navigation.goBack()}
            style={s.fill}
          />
        </View>
      }
    >
      <Header title="Results · Your task set" onBack={navigation.goBack} />
      <View style={c.ring}>
        <Svg width={170} height={170}>
          <Circle
            cx={85}
            cy={85}
            r={70}
            stroke="#443820"
            strokeWidth={13}
            fill="none"
          />
          <Circle
            cx={85}
            cy={85}
            r={70}
            stroke="#f6dc91"
            strokeWidth={13}
            fill="none"
            strokeDasharray={`${
              (circumference * accuracy) / 100
            } ${circumference}`}
            transform="rotate(-90 85 85)"
          />
        </Svg>
        <View style={c.ringText}>
          <Text style={{ fontSize: 38, fontWeight: '700', color: '#f6dc91' }}>
            {accuracy}%
          </Text>
          <Label>ACCURACY</Label>
        </View>
      </View>
      <Text style={[s.heading, { textAlign: 'center' }]}>
        {result.score === best
          ? 'Your personal best'
          : 'Another perspective gained'}
      </Text>
      <View style={s.row}>
        <Card accent="red" style={s.fill}>
          <Label>SCORE</Label>
          <Text style={s.title}>{result.score}</Text>
        </Card>
        <Card style={s.fill}>
          <Label>BEST</Label>
          <Text style={s.title}>{best}</Text>
        </Card>
      </View>
      <View style={s.row}>
        <Card accent="green" style={s.fill}>
          <Label>CORRECT</Label>
          <Text style={s.title}>{result.correct}</Text>
        </Card>
        <Card accent="red" style={s.fill}>
          <Label>MISSED</Label>
          <Text style={s.title}>{result.total - result.correct}</Text>
        </Card>
      </View>
      <Card>
        <Text style={s.body}>
          Accuracy over {Math.min(7, state.challenges.length)} sets
        </Text>
        <View style={c.chart}>
          {state.challenges
            .slice(0, 7)
            .reverse()
            .map(r => (
              <View key={r.id} style={c.barColumn}>
                <Text style={[s.muted, { fontSize: 10 }]}>
                  {Math.round((r.correct / r.total) * 100)}%
                </Text>
                <View
                  style={{
                    height: Math.max(3, (r.correct / r.total) * 75),
                    backgroundColor: colors.gold,
                    borderRadius: 4,
                    width: '100%',
                  }}
                />
              </View>
            ))}
        </View>
      </Card>
      <Card>
        <View style={s.between}>
          <Label>TIME</Label>
          <Text style={s.heading}>{duration(result.seconds)}</Text>
        </View>
      </Card>
      {review &&
        (result.misses.length ? (
          result.misses.map((m, i) => (
            <Card key={i}>
              <Text style={s.body}>{m.statement}</Text>
              <Text style={s.muted}>Your response: {m.actual}</Text>
              <Text style={{ color: '#9fd0b9' }}>Best match: {m.expected}</Text>
            </Card>
          ))
        ) : (
          <Text style={s.body}>Every response matched. Well done.</Text>
        ))}
    </Screen>
  );
}
const c = StyleSheet.create({
  response: {
    backgroundColor: '#231f21',
    borderWidth: 1,
    borderColor: '#67512b',
    borderRadius: 14,
    padding: 12,
    zIndex: 10,
  },
  selected: { backgroundColor: '#55341e', borderColor: colors.gold },
  tray: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#332a2d',
    gap: 14,
    overflow: 'visible',
  },
  overlay: {
    flex: 1,
    backgroundColor: '#0b090bf5',
    justifyContent: 'center',
    padding: 24,
  },
  pauseScroll: { flexGrow: 1, justifyContent: 'center', paddingVertical: 16 },
  pauseContent: { width: '100%', maxWidth: 480, alignSelf: 'center', gap: 22 },
  pauseIcon: {
    alignSelf: 'center',
    padding: 20,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#a47b2c',
    backgroundColor: '#432015',
  },
  ring: { alignSelf: 'center', width: 170, height: 170 },
  ringText: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chart: { height: 100, flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  barColumn: {
    flex: 1,
    justifyContent: 'flex-end',
    gap: 4,
    alignItems: 'center',
  },
});
