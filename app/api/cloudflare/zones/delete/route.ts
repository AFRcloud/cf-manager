import { type NextRequest, NextResponse } from "next/server"

export async function DELETE(request: NextRequest) {
  try {
    const { zoneId, account } = await request.json()

    if (!zoneId || !account) {
      return NextResponse.json({ error: "Missing zoneId or account data" }, { status: 400 })
    }

    console.log(`[v0] Deleting zone ${zoneId} for account: ${account.name}`)

    // Determine API authentication type
    let apiType = account.apiType
    if (!apiType) {
      if (account.email && account.apiKey?.length === 37) {
        apiType = "global"
      } else {
        apiType = "token"
      }
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    if (apiType === "global") {
      headers["X-Auth-Email"] = account.email?.trim()
      headers["X-Auth-Key"] = account.apiKey?.trim()
    } else {
      headers["Authorization"] = `Bearer ${account.apiKey?.trim()}`
    }

    const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}`, {
      method: "DELETE",
      headers,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[v0] Delete zone API error:`, response.status, response.statusText)
      console.error(`[v0] Error response:`, errorText)

      try {
        const errorJson = JSON.parse(errorText)
        if (errorJson.errors && errorJson.errors.length > 0) {
          return NextResponse.json(
            { error: `Cloudflare API error: ${errorJson.errors[0].message}` },
            { status: response.status },
          )
        }
      } catch (e) {
        // Error response is not JSON
      }

      return NextResponse.json(
        { error: `Failed to delete domain: ${response.status} ${response.statusText}` },
        { status: response.status },
      )
    }

    const data = await response.json()

    if (data.success) {
      console.log(`[v0] Successfully deleted zone ${zoneId}`)
      return NextResponse.json({ success: true, message: "Domain deleted successfully" })
    } else {
      console.error(`[v0] Cloudflare API returned success: false`, data.errors)
      return NextResponse.json({ error: data.errors?.[0]?.message || "Failed to delete domain" }, { status: 400 })
    }
  } catch (error) {
    console.error("[v0] Delete zone API route error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
