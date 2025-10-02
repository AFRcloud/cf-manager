import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { accounts } = await request.json()

    if (!accounts || !Array.isArray(accounts)) {
      return NextResponse.json({ error: "Invalid accounts data" }, { status: 400 })
    }

    const results = []

    for (const account of accounts) {
      try {
        console.log(`[v0] Fetching workers for account: ${account.name}`)

        // Auto-detect API type if not specified
        const isGlobalApiKey = account.email && account.apiKey && account.apiKey.length === 37
        const apiType = account.apiType || (isGlobalApiKey ? "global" : "token")

        console.log(`[v0] Account apiType: ${account.apiType}`)
        console.log(`[v0] Account email: ${account.email}`)
        console.log(`[v0] Account apiKey length: ${account.apiKey?.length}`)

        if (isGlobalApiKey) {
          console.log("[v0] Auto-detected Global API Key based on length and email presence")
        }

        // Prepare headers based on API type
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        }

        if (apiType === "global") {
          console.log("[v0] Using Global API Key authentication")
          headers["X-Auth-Email"] = account.email?.trim()
          headers["X-Auth-Key"] = account.apiKey?.trim()
        } else {
          console.log("[v0] Using API Token authentication")
          headers["Authorization"] = `Bearer ${account.apiKey?.trim()}`
        }

        console.log("[v0] Request headers (without sensitive data):", {
          "Content-Type": headers["Content-Type"],
          "X-Auth-Email": headers["X-Auth-Email"] ? "***@***.***" : undefined,
          "X-Auth-Key": headers["X-Auth-Key"] ? "***" : undefined,
          Authorization: headers["Authorization"] ? "Bearer ***" : undefined,
        })

        const response = await fetch("https://api.cloudflare.com/client/v4/accounts", {
          method: "GET",
          headers,
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.log(`[v0] Cloudflare API error for account ${account.name}: ${response.status}`)
          console.log(`[v0] Cloudflare error response:`, errorText)

          try {
            const errorJson = JSON.parse(errorText)
            if (errorJson.errors) {
              console.log(`[v0] Cloudflare errors:`, errorJson.errors)
            }
          } catch (e) {
            // Error response is not JSON
          }

          results.push({
            accountName: account.name,
            workers: [],
            error: `HTTP ${response.status}`,
          })
          continue
        }

        const accountsData = await response.json()
        console.log(`[v0] Accounts API response for ${account.name}:`, accountsData)

        if (accountsData.success && accountsData.result && accountsData.result.length > 0) {
          const accountId = accountsData.result[0].id

          // Fetch workers for this account
          const workersResponse = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts`,
            {
              method: "GET",
              headers,
            },
          )

          if (workersResponse.ok) {
            const workersData = await workersResponse.json()
            console.log(
              `[v0] Successfully fetched ${workersData.result?.length || 0} workers for account ${account.name}`,
            )

            results.push({
              accountName: account.name,
              workers: workersData.result || [],
            })
          } else {
            console.log(`[v0] Failed to fetch workers for account ${account.name}: ${workersResponse.status}`)
            results.push({
              accountName: account.name,
              workers: [],
              error: `Workers API error: ${workersResponse.status}`,
            })
          }
        } else {
          console.log(`[v0] No account data found for ${account.name}`)
          results.push({
            accountName: account.name,
            workers: [],
            error: "No account data found",
          })
        }
      } catch (error) {
        console.log(`[v0] Error processing account ${account.name}:`, error)
        results.push({
          accountName: account.name,
          workers: [],
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    console.log("[v0] API route error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
