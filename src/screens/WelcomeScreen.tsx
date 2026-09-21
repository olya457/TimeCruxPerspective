import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { assets, colors, styles as s } from '../theme';
import { Button, Screen } from '../components/UI';
import { Motion, useReducedMotion } from '../components/Motion';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { useStore } from '../storage/AppStore';
const loaderHtml = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;background:transparent;overflow:hidden}body{display:flex;align-items:center;justify-content:center;height:60px}.track{width:148px;height:3px;background:#ffffff26;border-radius:3px;overflow:hidden}.bar{height:100%;width:0;background:linear-gradient(90deg,#b48526,#fff0bd);animation:load 4s linear forwards}@keyframes load{to{width:100%}}</style></head><body><div class="track"><div class="bar"></div></div><script>setTimeout(function(){window.ReactNativeWebView.postMessage('complete')},4000)</script></body></html>`;
export function LoaderScreen({ onComplete }: { onComplete: () => void }) {
  const { height, compact } = useResponsiveLayout();
  const reduced = useReducedMotion();
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!failed) {
      return;
    }
    const timer = setTimeout(onComplete, 4000);
    return () => clearTimeout(timer);
  }, [failed, onComplete]);
  return (
    <View style={s.screen}>
      <Motion reduced={reduced} direction="down" style={w.loaderCenter}>
        <Image
          source={assets.logo}
          style={{
            width: Math.min(228, height * 0.29),
            height: Math.min(228, height * 0.29),
          }}
          resizeMode="contain"
        />
        <Text style={[w.brand, compact && w.compactBrand]}>Thinkwise</Text>
        <Text style={w.tagline}>
          Pause at the crux.{'\n'}See the choice from every side.
        </Text>
      </Motion>
      <Motion
        reduced={reduced}
        index={3}
        style={[w.loaderBottom, compact && w.compactLoaderBottom]}
      >
        <WebView
          source={{ html: loaderHtml }}
          originWhitelist={['*']}
          style={w.webview}
          scrollEnabled={false}
          onMessage={e => e.nativeEvent.data === 'complete' && onComplete()}
          onError={() => setFailed(true)}
          onShouldStartLoadWithRequest={r => r.url === 'about:blank'}
        />
        <Text style={w.preparing}>PREPARING YOUR CRUX</Text>
      </Motion>
    </View>
  );
}
const pages = [
  {
    tag: 'THE PAUSE',
    title: 'Three seconds\nbefore you decide',
    body: 'Thinkwise slows the moment down. Answer a short sequence of questions and watch your own reasoning appear on the page.',
  },
  {
    tag: 'ROLE SWITCH',
    title: 'The same event,\nread six ways',
    body: 'Answer as yourself, then as a friend, a manager, a stranger. Compare the two side by side and see which assumptions were yours, not “the facts”.',
  },
  {
    tag: 'THINKING CHALLENGE',
    title: 'Train it like\na sport',
    body: 'Drag-and-match rounds on biases, trade-offs and framing. Set your own length, difficulty and timer — or switch the clock off entirely.',
  },
];
export function OnboardingScreen() {
  const [page, setPage] = useState(0);
  const { illustrationHeight, compact } = useResponsiveLayout();
  const { update } = useStore();
  const finish = () => update(state => ({ ...state, onboarded: true }));
  return (
    <Screen
      animationKey={page}
      footer={
        <View style={s.between}>
          <View style={s.row}>
            {pages.map((_, i) => (
              <View key={i} style={[w.dot, i === page && w.activeDot]} />
            ))}
          </View>
          <Button
            title={page === 2 ? 'Start  →' : 'Next  →'}
            onPress={() => (page === 2 ? finish() : setPage(page + 1))}
          />
        </View>
      }
    >
      <View style={w.skip}>
        <Text onPress={finish} accessibilityRole="button" style={s.muted}>
          Skip
        </Text>
      </View>
      <Image
        source={assets.onboarding[page]}
        resizeMode="contain"
        style={{ width: '100%', height: illustrationHeight }}
      />
      <View style={s.fill} />
      <Text style={s.label}>{pages[page].tag}</Text>
      <Text style={[s.title, w.onboardTitle, compact && w.compactTitle]}>
        {pages[page].title}
      </Text>
      <Text style={s.muted}>{pages[page].body}</Text>
    </Screen>
  );
}
const w = StyleSheet.create({
  loaderCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 30,
  },
  brand: { fontSize: 32, fontWeight: '700', color: '#ebc267', marginTop: 46 },
  tagline: {
    fontSize: 14,
    lineHeight: 21,
    color: '#9a8d82',
    textAlign: 'center',
    marginTop: 16,
  },
  compactTitle: { fontSize: 26, lineHeight: 31 },
  compactBrand: { marginTop: 24, fontSize: 28 },
  compactLoaderBottom: { height: 100 },
  loaderBottom: { height: 150, alignItems: 'center' },
  webview: { backgroundColor: 'transparent', width: 180, height: 60, flex: 0 },
  preparing: { color: '#78766a', fontSize: 10, letterSpacing: 2 },
  skip: { alignItems: 'flex-end' },
  dot: { width: 5, height: 5, borderRadius: 4, backgroundColor: '#4b4648' },
  activeDot: { width: 25, backgroundColor: colors.gold },
  onboardTitle: { fontSize: 30, lineHeight: 35 },
});
