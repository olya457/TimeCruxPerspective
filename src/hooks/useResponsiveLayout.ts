import { useWindowDimensions } from 'react-native';
export function getResponsiveLayout(
  width: number,
  height: number,
  fontScale: number,
) {
  const compact = width < 375 || height < 700;
  const narrow = width < 360 || fontScale > 1.25;
  const horizontalPadding = width < 360 ? 14 : compact ? 16 : 20;
  return {
    width,
    height,
    fontScale,
    compact,
    narrow,
    horizontalPadding,
    gap: compact ? 12 : 16,
    contentWidth: Math.min(width, 640) - horizontalPadding * 2,
    illustrationHeight: Math.min(390, height * (compact ? 0.34 : 0.46)),
    titleSize: width < 360 ? 25 : 28,
  };
}
export function useResponsiveLayout() {
  const { width, height, fontScale } = useWindowDimensions();
  return getResponsiveLayout(width, height, fontScale);
}
