import { type NextRequest, NextResponse } from "next/server"

async function getRealAccountId(account: any): Promise<string | null> {
  try {
    const maxRetries = 3
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[v0] Fetching real account ID for ${account.name} (attempt ${attempt}/${maxRetries})`)

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)

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

          if (response.status === 401 || response.status === 403) {
            return null
          }

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

        if (lastError.name === "AbortError") {
          console.error(`[v0] Request timeout for ${account.name}`)
          return null
        }

        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt - 1) * 1000
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

export async function POST(request: NextRequest) {
  try {
    const { accounts } = await request.json()

    if (!accounts || !Array.isArray(accounts)) {
      return NextResponse.json({ error: "Invalid accounts data" }, { status: 400 })
    }

    const results = await Promise.allSettled(
      accounts.map(async (account) => {
        try {
          const realAccountId = await getRealAccountId(account)

          if (!realAccountId) {
            throw new Error(`Account ${account.name} not found or invalid API credentials`)
          }

          const pagesResponse = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${realAccountId}/pages/projects`,
            {
              headers: {
                "X-Auth-Email": account.email,
                "X-Auth-Key": account.apiKey,
                "Content-Type": "application/json",
              },
            },
          )

          if (!pagesResponse.ok) {
            throw new Error(`Failed to fetch pages: ${pagesResponse.status}`)
          }

          const pagesData = await pagesResponse.json()

          return {
            accountName: account.name,
            accountId: realAccountId,
            pages: pagesData.result || [],
            success: true,
          }
        } catch (error) {
          console.error(`Error fetching pages for ${account.name}:`, error)
          return {
            accountName: account.name,
            pages: [],
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          }
        }
      }),
    )

    const successfulResults = results
      .filter((result) => result.status === "fulfilled")
      .map((result) => (result as PromiseFulfilledResult<any>).value)

    return NextResponse.json(successfulResults)
  } catch (error) {
    console.error("Error in pages API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
