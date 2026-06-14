import { Gesture } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import type { PlacedTile, GridConfig } from '../types';
import type { PixelRect } from '../layout/LayoutCalculator';
import { useGridDrag } from '../context/GridDragContext';
import { pixelToGrid } from '../utils/pixelToGrid';

type Options = {
  tile: PlacedTile;
  rect: PixelRect;
  config: GridConfig;
  containerWidth: number;
};

export function useTileGesture({ tile, rect, config, containerWidth }: Options) {
  const drag = useGridDrag();

  const canDrag = drag.draggable && tile.draggable !== false;
  const canSelect = drag.selectable && tile.selectable !== false;

  function onDragStart() {
    drag.startDrag(tile, rect);
  }

  function onDragMove(absX: number, absY: number) {
    const pos = pixelToGrid(
      absX,
      absY,
      drag.containerPageX.current,
      drag.containerPageY.current,
      drag.scrollYRef.current,
      config,
      tile.size,
      containerWidth
    );
    drag.updateGhost(pos);
  }

  function onDragEnd() {
    drag.endDrag(drag.ghostPosition ?? tile.position);
  }

  function onLongPressSelect() {
    drag.selectTile(tile);
  }

  function onPress() {
    drag.onTilePress(tile);
  }

  const tap = Gesture.Tap()
    .maxDuration(200) // must complete before the 300ms long-press activates drag
    .onEnd(() => {
      runOnJS(onPress)();
    });

  const pan = Gesture.Pan()
    .enabled(canDrag || canSelect)
    .activateAfterLongPress(300)
    .onStart(() => {
      if (canDrag) {
        runOnJS(onDragStart)();
      } else {
        // draggable=false: select immediately on long-press activation, not on release
        runOnJS(onLongPressSelect)();
      }
    })
    .onUpdate((e) => {
      if (!canDrag) return;
      drag.dragAbsX.value = e.absoluteX;
      drag.dragAbsY.value = e.absoluteY;
      runOnJS(onDragMove)(e.absoluteX, e.absoluteY);
    })
    .onEnd(() => {
      if (canDrag) {
        runOnJS(onDragEnd)();
      }
    })
    .onFinalize(() => {
      if (canDrag && drag.isDragging.value) {
        runOnJS(onDragEnd)();
      }
    });

  const gesture = Gesture.Simultaneous(pan, tap);

  return { gesture };
}
