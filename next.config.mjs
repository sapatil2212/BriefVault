/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Keep native/CommonJS extraction libs out of the bundle; require at runtime.
  serverExternalPackages: ["pdf-parse", "mammoth", "tesseract.js"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "randomuser.me",
      },
    ],
  },
  webpack: (config, { dev }) => {
    // react-pdf/pdfjs-dist ship `pdf.mjs` as a pre-bundled webpack module.
    // Next's default `.mjs` handling re-wraps it and runs the harmony-export
    // helper against a non-object, throwing "Object.defineProperty called on
    // non-object" at load. Treating node_modules `.mjs` as ambiguous modules
    // (and relaxing fullySpecified) lets webpack bundle it correctly.
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: "javascript/auto",
      resolve: { fullySpecified: false },
    });
    // pdf.js optionally references `canvas` (Node-only); alias it out so the
    // browser bundle doesn't try to resolve it.
    config.resolve.alias = { ...config.resolve.alias, canvas: false };

    // Windows file locking (antivirus / cloud sync on the project drive) can
    // corrupt webpack's persistent `.pack.gz` cache mid-write, producing
    // recurring ENOENT "rename 0.pack.gz_ -> 0.pack.gz" and missing-manifest
    // 500s. Use the in-memory cache in dev to eliminate the corruption; prod
    // builds keep the default optimized cache.
    if (dev) {
      config.cache = { type: "memory" };
    }
    return config;
  },
};

export default nextConfig;
