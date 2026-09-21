import React, { useState } from 'react';
import { Alert, Pressable, Share, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { useNavigation } from '@react-navigation/native';
import {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import choices from '../data/choices.json';
import { ChoiceDraft, RootStackParams } from '../types';
import { useStore } from '../storage/AppStore';
import { colors, styles as s } from '../theme';
import {
  Button,
  Card,
  Chips,
  Header,
  IconButton,
  Label,
  Screen,
} from '../components/UI';
import { uid } from '../utils';
export function ChoicesScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParams>>();
  const { state } = useStore();
  return (
    <Screen>
      <Header title="No Perfect Choice" />
      <Text style={s.muted}>
        Situations where every option costs something. Choose the compromise you
        can live with, then reflect on your priorities.
      </Text>
      {choices.map((item, i) => (
        <Pressable
          key={item.id}
          onPress={() => navigation.navigate('Choice', { id: item.id })}
        >
          <Card accent={i === 0 ? 'red' : undefined}>
            <Label>
              {i === 0 ? 'FEATURED · 3 OPTIONS' : item.category.toUpperCase()}
            </Label>
            <Text style={s.heading}>{item.title}</Text>
            <Text style={s.muted} numberOfLines={i === 0 ? 4 : 2}>
              {item.situation}
            </Text>
            <View style={s.between}>
              <Text style={s.label}>{item.category}</Text>
              <Button
                small
                title={state.choiceDrafts[item.id] ? 'Continue' : 'Open'}
                onPress={() => navigation.navigate('Choice', { id: item.id })}
              />
            </View>
          </Card>
        </Pressable>
      ))}
      {state.reflections
        .filter(r => r.kind === 'choice')
        .map(r => (
          <Card key={r.id}>
            <Label>YOUR COMPROMISE</Label>
            <Text style={s.body}>{r.title}</Text>
            <Button
              secondary
              title="Review"
              onPress={() =>
                navigation.navigate('ReflectionDetail', { id: r.id })
              }
            />
          </Card>
        ))}
    </Screen>
  );
}
export function ChoiceScreen({
  route,
  navigation,
}: NativeStackScreenProps<RootStackParams, 'Choice'>) {
  const item = choices.find(x => x.id === route.params.id)!;
  const { state, update, saveReflection } = useStore();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<ChoiceDraft>(
    state.choiceDrafts[item.id] || {
      option: -1,
      priorities: item.priorities.map(() => 50),
      value: '',
      confidence: 50,
    },
  );
  const edit = (change: Partial<ChoiceDraft>) => {
    const next = { ...draft, ...change };
    setDraft(next);
    update(st => ({
      ...st,
      choiceDrafts: { ...st.choiceDrafts, [item.id]: next },
    }));
  };
  const option = item.options[draft.option];
  const highest = draft.priorities.indexOf(Math.max(...draft.priorities));
  const summary = option
    ? `You chose: ${option.title}.\nYour guiding value: ${
        draft.value
      }.\nYour highest priority: ${
        item.priorities[highest]
      }.\nYou accepted: ${option.costs.join('; ')}.\nConfidence: ${
        draft.confidence
      }%.`
    : '';
  const save = () => {
    const now = new Date().toISOString();
    const id = uid();
    saveReflection({
      id,
      sourceId: item.id,
      title: item.title,
      category: item.category,
      kind: 'choice',
      answers: {
        'Your choice': option.title,
        ...Object.fromEntries(
          item.priorities.map((p, i) => [p, `${draft.priorities[i]} / 100`]),
        ),
        'Most important to me': draft.value,
        Confidence: `${draft.confidence}%`,
      },
      conclusion: summary,
      note: '',
      step: 0,
      completed: true,
      createdAt: now,
      updatedAt: now,
    });
    update(st => {
      const drafts = { ...st.choiceDrafts };
      delete drafts[item.id];
      return { ...st, choiceDrafts: drafts };
    });
    navigation.replace('ReflectionDetail', { id });
  };
  return (
    <Screen
      animationKey={step}
      footer={
        step === 2 ? (
          <View style={s.row}>
            <Button secondary title="Re-decide" onPress={() => setStep(0)} />
            <Button title="Save to reflections" onPress={save} style={s.fill} />
          </View>
        ) : (
          <Button
            title={step === 0 ? 'Weigh this compromise' : 'See what this says'}
            disabled={draft.option < 0 || (step === 1 && !draft.value)}
            onPress={() => setStep(step + 1)}
          />
        )
      }
    >
      <Header
        title={
          step === 0
            ? 'No Perfect Choice'
            : step === 1
            ? 'What matters most to you here?'
            : 'Your compromise'
        }
        subtitle={`STEP ${step + 1} OF 3 · NO SCORING`}
        onBack={() => (step ? setStep(step - 1) : navigation.goBack())}
        right={
          step === 2 ? (
            <IconButton
              name="share"
              label="Share compromise"
              onPress={() => {
                Share.share({ message: `${item.title}\n\n${summary}` }).catch(
                  () => Alert.alert('Sharing unavailable'),
                );
              }}
            />
          ) : undefined
        }
      />
      {step === 0 ? (
        <>
          <Text style={s.title}>{item.title}</Text>
          <Text style={s.muted}>{item.situation}</Text>
          <Text style={s.muted}>
            {item.intro ||
              'Every option costs something real. There is no correct answer.'}
          </Text>
          {item.options.map((o, i) => (
            <Pressable key={o.title} onPress={() => edit({ option: i })}>
              <Card
                accent={draft.option === i ? 'red' : undefined}
                style={{
                  borderColor: draft.option === i ? '#b88e32' : colors.border,
                }}
              >
                <View style={s.row}>
                  <Text style={{ fontSize: 25, color: colors.gold }}>
                    {draft.option === i ? '◉' : '○'}
                  </Text>
                  <View style={s.fill}>
                    <Text style={s.body}>{o.title}</Text>
                    <Text style={s.muted}>{o.description}</Text>
                  </View>
                </View>
                <View style={s.row}>
                  <Card accent="green" style={s.fill}>
                    <Label>GAINS</Label>
                    {o.gains.map(g => (
                      <Text key={g} style={s.muted}>
                        {g}
                      </Text>
                    ))}
                  </Card>
                  <Card accent="red" style={s.fill}>
                    <Label>COSTS</Label>
                    {o.costs.map(c => (
                      <Text key={c} style={s.muted}>
                        {c}
                      </Text>
                    ))}
                  </Card>
                </View>
                <View style={s.between}>
                  <Label>RISK</Label>
                  <Text style={s.muted}>{o.risk}</Text>
                </View>
              </Card>
            </Pressable>
          ))}
        </>
      ) : step === 1 ? (
        <>
          <Card accent="red">
            <Label>YOUR CHOICE</Label>
            <Text style={s.body}>{option.title}</Text>
          </Card>
          <Label>SET YOUR PRIORITIES</Label>
          {item.priorities.map((p, i) => (
            <View key={p}>
              <View style={s.between}>
                <Text style={[s.body, s.fill]}>{p}</Text>
                <Text style={s.muted}>{draft.priorities[i]}%</Text>
              </View>
              <Slider
                accessibilityLabel={p}
                value={draft.priorities[i]}
                minimumValue={0}
                maximumValue={100}
                step={1}
                minimumTrackTintColor="#6f955a"
                maximumTrackTintColor="#30292d"
                thumbTintColor="#edcf80"
                onValueChange={v =>
                  edit({
                    priorities: draft.priorities.map((n, j) =>
                      i === j ? v : n,
                    ),
                  })
                }
              />
            </View>
          ))}
          <Card>
            <Label>MOST IMPORTANT TO ME</Label>
            <Chips
              items={item.values}
              value={draft.value}
              onChange={v => edit({ value: v })}
            />
          </Card>
          <Card>
            <View style={s.between}>
              <Text style={s.body}>How confident are you?</Text>
              <Text style={s.label}>{draft.confidence}%</Text>
            </View>
            <Slider
              accessibilityLabel="Confidence"
              value={draft.confidence}
              minimumValue={0}
              maximumValue={100}
              step={1}
              minimumTrackTintColor={colors.gold}
              maximumTrackTintColor="#30292d"
              thumbTintColor="#edcf80"
              onValueChange={v => edit({ confidence: v })}
            />
            <View style={s.between}>
              <Label>UNSURE</Label>
              <Label>SETTLED</Label>
            </View>
          </Card>
        </>
      ) : (
        <>
          <Label>NOT A SCORE · A MIRROR</Label>
          <Text style={s.title}>
            You chose {draft.value.toLowerCase()} as your guide.
          </Text>
          <Card accent="green">
            <Label>YOU PRIORITISED</Label>
            <Text style={s.heading}>{item.priorities[highest]}</Text>
            <Text style={s.body}>{option.gains.join('\n')}</Text>
          </Card>
          <Card accent="red">
            <Label>YOU ACCEPTED</Label>
            <Text style={s.body}>{option.costs.join('\n')}</Text>
          </Card>
          <Card>
            <Label>YOUR PRIORITIES</Label>
            {item.priorities.map((p, i) => (
              <View key={p} style={{ gap: 5 }}>
                <View style={s.between}>
                  <Text style={s.muted}>{p}</Text>
                  <Text style={s.muted}>{draft.priorities[i]}%</Text>
                </View>
                <View
                  style={{
                    height: 5,
                    backgroundColor: '#373032',
                    borderRadius: 4,
                  }}
                >
                  <View
                    style={{
                      height: 5,
                      width: `${draft.priorities[i]}%`,
                      backgroundColor: colors.gold,
                      borderRadius: 4,
                    }}
                  />
                </View>
              </View>
            ))}
          </Card>
          <Card>
            <Label>ANOTHER WAY TO READ IT</Label>
            <Text style={s.body}>
              You chose “{option.title}” while rating{' '}
              {item.priorities[highest].toLowerCase()} highest. Does this option
              protect that priority in practice? What would make its cost
              unacceptable?
            </Text>
          </Card>
          <Card>
            <Text style={s.muted}>
              Your confidence is {draft.confidence}%. You can revisit this
              reflection whenever you have new information.
            </Text>
          </Card>
        </>
      )}
    </Screen>
  );
}
