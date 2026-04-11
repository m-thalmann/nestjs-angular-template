export function createMatchMediaMock(matches: boolean): {
  mediaQueryList: MediaQueryList;
  getListener: () => ((event: { matches: boolean }) => void) | null;
} {
  let listener: ((event: { matches: boolean }) => void) | null = null;

  const mediaQueryList: MediaQueryList = {
    matches,
    // @ts-expect-error type mismatch
    addEventListener: jest.fn((event: string, handler: (event: { matches: boolean }) => void) => {
      if (event !== 'change') {
        throw new Error(`Unexpected event type: ${event}`);
      }

      listener = handler;
    }),
    removeEventListener: jest.fn(),
  };
  window.matchMedia = jest.fn().mockReturnValue(mediaQueryList);

  return { mediaQueryList, getListener: () => listener };
}
