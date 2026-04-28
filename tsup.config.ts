import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    core: 'src/core/index.ts',
    spacemagic: 'src/spacemagic/index.ts',
  },
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'es2022',
  treeshake: true,
  splitting: false,
});
