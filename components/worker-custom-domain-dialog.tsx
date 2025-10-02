"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus, ExternalLink } from "lucide-react"
import { useAuth } from "@/components/auth-provider"

interface WorkerCustomDomainDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  worker: any
  account: any
}

export function WorkerCustomDomainDialog({ open, onOpenChange, worker, account }: WorkerCustomDomainDialogProps) {
  const [domains, setDomains] = useState<any[]>([])
  const [availableZones, setAvailableZones] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [newDomain, setNewDomain] = useState({
    hostname: "",
    zoneId: "",
  })
  const { cloudflareAccounts } = useAuth()

  useEffect(() => {
    if (open && account && worker) {
      fetchWorkerDomains()
      fetchAvailableZones()
    }
  }, [open, account, worker])

  const fetchWorkerDomains = async () => {
    if (!worker?.id) return

    try {
      setLoading(true)
      console.log("[v0] Fetching domains for worker:", worker.id)
      console.log("[v0] Account:", account.name)

      const response = await fetch(`/api/cloudflare/workers/domains`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "get",
          account: account,
          workerId: worker.id,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Raw domains response:", data.result)

        const workerDomains = (data.result || []).filter((domain: any) => {
          const isMatch = domain.service === worker.id || domain.worker_id === worker.id
          console.log(
            "[v0] Domain:",
            domain.hostname,
            "Service:",
            domain.service,
            "Worker ID:",
            worker.id,
            "Match:",
            isMatch,
          )
          return isMatch
        })

        console.log("[v0] Filtered domains for worker", worker.id, ":", workerDomains)
        setDomains(workerDomains)
      }
    } catch (error) {
      console.error("Error fetching worker domains:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableZones = async () => {
    try {
      const response = await fetch("/api/cloudflare/zones", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accounts: cloudflareAccounts,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const accountZones = data.domains?.filter((zone: any) => zone.account === account.name) || []
        setAvailableZones(accountZones)
      } else {
        console.error("Error fetching zones:", response.status, response.statusText)
      }
    } catch (error) {
      console.error("Error fetching zones:", error)
    }
  }

  const handleAddDomain = async () => {
    if (!newDomain.hostname || !newDomain.zoneId || !worker?.id) return

    try {
      setLoading(true)
      const response = await fetch("/api/cloudflare/workers/domains", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "add",
          account: account,
          hostname: newDomain.hostname,
          service: worker.id,
          zoneId: newDomain.zoneId,
        }),
      })

      if (response.ok) {
        setNewDomain({ hostname: "", zoneId: "" })
        await fetchWorkerDomains()
      } else {
        const error = await response.json()
        console.error("Error adding domain:", error)
      }
    } catch (error) {
      console.error("Error adding domain:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveDomain = async (domainId: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/cloudflare/workers/domains`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "delete",
          account: account,
          domainId: domainId,
        }),
      })

      if (response.ok) {
        // Always refresh data after successful delete, regardless of response parsing
        await fetchWorkerDomains()
        console.log("[v0] Domain deleted successfully, data refreshed")
      } else {
        const errorText = await response.text()
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { error: errorText || "Failed to delete domain" }
        }
        console.error("Error removing domain:", errorData)
        alert(`Failed to delete domain: ${errorData.error || "Unknown error"}`)
      }
    } catch (error) {
      console.error("Error removing domain:", error)
      alert(`Network error: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }

  if (!worker || !account) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Custom Domains - {worker?.id || "Unknown Worker"}</DialogTitle>
          <DialogDescription>Manage custom domains for this Cloudflare Worker</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 overflow-hidden flex-1">
          {/* Add New Domain Form - Always visible at top */}
          <div className="flex-shrink-0 border rounded-lg p-4 bg-muted/20">
            <Label className="text-sm font-medium">Add New Domain</Label>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="hostname" className="text-xs">
                  Hostname
                </Label>
                <Input
                  id="hostname"
                  placeholder="api.example.com"
                  value={newDomain.hostname}
                  onChange={(e) => setNewDomain((prev) => ({ ...prev, hostname: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="zone" className="text-xs">
                  Zone
                </Label>
                <Select
                  value={newDomain.zoneId}
                  onValueChange={(value) => setNewDomain((prev) => ({ ...prev, zoneId: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a zone" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableZones.map((zone) => (
                      <SelectItem key={zone.id} value={zone.id}>
                        {zone.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              onClick={handleAddDomain}
              disabled={loading || !newDomain.hostname || !newDomain.zoneId}
              className="w-full mt-4"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Custom Domain
            </Button>
          </div>

          {/* Current Domains List - Scrollable */}
          <div className="flex-1 overflow-hidden">
            <Label className="text-sm font-medium">Current Domains ({domains.length})</Label>
            <div className="mt-2 h-64 overflow-y-auto space-y-2 pr-2 border rounded-lg">
              {domains.length === 0 ? (
                <div className="flex items-center justify-center p-8 border-2 border-dashed rounded-lg">
                  <p className="text-sm text-muted-foreground">No custom domains configured</p>
                </div>
              ) : (
                domains.map((domain) => (
                  <div
                    key={domain.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{domain.hostname}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-muted-foreground">Environment: {domain.environment}</p>
                          <Badge variant="outline" className="text-xs">
                            {domain.zone_name}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`https://${domain.hostname}`, "_blank")}
                        className="h-8 w-8 p-0"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRemoveDomain(domain.id)}
                        disabled={loading}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
