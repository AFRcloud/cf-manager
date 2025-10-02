export async function POST(request: Request) {
  try {
    const { workerId, account, domain } = await request.json()

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    if (account.email && account.apiKey.length === 37) {
      headers["X-Auth-Email"] = account.email.trim()
      headers["X-Auth-Key"] = account.apiKey.trim()
    } else {
      headers["Authorization"] = `Bearer ${account.apiKey.trim()}`
    }

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${account.accountId}/workers/scripts/${workerId}/routes`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          pattern: `${domain}/*`,
          script: workerId,
        }),
      },
    )

    const data = await response.json()

    if (!response.ok) {
      return Response.json({ error: "Failed to add custom domain", details: data }, { status: response.status })
    }

    return Response.json(data.result)
  } catch (error) {
    console.error("[v0] Worker custom domain error:", error)
    return Response.json({ error: "Failed to add custom domain" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { routeId, account } = await request.json()

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    if (account.email && account.apiKey.length === 37) {
      headers["X-Auth-Email"] = account.email.trim()
      headers["X-Auth-Key"] = account.apiKey.trim()
    } else {
      headers["Authorization"] = `Bearer ${account.apiKey.trim()}`
    }

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${account.accountId}/workers/routes/${routeId}`,
      {
        method: "DELETE",
        headers,
      },
    )

    const data = await response.json()

    if (!response.ok) {
      return Response.json({ error: "Failed to remove custom domain", details: data }, { status: response.status })
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error("[v0] Worker custom domain delete error:", error)
    return Response.json({ error: "Failed to remove custom domain" }, { status: 500 })
  }
}
