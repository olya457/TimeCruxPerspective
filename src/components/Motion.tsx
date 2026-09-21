import React, {
  Children,
  Fragment,
  isValidElement,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native';
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then(value => {
        if (active) {
          setReduced(value);
        }
      })
      .catch(() => {});
    const listener = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduced,
    );
    return () => {
      active = false;
      listener.remove();
    };
  }, []);
  return reduced;
}
export function flattenContent(children: React.ReactNode): React.ReactNode[] {
  return Children.toArray(children).flatMap(child =>
    isValidElement<{ children?: React.ReactNode }>(child) &&
    child.type === Fragment
      ? flattenContent(child.props.children)
      : [child],
  );
}
export function Motion({
  children,
  index = 0,
  replayKey = 0,
  reduced = false,
  direction = 'up',
  style,
}: React.PropsWithChildren<{
  index?: number;
  replayKey?: string | number;
  reduced?: boolean;
  direction?: 'up' | 'down' | 'left' | 'right';
  style?: StyleProp<ViewStyle>;
}>) {
  const opacity = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  const movement = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  useEffect(() => {
    if (reduced) {
      opacity.setValue(1);
      movement.setValue(1);
      return;
    }
    opacity.setValue(0);
    movement.setValue(0);
    const animation = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 360,
        delay: Math.min(index, 7) * 45,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
        isInteraction: false,
      }),
      Animated.spring(movement, {
        toValue: 1,
        delay: Math.min(index, 7) * 45,
        damping: 19,
        stiffness: 160,
        mass: 0.85,
        useNativeDriver: true,
        isInteraction: false,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [index, replayKey, reduced, opacity, movement]);
  const horizontal = direction === 'left' || direction === 'right';
  const offset = direction === 'down' || direction === 'right' ? -24 : 24;
  const translate = movement.interpolate({
    inputRange: [0, 1],
    outputRange: [offset, 0],
  });
  return (
    <Animated.View
      style={[
        m.container,
        style,
        {
          opacity,
          transform: [
            horizontal ? { translateX: translate } : { translateY: translate },
            {
              scale: movement.interpolate({
                inputRange: [0, 1],
                outputRange: [0.985, 1],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
export function AnimatedContent({
  children,
  replayKey,
  reduced,
}: {
  children: React.ReactNode;
  replayKey: string;
  reduced: boolean;
}) {
  return (
    <>
      {flattenContent(children).map((child, index) => {
        const element = isValidElement<{ style?: StyleProp<ViewStyle> }>(child)
          ? child
          : null;
        const layout = StyleSheet.flatten(element?.props.style);
        return (
          <Motion
            key={`${element?.key ?? 'item'}-${index}`}
            index={index}
            replayKey={replayKey}
            reduced={reduced}
            direction={index === 0 ? 'down' : index % 3 === 1 ? 'right' : 'up'}
            style={layout?.flex ? { flex: layout.flex } : undefined}
          >
            {child}
          </Motion>
        );
      })}
    </>
  );
}
const m = StyleSheet.create({ container: { minWidth: 0 } });
