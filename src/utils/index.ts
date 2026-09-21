import { Answer, Question } from '../types';
export const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
export const answerText = (value?: Answer) =>
  Array.isArray(value)
    ? value.join(' · ')
    : value === undefined
    ? 'Skipped'
    : String(value);
export const answered = (q: Question, value?: Answer) =>
  q.kind === 'fields'
    ? Array.isArray(value) &&
      q.fields.every((_, i) => Boolean(value[i]?.trim()))
    : Array.isArray(value)
    ? value.length > 0
    : typeof value === 'number' || Boolean(value?.trim());
export const shuffle = <T>(items: readonly T[]): T[] => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};
export const duration = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
