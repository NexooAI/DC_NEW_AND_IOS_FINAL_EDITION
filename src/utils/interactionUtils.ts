/**
 * Safely executes tasks after UI animations and interactions settle.
 * Recommended replacement for deprecated React Native InteractionManager.runAfterInteractions.
 */
export const runAfterInteractions = (callback: () => void): (() => void) => {
  if (typeof (global as any).requestIdleCallback !== "undefined") {
    const handle = (global as any).requestIdleCallback(callback, { timeout: 150 });
    return () => {
      if (typeof (global as any).cancelIdleCallback !== "undefined") {
        (global as any).cancelIdleCallback(handle);
      }
    };
  }

  const animFrame = requestAnimationFrame(() => {
    callback();
  });
  return () => cancelAnimationFrame(animFrame);
};

export default {
  runAfterInteractions,
};
