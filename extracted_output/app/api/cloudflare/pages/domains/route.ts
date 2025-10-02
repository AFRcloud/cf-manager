import { type NextRequest, NextResponse } from "next/server"

async function getRealAccountId(account: any, retryCount = 0): Promise<string> {
  const maxRetries = 3
  const timeout = 10000 // 10 seconds

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const response = await fetch("https://api.cloudflare.com/client/v4/accounts", {
      headers: {
        "X-Auth-Email": account.email,
        "X-Auth-Key": account.apiKey,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error(`Authentication failed: ${response.status}`)
      }
      if (response.status >= 500 && retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000
        await new Promise((resolve) => setTimeout(resolve, delay))
        return getRealAccountId(account, retryCount + 1)
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    if (!data.result || !Array.isArray(data.result)) {
      throw new Error("Invalid response format from Cloudflare API")
    }

    // Try to find account by name first, then by email if name fails
    let realAccount = data.result.find((acc: any) => acc.name && acc.name.toLowerCase() === account.name.toLowerCase())

    if (!realAccount) {
      // If not found by name, try to find by email or use first account
      realAccount =
        data.result.find((acc: any) => acc.name && acc.name.toLowerCase().includes(account.email?.toLowerCase())) ||
        data.result[0]
    }

    if (!realAccount) {
      throw new Error(`No accessible accounts found for ${account.name}`)
    }

    return realAccount.id
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      if (retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000
        await new Promise((resolve) => setTimeout(resolve, delay))
        return getRealAccountId(account, retryCount + 1)
      }
      throw new Error("Request timeout after retries")
    }

    if (retryCount < maxRetries && !(error instanceof Error && error.message.includes("Authentication failed"))) {
      const delay = Math.pow(2, retryCount) * 1000
      await new Promise((resolve) => setTimeout(resolve, delay))
      return getRealAccountId(account, retryCount + 1)
    }

    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, account, pageName, hostname } = await request.json()

    if (!account || !pageName) {
      return NextResponse.json({ error: "Account and page name are required" }, { status: 400 })
    }

    const headers = {
      "X-Auth-Email": account.email,
      "X-Auth-Key": account.apiKey,
      "Content-Type": "application/json",
    }

    const accountId = await getRealAccountId(account)

    if (action === "get") {
      // Get custom domains for the page
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${pageName}/domains`,
        {
          headers,
        },
      )

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Cloudflare API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      return NextResponse.json(data)
    }

    if (action === "add") {
      if (!hostname) {
        return NextResponse.json({ error: "Hostname is required" }, { status: 400 })
      }

      // Add custom domain to the page
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${pageName}/domains`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            name: hostname,
          }),
        },
      )

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Cloudflare API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      return NextResponse.json(data)
    }

    if (action === "delete") {
      if (!hostname) {
        return NextResponse.json({ error: "Hostname is required" }, { status: 400 })
      }

      // Delete custom domain from the page
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${pageName}/domains/${hostname}`,
        {
          method: "DELETE",
          headers,
        },
      )

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Cloudflare API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      return NextResponse.json(data)
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Pages domains API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
