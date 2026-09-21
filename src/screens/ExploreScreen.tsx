import React, { useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import cards from '../data/cards.json';
import articles from '../data/articles.json';
import { RootStackParams } from '../types';
import { useStore } from '../storage/AppStore';
import { colors, styles as s } from '../theme';
import {
  Button,
  Card,
  GradientBackground,
  Chips,
  Empty,
  Header,
  IconButton,
  Label,
  Progress,
  Screen,
  Segments,
} from '../components/UI';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { shuffle } from '../utils';
export function ExploreScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParams>>();
  const { state, toggle } = useStore();
  const [tab, setTab] = useState('Perspective Cards');
  const [filter, setFilter] = useState('All');
  const [saved, setSaved] = useState(false);
  const [deck, setDeck] = useState(cards);
  const [index, setIndex] = useState(0);
  const list = useRef<FlatList>(null);
  const { height, contentWidth, compact } = useResponsiveLayout();
  const cardWidth = contentWidth - 12;
  const visible = saved
    ? deck.filter(c => state.savedCards.includes(c.id))
    : deck;
  const resetDeck = (next: typeof cards) => {
    setDeck(next);
    setIndex(0);
    list.current?.scrollToOffset({ offset: 0, animated: false });
  };
  return (
    <Screen animationKey={tab}>
      <Header title="Explore" />
      <Segments
        items={['Perspective Cards', 'Articles']}
        value={tab}
        onChange={setTab}
      />
      {tab === 'Perspective Cards' ? (
        <>
          {visible.length ? (
            <FlatList
              ref={list}
              horizontal
              data={visible}
              keyExtractor={item => item.id}
              snapToInterval={cardWidth + 12}
              decelerationRate="fast"
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={e =>
                setIndex(
                  Math.round(e.nativeEvent.contentOffset.x / (cardWidth + 12)),
                )
              }
              renderItem={({ item, index: i }) => (
                <View
                  style={[
                    e.perspectiveCard,
                    {
                      width: cardWidth,
                      minHeight: Math.max(330, Math.min(470, height * 0.54)),
                      padding: compact ? 18 : 24,
                      marginRight: 12,
                    },
                  ]}
                >
                  <GradientBackground
                    colors={
                      i % 2
                        ? ['#104436', '#0c201b', '#242121']
                        : ['#78132c', '#380c17', '#252223']
                    }
                    radius={27}
                  />
                  <Label>{item.category}</Label>
                  <View style={s.fill} />
                  <Text style={[e.quote, compact && e.compactQuote]}>
                    {item.text}
                  </Text>
                  <View style={s.fill} />
                  <Text style={s.muted}>{item.detail}</Text>
                  <View style={s.row}>
                    <Button
                      secondary
                      title="Share card"
                      onPress={() => {
                        Share.share({
                          message: `${item.text}\n\n${item.detail}\n— Time Crux Perspective`,
                        }).catch(() => Alert.alert('Sharing unavailable'));
                      }}
                      style={s.fill}
                    />
                    <IconButton
                      name={
                        state.savedCards.includes(item.id)
                          ? 'check'
                          : 'bookmark'
                      }
                      label={
                        state.savedCards.includes(item.id)
                          ? 'Unsave card'
                          : 'Save card'
                      }
                      onPress={() => toggle('savedCards', item.id)}
                    />
                  </View>
                </View>
              )}
            />
          ) : (
            <Empty
              title="No saved cards yet"
              detail="Save a card to return to it later."
            />
          )}
          <Text style={[s.muted, { textAlign: 'center' }]}>
            {visible.length
              ? `${Math.min(index + 1, visible.length)} / ${visible.length}`
              : '0 cards'}
          </Text>
          <View style={s.wrap}>
            <Button
              small
              secondary
              title="Shuffle deck"
              onPress={() => resetDeck(shuffle(deck))}
            />
            <Button
              small
              secondary
              title={saved ? 'Show all' : `Saved (${state.savedCards.length})`}
              onPress={() => {
                setSaved(!saved);
                setIndex(0);
                list.current?.scrollToOffset({ offset: 0, animated: false });
              }}
            />
            <Button
              small
              secondary
              title="Daily card"
              onPress={() => {
                setSaved(false);
                const daily =
                  cards[Math.floor(Date.now() / 86400000) % cards.length];
                resetDeck([daily, ...cards.filter(c => c.id !== daily.id)]);
              }}
            />
          </View>
        </>
      ) : (
        <>
          <Chips
            items={['All', 'Biases', 'Deciding', 'Talking', 'Saved']}
            value={filter}
            onChange={setFilter}
          />
          {articles
            .filter(
              a =>
                filter === 'All' ||
                (filter === 'Saved' && state.savedArticles.includes(a.id)) ||
                (filter === 'Biases' && a.category === 'COGNITIVE BIASES') ||
                (filter === 'Deciding' &&
                  [
                    'DECISION MAKING',
                    'PERSPECTIVE',
                    'SOCIAL INFLUENCE',
                  ].includes(a.category)) ||
                (filter === 'Talking' && a.category === 'COMMUNICATION'),
            )
            .map(a => (
              <Card key={a.id}>
                <Pressable
                  onPress={() => navigation.navigate('Article', { id: a.id })}
                >
                  <Label>{a.category}</Label>
                  <Text style={[s.heading, { marginVertical: 10 }]}>
                    {a.title}
                  </Text>
                  <Text style={s.muted} numberOfLines={3}>
                    {a.paragraphs[0]}
                  </Text>
                </Pressable>
                <View style={s.between}>
                  <Text style={s.muted}>
                    {state.readArticles.includes(a.id) ? 'Read ✓' : ''}
                  </Text>
                  <Button
                    small
                    secondary
                    title={
                      state.savedArticles.includes(a.id) ? 'Saved ✓' : '+ Save'
                    }
                    onPress={() => toggle('savedArticles', a.id)}
                  />
                </View>
              </Card>
            ))}
          {filter === 'Saved' && state.savedArticles.length === 0 && (
            <Empty
              title="Your reading list is empty"
              detail="Save an article to keep it here."
            />
          )}
        </>
      )}
    </Screen>
  );
}
export function ArticleScreen({
  route,
  navigation,
}: NativeStackScreenProps<RootStackParams, 'Article'>) {
  const article = articles.find(a => a.id === route.params.id)!;
  const { state, toggle } = useStore();
  const [large, setLarge] = useState(false);
  const [progress, setProgress] = useState(0);
  return (
    <Screen
      onScroll={({ nativeEvent: e }) => {
        const distance = e.contentSize.height - e.layoutMeasurement.height;
        setProgress(
          distance <= 0
            ? 100
            : Math.min(100, Math.round((e.contentOffset.y / distance) * 100)),
        );
      }}
    >
      <Header
        title=""
        onBack={navigation.goBack}
        right={
          <View style={s.row}>
            <IconButton
              name={
                state.readArticles.includes(article.id) ? 'check' : 'bookmark'
              }
              label="Mark article read"
              onPress={() => toggle('readArticles', article.id)}
            />
            <Button
              secondary
              small
              title="Aa"
              onPress={() => setLarge(!large)}
            />
          </View>
        }
      />
      <Progress current={progress} total={100} />
      <Label>{article.category}</Label>
      <Text style={s.title}>{article.title}</Text>
      <View style={s.separator} />
      {article.paragraphs.map((p, i) =>
        p === 'TRY THIS' ? null : article.paragraphs[i - 1] === 'TRY THIS' ? (
          <Card accent="green" key={i}>
            <Label>TRY THIS</Label>
            <Text
              style={[
                s.body,
                { fontSize: large ? 20 : 16, lineHeight: large ? 32 : 26 },
              ]}
            >
              {p}
            </Text>
          </Card>
        ) : (
          <Text
            key={i}
            style={{
              color: '#c6c0bb',
              fontSize: large ? 20 : 16,
              lineHeight: large ? 33 : 27,
            }}
          >
            {p}
          </Text>
        ),
      )}
      <Button
        title={
          state.savedArticles.includes(article.id) ? 'Saved ✓' : 'Save article'
        }
        onPress={() => toggle('savedArticles', article.id)}
      />
      <Button
        secondary
        title={
          state.readArticles.includes(article.id)
            ? 'Mark unread'
            : 'Mark as read'
        }
        onPress={() => toggle('readArticles', article.id)}
      />
    </Screen>
  );
}
const e = StyleSheet.create({
  compactQuote: { fontSize: 23, lineHeight: 30 },
  perspectiveCard: {
    borderWidth: 1,
    borderColor: '#9d7830',
    borderRadius: 28,
    padding: 24,
    gap: 20,
  },
  quote: {
    fontSize: 27,
    lineHeight: 35,
    letterSpacing: -0.6,
    color: colors.text,
  },
});
