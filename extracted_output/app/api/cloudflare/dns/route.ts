import { type NextRequest, NextResponse } from "next/server"

interface CloudflareAccount {
  name: string
  email?: string
  apiKey: string
  apiType?: "global" | "token"
}

interface DNSRecord {
  id: string
  zone_id: string
  zone_name: string
  name: string
  type: string
  content: string
  ttl: number
  priority?: number
  proxied: boolean
  created_on: string
  modified_on: string
}

export async function POST(request: NextRequest) {
  try {
    const { accounts } = await request.json()

    if (!accounts || !Array.isArray(accounts)) {
      return NextResponse.json({ error: "Invalid accounts data" }, { status: 400 })
    }

    console.log("[v0] Fetching DNS records for all accounts")

    const allDNSRecords: any[] = []

    for (const account of accounts) {
      try {
        console.log(`[v0] Fetching DNS records for account: ${account.name}`)

        // First get zones for this account
        const zonesUrl = "https://api.cloudflare.com/client/v4/zones"

        // Auto-detect API type if not specified
        const isGlobalKey = account.email && account.apiKey?.length === 37
        const apiType = account.apiType || (isGlobalKey ? "global" : "token")

        console.log(`[v0] Account apiType: ${account.apiType}`)
        console.log(`[v0] Auto-detected: ${apiType}`)

        const zonesHeaders: Record<string, string> = {
          "Content-Type": "application/json",
        }

        if (apiType === "global") {
          zonesHeaders["X-Auth-Email"] = account.email?.trim()
          zonesHeaders["X-Auth-Key"] = account.apiKey?.trim()
        } else {
          zonesHeaders["Authorization"] = `Bearer ${account.apiKey?.trim()}`
        }

        const zonesResponse = await fetch(zonesUrl, {
          method: "GET",
          headers: zonesHeaders,
        })

        if (!zonesResponse.ok) {
          const errorText = await zonesResponse.text()
          console.log(`[v0] Zones API error for account ${account.name}: ${zonesResponse.status}`)
          console.log(`[v0] Zones error response: ${errorText}`)
          continue
        }

        const zonesData = await zonesResponse.json()

        if (!zonesData.success || !zonesData.result) {
          console.log(`[v0] Zones API failed for account ${account.name}:`, zonesData.errors)
          continue
        }

        console.log(`[v0] Found ${zonesData.result.length} zones for account ${account.name}`)

        // Now get DNS records for each zone
        for (const zone of zonesData.result) {
          try {
            const dnsUrl = `https://api.cloudflare.com/client/v4/zones/${zone.id}/dns_records`

            const dnsResponse = await fetch(dnsUrl, {
              method: "GET",
              headers: zonesHeaders,
            })

            if (!dnsResponse.ok) {
              const errorText = await dnsResponse.text()
              console.log(`[v0] DNS API error for zone ${zone.name}: ${dnsResponse.status}`)
              console.log(`[v0] DNS error response: ${errorText}`)
              continue
            }

            const dnsData = await dnsResponse.json()

            if (!dnsData.success || !dnsData.result) {
              console.log(`[v0] DNS API failed for zone ${zone.name}:`, dnsData.errors)
              continue
            }

            console.log(`[v0] Found ${dnsData.result.length} DNS records for zone ${zone.name}`)

            // Add account info to each DNS record
            const recordsWithAccount = dnsData.result.map((record: DNSRecord) => ({
              ...record,
              accountName: account.name,
              domainName: zone.name,
            }))

            allDNSRecords.push(...recordsWithAccount)
          } catch (error) {
            console.log(`[v0] Error fetching DNS records for zone ${zone.name}:`, error)
          }
        }
      } catch (error) {
        console.log(`[v0] Error processing account ${account.name}:`, error)
      }
    }

    console.log(`[v0] Total DNS records fetched: ${allDNSRecords.length}`)

    return NextResponse.json({
      success: true,
      result: allDNSRecords,
    })
  } catch (error) {
    console.log("[v0] DNS API route error:", error)
    return NextResponse.json({ error: "Failed to fetch DNS records" }, { status: 500 })
  }
}
