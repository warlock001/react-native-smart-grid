import { useRef } from 'react';
import { StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, runOnJS } from 'react-native-reanimated';
import type { PlacedTile, TileSize, GridConfig } from '../types';
import { columnWidth } from '../layout/LayoutCalculator';
import { useGridDrag } from '../context/GridDragContext';

type Props = {
  tile: PlacedTile;
  config: GridConfig;
  containerWidth: number;
};

export function ResizeHandle({ tile, config, containerWidth }: Props) {
  const { commitResize } = useGridDrag();
  const initSize = useRef<TileSize>(tile.size);
  const deltaW = useSharedValue(0);
  const deltaH = useSharedValue(0);

  const colW = columnWidth(config, containerWidth);

  function onCommit(w: number, h: number) {
    const minW = tile.minSize?.w ?? 1;
    const minH = tile.minSize?.h ?? 1;
    const maxW = tile.maxSize?.w ?? config.columns;
    const maxH = tile.maxSize?.h ?? 99;
    const newSize: TileSize = {
      w: Math.max(minW, Math.min(maxW, w)),
      h: Math.max(minH, Math.min(maxH, h)),
    };
    commitResize(tile, newSize);
  }

  const gesture = Gesture.Pan()
    .onBegin(() => {
      initSize.current = tile.size;
      deltaW.value = 0;
      deltaH.value = 0;
    })
    .onUpdate((e) => {
      deltaW.value = Math.round(e.translationX / (colW + config.gap));
      deltaH.value = Math.round(e.translationY / (config.rowHeight + config.gap));
    })
    .onEnd(() => {
      const newW = initSize.current.w + deltaW.value;
      const newH = initSize.current.h + deltaH.value;
      deltaW.value = 0;
      deltaH.value = 0;
      runOnJS(onCommit)(newW, newH);
    });

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: deltaW.value * (colW + config.gap) }, { translateY: deltaH.value * (config.rowHeight + config.gap) }],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.handle, animStyle]} />
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  handle: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
});
