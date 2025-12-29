import { NextResponse } from "next/server";

// Force dynamic to prevent static analysis at build time
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Lazy import Prisma to prevent initialization at build time
    const { prisma } = await import("@/lib/prisma");

    // Check database connectivity with timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Database timeout")), 5000)
    );
    await Promise.race([prisma.$queryRaw`SELECT 1`, timeoutPromise]);

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: "connected",
    });
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        database: "disconnected",
        // Sanitize error details in production
        error:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : "Unknown error"
            : "Database connection failed",
      },
      { status: 503 }
    );
  }
}
