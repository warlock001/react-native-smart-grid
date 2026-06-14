import { memo, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useGridDrag } from '../context/GridDragContext';
import type { Tile } from '../types';
import type { PixelRect } from '../layout/LayoutCalculator';

const LIFT_SPRING = { damping: 15, stiffness: 300, mass: 0.4 };

type Props<TData> = {
  tile: Tile<TData>;
  initialRect: PixelRect;
  children: React.ReactNode;
};

function DragLayerInner<TData>({ tile: _tile, initialRect, children }: Props<TData>) {
  const { dragAbsX, dragAbsY, containerPageX, containerPageY, scrollYRef } = useGridDrag();

  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1.06, LIFT_SPRING);
    opacity.value = withSpring(1, LIFT_SPRING);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const animStyle = useAnimatedStyle(() => {
    const x = dragAbsX.value - containerPageX.current - initialRect.width / 2;
    const y =
      dragAbsY.value -
      containerPageY.current +
      scrollYRef.current -
      initialRect.height / 2;
    return {
      opacity: opacity.value,
      transform: [{ translateX: x }, { translateY: y }, { scale: scale.value }],
    };
  });

  return (
    <Animated.View
      style={[
        styles.layer,
        { width: initialRect.width, height: initialRect.height },
        animStyle,
      ]}
    >
      {children}
    </Animated.View>
  );
}

export const DragLayer = memo(DragLayerInner) as typeof DragLayerInner;

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
  },
});
