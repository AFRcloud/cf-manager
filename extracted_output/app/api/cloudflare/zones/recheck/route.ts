import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { zoneId, accountId, accounts } = await request.json()

    // Find the account
    const account = accounts.find((acc: any) => acc.id === accountId)
    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }

    console.log("[v0] Re-checking nameserver for zone:", zoneId, "account:", account.name)

    // Auto-detect API type
    const apiType = account.apiType || (account.email && account.apiKey?.length === 37 ? "global" : "token")
    console.log("[v0] Auto-detected:", apiType)

    // Set up headers based on API type
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    if (apiType === "global") {
      headers["X-Auth-Email"] = account.email?.trim()
      headers["X-Auth-Key"] = account.apiKey?.trim()
      console.log("[v0] Using Global API Key authentication")
    } else {
      headers["Authorization"] = `Bearer ${account.apiKey?.trim()}`
      console.log("[v0] Using API Token authentication")
    }

    // Re-check zone status
    const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}`, {
      method: "GET",
      headers,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.log("[v0] Cloudflare API error:", response.status, errorText)
      return NextResponse.json(
        {
          error: `Cloudflare API error: ${response.status}`,
          details: errorText,
        },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log("[v0] Zone recheck response:", data.result?.status)

    if (data.success) {
      return NextResponse.json({
        success: true,
        zone: data.result,
        message: `Domain status: ${data.result.status}`,
      })
    } else {
      return NextResponse.json(
        {
          error: "Failed to recheck nameserver",
          details: data.errors,
        },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error("[v0] Error rechecking nameserver:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
