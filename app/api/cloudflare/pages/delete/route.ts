import { type NextRequest, NextResponse } from "next/server"

export async function DELETE(request: NextRequest) {
  try {
    const { accountId, pageName, apiKey, email } = await request.json()

    if (!accountId || !pageName || !apiKey || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${pageName}`,
      {
        method: "DELETE",
        headers: {
          "X-Auth-Email": email,
          "X-Auth-Key": apiKey,
          "Content-Type": "application/json",
        },
      },
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: errorData.errors?.[0]?.message || `HTTP ${response.status}` },
        { status: response.status },
      )
    }

    return NextResponse.json({ success: true, message: "Page deleted successfully" })
  } catch (error) {
    console.error("Error deleting page:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
