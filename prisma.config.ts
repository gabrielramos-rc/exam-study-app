// Prisma configuration file for Prisma 7+
// dotenv is optional - in production, DATABASE_URL is provided by Kubernetes
// In development, use: npm run dev (which loads .env automatically via Next.js)
import { defineConfig } from "prisma/config";

// Only load dotenv in development if available
if (process.env.NODE_ENV !== "production") {
  try {
    require("dotenv/config");
  } catch {
    // dotenv not available in production, which is fine
  }
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
