import quizzes from '../src/data/quizzes.json';
import situations from '../src/data/situations.json';
import perspectives from '../src/data/perspectives.json';
import choices from '../src/data/choices.json';
import cards from '../src/data/cards.json';
import articles from '../src/data/articles.json';
import { answered, shuffle } from '../src/utils';
test('all supplied content is available and identifiers are unique', () => {
  expect([
    quizzes.length,
    situations.length,
    perspectives.length,
    choices.length,
    cards.length,
    articles.length,
  ]).toEqual([30, 24, 40, 10, 100, 26]);
  const ids = [
    ...quizzes,
    ...situations,
    ...perspectives,
    ...choices,
    ...cards,
    ...articles,
  ].map(x => x.id);
  expect(new Set(ids).size).toBe(ids.length);
});
test('every quiz has exactly one correct match for each statement', () => {
  quizzes.forEach(q => {
    expect(q.statements).toHaveLength(3);
    expect(
      q.matches
        .filter(m => m.target !== null)
        .map(m => m.target)
        .sort(),
    ).toEqual([0, 1, 2]);
  });
});
test('every question and choice contains usable source content', () => {
  [...situations, ...perspectives].forEach(item => {
    expect(item.situation.length).toBeGreaterThan(10);
    item.questions.forEach(q => {
      expect(q.prompt.length).toBeGreaterThan(0);
      if (['single', 'multi', 'rank'].includes(q.kind)) {
        expect(q.options.length).toBeGreaterThan(1);
      }
    });
  });
  choices.forEach(item => {
    expect(item.options).toHaveLength(3);
    expect(item.priorities.length).toBeGreaterThan(0);
    item.options.forEach(o => {
      expect(o.gains.length).toBeGreaterThan(0);
      expect(o.costs.length).toBeGreaterThan(0);
    });
  });
});
test('required answers reject blank and incomplete fields while accepting zero scales', () => {
  const q = situations[0].questions[2];
  expect(answered(q, ['filled', '', 'filled'])).toBe(false);
  expect(answered(q, ['a', 'b', 'c'])).toBe(true);
  expect(answered({ ...q, kind: 'scale' }, 0)).toBe(true);
  expect(answered({ ...q, kind: 'text' }, '  ')).toBe(false);
});
test('shuffling preserves all content without mutating source order', () => {
  const source = [1, 2, 3, 4, 5];
  expect(shuffle(source).sort()).toEqual(source);
  expect(source).toEqual([1, 2, 3, 4, 5]);
});
