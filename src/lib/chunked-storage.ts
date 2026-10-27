/** Anything that can keep short strings, such as Expo SecureStore. */
export type KeyValueBackend = {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<void>;
  remove: (key: string) => Promise<void>;
};

export type ChunkedStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

const MAX_PARTS = 100;

// SecureStore refuses values over 2048 bytes. 600 characters stay under that
// even at 3 bytes per character.
const DEFAULT_CHUNK_SIZE = 600;

/** Splits text into pieces of at most `size` characters, never cutting a surrogate pair in half. */
export function splitText(value: string, size: number): string[] {
  const parts: string[] = [];
  let start = 0;
  while (start < value.length) {
    let end = Math.min(start + size, value.length);
    const lastUnit = value.charCodeAt(end - 1);
    if (end < value.length && lastUnit >= 0xd800 && lastUnit <= 0xdbff)
      end += 1;
    parts.push(value.slice(start, end));
    start = end;
  }
  return parts;
}

export function createChunkedStorage(
  backend: KeyValueBackend,
  chunkSize = DEFAULT_CHUNK_SIZE,
): ChunkedStorage {
  const countKey = (key: string) => `${key}.count`;
  const partKey = (key: string, index: number) => `${key}.${index}`;

  async function readCount(key: string): Promise<number | null> {
    const raw = await backend.get(countKey(key));
    if (raw === null) return null;
    const count = Number(raw);
    return Number.isInteger(count) && count >= 1 && count <= MAX_PARTS
      ? count
      : null;
  }

  async function removeItem(key: string): Promise<void> {
    const count = await readCount(key);
    // Remove the count first: without it the value reads as missing, even if clean-up is interrupted.
    await backend.remove(countKey(key));
    if (count !== null) {
      for (let i = 0; i < count; i++) await backend.remove(partKey(key, i));
    }
  }

  async function getItem(key: string): Promise<string | null> {
    const count = await readCount(key);
    if (count === null) return null;
    let value = "";
    for (let i = 0; i < count; i++) {
      const part = await backend.get(partKey(key, i));
      if (part === null) return null; // an incomplete value is treated as no value
      value += part;
    }
    return value;
  }

  async function setItem(key: string, value: string): Promise<void> {
    await removeItem(key);
    if (value === "") return; // storing nothing is the same as removing

    const parts = splitText(value, chunkSize);
    if (parts.length > MAX_PARTS) throw new Error("Value too large to store");

    for (let i = 0; i < parts.length; i++)
      await backend.set(partKey(key, i), parts[i]);
    // The count goes last, so an interrupted write reads as "no value", never as a broken one.
    await backend.set(countKey(key), String(parts.length));
  }

  return { getItem, setItem, removeItem };
}
