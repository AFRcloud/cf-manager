export async function PUT(request: Request) {
  try {
    const { zoneId, recordId, account, record } = await request.json()

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    if (account.email && account.apiKey.length === 37) {
      headers["X-Auth-Email"] = account.email.trim()
      headers["X-Auth-Key"] = account.apiKey.trim()
    } else {
      headers["Authorization"] = `Bearer ${account.apiKey.trim()}`
    }

    const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${recordId}`, {
      method: "PUT",
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
      return Response.json({ error: "Failed to update DNS record", details: data }, { status: response.status })
    }

    return Response.json(data.result)
  } catch (error) {
    console.error("[v0] DNS update error:", error)
    return Response.json({ error: "Failed to update DNS record" }, { status: 500 })
  }
}
