/**
 * Turn off user zoom so the app behaves like a native one.
 *
 * The viewport meta tag handles this in standalone mode, but iOS Safari
 * ignores `user-scalable=no` when the page is opened as an ordinary tab, so
 * pinch gestures still need blocking directly. `touch-action: manipulation`
 * in the global stylesheet covers double-tap.
 *
 * This only disables *page* zoom. The operating system's own accessibility
 * zoom and text-size settings are unaffected.
 */
export function disableZoom(): void {
  // Non-standard, WebKit only; other engines simply never fire these.
  const block = (event: Event): void => event.preventDefault();

  document.addEventListener('gesturestart', block, { passive: false });
  document.addEventListener('gesturechange', block, { passive: false });
  document.addEventListener('gestureend', block, { passive: false });

  // Safari also zooms on a double tap even with touch-action set, when the
  // two taps land close together in time.
  let lastTouchEnd = 0;
  document.addEventListener(
    'touchend',
    (event) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) event.preventDefault();
      lastTouchEnd = now;
    },
    { passive: false },
  );
}
