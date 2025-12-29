import { NextResponse } from "next/server";

// Force dynamic to prevent static analysis at build time
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Lazy import Prisma to prevent initialization at build time
    const { prisma } = await import("@/lib/prisma");

    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;

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
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 }
    );
  }
}
