// Pace a GitHub poll's batch across the time until the next permitted poll.
// This smooths the presentation; it does not make the source data fresher.
export function createPlayback<T>(deliver: (event: T) => void, onQueueSize: (size: number) => void) {
  const queue: T[] = [];
  let timer: ReturnType<typeof setTimeout> | undefined;
  let interval = 5000;

  function next() {
    timer = undefined;
    const event = queue.shift();
    if (event !== undefined) deliver(event);
    onQueueSize(queue.length);
    if (queue.length) timer = setTimeout(next, interval);
  }

  return {
    enqueue(event: T) {
      queue.push(event);
      onQueueSize(queue.length);
      // Fallback for servers that do not send a ratelimits/batch-end event.
      if (!timer) timer = setTimeout(next, 1000);
    },
    releaseBatch() {
      if (!queue.length) return;
      interval = Math.max(500, Math.min(6000, Math.floor(55000 / queue.length)));
      if (timer) clearTimeout(timer);
      next();
    },
    clear() {
      if (timer) clearTimeout(timer);
      timer = undefined;
      queue.length = 0;
      onQueueSize(0);
    },
  };
}
