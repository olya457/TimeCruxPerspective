import React, { useEffect, useState } from 'react';
import { Alert, Pressable, Share, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import scenarios from '../data/perspectives.json';
import situations from '../data/situations.json';
import { RootStackParams, Situation } from '../types';
import { useStore } from '../storage/AppStore';
import { styles as s } from '../theme';
import {
  Button,
  Card,
  Chips,
  Header,
  IconButton,
  Input,
  Label,
  Progress,
  Icon,
  Screen,
} from '../components/UI';
import { answerText, uid } from '../utils';
export function PerspectivesScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParams>>();
  const { state } = useStore();
  const [topic, setTopic] = useState('All');
  const [generating, setGenerating] = useState<string | null>(null);
  const [stage, setStage] = useState(0);
  useEffect(() => {
    if (!generating) {
      return;
    }
    const first = setTimeout(() => setStage(1), 350);
    const second = setTimeout(() => setStage(2), 800);
    const done = setTimeout(() => {
      setGenerating(null);
      setStage(0);
      navigation.navigate('PerspectiveSetup', { sourceId: generating });
    }, 1400);
    return () => {
      clearTimeout(first);
      clearTimeout(second);
      clearTimeout(done);
    };
  }, [generating, navigation]);
  if (generating) {
    return (
      <Screen
        footer={
          <Button
            secondary
            title="Cancel"
            onPress={() => {
              setGenerating(null);
              setStage(0);
            }}
          />
        }
      >
        <Header
          title="Preparing your situation"
          subtitle="ROLE SWITCH · STEP 1 OF 3"
        />
        <View style={[s.fill, { justifyContent: 'center', gap: 24 }]}>
          <View style={{ alignItems: 'center', gap: 22 }}>
            <Icon name="spark" size={56} />
            <Text style={s.heading}>A fresh point of view</Text>
            <Text style={s.muted}>
              {topic === 'All' ? 'Everyday decisions' : topic}
            </Text>
          </View>
          {[
            'Pick a situation',
            'Bring in the context',
            'Prepare your questions',
          ].map((label, i) => (
            <Card key={label}>
              <View style={s.row}>
                <Icon name={i <= stage ? 'check' : 'spark'} />
                <Text style={s.body}>{label}</Text>
              </View>
            </Card>
          ))}
          <Progress current={stage + 1} total={3} />
        </View>
      </Screen>
    );
  }

  const pool = scenarios.filter(x => topic === 'All' || x.category === topic);
  return (
    <Screen>
      <Header title="Perspectives" subtitle="ROLE SWITCH · STEP 1 OF 3" />
      <Text style={s.muted}>
        Pick a situation to reread from someone else’s point of view — or let
        the app choose one for you.
      </Text>
      <Card accent="red">
        <Label>✧ FIND A FRESH SITUATION</Label>
        <Text style={s.heading}>Give me something to think about</Text>
        <Text style={s.muted}>
          An everyday dilemma, built around the topics you pick.
        </Text>
        <Chips
          items={['All', 'WORK', 'MONEY', 'FRIENDSHIP', 'FAMILY', 'BOUNDARIES']}
          value={topic}
          onChange={setTopic}
        />
        <Button
          title="✧  Choose a situation"
          onPress={() => {
            const eligible = pool.length ? pool : scenarios;
            setGenerating(
              eligible[Math.floor(Math.random() * eligible.length)].id,
            );
          }}
        />
      </Card>
      {state.reflections.some(r => r.kind === 'situation' && r.completed) && (
        <>
          <Label>OR START FROM ONE OF YOURS</Label>
          {state.reflections
            .filter(r => r.kind === 'situation' && r.completed)
            .map(r => (
              <Card key={r.id}>
                <Text style={s.body}>{r.title}</Text>
                <Button
                  secondary
                  small
                  title="Use this situation"
                  onPress={() =>
                    navigation.navigate('PerspectiveSetup', {
                      sourceId: r.sourceId,
                    })
                  }
                />
              </Card>
            ))}
        </>
      )}
      <Label>BROWSE SITUATIONS</Label>
      {pool.map(item => (
        <Pressable
          key={item.id}
          onPress={() =>
            navigation.navigate('PerspectiveSetup', { sourceId: item.id })
          }
        >
          <Card>
            <Label>{item.category}</Label>
            <Text style={s.body}>{item.title}</Text>
            <Text style={s.muted}>
              Depth {'●'.repeat(item.depth)} · {item.questions.length} questions
            </Text>
          </Card>
        </Pressable>
      ))}
    </Screen>
  );
}
export function PerspectiveSetupScreen({
  route,
  navigation,
}: NativeStackScreenProps<RootStackParams, 'PerspectiveSetup'>) {
  const { state } = useStore();
  const { sourceId } = route.params;
  const [sessionId] = useState(route.params.sessionId || uid);
  const source = ([...scenarios, ...situations] as Situation[]).find(
    x => x.id === sourceId,
  )!;
  const [selected, setSelected] = useState('Me');
  const results = state.reflections.filter(
    r => r.sessionId === sessionId && r.completed,
  );
  const roles = source.roles || [
    'Me',
    'Friend',
    'Partner',
    'Manager',
    'Stranger',
    'Neutral Observer',
  ];
  return (
    <Screen
      footer={
        <>
          <Button
            title={`Answer as ${selected}`}
            onPress={() =>
              navigation.navigate('Reflection', {
                sourceId,
                role: selected,
                sessionId,
              })
            }
          />
          {new Set(results.map(r => r.role)).size >= 2 && (
            <Button
              secondary
              title="Compare perspectives"
              onPress={() =>
                navigation.navigate('Compare', { sourceId, sessionId })
              }
            />
          )}
        </>
      }
    >
      <Header
        title="Your situation"
        subtitle="ROLE SWITCH · STEP 2 OF 3"
        onBack={navigation.goBack}
      />
      <Card accent="red">
        <Label>{source.category}</Label>
        <Text style={s.heading}>{source.title}</Text>
        <Text style={s.muted}>{source.situation}</Text>
      </Card>
      <Text style={s.heading}>Answer as someone else</Text>
      <Text style={s.muted}>
        Start with your own view, then step into another role.
      </Text>
      {roles.map(role => (
        <Pressable key={role} onPress={() => setSelected(role)}>
          <Card accent={selected === role ? 'red' : undefined}>
            <View style={s.between}>
              <Text style={s.body}>{role}</Text>
              <Text style={s.label}>
                {results.some(r => r.role === role)
                  ? 'ANSWERED ✓'
                  : selected === role
                  ? 'SELECTED'
                  : ''}
              </Text>
            </View>
          </Card>
        </Pressable>
      ))}
      <Label>WHAT YOU’LL BE ASKED</Label>
      {source.questions.map((q, i) => (
        <Text key={q.id} style={s.muted}>
          {String(i + 1).padStart(2, '0')} {q.prompt}
        </Text>
      ))}
    </Screen>
  );
}
export function CompareScreen({
  route,
  navigation,
}: NativeStackScreenProps<RootStackParams, 'Compare'>) {
  const { state, saveReflection } = useStore();
  const [takeaway, setTakeaway] = useState('');
  const [writing, setWriting] = useState(false);
  const source = ([...scenarios, ...situations] as Situation[]).find(
    x => x.id === route.params.sourceId,
  )!;
  const all = state.reflections.filter(
    r => r.sessionId === route.params.sessionId && r.completed,
  );
  const results = all.filter(
    (r, i) => all.findIndex(x => x.role === r.role) === i,
  );
  const save = () => {
    const now = new Date().toISOString();
    const id = uid();
    saveReflection({
      id,
      sourceId: source.id,
      title: `Perspectives: ${source.title}`,
      category: source.category,
      kind: 'perspective',
      answers: Object.fromEntries(
        results.map(r => [r.role || 'Me', r.conclusion]),
      ),
      conclusion: takeaway.trim(),
      note: '',
      step: 0,
      completed: true,
      createdAt: now,
      updatedAt: now,
    });
    navigation.replace('ReflectionDetail', { id });
  };
  return (
    <Screen
      footer={
        <View style={s.row}>
          <Button
            secondary
            title="Add a role"
            onPress={() => navigation.goBack()}
          />
          <Button
            title={writing ? 'Save takeaway' : 'Write my takeaway'}
            disabled={writing && !takeaway.trim()}
            onPress={() => (writing ? save() : setWriting(true))}
            style={s.fill}
          />
        </View>
      }
    >
      <Header
        title="Compare perspectives"
        onBack={navigation.goBack}
        right={
          <IconButton
            name="share"
            label="Share comparison"
            onPress={() => {
              Share.share({
                message: `${source.title}\n\n${results
                  .map(r => `${r.role}: ${r.conclusion}`)
                  .join('\n\n')}`,
              }).catch(() => Alert.alert('Sharing unavailable'));
            }}
          />
        }
      />
      <Text style={s.title}>
        Same situation.{'\n'}Different points of view.
      </Text>
      {source.questions.map(q => (
        <View key={q.id} style={{ gap: 10 }}>
          <Label>{q.prompt}</Label>
          <View style={{ gap: 10 }}>
            {results.map((r, i) => (
              <Card key={r.id} accent={i % 2 ? 'green' : 'red'}>
                <Label>{r.role}</Label>
                <Text style={s.body}>{answerText(r.answers[q.id])}</Text>
              </Card>
            ))}
          </View>
          {new Set(results.map(r => answerText(r.answers[q.id]))).size > 1 && (
            <Text style={s.muted}>
              Your answers differ here. What changed when you changed roles?
            </Text>
          )}
        </View>
      ))}
      {writing && (
        <Input
          value={takeaway}
          onChangeText={setTakeaway}
          placeholder="Which assumption changed? What will you take away?"
        />
      )}
    </Screen>
  );
}
