type Listener = () => void;

const listeners = new Map<string, Set<Listener>>();

export function subscribeTabReselect(key: string, listener: Listener) {
  let bucket = listeners.get(key);

  if (!bucket) {
    bucket = new Set();
    listeners.set(key, bucket);
  }

  bucket.add(listener);

  return () => {
    bucket?.delete(listener);

    if (bucket && bucket.size === 0) {
      listeners.delete(key);
    }
  };
}

export function emitTabReselect(key: string) {
  const bucket = listeners.get(key);

  if (!bucket) {
    return;
  }

  for (const listener of bucket) {
    listener();
  }
}
