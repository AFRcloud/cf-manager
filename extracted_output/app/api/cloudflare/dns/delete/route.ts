export async function DELETE(request: Request) {
  try {
    const { zoneId, recordId, account } = await request.json()

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
      method: "DELETE",
      headers,
    })

    const data = await response.json()

    if (!response.ok) {
      return Response.json({ error: "Failed to delete DNS record", details: data }, { status: response.status })
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error("[v0] DNS delete error:", error)
    return Response.json({ error: "Failed to delete DNS record" }, { status: 500 })
  }
}
