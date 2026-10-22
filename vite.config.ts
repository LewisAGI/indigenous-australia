import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Content-Security-Policy':
    "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://gibs.earthdata.nasa.gov; connect-src 'self' https://gibs.earthdata.nasa.gov; worker-src 'self' blob:; font-src 'self'",
};

export default defineConfig({
  plugins: [react()],
  server: { host: '127.0.0.1' },
  preview: { host: '127.0.0.1', headers: securityHeaders },
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
