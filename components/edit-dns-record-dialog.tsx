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
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Server, AlertCircle } from "lucide-react"
import { useAuth } from "./auth-provider"

interface DNSRecord {
  id: string
  domainName: string
  accountName: string
  type: "A" | "AAAA" | "CNAME" | "MX" | "TXT" | "NS" | "SRV" | "PTR"
  name: string
  content: string
  ttl: number
  priority?: number
  proxied: boolean
  createdOn: string
  modifiedOn: string
}

interface EditDNSRecordDialogProps {
  record: DNSRecord
  children: React.ReactNode
}

export function EditDNSRecordDialog({ record, children }: EditDNSRecordDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [proxied, setProxied] = useState(record.proxied)
  const { cloudflareAccounts } = useAuth()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const content = formData.get("content") as string
    const ttl = Number.parseInt(formData.get("ttl") as string)
    const priority = formData.get("priority") ? Number.parseInt(formData.get("priority") as string) : undefined

    try {
      const account = cloudflareAccounts.find((acc) => acc.name === record.accountName)

      if (!account) {
        throw new Error("Account not found")
      }

      const response = await fetch("/api/cloudflare/dns/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zoneId: record.domainName, // This should be the zone ID, might need adjustment
          recordId: record.id,
          account,
          record: {
            type: record.type,
            name,
            content,
            ttl,
            priority,
            proxied,
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update DNS record")
      }

      console.log("[v0] Successfully updated DNS record:", {
        id: record.id,
        name,
        content,
        ttl,
        priority,
        proxied,
      })

      setOpen(false)

      // Refresh the page to show updated record
      window.location.reload()
    } catch (err) {
      console.error("[v0] Error updating DNS record:", err)
      setError(
        err instanceof Error ? err.message : "Failed to update DNS record. Please check your input and try again.",
      )
    } finally {
      setIsLoading(false)
    }
  }

  const canBeProxied = (type: string) => {
    return ["A", "AAAA", "CNAME"].includes(type)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Edit DNS Record</DialogTitle>
          <DialogDescription>Update the DNS record for {record.domainName}.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Domain</Label>
              <Input value={record.domainName} disabled className="bg-muted" />
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Input value={record.type} disabled className="bg-muted" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-name">Name</Label>
            <div className="relative">
              <Server className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="edit-name"
                name="name"
                defaultValue={record.name}
                placeholder="@ for root domain, or subdomain name"
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-content">Content</Label>
            <Input id="edit-content" name="content" defaultValue={record.content} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-ttl">TTL (seconds)</Label>
              <Select name="ttl" defaultValue={record.ttl.toString()}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="60">1 minute</SelectItem>
                  <SelectItem value="300">5 minutes</SelectItem>
                  <SelectItem value="1800">30 minutes</SelectItem>
                  <SelectItem value="3600">1 hour</SelectItem>
                  <SelectItem value="86400">1 day</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {record.type === "MX" && (
              <div className="space-y-2">
                <Label htmlFor="edit-priority">Priority</Label>
                <Input
                  id="edit-priority"
                  name="priority"
                  type="number"
                  defaultValue={record.priority}
                  min="0"
                  max="65535"
                />
              </div>
            )}
          </div>

          {canBeProxied(record.type) && (
            <div className="flex items-center space-x-2">
              <Switch id="edit-proxied" checked={proxied} onCheckedChange={setProxied} />
              <Label htmlFor="edit-proxied">Proxy through Cloudflare</Label>
            </div>
          )}

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
              {isLoading ? "Updating..." : "Update Record"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
