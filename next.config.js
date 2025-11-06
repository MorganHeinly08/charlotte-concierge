module.exports = {
  output: 'export',
  reactStrictMode: true,
  images: { unoptimized: true },
  basePath: process.env.NODE_ENV === 'production' ? '/charlotte-concierge' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/charlotte-concierge/' : '',
}