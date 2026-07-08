import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prisma's generator output is customized to app/generated/prisma (see prisma/schema.prisma),
  // so Next.js's default trace of node_modules/.prisma/client never picks up the native query
  // engine binary. Without this, every route that touches Prisma throws
  // "PrismaClientInitializationError: could not locate the Query Engine" in production.
  outputFileTracingIncludes: {
    "/*": ["./app/generated/prisma/**/*"],
  },
};

export default nextConfig;
