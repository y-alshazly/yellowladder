module.exports = function (api) {
  api.cache(true);

  if (
    process.env.NX_TASK_TARGET_TARGET === 'build' ||
    process.env.NX_TASK_TARGET_TARGET?.includes('storybook')
  ) {
    return {
      presets: [
        [
          '@nx/react/babel',
          {
            runtime: 'automatic',
          },
        ],
      ],
    };
  }

  return {
    presets: [['module:@react-native/babel-preset', { useTransformReactJSX: true }]],
    // Zod v4 (and other libs) use `export * as ns from '...'` namespace
    // re-exports. React Native's babel preset does not include the
    // transform plugin by default, so Metro's transformer throws when it
    // walks `node_modules/zod/v4/classic/external.js`. Enable it explicitly.
    //
    // `react-native-reanimated/plugin` MUST remain the LAST entry in this
    // array — Reanimated wraps worklets via a babel pass that must run
    // after every other babel plugin, including the namespace-from
    // transform above. Reordering this list will silently break every
    // `useAnimatedStyle` / `withTiming` call at runtime with an obscure
    // "Reanimated 2 failed to create a worklet" error.
    plugins: [
      '@babel/plugin-transform-export-namespace-from',
      'react-native-reanimated/plugin',
    ],
  };
};
