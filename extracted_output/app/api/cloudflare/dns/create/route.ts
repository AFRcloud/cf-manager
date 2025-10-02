export async function POST(request: Request) {
  try {
    const { zoneId, account, record } = await request.json()

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    // Auto-detect API type based on account data
    if (account.email && account.apiKey.length === 37) {
      headers["X-Auth-Email"] = account.email.trim()
      headers["X-Auth-Key"] = account.apiKey.trim()
    } else {
      headers["Authorization"] = `Bearer ${account.apiKey.trim()}`
    }

    const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        type: record.type,
        name: record.name,
        content: record.content,
        ttl: record.ttl || 1,
        proxied: record.proxied || false,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.log(`[v0] DNS create error:`, data)
      return Response.json({ error: "Failed to create DNS record", details: data }, { status: response.status })
    }

    return Response.json(data.result)
  } catch (error) {
    console.error("[v0] DNS create error:", error)
    return Response.json({ error: "Failed to create DNS record" }, { status: 500 })
  }
}
