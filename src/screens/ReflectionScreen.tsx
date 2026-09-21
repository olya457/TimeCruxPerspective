import React, { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Answer, Reflection, RootStackParams, Situation } from '../types';
import situations from '../data/situations.json';
import perspectives from '../data/perspectives.json';
import { useStore } from '../storage/AppStore';
import {
  Button,
  Card,
  Header,
  Input,
  Label,
  Progress,
  Screen,
} from '../components/UI';
import { QuestionInput } from '../components/QuestionInput';
import { styles as s } from '../theme';
import { answered, answerText, uid } from '../utils';
export function ReflectionScreen({
  route,
  navigation,
}: NativeStackScreenProps<RootStackParams, 'Reflection'>) {
  const { sourceId, reflectionId, role, sessionId } = route.params;
  const { state, saveReflection } = useStore();
  const source = ([...situations, ...perspectives] as Situation[]).find(
    x => x.id === sourceId,
  )!;
  const existing = state.reflections.find(r => r.id === reflectionId);
  const [id] = useState(existing?.id || uid);
  const [step, setStep] = useState(existing?.step || 0);
  const [answers, setAnswers] = useState<Record<string, Answer>>(
    existing?.answers || {},
  );
  const [conclusion, setConclusion] = useState(existing?.conclusion || '');
  const [note, setNote] = useState(existing?.note || '');
  const [summary, setSummary] = useState(false);
  const createdAt = useRef(existing?.createdAt || new Date().toISOString());
  const kind =
    role || sourceId.startsWith('perspectives') ? 'perspective' : 'situation';
  const q = source.questions[Math.min(step, source.questions.length - 1)];
  const latest = useRef<Reflection | null>(null);
  latest.current = {
    id,
    sourceId,
    title: source.title,
    category: source.category,
    kind,
    answers,
    conclusion,
    note,
    step,
    completed: false,
    createdAt: createdAt.current,
    updatedAt: new Date().toISOString(),
    role,
    sessionId,
  };
  const saveRef = useRef(saveReflection);
  saveRef.current = saveReflection;
  const finished = useRef(false);
  useEffect(() => {
    if (
      !finished.current &&
      latest.current &&
      Object.keys(latest.current.answers).length
    ) {
      saveRef.current(latest.current);
    }
  }, [answers, step, conclusion, note]);
  useEffect(
    () => () => {
      if (
        !finished.current &&
        latest.current &&
        Object.keys(latest.current.answers).length
      ) {
        saveRef.current(latest.current);
      }
    },
    [],
  );
  const complete = () => {
    finished.current = true;
    const result = {
      ...latest.current!,
      completed: true,
      conclusion:
        conclusion.trim() ||
        answerText(answers[source.questions[source.questions.length - 1].id]),
      updatedAt: new Date().toISOString(),
    };
    saveReflection(result);
    if (kind === 'perspective') {
      navigation.replace('PerspectiveSetup', {
        sourceId,
        sessionId: sessionId || id,
      });
    } else {
      navigation.replace('ReflectionDetail', { id });
    }
  };
  const next = () => {
    if (step === source.questions.length - 1) {
      const final = source.questions.find(x => x.final);
      if (final) {
        setConclusion(answerText(answers[final.id]));
      }
      setSummary(true);
    } else {
      setStep(step + 1);
    }
  };
  if (summary) {
    return (
      <Screen
        footer={
          <View style={s.row}>
            <Button
              secondary
              title="Review answers"
              onPress={() => setSummary(false)}
              style={s.fill}
            />
            <Button
              title={
                kind === 'perspective' ? 'Save this role' : 'Save reflection'
              }
              onPress={complete}
              style={s.fill}
            />
          </View>
        }
      >
        <Header title="Reflection summary" onBack={() => setSummary(false)} />
        <Text style={[s.title, { textAlign: 'center' }]}>
          You worked it through
        </Text>
        <Text style={[s.muted, { textAlign: 'center' }]}>
          {source.questions.length} questions · {source.category}
          {role ? ` · ${role}` : ''}
        </Text>
        <Card accent="green">
          <Label>YOUR CONCLUSION</Label>
          <Input
            compact
            value={conclusion}
            onChangeText={setConclusion}
            placeholder="What will you take away?"
          />
        </Card>
        {source.questions.map(question => (
          <Card key={question.id}>
            <Text style={s.muted}>{question.prompt}</Text>
            <Text style={s.body}>{answerText(answers[question.id])}</Text>
          </Card>
        ))}
        <Input
          compact
          value={note}
          onChangeText={setNote}
          placeholder="Add a personal note (optional)"
        />
      </Screen>
    );
  }
  return (
    <Screen
      key={q.id}
      footer={
        <View style={s.row}>
          <Button
            secondary
            title="Back"
            onPress={() => (step ? setStep(step - 1) : navigation.goBack())}
          />
          <Button
            title={
              step === source.questions.length - 1
                ? 'See my reflection'
                : 'Continue'
            }
            onPress={next}
            disabled={!answered(q, answers[q.id])}
            style={s.fill}
          />
        </View>
      }
    >
      <Header
        title={role ? `Answering as ${role}` : source.title}
        subtitle={`QUESTION ${step + 1} OF ${
          source.questions.length
        } · ${source.category.toUpperCase()}`}
        onBack={() => (step ? setStep(step - 1) : navigation.goBack())}
        right={
          <Text
            style={s.muted}
            onPress={() => {
              if (latest.current) {
                saveReflection(latest.current);
              }
              navigation.goBack();
            }}
          >
            Save & exit
          </Text>
        }
      />
      <Progress current={step + 1} total={source.questions.length} />
      {step === 0 && (
        <Card>
          <Label>SITUATION RECAP</Label>
          <Text style={s.muted}>{source.situation}</Text>
        </Card>
      )}
      {role && role !== 'Me' && (
        <Text style={s.muted}>
          Imagine you are {role.toLowerCase()}. Answer from their point of view.
        </Text>
      )}
      <Label>{q.label}</Label>
      <Text style={s.heading}>{q.prompt}</Text>
      <QuestionInput
        question={q}
        value={answers[q.id]}
        onChange={value => setAnswers({ ...answers, [q.id]: value })}
      />
      {!q.final && (
        <Text accessibilityRole="button" style={s.muted} onPress={next}>
          Skip this one
        </Text>
      )}
    </Screen>
  );
}
