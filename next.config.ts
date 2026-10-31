import type { NextConfig } from 'next';

// Cabeçalhos de segurança básicos. A CSP completa (com nonces) entra na fase de qualidade/segurança.
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  },
];

const nextConfig: NextConfig = {
  typedRoutes: true,
  // O indicador flutuante tapava a navegação inferior; os erros continuam a aparecer no overlay.
  devIndicators: false,
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
