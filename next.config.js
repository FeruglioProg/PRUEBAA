/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      "puppeteer-extra",
      "puppeteer-extra-plugin-stealth",
      "puppeteer-extra-plugin-adblocker",
      "puppeteer",
      "cheerio",
      "clone-deep",
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Excluir paquetes problemáticos del bundle del cliente
      config.externals = config.externals || []
      config.externals.push({
        puppeteer: "commonjs puppeteer",
        "puppeteer-extra": "commonjs puppeteer-extra",
        cheerio: "commonjs cheerio",
        "clone-deep": "commonjs clone-deep",
      })
    }

    // Ignorar warnings de análisis estático para ciertos módulos
    config.ignoreWarnings = [
      { module: /node_modules\/clone-deep/ },
      { module: /node_modules\/puppeteer/ },
      { module: /node_modules\/cheerio/ },
    ]

    return config
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ["placeholder.svg"],
    unoptimized: true,
  },
  // Configuración adicional para evitar problemas de build
  swcMinify: false,
  output: "standalone",
}

module.exports = nextConfig
