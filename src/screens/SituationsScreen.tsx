import React, { useState } from 'react';
import { Alert, Image, Pressable, Share, Text, View } from 'react-native';
import {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import situations from '../data/situations.json';
import perspectives from '../data/perspectives.json';
import { RootStackParams, Situation } from '../types';
import { useStore } from '../storage/AppStore';
import { assets, styles as s } from '../theme';
import {
  Button,
  Card,
  Chips,
  Empty,
  Header,
  IconButton,
  Input,
  Label,
  Screen,
  Segments,
} from '../components/UI';
import { answerText } from '../utils';
export function SituationsScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParams>>();
  const { state } = useStore();
  const [tab, setTab] = useState('Situations');
  const [category, setCategory] = useState('All');
  const completed = state.reflections.filter(r => r.completed);
  return (
    <Screen animationKey={tab}>
      <Header title="Situations" />
      <Segments
        items={['Situations', 'My Reflections']}
        value={tab}
        onChange={setTab}
      />
      {tab === 'Situations' ? (
        <>
          <Chips
            items={['All', 'Career', 'Money', 'Boundaries', 'Relationships']}
            value={category}
            onChange={setCategory}
          />
          {situations
            .filter(x => category === 'All' || x.category.includes(category))
            .map((item, i) => (
              <Pressable
                key={item.id}
                onPress={() =>
                  navigation.navigate('Reflection', { sourceId: item.id })
                }
              >
                <Card accent={i === 0 ? 'red' : undefined}>
                  <View style={s.row}>
                    <Image
                      source={assets.onboarding[i % 3]}
                      style={{ height: 44, width: 44 }}
                    />
                    <View style={s.fill}>
                      <Label>{item.category.toUpperCase()}</Label>
                      <Text style={s.heading}>{item.title}</Text>
                    </View>
                  </View>
                  <Text style={s.muted}>{item.situation}</Text>
                  <View style={s.between}>
                    <Text style={[s.muted, s.fill]}>
                      Depth {'●'.repeat(item.depth)}
                      {'○'.repeat(4 - item.depth)} · {item.time}
                    </Text>
                    <Button
                      small
                      title="Begin"
                      onPress={() =>
                        navigation.navigate('Reflection', { sourceId: item.id })
                      }
                    />
                  </View>
                </Card>
              </Pressable>
            ))}
        </>
      ) : (
        <>
          <View style={s.row}>
            {[
              [completed.length, 'COMPLETED'],
              [state.reflections.length - completed.length, 'IN PROGRESS'],
            ].map(([n, label]) => (
              <Card key={label} style={s.fill}>
                <Text style={s.heading}>{n}</Text>
                <Label>{label}</Label>
              </Card>
            ))}
          </View>
          {state.reflections.length === 0 ? (
            <Empty
              title="Your first reflection lives here"
              detail="Work through any situation and your answers, conclusion and values are kept privately on this device."
            />
          ) : (
            state.reflections.map(r => (
              <Pressable
                key={r.id}
                onPress={() =>
                  r.completed
                    ? navigation.navigate('ReflectionDetail', { id: r.id })
                    : navigation.navigate('Reflection', {
                        sourceId: r.sourceId,
                        reflectionId: r.id,
                        role: r.role,
                        sessionId: r.sessionId,
                      })
                }
              >
                <Card>
                  <View style={s.between}>
                    <Label>{r.category.toUpperCase()}</Label>
                    <Text style={s.muted}>
                      {new Date(r.updatedAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={s.heading}>{r.title}</Text>
                  <Text numberOfLines={2} style={s.muted}>
                    {r.conclusion || 'Continue where you left off'}
                  </Text>
                  <Text style={s.label}>
                    {r.completed ? '✓ Concluded' : 'In progress'}
                    {r.role ? ` · ${r.role}` : ''}
                  </Text>
                </Card>
              </Pressable>
            ))
          )}
        </>
      )}
    </Screen>
  );
}
export function ReflectionDetailScreen({
  route,
  navigation,
}: NativeStackScreenProps<RootStackParams, 'ReflectionDetail'>) {
  const { state, saveReflection, removeReflection } = useStore();
  const r = state.reflections.find(x => x.id === route.params.id);
  const [editing, setEditing] = useState(false);
  const [conclusion, setConclusion] = useState(r?.conclusion || '');
  const [note, setNote] = useState(r?.note || '');
  if (!r) {
    return (
      <Screen>
        <Header title="Reflection" onBack={navigation.goBack} />
        <Empty
          title="Reflection not found"
          detail="It may have been deleted."
        />
      </Screen>
    );
  }
  const source = ([...situations, ...perspectives] as Situation[]).find(
    x => x.id === r.sourceId,
  );
  const share = () =>
    Share.share({
      message: [
        r.title,
        r.conclusion,
        ...Object.entries(r.answers).map(
          ([key, v]) =>
            `${
              source?.questions.find(q => q.id === key)?.prompt || key
            }\n${answerText(v)}`,
        ),
        r.note,
      ]
        .filter(Boolean)
        .join('\n\n'),
    }).catch(() => Alert.alert('Sharing unavailable', 'Please try again.'));
  const update = () => {
    saveReflection({
      ...r,
      conclusion,
      note,
      updatedAt: new Date().toISOString(),
    });
    setEditing(false);
  };
  return (
    <Screen
      footer={
        <View style={s.row}>
          <IconButton
            name="trash"
            label="Delete reflection"
            onPress={() =>
              Alert.alert(
                'Delete this reflection?',
                `“${r.title}” and your answers will be removed. This cannot be undone.`,
                [
                  { text: 'Keep it', style: 'cancel' },
                  {
                    text: 'Delete reflection',
                    style: 'destructive',
                    onPress: () => {
                      removeReflection(r.id);
                      navigation.goBack();
                    },
                  },
                ],
              )
            }
          />
          <Button title="Share reflection" onPress={share} style={s.fill} />
        </View>
      }
    >
      <Header
        title="Reflection"
        subtitle={new Date(r.createdAt).toLocaleDateString()}
        onBack={navigation.goBack}
        right={
          <Button
            small
            secondary
            title={editing ? 'Done' : 'Edit'}
            onPress={() => (editing ? update() : setEditing(true))}
          />
        }
      />
      <Text style={s.title}>{r.title}</Text>
      <Label>
        {r.category} {r.role ? ` · ${r.role}` : ''}
      </Label>
      <Card accent="green">
        <Label>YOUR CONCLUSION</Label>
        {editing ? (
          <Input
            value={conclusion}
            onChangeText={setConclusion}
            placeholder="Your conclusion"
          />
        ) : (
          <Text style={s.body}>{r.conclusion || 'No conclusion added.'}</Text>
        )}
      </Card>
      <Label>ANSWER TRAIL</Label>
      {Object.entries(r.answers).map(([key, value]) => (
        <Card key={key}>
          <Text style={s.muted}>
            {source?.questions.find(q => q.id === key)?.prompt || key}
          </Text>
          <Text style={s.body}>{answerText(value)}</Text>
        </Card>
      ))}
      <Card>
        <Label>PERSONAL NOTE</Label>
        {editing ? (
          <Input value={note} onChangeText={setNote} placeholder="Add a note" />
        ) : (
          <Text style={s.body}>{r.note || 'No note yet.'}</Text>
        )}
      </Card>
      {source && (
        <Button
          secondary
          title="Re-answer this situation"
          onPress={() =>
            navigation.navigate('Reflection', {
              sourceId: r.sourceId,
              role: r.role,
              sessionId: r.sessionId,
            })
          }
        />
      )}
    </Screen>
  );
}
