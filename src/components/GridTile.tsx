import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import type { PixelRect } from '../layout/LayoutCalculator';

type Props = {
  rect: PixelRect;
  children: React.ReactNode;
};

export const GridTile = memo(function GridTile({ rect, children }: Props) {
  return (
    <View
      style={[
        styles.tile,
        { left: rect.x, top: rect.y, width: rect.width, height: rect.height },
      ]}
    >
      {children}
    </View>
  );
});

const styles = StyleSheet.create({
  tile: {
    position: 'absolute',
  },
});
