import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { accounts } = await request.json()

    if (!accounts || !Array.isArray(accounts)) {
      return NextResponse.json({ error: "Invalid accounts data" }, { status: 400 })
    }

    const allDomains = []

    for (const account of accounts) {
      try {
        console.log(`[v0] Fetching zones for account: ${account.name}`)
        console.log(`[v0] Account apiType: ${account.apiType}`)
        console.log(`[v0] Account email: ${account.email}`)
        console.log(`[v0] Account apiKey length: ${account.apiKey?.length}`)

        let apiType = account.apiType
        if (!apiType) {
          // Global API Key is typically 37 characters and requires email
          // API Token is longer and doesn't require email
          if (account.email && account.apiKey?.length === 37) {
            apiType = "global"
            console.log(`[v0] Auto-detected Global API Key based on length and email presence`)
          } else {
            apiType = "token"
            console.log(`[v0] Auto-detected API Token`)
          }
        }

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        }

        if (apiType === "global") {
          headers["X-Auth-Email"] = account.email?.trim()
          headers["X-Auth-Key"] = account.apiKey?.trim()
          console.log(`[v0] Using Global API Key authentication`)
        } else {
          const cleanApiKey = account.apiKey?.trim()
          headers["Authorization"] = `Bearer ${cleanApiKey}`
          console.log(`[v0] Using API Token authentication`)
        }

        console.log(`[v0] Request headers (without sensitive data):`, {
          "Content-Type": headers["Content-Type"],
          "X-Auth-Email": headers["X-Auth-Email"] ? "***@***.***" : undefined,
          "X-Auth-Key": headers["X-Auth-Key"] ? "***" : undefined,
          Authorization: headers["Authorization"] ? "Bearer ***" : undefined,
        })

        const response = await fetch("https://api.cloudflare.com/client/v4/zones", {
          method: "GET",
          headers,
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`[v0] API error for account ${account.name}:`, response.status, response.statusText)
          console.error(`[v0] Error response body:`, errorText)

          try {
            const errorJson = JSON.parse(errorText)
            if (errorJson.errors && errorJson.errors.length > 0) {
              console.error(`[v0] Cloudflare errors:`, errorJson.errors)
            }
          } catch (e) {
            // Error response is not JSON
          }

          continue
        }

        const data = await response.json()

        if (data.success && data.result) {
          const domains = data.result.map((zone: any) => ({
            id: zone.id,
            name: zone.name,
            status: zone.status,
            account: account.name,
            accountId: account.id,
            plan: zone.plan?.name || "Free",
            nameServers: zone.name_servers || [],
            createdOn: zone.created_on,
            modifiedOn: zone.modified_on,
            developmentMode: zone.development_mode,
            originalNameServers: zone.original_name_servers || [],
            originalRegistrar: zone.original_registrar,
            originalDnshost: zone.original_dnshost,
            paused: zone.paused,
            type: zone.type || "full",
          }))

          allDomains.push(...domains)
          console.log(`[v0] Successfully fetched ${domains.length} zones for account ${account.name}`)
        }
      } catch (error) {
        console.error(`[v0] Error fetching zones for account ${account.name}:`, error)
        continue
      }
    }

    return NextResponse.json({ domains: allDomains })
  } catch (error) {
    console.error("[v0] API route error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
