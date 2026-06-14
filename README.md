# react-native-smart-grid

A draggable, variable-sized tile grid for React Native. Think iOS home screen meets Pinterest meets Trello — with collision detection, auto-arrange, multi-select, and smooth spring animations.

> **Nothing like this exists in the RN ecosystem.** Every other grid library uses uniform tile sizes. This one doesn't.

| Drag & Drop | Multi-Select | Resize & Edit |
|:-----------:|:------------:|:-------------:|
| ![Drag and drop demo](https://github.com/warlock001/react-native-smart-grid/raw/main/docs/drag-drop.gif) | ![Multi-select demo](https://github.com/warlock001/react-native-smart-grid/raw/main/docs/multi-select.gif) | ![Resize demo](https://github.com/warlock001/react-native-smart-grid/raw/main/docs/resize.gif) |

## Features

- **Variable-sized tiles** — 1×1, 1×2, 2×2, 2×4, any grid unit combination
- **Drag to reorder** — long press to lift, pan to move, spring to land
- **Collision detection** — push or swap modes
- **Auto-arrange** — bin-packing algorithm, callable via ref
- **Gravity** — tiles compact upward or leftward after every drop
- **Resize handles** — drag the corner to resize any tile in edit mode
- **Multi-select** — long press enters selection mode; tap to add/remove tiles
- **Serialization** — save and restore layouts, storage-agnostic
- **Virtualized** — only renders tiles in the viewport, handles thousands of items
- **Haptic callbacks** — bring your own haptics library, zero dependencies added

---

## Installation

```sh
npm install react-native-smart-grid
# or
yarn add react-native-smart-grid
```

### Peer dependencies

```sh
npm install react-native-gesture-handler react-native-reanimated
```

> **Reanimated v4+:** Starting with `react-native-reanimated@4`, the worklets runtime ships as a separate package. If you get a build error about `react-native-worklets` not being found, install it too:
> ```sh
> npm install react-native-worklets
> ```

Follow the setup guides for each:
- [react-native-gesture-handler](https://docs.swmansion.com/react-native-gesture-handler/docs/fundamentals/installation)
- [react-native-reanimated](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started)

### Babel plugin

Add the Reanimated plugin to your `babel.config.js` — it **must be listed last**:

```js
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: ['react-native-reanimated/plugin'],
};
```

After adding it, restart Metro with a cleared cache:

```sh
npx react-native start --reset-cache
```

Wrap your app root (or at minimum the screen containing `SmartGrid`) with `GestureHandlerRootView`:

```tsx
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* your app */}
    </GestureHandlerRootView>
  );
}
```

---

## Quick start

```tsx
import { useState } from 'react';
import { Text, View } from 'react-native';
import { SmartGrid } from 'react-native-smart-grid';
import type { Tile, LayoutItem } from 'react-native-smart-grid';

type CardData = { label: string; color: string };

// Simplest form — no position, no size. Every tile defaults to 1×1 and
// is auto-placed in order using bin-packing.
const TILES: Tile<CardData>[] = [
  { id: '1', data: { label: 'Music',    color: '#6366f1' } },
  { id: '2', data: { label: 'Photos',   color: '#f59e0b' } },
  { id: '3', data: { label: 'Notes',    color: '#10b981' } },
  { id: '4', data: { label: 'Calendar', color: '#ef4444' } },
];

export default function App() {
  const [tiles, setTiles] = useState(TILES);

  function handleLayoutChange(layout: LayoutItem[]) {
    setTiles(prev =>
      prev.map(t => {
        const updated = layout.find(l => l.id === t.id);
        return updated ? { ...t, ...updated } : t;
      })
    );
  }

  return (
    <SmartGrid
      data={tiles}
      columns={4}
      rowHeight={100}
      gap={8}
      padding={12}
      onLayoutChange={handleLayoutChange}
      renderTile={({ item, isActive }) => (
        <View style={{
          flex: 1,
          backgroundColor: item.data.color,
          borderRadius: 12,
          opacity: isActive ? 0.4 : 1,
        }}>
          <Text style={{ color: '#fff', padding: 8 }}>{item.data.label}</Text>
        </View>
      )}
    />
  );
}
```

---

## Tile data model

`position` and `size` are both optional. SmartGrid auto-places any tile that is missing either.

```ts
// ── Option 1: explicit position + size ────────────────────────────────────────
// Full control. Use this when restoring a saved layout from storage/server.
const tiles: Tile<MyData>[] = [
  { id: '1', position: { x: 0, y: 0 }, size: { w: 2, h: 2 }, data: { label: 'Large' } },
  { id: '2', position: { x: 2, y: 0 }, size: { w: 2, h: 1 }, data: { label: 'Wide'  } },
  { id: '3', position: { x: 2, y: 1 }, size: { w: 1, h: 1 }, data: { label: 'Small' } },
];

// ── Option 2: size only, no position ──────────────────────────────────────────
// Grid auto-places each tile using bin-packing. Good when you know the sizes
// but don't care where tiles land initially.
const tiles: Tile<MyData>[] = [
  { id: '1', size: { w: 2, h: 2 }, data: { label: 'Large' } },
  { id: '2', size: { w: 2, h: 1 }, data: { label: 'Wide'  } },
  { id: '3', size: { w: 1, h: 1 }, data: { label: 'Small' } },
];

// ── Option 3: no position, no size ────────────────────────────────────────────
// Simplest form. Every tile defaults to 1×1 and is auto-placed in order.
const tiles: Tile<MyData>[] = [
  { id: '1', data: { label: 'Music'  } },
  { id: '2', data: { label: 'Photos' } },
  { id: '3', data: { label: 'Notes'  } },
];
```

---

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `data` | `Tile<TData>[]` | **required** | Array of tiles. `position` and `size` are optional. |
| `renderTile` | `(info: RenderTileInfo) => ReactNode` | **required** | Render function for each tile. |
| `columns` | `number` | `4` | Number of grid columns. |
| `rowHeight` | `number` | `100` | Height of one grid row in pixels. |
| `gap` | `number` | `8` | Gap between tiles in pixels. |
| `padding` | `number` | `8` | Outer padding of the grid in pixels. |
| `collisionBehavior` | `'push' \| 'swap'` | `'push'` | How dropped tiles interact with others at the target position. |
| `gravity` | `'none' \| 'up' \| 'left'` | `'none'` | Compact tiles toward origin after each drop. |
| `isEditing` | `boolean` | `false` | Show resize handle on each tile's bottom-right corner. |
| `draggable` | `boolean` | `true` | Master switch — `false` disables drag on all tiles. |
| `selectable` | `boolean` | `true` | Master switch — `false` disables selection on all tiles. |
| `multiSelect` | `boolean` | `true` | `false` switches to single-select (new selection replaces old). |
| `onLayoutChange` | `(layout: LayoutItem[]) => void` | — | Fired after every drag, drop, or resize. Merge into your state. |
| `onTilePress` | `(tile: Tile) => void` | — | Quick tap (no drag). Open detail views, folders, etc. |
| `onTileDragStart` | `(tile: Tile) => void` | — | Fired when the 300ms long-press activates drag. |
| `onTileDrop` | `(tile, position) => void` | — | Fired when a tile lands at a new position. |
| `onTileResize` | `(tile, newSize) => void` | — | Fired when a tile is resized via the handle. |
| `onSelectionChange` | `(ids: string[]) => void` | — | Fired whenever the selection array changes. |
| `onHaptic` | `(event: HapticEvent) => void` | — | Fired at pick-up, snap, drop, and resize moments. |

---

## Ref API

```tsx
import { useRef } from 'react';
import type { SmartGridRef } from 'react-native-smart-grid';

const gridRef = useRef<SmartGridRef>(null);

<SmartGrid ref={gridRef} ... />
```

| Method | Description |
|---|---|
| `autoArrange()` | Re-packs all tiles using bin-packing (largest first). Fires `onLayoutChange`. |
| `serializeLayout()` | Returns `LayoutItem[]` — save anywhere, no `data` field included. |
| `restoreLayout(layout)` | Restores a previously serialized layout. Fires `onLayoutChange`. |
| `clearSelection()` | Clears the selection array. Fires `onSelectionChange`. |
| `setSelection(ids)` | Programmatically sets the selection. Fires `onSelectionChange`. |

---

## Usage examples

### Drag & drop

Long press any tile to lift it, drag to a new position, and release to drop. Other tiles animate out of the way automatically.

![Drag and drop](https://github.com/warlock001/react-native-smart-grid/raw/main/docs/drag-drop.gif)

---

### Collision behavior

`'push'` displaces tiles to the next free slot. `'swap'` exchanges the dragged tile with the one at the drop center.

```tsx
// Default — displaced tiles cascade to the next available space
<SmartGrid collisionBehavior="push" ... />

// Drop center tile and dragged tile switch places, others untouched
<SmartGrid collisionBehavior="swap" ... />
```

---

### Gravity

Automatically compacts the layout after every drop.

```tsx
// No compaction — tiles stay exactly where dropped
<SmartGrid gravity="none" ... />

// Tiles slide upward to fill empty rows
<SmartGrid gravity="up" ... />

// Tiles slide leftward to fill empty columns
<SmartGrid gravity="left" ... />
```

---

### Edit mode and resize

![Resize demo](https://github.com/warlock001/react-native-smart-grid/raw/main/docs/resize.gif)


```tsx
const [isEditing, setIsEditing] = useState(false);

<Button title={isEditing ? 'Done' : 'Edit'} onPress={() => setIsEditing(e => !e)} />

<SmartGrid
  isEditing={isEditing}
  onTileResize={(tile, newSize) => {
    console.log(`${tile.id} resized to ${newSize.w}×${newSize.h}`);
  }}
  onLayoutChange={handleLayoutChange}
  ...
/>
```

Use `locked` on a tile to hide its resize handle while still allowing drag:

```ts
{ id: 'header', size: { w: 4, h: 1 }, data: { label: 'Header' }, locked: true }
```

---

### Tap to open

```tsx
<SmartGrid
  onTilePress={(tile) => {
    navigation.navigate('Detail', { id: tile.id, data: tile.data });
  }}
  renderTile={({ item }) => (
    <View style={styles.card}>
      <Text>{item.data.label}</Text>
    </View>
  )}
  ...
/>
```

`onTilePress` fires on a quick tap (< 200ms). It is suppressed while a selection is active — tapping a tile in selection mode toggles it instead.

---

### Selection — multi-select (default)

![Multi-select demo](https://github.com/warlock001/react-native-smart-grid/raw/main/docs/multi-select.gif)


Long press a tile to enter selection mode. While selected, tapping any tile adds or removes it. A real drag-and-drop clears the selection.

```tsx
const [selectedIds, setSelectedIds] = useState<string[]>([]);
const gridRef = useRef<SmartGridRef>(null);

<SmartGrid
  ref={gridRef}
  onSelectionChange={(ids) => setSelectedIds(ids)}
  renderTile={({ item, isSelected }) => (
    <View style={[styles.card, isSelected && styles.cardSelected]}>
      <Text>{item.data.label}</Text>
      {isSelected && (
        <TouchableOpacity onPress={() => deleteTile(item.id)}>
          <Text>✕ Delete</Text>
        </TouchableOpacity>
      )}
    </View>
  )}
  ...
/>

{selectedIds.length > 0 && (
  <Button
    title={`Delete ${selectedIds.length} tiles`}
    onPress={() => {
      setTiles(prev => prev.filter(t => !selectedIds.includes(t.id)));
      gridRef.current?.clearSelection();
    }}
  />
)}
```

---

### Selection — single-select

```tsx
const [activeId, setActiveId] = useState<string | null>(null);

<SmartGrid
  multiSelect={false}
  onSelectionChange={([id]) => setActiveId(id ?? null)}
  renderTile={({ item, isSelected }) => (
    <View style={[styles.card, isSelected && styles.cardActive]}>
      <Text>{item.data.label}</Text>
    </View>
  )}
  ...
/>
```

---

### Programmatic selection

```tsx
const gridRef = useRef<SmartGridRef>(null);

// Select specific tiles
gridRef.current?.setSelection(['tile-1', 'tile-3']);

// Clear all
gridRef.current?.clearSelection();
```

---

### Disable drag, keep selection

When `draggable={false}`, tiles can still be long-pressed to enter selection. Selection fires **immediately** at the long-press threshold (300ms) rather than on release — identical to how the iOS Photos app behaves.

```tsx
<SmartGrid
  draggable={false}       // tiles stay in place
  onSelectionChange={(ids) => console.log('selected:', ids)}
  renderTile={({ item, isSelected }) => (
    <View style={[styles.card, isSelected && styles.cardSelected]}>
      <Text>{item.data.label}</Text>
    </View>
  )}
  ...
/>
```

---

### Grid-level switches

Master switches that override all per-tile flags.

```tsx
// View-only — nothing moves, nothing selects
<SmartGrid draggable={false} selectable={false} ... />

// Locked layout — tiles visible, no interaction
<SmartGrid draggable={false} selectable={false} ... />

// Selection off — long press does nothing, onTilePress still fires on tap
<SmartGrid selectable={false} onTilePress={openDetail} ... />
```

---

### Per-tile draggable / selectable

Fine-grained control on individual tiles. Grid-level switches take priority when set to `false`.

```tsx
const tiles: Tile<MyData>[] = [
  // Normal tile — draggable and selectable
  { id: '1', data: { label: 'Drag me' } },

  // Pinned tile — stays in place, cannot be dragged
  { id: '2', data: { label: 'Pinned' }, draggable: false },

  // Info tile — long press fires onTilePress instead of entering selection
  { id: '3', data: { label: 'Info' }, selectable: false },

  // Fully locked — no drag, no resize
  { id: '4', data: { label: 'Header' }, locked: true },
];
```

---

### Auto-arrange

```tsx
const gridRef = useRef<SmartGridRef>(null);

<Button
  title="Auto-arrange"
  onPress={() => gridRef.current?.autoArrange()}
/>

<SmartGrid ref={gridRef} onLayoutChange={handleLayoutChange} ... />
```

`autoArrange()` re-packs all tiles using a largest-first bin-packing algorithm and fires `onLayoutChange` with the new positions.

---

### Saving and restoring layouts

`serializeLayout` returns a plain array of `{ id, position, size }` — no `data` field. Save it anywhere.

```tsx
const gridRef = useRef<SmartGridRef>(null);

// Save to your backend or AsyncStorage
async function save() {
  const layout = gridRef.current?.serializeLayout();
  await AsyncStorage.setItem('grid-layout', JSON.stringify(layout));
}

// Restore on next launch
async function restore() {
  const raw = await AsyncStorage.getItem('grid-layout');
  if (raw) gridRef.current?.restoreLayout(JSON.parse(raw));
}
```

When restoring, pass the saved layout back through your `data` state before mounting the grid:

```tsx
// Merge saved geometry back into your tile objects on startup
const saved = await AsyncStorage.getItem('grid-layout');
const savedLayout: LayoutItem[] = saved ? JSON.parse(saved) : [];

const initialTiles = MY_TILES.map(t => {
  const saved = savedLayout.find(l => l.id === t.id);
  return saved ? { ...t, position: saved.position, size: saved.size } : t;
});
```

---

### Haptics

The library fires `onHaptic` at the right moments but has no opinion on which haptics library you use.

```tsx
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

<SmartGrid
  onHaptic={(event) => {
    if (event === 'pick-up') ReactNativeHapticFeedback.trigger('impactMedium');
    if (event === 'snap')    ReactNativeHapticFeedback.trigger('selection');
    if (event === 'drop')    ReactNativeHapticFeedback.trigger('notificationSuccess');
    if (event === 'resize')  ReactNativeHapticFeedback.trigger('impactLight');
  }}
  ...
/>
```

| Event | When |
|---|---|
| `'pick-up'` | Long press activates (drag starts or tile selected) |
| `'snap'` | Ghost tile snaps to a new grid position mid-drag |
| `'drop'` | Tile is released |
| `'resize'` | Tile resize is committed |

---

### Size constraints

Limit how small or large a tile can be resized (only enforced when `isEditing={true}`).

```tsx
const tiles: Tile<MyData>[] = [
  {
    id: '1',
    size: { w: 2, h: 2 },
    minSize: { w: 1, h: 1 },   // can shrink to 1×1
    maxSize: { w: 4, h: 4 },   // can grow up to 4×4
    data: { label: 'Resizable' },
  },
  {
    id: '2',
    size: { w: 2, h: 1 },
    locked: true,               // resize handle hidden entirely
    data: { label: 'Fixed' },
  },
];
```

---

## Types

```ts
type Tile<TData = unknown> = {
  id: string;                  // unique, stable across re-renders
  position?: TilePosition;     // { x, y } — omit to auto-place
  size?: TileSize;             // { w, h } in grid units — omit to default 1×1
  data: TData;                 // your custom data, passed back to renderTile
  locked?: boolean;            // hides resize handle, prevents resize
  minSize?: TileSize;          // smallest allowed size (isEditing only)
  maxSize?: TileSize;          // largest allowed size (isEditing only)
  draggable?: boolean;         // false = tile cannot be dragged (default: true)
  selectable?: boolean;        // false = long press fires onTilePress (default: true)
};

type TileSize     = { w: number; h: number };   // grid units
type TilePosition = { x: number; y: number };   // column / row index, 0-based

type LayoutItem = {
  id: string;
  position: TilePosition;
  size: TileSize;
};

type RenderTileInfo<TData> = {
  item: Tile<TData>;   // the tile being rendered
  isActive: boolean;   // true while this tile is being dragged (shows placeholder)
  isSelected: boolean; // true when this tile is in the selection array
};

type SmartGridRef = {
  autoArrange: () => void;
  serializeLayout: () => LayoutItem[];
  restoreLayout: (layout: LayoutItem[]) => void;
  clearSelection: () => void;
  setSelection: (ids: string[]) => void;
};

type CollisionBehavior = 'push' | 'swap';
type Gravity         = 'none' | 'up' | 'left';
type HapticEvent     = 'pick-up' | 'snap' | 'drop' | 'resize';
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT
