import { type NextRequest, NextResponse } from "next/server"
import { apiOptimizer } from "@/lib/api-optimizer"

export async function POST(request: NextRequest) {
  try {
    const { accounts, operations } = await request.json()

    console.log(`[v0] Batch API request for ${accounts.length} accounts, ${operations.length} operations`)

    const results = await Promise.allSettled(
      accounts.map(async (account: any) => {
        try {
          const realAccountId = await getRealAccountId(account)
          if (!realAccountId) {
            console.error(`[v0] Skipping account ${account.name} - invalid API credentials`)
            return {
              account: account.name,
              error: "Invalid API credentials",
              results: {},
            }
          }

          const accountKey = `account-${account.name}`

          const operationResults = await Promise.allSettled(
            operations.map(async (op: string) => {
              const cacheKey = `${accountKey}-${op}`

              return apiOptimizer.optimizedFetch(
                cacheKey,
                async () => {
                  const cleanOp = op.replace(`account-${account.name}-`, "")
                  let apiEndpoint: string

                  if (cleanOp === "zones") {
                    apiEndpoint = "https://api.cloudflare.com/client/v4/zones"
                  } else if (cleanOp.startsWith("zones/") && cleanOp.includes("/dns_records")) {
                    console.log(`[v0] Fetching DNS records - first getting zones for account: ${account.name}`)

                    const zonesResponse = await fetch("https://api.cloudflare.com/client/v4/zones", {
                      headers: {
                        "Content-Type": "application/json",
                        "X-Auth-Email": account.email,
                        "X-Auth-Key": account.apiKey,
                      },
                    })

                    if (!zonesResponse.ok) {
                      throw new Error(`Failed to fetch zones: ${zonesResponse.status}`)
                    }

                    const zonesData = await zonesResponse.json()
                    const zones = zonesData.result || []

                    console.log(`[v0] Found ${zones.length} zones for account ${account.name}`)

                    const allDnsRecords = []
                    for (const zone of zones) {
                      const dnsResponse = await fetch(
                        `https://api.cloudflare.com/client/v4/zones/${zone.id}/dns_records`,
                        {
                          headers: {
                            "Content-Type": "application/json",
                            "X-Auth-Email": account.email,
                            "X-Auth-Key": account.apiKey,
                          },
                        },
                      )

                      if (dnsResponse.ok) {
                        const dnsData = await dnsResponse.json()
                        const records = dnsData.result || []
                        console.log(`[v0] Found ${records.length} DNS records for zone ${zone.name}`)

                        const recordsWithZone = records.map((record: any) => ({
                          ...record,
                          zone_name: zone.name,
                          zone_id: zone.id,
                        }))

                        allDnsRecords.push(...recordsWithZone)
                      }
                    }

                    console.log(`[v0] Total DNS records fetched: ${allDnsRecords.length}`)
                    return { success: true, result: allDnsRecords }
                  } else if (cleanOp === "workers/scripts") {
                    apiEndpoint = `https://api.cloudflare.com/client/v4/accounts/${realAccountId}/${cleanOp}`
                  } else if (cleanOp === "pages/projects") {
                    apiEndpoint = `https://api.cloudflare.com/client/v4/accounts/${realAccountId}/${cleanOp}`
                  } else {
                    apiEndpoint = `https://api.cloudflare.com/client/v4/accounts/${realAccountId}/${cleanOp}`
                  }

                  console.log(`[v0] Making Cloudflare API call to: ${apiEndpoint}`)

                  const response = await fetch(apiEndpoint, {
                    headers: {
                      "Content-Type": "application/json",
                      "X-Auth-Email": account.email,
                      "X-Auth-Key": account.apiKey,
                    },
                  })

                  if (!response.ok) {
                    const errorText = await response.text()
                    console.error(`[v0] Cloudflare API error ${response.status}:`, errorText)
                    throw new Error(`API error: ${response.status}`)
                  }

                  return response.json()
                },
                60000,
              )
            }),
          )

          const processedResults = Object.fromEntries(
            operations.map((op: string, index: number) => {
              const result = operationResults[index]
              if (result.status === "fulfilled") {
                return [op, result.value]
              } else {
                console.error(`[v0] Operation ${op} failed for account ${account.name}:`, result.reason)
                return [op, { error: result.reason?.message || "Operation failed" }]
              }
            }),
          )

          return {
            account: account.name,
            results: processedResults,
          }
        } catch (error) {
          console.error(`[v0] Account ${account.name} failed:`, error)
          return {
            account: account.name,
            error: error instanceof Error ? error.message : "Account processing failed",
            results: {},
          }
        }
      }),
    )

    const processedResults = results.map((result) => {
      if (result.status === "fulfilled") {
        return result.value
      } else {
        console.error(`[v0] Account processing failed:`, result.reason)
        return {
          account: "unknown",
          error: result.reason?.message || "Account processing failed",
          results: {},
        }
      }
    })

    console.log(
      `[v0] Batch API completed - ${processedResults.filter((r) => !r.error).length}/${accounts.length} accounts successful`,
    )
    return NextResponse.json({ success: true, data: processedResults })
  } catch (error) {
    console.error("[v0] Batch API error:", error)
    return NextResponse.json({ error: "Batch API failed" }, { status: 500 })
  }
}

async function getRealAccountId(account: any): Promise<string | null> {
  try {
    const maxRetries = 3
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[v0] Fetching real account ID for ${account.name} (attempt ${attempt}/${maxRetries})`)

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

        const response = await fetch("https://api.cloudflare.com/client/v4/accounts", {
          headers: {
            "Content-Type": "application/json",
            "X-Auth-Email": account.email,
            "X-Auth-Key": account.apiKey,
          },
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`[v0] Failed to fetch accounts for ${account.name}: ${response.status} - ${errorText}`)

          // Don't retry on authentication errors (401, 403)
          if (response.status === 401 || response.status === 403) {
            return null
          }

          // Retry on server errors (5xx) and rate limiting (429)
          if (response.status >= 500 || response.status === 429) {
            throw new Error(`HTTP ${response.status}: ${errorText}`)
          }

          return null
        }

        const data = await response.json()

        const targetAccount =
          data.result?.find((acc: any) => acc.name?.toLowerCase() === account.name?.toLowerCase()) || data.result?.[0]

        if (targetAccount?.id) {
          console.log(`[v0] Found real account ID for ${account.name}: ${targetAccount.id}`)
          return targetAccount.id
        }

        console.error(`[v0] No matching account found for ${account.name}`)
        return null
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        console.error(`[v0] Attempt ${attempt} failed for ${account.name}:`, lastError.message)

        // Don't retry on abort errors (timeout)
        if (lastError.name === "AbortError") {
          console.error(`[v0] Request timeout for ${account.name}`)
          return null
        }

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt - 1) * 1000 // 1s, 2s, 4s
          console.log(`[v0] Retrying in ${delay}ms...`)
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }
    }

    console.error(`[v0] All attempts failed for ${account.name}. Last error:`, lastError?.message)
    return null
  } catch (error) {
    console.error(`[v0] Unexpected error fetching real account ID for ${account.name}:`, error)
    return null
  }
}
