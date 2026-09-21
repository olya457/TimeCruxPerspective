import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { ChallengeResult, ChoiceDraft, Reflection } from '../types';
type State = {
  onboarded: boolean;
  reflections: Reflection[];
  savedCards: string[];
  savedArticles: string[];
  readArticles: string[];
  challenges: ChallengeResult[];
  choiceDrafts: Record<string, ChoiceDraft>;
};
const initial: State = {
  onboarded: false,
  reflections: [],
  savedCards: [],
  savedArticles: [],
  readArticles: [],
  challenges: [],
  choiceDrafts: {},
};
const KEY = '@timecrux/state/v1';
type Store = {
  state: State;
  ready: boolean;
  update: (fn: (s: State) => State) => void;
  saveReflection: (r: Reflection) => void;
  removeReflection: (id: string) => void;
  toggle: (
    key: 'savedCards' | 'savedArticles' | 'readArticles',
    id: string,
  ) => void;
};
const Context = createContext<Store | null>(null);
export function AppStore({ children }: React.PropsWithChildren) {
  const [state, setState] = useState(initial);
  const [ready, setReady] = useState(false);
  const queue = useRef(Promise.resolve());
  const readFailed = useRef(false);
  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then(raw => {
        if (raw) {
          const parsed = JSON.parse(raw);
          if (
            !parsed ||
            typeof parsed !== 'object' ||
            !Array.isArray(parsed.reflections)
          ) {
            throw new Error('Invalid storage');
          }
          setState({ ...initial, ...parsed });
        }
      })
      .catch(() => {
        readFailed.current = true;
        Alert.alert(
          'Storage unavailable',
          'Your saved data could not be read. Restart the app to try again. New changes will not overwrite your existing data.',
        );
      })
      .finally(() => setReady(true));
  }, []);
  useEffect(() => {
    if (ready && !readFailed.current) {
      queue.current = queue.current
        .then(() => AsyncStorage.setItem(KEY, JSON.stringify(state)))
        .catch(() => {
          Alert.alert(
            'Could not save',
            'Your changes are still available in this session. Please check device storage.',
          );
        });
    }
  }, [state, ready]);
  const update = (fn: (s: State) => State) => setState(fn);
  const saveReflection = (r: Reflection) =>
    update(s => ({
      ...s,
      reflections: [r, ...s.reflections.filter(x => x.id !== r.id)],
    }));
  const removeReflection = (id: string) =>
    update(s => ({
      ...s,
      reflections: s.reflections.filter(x => x.id !== id),
    }));
  const toggle: Store['toggle'] = (key, id) =>
    update(s => ({
      ...s,
      [key]: s[key].includes(id)
        ? s[key].filter(x => x !== id)
        : [...s[key], id],
    }));
  return (
    <Context.Provider
      value={{ state, ready, update, saveReflection, removeReflection, toggle }}
    >
      {children}
    </Context.Provider>
  );
}
export function useStore() {
  const store = useContext(Context);
  if (!store) {
    throw new Error('AppStore is required');
  }
  return store;
}
