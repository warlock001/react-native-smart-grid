import { useRef, useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { SmartGrid } from 'react-native-smart-grid';
import type { LayoutItem, SmartGridRef, Tile } from 'react-native-smart-grid';

/** Your tile's custom data shape. Can be anything — SmartGrid is generic. */
type CardData = { label: string; color: string };

// ─── Option 1: explicit position + size ───────────────────────────────────────
// Full control. Use this when restoring a saved layout from storage/server.
//
const INITIAL_TILES: Tile<CardData>[] = [
  {
    id: '1',
    position: { x: 0, y: 0 },
    size: { w: 2, h: 2 },
    data: { label: '🎵 Music', color: '#6366f1' },
  },
  {
    id: '2',
    position: { x: 2, y: 0 },
    size: { w: 2, h: 1 },
    data: { label: '📸 Photos', color: '#f59e0b' },
  },
  {
    id: '3',
    position: { x: 2, y: 1 },
    size: { w: 1, h: 1 },
    data: { label: '📝 Notes', color: '#10b981' },
  },
  {
    id: '4',
    position: { x: 3, y: 1 },
    size: { w: 1, h: 1 },
    data: { label: '✅ Tasks', color: '#ef4444' },
  },
  {
    id: '5',
    position: { x: 0, y: 2 },
    size: { w: 1, h: 1 },
    data: { label: '🗺️ Maps', color: '#8b5cf6' },
  },
  {
    id: '6',
    position: { x: 1, y: 2 },
    size: { w: 1, h: 1 },
    data: { label: '📰 News', color: '#ec4899' },
  },
  {
    id: '7',
    position: { x: 2, y: 2 },
    size: { w: 2, h: 1 },
    data: { label: '🌤️ Weather', color: '#14b8a6' },
  },
  {
    id: '8',
    position: { x: 0, y: 3 },
    size: { w: 4, h: 1 },
    data: { label: '📅 Calendar', color: '#f97316' },
  },
  {
    id: '9',
    position: { x: 0, y: 4 },
    size: { w: 1, h: 2 },
    data: { label: '💬 Chat', color: '#0ea5e9' },
  },
  {
    id: '10',
    position: { x: 1, y: 4 },
    size: { w: 2, h: 1 },
    data: { label: '🎬 Videos', color: '#d946ef' },
  },
  {
    id: '11',
    position: { x: 3, y: 4 },
    size: { w: 1, h: 1 },
    data: { label: '🔔 Alerts', color: '#f43f5e' },
  },
  {
    id: '12',
    position: { x: 1, y: 5 },
    size: { w: 1, h: 1 },
    data: { label: '⚙️ Settings', color: '#64748b' },
  },
  {
    id: '13',
    position: { x: 2, y: 5 },
    size: { w: 2, h: 1 },
    data: { label: '🛒 Shop', color: '#84cc16' },
  },
];

// ─── Option 2: size only, no position ─────────────────────────────────────────
// Grid auto-places each tile using bin-packing. Good when you know the sizes
// but don't care where tiles land initially.
//
// const INITIAL_TILES: Tile<CardData>[] = [
//   { id: '1', size: { w: 2, h: 2 }, data: { label: 'Music',    color: '#6366f1' } },
//   { id: '2', size: { w: 2, h: 1 }, data: { label: 'Photos',   color: '#f59e0b' } },
//   { id: '3', size: { w: 1, h: 1 }, data: { label: 'Notes',    color: '#10b981' } },
// ];

// ─── Option 3: no position, no size ───────────────────────────────────────────
// Simplest form. Every tile defaults to 1×1 and is auto-placed in order.
// const INITIAL_TILES: Tile<CardData>[] = [
//   { id: '1', data: { label: 'Music', color: '#6366f1' } },
//   { id: '2', data: { label: 'Photos', color: '#f59e0b' } },
//   { id: '3', data: { label: 'Notes', color: '#10b981' } },
//   { id: '4', data: { label: 'Tasks', color: '#ef4444' } },
//   { id: '5', data: { label: 'Maps', color: '#8b5cf6' } },
//   { id: '6', data: { label: 'News', color: '#ec4899' } },
//   { id: '7', data: { label: 'Weather', color: '#14b8a6' } },
//   { id: '8', data: { label: 'Calendar', color: '#f97316' } },
// ];

export default function App() {
  const [tiles, setTiles] = useState(INITIAL_TILES);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  /**
   * Ref gives imperative access to:
   *   gridRef.current.autoArrange()          — re-pack with bin-packing
   *   gridRef.current.serializeLayout()      — returns LayoutItem[] to save
   *   gridRef.current.restoreLayout(layout)  — restores a saved LayoutItem[]
   */
  const gridRef = useRef<SmartGridRef>(null);

  /**
   * Called after every drag, drop, or resize with the new positions/sizes.
   * Merge the updated geometry back into your tile state so the grid stays
   * in sync. The `data` field is never touched — only position and size change.
   */
  function handleLayoutChange(newLayout: LayoutItem[]) {
    console.log('handleLayoutChange', newLayout);
    setTiles((prev) =>
      prev.map((t) => {
        const updated = newLayout.find((l) => l.id === t.id);
        return updated
          ? { ...t, position: updated.position, size: updated.size }
          : t;
      })
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.toolbar}>
            {/* Calls autoArrange() on the ref — re-packs all tiles largest-first */}
            <Button
              title="Auto-arrange"
              onPress={() => gridRef.current?.autoArrange()}
            />
            {/* isEditing=true shows a resize handle on each tile's bottom-right corner */}
            <Button
              title={isEditing ? 'Done' : 'Edit'}
              onPress={() => setIsEditing((e) => !e)}
            />
            {selectedIds.length > 0 && (
              <Button
                title={`Clear (${selectedIds.length})`}
                onPress={() => gridRef.current?.clearSelection()}
              />
            )}
          </View>

          <SmartGrid
            ref={gridRef}
            selectable={true} // enable long-press to select tiles
            multiSelect={true} // long-press to select multiple tiles
            draggable={true} // enable drag-and-drop
            data={tiles}
            onTilePress={(tile) =>
              console.log('Tile pressed:', tile.id, tile.data)
            }
            columns={4} // number of grid columns
            rowHeight={90} // height of one row in px
            gap={8} // gap between tiles in px
            padding={12} // outer padding in px
            collisionBehavior="push" // 'push' | 'swap'
            gravity="up" // 'none' | 'up' | 'left' — compacts after each drop
            isEditing={isEditing}
            onLayoutChange={handleLayoutChange}
            /**
             * onSelectionChange fires whenever the selected tile IDs change.
             * Long press + release toggles the tile in the array.
             * A real drop clears the array. Use gridRef.current.clearSelection() to reset.
             */
            onSelectionChange={(ids) => {
              console.log('Selection changed:', ids);
              setSelectedIds(ids);
            }}
            /**
             * renderTile receives { item, isActive, isSelected }.
             * isSelected is true when this tile is in the selection array.
             */
            renderTile={({ item, isActive, isSelected }) => (
              <View
                style={[
                  styles.card,
                  { backgroundColor: item.data.color },
                  isActive && styles.cardActive,
                  isSelected && styles.cardSelected,
                ]}
              >
                <Text style={styles.label}>{item.data.label}</Text>
                {isSelected && <Text style={styles.deleteHint}>✕ Delete</Text>}
              </View>
            )}
          />
        </SafeAreaView>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0f0f0f' },
  safeArea: { flex: 1 },
  toolbar: {
    padding: 8,
    backgroundColor: '#1a1a1a',
    flexDirection: 'row',
    gap: 8,
  },
  card: {
    flex: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardActive: { transform: [{ scale: 1.03 }] },
  cardSelected: { borderWidth: 2, borderColor: '#fff' },
  label: { color: '#fff', fontWeight: '700', fontSize: 16 },
  deleteHint: { color: '#fff', fontSize: 11, opacity: 0.8, marginTop: 4 },
});
