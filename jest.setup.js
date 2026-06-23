// Jest setup file — global mocks for unit tests

// Mock expo-router
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
};

jest.mock('expo-router', () => ({
  router: mockRouter,
  useRouter: () => mockRouter,
  useSegments: () => [],
  usePathname: () => '/(onboarding)/welcome',
  useLocalSearchParams: () => ({}),
  useFocusEffect: (callback) => {
    const cleanup = callback();
    return cleanup;
  },
  Stack: {
    Screen: 'Stack.Screen',
  },
  Tabs: {
    Screen: 'Tabs.Screen',
  },
}));
