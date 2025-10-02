import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { account } = await request.json()

    if (!account || !account.apiKey || !account.email) {
      return NextResponse.json({ success: false, error: "Missing account credentials" }, { status: 400 })
    }

    console.log(`[v0] Testing connection for account: ${account.name}`)

    // Test connection with a simple API call to verify credentials
    const response = await fetch("https://api.cloudflare.com/client/v4/user", {
      headers: {
        "X-Auth-Email": account.email,
        "X-Auth-Key": account.apiKey,
        "Content-Type": "application/json",
      },
    })

    const data = await response.json()

    if (response.ok && data.success) {
      console.log(`[v0] Connection test successful for account: ${account.name}`)
      return NextResponse.json({
        success: true,
        message: "Connection successful",
        userInfo: {
          email: data.result?.email,
          id: data.result?.id,
        },
      })
    } else {
      console.log(`[v0] Connection test failed for account: ${account.name}`, data.errors)
      return NextResponse.json(
        {
          success: false,
          error: data.errors?.[0]?.message || "Authentication failed",
        },
        { status: 401 },
      )
    }
  } catch (error) {
    console.error("[v0] Test connection error:", error)
    return NextResponse.json({ success: false, error: "Network error or invalid API endpoint" }, { status: 500 })
  }
}
