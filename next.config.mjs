/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [{hostname: "images.paxels.com"}],
    },
};

export default nextConfig;
