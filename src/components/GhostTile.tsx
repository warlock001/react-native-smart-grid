import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import type { PlacedTile, GridConfig } from '../types';
import { tileToPixelRect } from '../layout/LayoutCalculator';
import { useGridDrag } from '../context/GridDragContext';

type Props = {
  activeTile: PlacedTile;
  config: GridConfig;
  containerWidth: number;
};

export const GhostTile = memo(function GhostTile({
  activeTile,
  config,
  containerWidth,
}: Props) {
  const { ghostPosition } = useGridDrag();
  if (!ghostPosition) return null;

  const rect = tileToPixelRect(ghostPosition, activeTile.size, config, containerWidth);

  return (
    <View
      style={[
        styles.ghost,
        { left: rect.x, top: rect.y, width: rect.width, height: rect.height },
      ]}
    />
  );
});

const styles = StyleSheet.create({
  ghost: {
    position: 'absolute',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
});
