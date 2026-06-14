const { View } = require('react-native');

const useSharedValue = (init) => ({ value: init });
const useAnimatedStyle = (fn) => fn();
const withSpring = (v) => v;
const withTiming = (v) => v;
const runOnJS = (fn) => fn;
const useAnimatedRef = () => ({ current: null });
const useAnimatedScrollHandler = () => () => {};
const interpolate = (v, _i, _o) => v;
const Extrapolation = { CLAMP: 'clamp' };

const Animated = {
  View,
  ScrollView: View,
  createAnimatedComponent: (c) => c,
};

module.exports = {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  useAnimatedRef,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolation,
  Animated,
  default: Animated,
};
