import { type NextRequest, NextResponse } from "next/server"

async function getRealAccountId(account: any): Promise<string> {
  const maxRetries = 3
  const baseDelay = 1000

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const isGlobalApiKey =
        account.apiType === "global" ||
        (account.apiType === undefined && account.email && account.apiKey?.length === 37)

      let headers: Record<string, string>
      if (isGlobalApiKey) {
        headers = {
          "Content-Type": "application/json",
          "X-Auth-Email": account.email?.trim(),
          "X-Auth-Key": account.apiKey?.trim(),
        }
      } else {
        headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${account.apiKey?.trim()}`,
        }
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch("https://api.cloudflare.com/client/v4/accounts", {
        headers,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error(`Authentication failed: ${response.status}`)
        }
        throw new Error(`Server error: ${response.status}`)
      }

      const data = await response.json()
      const accounts = data.result || []

      // Try to find account by name or email
      const foundAccount = accounts.find(
        (acc: any) =>
          acc.name?.toLowerCase() === account.name?.toLowerCase() ||
          acc.name?.toLowerCase() === account.email?.toLowerCase(),
      )

      if (foundAccount) {
        return foundAccount.id
      }

      // If not found by name, return the first account ID
      if (accounts.length > 0) {
        return accounts[0].id
      }

      throw new Error("No accounts found")
    } catch (error: any) {
      console.log(`[v0] Attempt ${attempt} failed:`, error.message)

      if (attempt === maxRetries) {
        throw error
      }

      if (error.message.includes("Authentication failed")) {
        throw error
      }

      const delay = baseDelay * Math.pow(2, attempt - 1)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw new Error("Max retries exceeded")
}

export async function POST(request: NextRequest) {
  try {
    const { domainName, accountId, accounts } = await request.json()

    if (!domainName || !accountId || !accounts) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Find the account
    const account = accounts.find((acc: any) => acc.id === accountId)
    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }

    console.log(`[v0] Adding domain ${domainName} to account: ${account.name}`)

    const realAccountId = await getRealAccountId(account)
    console.log(`[v0] Using real account ID: ${realAccountId}`)

    // Determine authentication method
    const isGlobalApiKey =
      account.apiType === "global" || (account.apiType === undefined && account.email && account.apiKey?.length === 37)

    let headers: Record<string, string>
    if (isGlobalApiKey) {
      headers = {
        "Content-Type": "application/json",
        "X-Auth-Email": account.email?.trim(),
        "X-Auth-Key": account.apiKey?.trim(),
      }
    } else {
      headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${account.apiKey?.trim()}`,
      }
    }

    console.log(`[v0] Using ${isGlobalApiKey ? "Global API Key" : "API Token"} authentication`)

    // Add domain to Cloudflare
    const response = await fetch("https://api.cloudflare.com/client/v4/zones", {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: domainName,
        account: {
          id: realAccountId, // Use real account ID instead of account.accountId
        },
        jump_start: true,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.log(`[v0] Cloudflare API error:`, data)
      return NextResponse.json(
        {
          error: data.errors?.[0]?.message || "Failed to add domain",
          details: data.errors,
        },
        { status: response.status },
      )
    }

    console.log(`[v0] Successfully added domain ${domainName}`)
    return NextResponse.json({
      success: true,
      zone: data.result,
      message: `Domain ${domainName} added successfully`,
    })
  } catch (error) {
    console.error("[v0] Error adding domain:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
