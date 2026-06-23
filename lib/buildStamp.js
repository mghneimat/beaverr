/** Injected at export time into dist/build-stamp.json — shown on error screens to verify deploy. */
export const BUILD_STAMP = process.env.EXPO_PUBLIC_BUILD_STAMP || 'dev';
