import React, { memo, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useGridDrag } from '../context/GridDragContext';
import { useTileGesture } from '../hooks/useTileGesture';
import { ResizeHandle } from './ResizeHandle';
import type { PlacedTile, GridConfig } from '../types';
import type { PixelRect } from '../layout/LayoutCalculator';

const SPRING = { damping: 20, stiffness: 220, mass: 0.5 };

type Props<TData> = {
  tile: PlacedTile<TData>;
  rect: PixelRect;
  config: GridConfig;
  containerWidth: number;
  children: React.ReactNode;
};

function DraggableTileInner<TData>({
  tile,
  rect,
  config,
  containerWidth,
  children,
}: Props<TData>) {
  const { activeTile, isEditing } = useGridDrag();
  const { gesture } = useTileGesture({ tile, rect, config, containerWidth });
  const isActive = activeTile?.id === tile.id;

  const animX = useSharedValue(rect.x);
  const animY = useSharedValue(rect.y);
  const animW = useSharedValue(rect.width);
  const animH = useSharedValue(rect.height);

  useEffect(() => {
    animX.value = withSpring(rect.x, SPRING);
    animY.value = withSpring(rect.y, SPRING);
    animW.value = withSpring(rect.width, SPRING);
    animH.value = withSpring(rect.height, SPRING);
  }, [rect.x, rect.y, rect.width, rect.height]); // eslint-disable-line react-hooks/exhaustive-deps

  const animStyle = useAnimatedStyle(() => ({
    left: animX.value,
    top: animY.value,
    width: animW.value,
    height: animH.value,
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          styles.tile,
          animStyle,
          isActive && styles.tileActive,
          isEditing && styles.tileEditing,
        ]}
      >
        {children}
        {isEditing && !tile.locked && (
          <ResizeHandle tile={tile} config={config} containerWidth={containerWidth} />
        )}
      </Animated.View>
    </GestureDetector>
  );
}

export const DraggableTile = memo(DraggableTileInner) as typeof DraggableTileInner;

const styles = StyleSheet.create({
  tile: {
    position: 'absolute',
  },
  tileActive: {
    opacity: 0.3,
  },
  tileEditing: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 12,
  },
});
