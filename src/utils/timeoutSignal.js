// Cross-environment helper to create an AbortSignal with a timeout.
// Falls back to AbortController if AbortSignal.timeout is not available.

export const createTimeoutSignal = (ms) => {
  try {
    if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
      return AbortSignal.timeout(ms);
    }
  } catch (e) {
    // Ignore and fall back to manual controller
  }

  if (typeof AbortController !== 'undefined') {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, ms);

    // Clean up timeout when aborted
    controller.signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timeoutId);
      },
      { once: true }
    );

    return controller.signal;
  }

  // As a last resort, return undefined (no timeout signal)
  return undefined;
};


