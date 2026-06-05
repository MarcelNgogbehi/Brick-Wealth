/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'res.cloudinary.com',
                pathname: '**',
            },
            {
                protocol: 'https',
                hostname: 'raw.githubusercontent.com',
                pathname: '**',
            },
        ],
    },
    // Next 16 removed the `eslint` config key (`next lint` is gone).
    // Linting now runs separately via `npm run lint` (ESLint CLI) and no
    // longer blocks the production build.

    // Hide the floating Next.js dev-tools indicator (the dark "N" bubble that
    // appears bottom-left in development). Dev-only chrome — never shipped to prod.
    devIndicators: false,
};

export default nextConfig;
