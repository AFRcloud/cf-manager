"use client"

import type React from "react"
import { useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"

interface AddAccountFormProps {
  onSuccess?: () => void
}

export function AddAccountForm({ onSuccess }: AddAccountFormProps) {
  const { addCloudflareAccount } = useAuth()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("") // Added email field for Global API
  const [apiKey, setApiKey] = useState("")
  const [apiType, setApiType] = useState<"global" | "token">("global") // Added API type selection
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setError("Account name is required")
      return
    }

    if (apiType === "global" && !email.trim()) {
      setError("Email is required for Global API")
      return
    }

    if (!apiKey.trim()) {
      setError("API key is required")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }

      if (apiType === "global") {
        headers["X-Auth-Email"] = email
        headers["X-Auth-Key"] = apiKey
      } else {
        headers["Authorization"] = `Bearer ${apiKey}`
      }

      const response = await fetch("https://api.cloudflare.com/client/v4/user", {
        headers,
      })

      if (!response.ok) {
        throw new Error("Invalid API credentials")
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error("Failed to verify API credentials")
      }

      const newAccount = {
        name: name.trim(),
        email: email.trim(),
        apiKey: apiKey.trim(),
        apiType,
        accountId: data.result?.id || "unknown",
        isActive: true,
      }

      await addCloudflareAccount(newAccount)

      setName("")
      setEmail("")
      setApiKey("")
      setApiType("global")
      onSuccess?.()
    } catch (err) {
      console.error("[v0] Error adding account:", err)
      setError(err instanceof Error ? err.message : "Failed to add account")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Account Name</Label>
        <Input
          id="name"
          type="text"
          placeholder="My Cloudflare Account"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label>API Type</Label>
        <div className="flex gap-4">
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="global"
              name="apiType"
              value="global"
              checked={apiType === "global"}
              onChange={(e) => setApiType(e.target.value as "global" | "token")}
              disabled={isLoading}
            />
            <Label htmlFor="global">Global API Key</Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="token"
              name="apiType"
              value="token"
              checked={apiType === "token"}
              onChange={(e) => setApiType(e.target.value as "global" | "token")}
              disabled={isLoading}
            />
            <Label htmlFor="token">API Token</Label>
          </div>
        </div>
      </div>

      {apiType === "global" && (
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="your-email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
          <p className="text-sm text-muted-foreground">Your Cloudflare account email address</p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="apiKey">{apiType === "global" ? "Global API Key" : "API Token"}</Label>
        <Input
          id="apiKey"
          type="password"
          placeholder={apiType === "global" ? "Your Global API Key" : "Your API Token"}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          disabled={isLoading}
        />
        <p className="text-sm text-muted-foreground">
          {apiType === "global"
            ? "Found in Cloudflare Dashboard → My Profile → API Tokens → Global API Key"
            : "Create a custom token with Zone:Read permissions"}
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Verifying..." : "Add Account"}
      </Button>
    </form>
  )
}
