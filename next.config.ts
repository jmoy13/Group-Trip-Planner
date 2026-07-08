import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prisma's generator output is customized to app/generated/prisma (see prisma/schema.prisma),
  // so Next.js's default trace of node_modules/.prisma/client never picks up the native query
  // engine binary. Without this, every route that touches Prisma throws
  // "PrismaClientInitializationError: could not locate the Query Engine" in production.
  outputFileTracingIncludes: {
    "/*": ["./app/generated/prisma/**/*"],
  },
  // Without this, Next.js webpack-bundles our generated Prisma client (it's app-local code, not
  // an npm package) into .next/server/**, which moves it away from the __dirname the binary query
  // engine uses to locate its .so.node file at runtime — the actual cause of the error above.
  // Keeping it external preserves its real file location so that lookup still works.
  serverExternalPackages: ["@prisma/client"],
};

export default nextConfig;
