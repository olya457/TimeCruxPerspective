import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { Answer, Question } from '../types';
import { colors, styles as s } from '../theme';
import { Card, Icon, IconButton, Input } from './UI';
export function QuestionInput({
  question: q,
  value,
  onChange,
}: {
  question: Question;
  value?: Answer;
  onChange: (v: Answer) => void;
}) {
  if (q.kind === 'single' || q.kind === 'multi') {
    return (
      <View style={{ gap: 10 }}>
        {q.options.map(option => {
          const selected = Array.isArray(value)
            ? value.includes(option)
            : value === option;
          return (
            <Pressable
              key={option}
              accessibilityRole={q.kind === 'multi' ? 'checkbox' : 'radio'}
              accessibilityState={{ checked: selected }}
              onPress={() => {
                if (q.kind === 'single') {
                  onChange(option);
                } else {
                  const values = Array.isArray(value) ? value : [];
                  onChange(
                    selected
                      ? values.filter(v => v !== option)
                      : [...values, option],
                  );
                }
              }}
            >
              <Card
                accent={selected ? 'red' : undefined}
                style={{ borderColor: selected ? '#b49142' : colors.border }}
              >
                <View style={s.row}>
                  <Text
                    style={{
                      color: selected ? colors.gold : colors.muted,
                      fontSize: 23,
                    }}
                  >
                    {selected ? '◉' : '○'}
                  </Text>
                  <Text style={[s.body, s.fill]}>{option}</Text>
                </View>
              </Card>
            </Pressable>
          );
        })}
      </View>
    );
  }
  if (q.kind === 'fields') {
    const values = Array.isArray(value) ? value : [];
    return (
      <View style={{ gap: 14 }}>
        {q.fields.map((field, i) => (
          <Card key={`${field}-${i}`}>
            <Text style={s.muted}>{field}</Text>
            <Input
              compact
              numeric={q.numeric}
              value={values[i] || ''}
              placeholder={field}
              maxLength={q.maxLength}
              onChangeText={v => {
                const next = q.fields.map((_, j) => values[j] || '');
                next[i] = v;
                onChange(next);
              }}
            />
          </Card>
        ))}
      </View>
    );
  }
  if (q.kind === 'scale') {
    const current =
      typeof value === 'number' ? value : Math.round((q.min + q.max) / 2);
    return (
      <Card>
        <Text style={s.heading}>
          {value === undefined ? 'Move the slider to choose' : current}
        </Text>
        <Slider
          accessibilityLabel={q.prompt}
          minimumValue={q.min}
          maximumValue={q.max}
          step={1}
          value={current}
          minimumTrackTintColor={colors.gold}
          maximumTrackTintColor="#393336"
          thumbTintColor="#f1d58d"
          onValueChange={onChange}
        />
        <View style={s.between}>
          <Text style={[s.muted, s.fill]}>
            {q.scaleLabels[0] || 'Disagree'}
          </Text>
          <Text style={[s.muted, s.fill, { textAlign: 'right' }]}>
            {q.scaleLabels[q.scaleLabels.length - 1] || 'Agree'}
          </Text>
        </View>
      </Card>
    );
  }
  if (q.kind === 'rank') {
    const ranked = Array.isArray(value) ? value : q.options;
    const move = (i: number, delta: number) => {
      const next = [...ranked];
      [next[i], next[i + delta]] = [next[i + delta], next[i]];
      onChange(next);
    };
    return (
      <View style={{ gap: 8 }}>
        <Text style={s.muted}>Use the arrows to arrange your priorities.</Text>
        {ranked.map((item, i) => (
          <Card key={item}>
            <View style={s.row}>
              <Text style={s.label}>{i + 1}</Text>
              <Text style={[s.body, s.fill]}>{item}</Text>
              {i > 0 && (
                <IconButton
                  name="up"
                  label={`Move ${item} up`}
                  onPress={() => move(i, -1)}
                />
              )}{' '}
              {i < ranked.length - 1 && (
                <IconButton
                  name="down"
                  label={`Move ${item} down`}
                  onPress={() => move(i, 1)}
                />
              )}
            </View>
          </Card>
        ))}
        <Pressable onPress={() => onChange([...ranked])}>
          <View style={s.row}>
            <Icon name="check" />
            <Text style={s.body}>Use this order</Text>
          </View>
        </Pressable>
      </View>
    );
  }
  return (
    <Input
      value={typeof value === 'string' ? value : ''}
      onChangeText={onChange}
      placeholder={q.placeholder || q.prompt}
      maxLength={q.maxLength}
    />
  );
}
