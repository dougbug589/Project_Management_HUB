import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  // Since we're using JWT (stateless auth), logout is handled client-side
  // This endpoint exists for consistency and future token blacklisting
  
  return NextResponse.json({
    success: true,
    message: "Logged out successfully",
  })
}
