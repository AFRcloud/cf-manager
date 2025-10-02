import { type NextRequest, NextResponse } from "next/server"

async function getAccountAuth(account: any) {
  try {
    if (!account) {
      return { error: "Account not found" }
    }

    console.log(`[v0] Account apiType: ${account.apiType}`)
    console.log(`[v0] Account email: ${account.email}`)
    console.log(`[v0] Account apiKey length: ${account.apiKey?.length}`)

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    // Auto-detect API type based on key characteristics
    if (account.apiKey && account.apiKey.length === 40 && !account.email) {
      console.log("[v0] Auto-detected API Token based on length and no email")
      headers["Authorization"] = `Bearer ${account.apiKey}`
    } else if (account.apiKey && account.apiKey.length === 37 && account.email) {
      console.log("[v0] Auto-detected Global API Key based on length and email presence")
      headers["X-Auth-Email"] = account.email
      headers["X-Auth-Key"] = account.apiKey
    } else if (account.apiType === "token") {
      headers["Authorization"] = `Bearer ${account.apiKey}`
    } else if (account.apiType === "global" && account.email) {
      headers["X-Auth-Email"] = account.email
      headers["X-Auth-Key"] = account.apiKey
    } else {
      return { error: "Invalid authentication configuration" }
    }

    const logHeaders = { ...headers }
    if (logHeaders["X-Auth-Email"]) logHeaders["X-Auth-Email"] = "***@***.***"
    if (logHeaders["X-Auth-Key"]) logHeaders["X-Auth-Key"] = "***"
    if (logHeaders["Authorization"]) logHeaders["Authorization"] = "Bearer ***"
    console.log(`[v0] Request headers (without sensitive data): ${JSON.stringify(logHeaders)}`)

    return { account, headers }
  } catch (error) {
    console.error("[v0] Error getting account auth:", error)
    return { error: "Failed to get account authentication" }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, account, accountId, hostname, service, zoneId, environment = "production", domainId } = body

    if (!account) {
      return NextResponse.json({ error: "Account data is required" }, { status: 400 })
    }

    const authResult = await getAccountAuth(account)
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    const { headers } = authResult

    const accountsResponse = await fetch("https://api.cloudflare.com/client/v4/accounts", {
      method: "GET",
      headers,
    })

    const accountsData = await accountsResponse.json()
    if (!accountsResponse.ok || !accountsData.result || accountsData.result.length === 0) {
      console.error("Failed to fetch accounts:", accountsData)
      return NextResponse.json({ error: "Failed to fetch account information" }, { status: 500 })
    }

    // Use the first account's real ID from Cloudflare
    const realAccountId = accountsData.result[0].id
    console.log(`[v0] Using real Cloudflare account ID: ${realAccountId}`)

    // Handle different actions
    if (action === "get") {
      // Get worker domains
      const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${realAccountId}/workers/domains`, {
        method: "GET",
        headers,
      })

      const data = await response.json()

      if (!response.ok) {
        console.error("Cloudflare API Error:", data)
        return NextResponse.json(
          { error: "Failed to fetch worker domains", details: data.errors },
          { status: response.status },
        )
      }

      return NextResponse.json(data)
    } else if (action === "add") {
      // Add worker domain
      if (!hostname || !service || !zoneId) {
        return NextResponse.json(
          {
            error: "Missing required fields: hostname, service, zoneId",
          },
          { status: 400 },
        )
      }

      const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${realAccountId}/workers/domains`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          environment,
          hostname,
          service,
          zone_id: zoneId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error("Cloudflare API Error:", data)
        return NextResponse.json(
          { error: "Failed to register worker domain", details: data.errors },
          { status: response.status },
        )
      }

      return NextResponse.json(data)
    } else if (action === "delete") {
      // Delete worker domain
      if (!domainId) {
        return NextResponse.json(
          {
            error: "Domain ID is required",
          },
          { status: 400 },
        )
      }

      console.log(`[v0] Attempting to delete worker domain with ID: ${domainId}`)
      console.log(`[v0] Using account ID: ${realAccountId}`)

      try {
        const response = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${realAccountId}/workers/domains/${domainId}`,
          {
            method: "DELETE",
            headers,
          },
        )

        console.log(`[v0] Delete response status: ${response.status}`)

        if (response.ok) {
          // DELETE operations often return empty responses, so don't try to parse JSON
          console.log(`[v0] Successfully deleted worker domain`)
          return NextResponse.json({ success: true, message: "Domain deleted successfully" })
        } else {
          // Only try to parse JSON for error responses
          let errorData
          try {
            const text = await response.text()
            errorData = text ? JSON.parse(text) : { errors: [{ message: "Unknown error" }] }
          } catch (parseError) {
            errorData = { errors: [{ message: "Failed to parse error response" }] }
          }

          console.error("Cloudflare API Error:", errorData)
          return NextResponse.json(
            { error: "Failed to unregister worker domain", details: errorData.errors },
            { status: response.status },
          )
        }
      } catch (fetchError) {
        console.error(`[v0] Fetch error when deleting domain:`, fetchError)
        return NextResponse.json(
          { error: "Network error when deleting domain", details: fetchError.message },
          { status: 500 },
        )
      }
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error processing worker domain request:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
