"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Key, Mail, User, AlertCircle, Eye, EyeOff } from "lucide-react"
import { useAuth } from "./auth-provider"

interface AddAccountDialogProps {
  children?: React.ReactNode
}

export function AddAccountDialog({ children }: AddAccountDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showApiKey, setShowApiKey] = useState(false)
  const { addCloudflareAccount } = useAuth()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const apiKey = formData.get("apiKey") as string
    const accountId = formData.get("accountId") as string

    try {
      await addCloudflareAccount({
        name,
        email,
        apiKey,
        accountId,
        isActive: true,
      })

      setOpen(false)
      // Reset form
      e.currentTarget.reset()
    } catch (err) {
      setError("Failed to add Cloudflare account. Please check your credentials.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Account
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Add Cloudflare Account</DialogTitle>
          <DialogDescription>Connect your Cloudflare account to manage it from this dashboard.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="account-name">Account Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input id="account-name" name="name" placeholder="e.g., Production, Staging" className="pl-10" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="account-email">Cloudflare Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="account-email"
                name="email"
                type="email"
                placeholder="your@email.com"
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="api-key">Global API Key</Label>
            <div className="relative">
              <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="api-key"
                name="apiKey"
                type={showApiKey ? "text" : "password"}
                placeholder="Your Cloudflare Global API Key"
                className="pl-10 pr-10"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1 h-8 w-8 p-0"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="account-id">Account ID (Optional)</Label>
            <Input id="account-id" name="accountId" placeholder="Account ID for specific account access" />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? "Adding..." : "Add Account"}
            </Button>
          </div>
        </form>

        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>How to get your API Key:</strong>
            <br />
            1. Go to Cloudflare Dashboard → My Profile
            <br />
            2. Click "API Tokens" tab
            <br />
            3. Find "Global API Key" and click "View"
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
