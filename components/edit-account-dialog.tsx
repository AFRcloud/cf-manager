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
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Key, Mail, User, AlertCircle, Eye, EyeOff } from "lucide-react"
import { useAuth } from "./auth-provider"

interface CloudflareAccount {
  id: string
  name: string
  email: string
  apiKey: string
  accountId: string
  isActive: boolean
}

interface EditAccountDialogProps {
  account: CloudflareAccount
  children: React.ReactNode
}

export function EditAccountDialog({ account, children }: EditAccountDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showApiKey, setShowApiKey] = useState(false)
  const { updateCloudflareAccount } = useAuth()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const apiKey = formData.get("apiKey") as string
    const accountId = formData.get("accountId") as string
    const isActive = formData.get("isActive") === "on"

    try {
      await updateCloudflareAccount(account.id, {
        name,
        email,
        apiKey,
        accountId,
        isActive,
      })

      setOpen(false)
    } catch (err) {
      setError("Failed to update Cloudflare account. Please check your credentials.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Edit Cloudflare Account</DialogTitle>
          <DialogDescription>Update your Cloudflare account details and settings.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Account Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="edit-name"
                name="name"
                defaultValue={account.name}
                placeholder="e.g., Production, Staging"
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-email">Cloudflare Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="edit-email"
                name="email"
                type="email"
                defaultValue={account.email}
                placeholder="your@email.com"
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-api-key">Global API Key</Label>
            <div className="relative">
              <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="edit-api-key"
                name="apiKey"
                type={showApiKey ? "text" : "password"}
                defaultValue={account.apiKey}
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
            <Label htmlFor="edit-account-id">Account ID (Optional)</Label>
            <Input
              id="edit-account-id"
              name="accountId"
              defaultValue={account.accountId}
              placeholder="Account ID for specific account access"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="edit-active" name="isActive" defaultChecked={account.isActive} />
            <Label htmlFor="edit-active">Account is active</Label>
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
              {isLoading ? "Updating..." : "Update Account"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
