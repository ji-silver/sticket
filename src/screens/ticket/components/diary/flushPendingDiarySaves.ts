export async function flushPendingDiarySaves<T extends { version: number }>(
  getLatestSnapshot: () => T | null,
  getLastSavedVersion: () => number,
  enqueueSave: (snapshot: T) => Promise<void>,
) {
  let pendingSnapshot = getLatestSnapshot();

  while (
    pendingSnapshot &&
    pendingSnapshot.version > getLastSavedVersion()
  ) {
    await enqueueSave(pendingSnapshot);
    pendingSnapshot = getLatestSnapshot();
  }
}
