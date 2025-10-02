"use client"

import type React from "react"

import { useState, useEffect } from "react"
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

interface AddDNSRecordDialogProps {
  children?: React.ReactNode
}

export function AddDNSRecordDialog({ children }: AddDNSRecordDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [selectedDomain, setSelectedDomain] = useState("")
  const [recordType, setRecordType] = useState("")
  const [proxied, setProxied] = useState(false)
  const [availableDomains, setAvailableDomains] = useState<Array<{ id: string; name: string }>>([])
  const [loadingDomains, setLoadingDomains] = useState(false)
  const { cloudflareAccounts } = useAuth()

  useEffect(() => {
    if (open && cloudflareAccounts.length > 0) {
      fetchAvailableDomains()
    }
  }, [open, cloudflareAccounts])

  const fetchAvailableDomains = async () => {
    setLoadingDomains(true)
    try {
      const response = await fetch("/api/cloudflare/zones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accounts: cloudflareAccounts }),
      })

      if (!response.ok) throw new Error("Failed to fetch domains")

      const data = await response.json()
      const domains = data.domains || []
      setAvailableDomains(domains)
      console.log("[v0] Fetched available domains:", domains)
    } catch (err) {
      console.error("[v0] Error fetching domains:", err)
      setError("Failed to load domains")
    } finally {
      setLoadingDomains(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const content = formData.get("content") as string
    const ttl = Number.parseInt(formData.get("ttl") as string)
    const priority = formData.get("priority") ? Number.parseInt(formData.get("priority") as string) : undefined

    if (!selectedDomain || !recordType) {
      setError("Please select a domain and record type")
      setIsLoading(false)
      return
    }

    try {
      const selectedDomainData = availableDomains.find((d) => d.name === selectedDomain)
      if (!selectedDomainData) {
        throw new Error("Domain not found")
      }

      const account = cloudflareAccounts.find((acc) =>
        availableDomains.some((domain) => domain.name === selectedDomain),
      )

      if (!account) {
        throw new Error("Account not found for selected domain")
      }

      const response = await fetch("/api/cloudflare/dns/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zoneId: selectedDomainData.id,
          account,
          record: {
            type: recordType,
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
        throw new Error(errorData.error || "Failed to add DNS record")
      }

      console.log("[v0] Successfully added DNS record:", {
        domain: selectedDomain,
        type: recordType,
        name,
        content,
        ttl,
        priority,
        proxied,
      })

      setOpen(false)
      e.currentTarget.reset()
      setSelectedDomain("")
      setRecordType("")
      setProxied(false)

      window.location.reload()
    } catch (err) {
      console.error("[v0] Error adding DNS record:", err)
      setError(err instanceof Error ? err.message : "Failed to add DNS record. Please check your input and try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const getRecordTypeHelp = (type: string) => {
    switch (type) {
      case "A":
        return "Points to an IPv4 address (e.g., 192.168.1.1)"
      case "AAAA":
        return "Points to an IPv6 address (e.g., 2001:db8::1)"
      case "CNAME":
        return "Points to another domain name (e.g., example.com)"
      case "MX":
        return "Mail exchange record (e.g., mail.example.com)"
      case "TXT":
        return "Text record for verification or configuration"
      case "NS":
        return "Name server record"
      case "SRV":
        return "Service record for specific services"
      default:
        return "Select a record type to see help"
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
          <DialogTitle className="font-heading">Add DNS Record</DialogTitle>
          <DialogDescription>Create a new DNS record for one of your domains.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="domain-select">Domain</Label>
              <Select value={selectedDomain} onValueChange={setSelectedDomain} required>
                <SelectTrigger>
                  <SelectValue placeholder={loadingDomains ? "Loading domains..." : "Select domain"} />
                </SelectTrigger>
                <SelectContent>
                  {availableDomains.map((domain) => (
                    <SelectItem key={domain.id} value={domain.name}>
                      {domain.name}
                    </SelectItem>
                  ))}
                  {availableDomains.length === 0 && !loadingDomains && (
                    <SelectItem value="" disabled>
                      No domains available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type-select">Type</Label>
              <Select value={recordType} onValueChange={setRecordType} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="AAAA">AAAA</SelectItem>
                  <SelectItem value="CNAME">CNAME</SelectItem>
                  <SelectItem value="MX">MX</SelectItem>
                  <SelectItem value="TXT">TXT</SelectItem>
                  <SelectItem value="NS">NS</SelectItem>
                  <SelectItem value="SRV">SRV</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <div className="relative">
              <Server className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="name"
                name="name"
                placeholder="@ for root domain, or subdomain name"
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Input
              id="content"
              name="content"
              placeholder={
                recordType === "A"
                  ? "192.168.1.1"
                  : recordType === "CNAME"
                    ? "example.com"
                    : recordType === "MX"
                      ? "mail.example.com"
                      : "Record content"
              }
              required
            />
            {recordType && <p className="text-xs text-muted-foreground">{getRecordTypeHelp(recordType)}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ttl">TTL (seconds)</Label>
              <Select name="ttl" defaultValue="300">
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

            {recordType === "MX" && (
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Input id="priority" name="priority" type="number" placeholder="10" min="0" max="65535" />
              </div>
            )}
          </div>

          {canBeProxied(recordType) && (
            <div className="flex items-center space-x-2">
              <Switch id="proxied" checked={proxied} onCheckedChange={setProxied} />
              <Label htmlFor="proxied">Proxy through Cloudflare</Label>
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
            <Button
              type="submit"
              disabled={isLoading || cloudflareAccounts.length === 0 || availableDomains.length === 0}
              className="flex-1"
            >
              {isLoading ? "Adding..." : "Add Record"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
