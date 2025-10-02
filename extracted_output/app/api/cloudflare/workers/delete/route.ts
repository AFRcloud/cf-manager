import { type NextRequest, NextResponse } from "next/server"

export async function DELETE(request: NextRequest) {
  try {
    const { accountId, workerId, apiKey, email, apiType } = await request.json()

    if (!accountId || !workerId || !apiKey) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Auto-detect API type if not provided
    const detectedApiType = apiType || (email && apiKey.length === 37 ? "global" : "token")

    console.log(`[v0] Deleting worker ${workerId} for account ${accountId}`)
    console.log(`[v0] Using ${detectedApiType === "global" ? "Global API Key" : "API Token"} authentication`)

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    if (detectedApiType === "global") {
      headers["X-Auth-Email"] = email?.trim()
      headers["X-Auth-Key"] = apiKey?.trim()
    } else {
      headers["Authorization"] = `Bearer ${apiKey?.trim()}`
    }

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts/${workerId}`,
      {
        method: "DELETE",
        headers,
      },
    )

    const data = await response.json()

    if (!response.ok) {
      console.log(`[v0] Cloudflare API error:`, data)
      return NextResponse.json(
        { error: `Failed to delete worker: ${data.errors?.[0]?.message || "Unknown error"}` },
        { status: response.status },
      )
    }

    console.log(`[v0] Successfully deleted worker ${workerId}`)
    return NextResponse.json({ success: true, message: "Worker deleted successfully" })
  } catch (error) {
    console.error("[v0] Error deleting worker:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
