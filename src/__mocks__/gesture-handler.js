const { View } = require('react-native');

const GestureDetector = ({ children }) => children;
GestureDetector.displayName = 'GestureDetector';

const GestureHandlerRootView = View;

const noop = () => ({
  onStart: () => noop(),
  onUpdate: () => noop(),
  onEnd: () => noop(),
  onFinalize: () => noop(),
  onBegin: () => noop(),
  minDuration: () => noop(),
  activateAfterLongPress: () => noop(),
  simultaneousWithExternalGesture: () => noop(),
  enabled: () => noop(),
  runOnJS: () => noop(),
});

const Gesture = {
  Pan: noop,
  LongPress: noop,
  Tap: noop,
  Simultaneous: (..._gs) => noop(),
  Race: (..._gs) => noop(),
  Exclusive: (..._gs) => noop(),
};

module.exports = {
  GestureDetector,
  GestureHandlerRootView,
  Gesture,
};
