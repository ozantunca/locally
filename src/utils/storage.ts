import lzstring from 'lz-string';

const config: Map<string, any> = new Map();
const keys: string[] = [];
const ls = window.localStorage;

// Saves config to localStorage
export function persistCurrentConfig() {
  ls.setItem(
    'locally-config',
    lzstring.compressToUTF16(JSON.stringify(config))
  );
  return true;
}

// Removes a value from localStorage
export function removeValue(key: string) {
  if (keys.includes(key)) {
    ls.removeItem(key);
    keys.splice(keys.indexOf(key), 1);
    config.delete(key);
  }
}
