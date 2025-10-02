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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Globe, AlertCircle } from "lucide-react"
import { useAuth } from "./auth-provider"

interface AddDomainDialogProps {
  children?: React.ReactNode
}

export function AddDomainDialog({ children }: AddDomainDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [selectedAccount, setSelectedAccount] = useState("")
  const { cloudflareAccounts } = useAuth()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const domainName = formData.get("domainName") as string

    if (!selectedAccount) {
      setError("Please select a Cloudflare account")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/cloudflare/zones/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          domainName,
          accountId: selectedAccount,
          accounts: cloudflareAccounts,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to add domain")
      }

      console.log("[v0] Domain added successfully:", data)

      if (e.currentTarget) {
        e.currentTarget.reset()
      }
      setSelectedAccount("")
      setOpen(false)

      // Refresh the page to show the new domain
      window.location.reload()
    } catch (err) {
      console.error("[v0] Error adding domain:", err)
      setError(err instanceof Error ? err.message : "Failed to add domain. Please check the domain name and try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Add Domain to Cloudflare</DialogTitle>
          <DialogDescription>Add a new domain to one of your connected Cloudflare accounts.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="domain-name">Domain Name</Label>
            <div className="relative">
              <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="domain-name"
                name="domainName"
                placeholder="example.com"
                className="pl-10"
                required
                pattern="^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$"
                title="Please enter a valid domain name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="account-select">Cloudflare Account</Label>
            <Select value={selectedAccount} onValueChange={setSelectedAccount} required>
              <SelectTrigger>
                <SelectValue placeholder="Select an account" />
              </SelectTrigger>
              <SelectContent>
                {cloudflareAccounts
                  .filter((account) => account.isActive)
                  .map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{account.name}</span>
                        <span className="text-sm text-muted-foreground">{account.email}</span>
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
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
            <Button type="submit" disabled={isLoading || cloudflareAccounts.length === 0} className="flex-1">
              {isLoading ? "Adding..." : "Add Domain"}
            </Button>
          </div>
        </form>

        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> After adding a domain, you'll need to update your domain's nameservers to point to
            Cloudflare's nameservers to activate the service.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
