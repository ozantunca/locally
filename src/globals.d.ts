/// <reference lib="dom" />

declare const define: {
  amd?: boolean;
  (factory: () => unknown): void;
  (deps: string[], factory: (...args: unknown[]) => unknown): void;
};
