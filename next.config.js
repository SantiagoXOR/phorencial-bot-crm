// Temporalmente deshabilitando Sentry para resolver problemas de build
// const { withSentryConfig } = require('@sentry/nextjs')

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  },
  // Configuración simplificada para resolver problemas de build
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  // Configuración adicional para resolver problemas de permisos
  output: 'standalone',
  poweredByHeader: false,
  compress: true,
}

// Exportar configuración sin Sentry temporalmente
module.exports = nextConfig

// Sentry configuration (deshabilitado temporalmente)
/*
const sentryWebpackPluginOptions = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  transpileClientSDK: true,
  tunnelRoute: '/monitoring',
  hideSourceMaps: true,
  disableLogger: true,
  automaticVercelMonitors: true,
}

module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions)
*/
