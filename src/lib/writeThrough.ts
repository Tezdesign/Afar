// Optimistic writes that can never leave the screen wrong.
//
// - Writes for one key (one heart, one trip) run one after another, in tap
//   order, so the database ends on the last thing the person did.
// - Each write carries a sequence number. A failure rolls the screen back
//   only if no newer write for that key was made since.
// - Each write carries a session epoch. After sign in or out (`reset`), a
//   queued write is dropped without running, so it can never land in the
//   next account, and an old failure can no longer change the screen.

export function createWriteThrough() {
  let epoch = 0;
  let counter = 0;
  const latest = new Map<string, number>();
  const tails = new Map<string, Promise<unknown>>();

  return {
    /** Call on every sign in and sign out. */
    reset() {
      epoch += 1;
      latest.clear();
      tails.clear();
    },

    /** The session the caller is in now, to guard its own async loads. */
    get epoch() {
      return epoch;
    },

    /** The caller has already updated the screen. `write` saves it and
     *  `rollback` undoes it. Resolves true when the write succeeded. */
    run(key: string, write: () => Promise<void>, rollback: () => void): Promise<boolean> {
      const myEpoch = epoch;
      const mySeq = ++counter;
      latest.set(key, mySeq);

      const previous = tails.get(key) ?? Promise.resolve();
      const task = previous.then(async () => {
        if (myEpoch !== epoch) return false; // another session: never run
        try {
          await write();
          return true;
        } catch {
          if (myEpoch === epoch && latest.get(key) === mySeq) rollback();
          return false;
        }
      });
      tails.set(key, task);
      return task;
    },
  };
}
