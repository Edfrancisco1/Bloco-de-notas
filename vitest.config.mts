import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^@\/(.*)$/, replacement: path.join(root, '$1') },
      // `server-only` lança erro fora de um React Server Component; nos testes é um módulo vazio.
      { find: 'server-only', replacement: path.join(root, 'tests/support/server-only.ts') },
    ],
  },
  test: {
    include: ['tests/unit/**/*.test.{ts,tsx}', 'tests/contract/**/*.test.ts'],
    environment: 'node',
    setupFiles: ['tests/support/setup.ts'],
    restoreMocks: true,
  },
});
