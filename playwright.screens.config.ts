import { defineConfig, devices } from '@playwright/test';

// Capturas para revisão visual (docs/marcos/capturas).
// Por defeito usa um build de produção numa porta própria, para não interferir com um
// `npm run dev` que esteja aberto (o Next 16 só permite um servidor de dev por pasta).
// SCREENS_DEV=1 usa o servidor de desenvolvimento.
const PORT = 3200;
const baseURL = `http://localhost:${PORT}`;
const command = process.env.SCREENS_DEV
  ? `npx next dev --port ${PORT}`
  : `npm run build && npx next start --port ${PORT}`;

export default defineConfig({
  testDir: 'tests/screens',
  workers: 1,
  reporter: 'list',
  use: {
    baseURL,
    locale: 'pt-AO',
    timezoneId: 'Africa/Luanda',
    ...devices['Desktop Chrome'],
  },
  webServer: {
    command,
    url: baseURL,
    reuseExistingServer: true,
    timeout: 300_000,
  },
});
