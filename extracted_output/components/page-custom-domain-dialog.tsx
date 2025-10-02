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
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus, ExternalLink, AlertCircle } from "lucide-react"
import { useAuth } from "@/components/auth-provider"

interface PageCustomDomainDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  page: any
  account: any
}

export function PageCustomDomainDialog({ open, onOpenChange, page, account }: PageCustomDomainDialogProps) {
  const [domains, setDomains] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [newDomain, setNewDomain] = useState("")
  const [domainError, setDomainError] = useState("")
  const { cloudflareAccounts } = useAuth()

  const validateDomain = (domain: string): string => {
    if (!domain.trim()) return ""

    const cleanDomain = domain.replace(/^https?:\/\//, "").trim()

    if (cleanDomain.includes(" ")) {
      return "Domain cannot contain spaces"
    }

    if (cleanDomain.length < 3) {
      return "Domain is too short"
    }

    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
    if (!domainRegex.test(cleanDomain)) {
      return "Invalid domain format"
    }

    const parts = cleanDomain.split(".")
    if (parts.length < 2) {
      return "Domain must have a valid TLD (e.g., .com, .org)"
    }

    const tld = parts[parts.length - 1].toLowerCase()
    const validTlds = [
      "com",
      "org",
      "net",
      "edu",
      "gov",
      "mil",
      "int",
      "co",
      "io",
      "ai",
      "app",
      "dev",
      "tech",
      "info",
      "biz",
      "name",
      "pro",
      "museum",
      "aero",
      "coop",
      "jobs",
      "mobi",
      "travel",
      "xxx",
      "cat",
      "tel",
      "asia",
      "post",
      "geo",
      "tk",
      "ml",
      "ga",
      "cf",
      "me",
      "tv",
      "cc",
      "ws",
      "bz",
      "nu",
      "tk",
      "ly",
      "be",
      "it",
      "de",
      "fr",
      "uk",
      "us",
      "ca",
      "au",
      "jp",
      "cn",
      "in",
      "br",
      "mx",
      "ru",
      "nl",
      "se",
      "no",
      "dk",
      "fi",
      "es",
      "pt",
      "pl",
      "cz",
      "sk",
      "hu",
      "ro",
      "bg",
      "hr",
      "si",
      "ee",
      "lv",
      "lt",
      "lu",
      "mt",
      "cy",
      "ie",
      "at",
      "ch",
      "li",
      "is",
      "fo",
      "ad",
      "mc",
      "sm",
      "va",
      "gi",
      "im",
      "gg",
      "je",
      "ac",
      "sh",
      "tc",
      "vg",
      "ms",
      "ai",
      "ag",
      "bb",
      "bm",
      "bs",
      "dm",
      "gd",
      "jm",
      "kn",
      "lc",
      "tt",
      "vc",
      "ky",
      "pr",
      "vi",
      "as",
      "gu",
      "mp",
      "pw",
      "fm",
      "mh",
      "ki",
      "nr",
      "tv",
      "to",
      "ws",
      "vu",
      "sb",
      "fj",
      "pg",
      "nc",
      "pf",
      "wf",
      "ck",
      "nu",
      "tk",
    ]

    if (!validTlds.includes(tld)) {
      return `Invalid TLD ".${tld}". Please use a valid domain extension like .com, .org, .net`
    }

    return ""
  }

  const handleDomainChange = (value: string) => {
    setNewDomain(value)
    const error = validateDomain(value)
    setDomainError(error)
  }

  useEffect(() => {
    if (open && account && page) {
      fetchPageDomains()
    }
  }, [open, account, page])

  const fetchPageDomains = async () => {
    if (!page?.name) return

    try {
      setLoading(true)
      console.log("[v0] Fetching domains for page:", page.name)
      console.log("[v0] Account:", account.name)

      const response = await fetch(`/api/cloudflare/pages/domains`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "get",
          account: account,
          pageName: page.name,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Full API response:", data)
        console.log("[v0] Response result:", data.result)
        console.log("[v0] Response result type:", typeof data.result)

        let domainList = []

        if (Array.isArray(data.result)) {
          domainList = data.result
        } else if (data.result && Array.isArray(data.result.result)) {
          // Handle nested result structure
          domainList = data.result.result
        } else if (data.result && data.result.domains && Array.isArray(data.result.domains)) {
          // Handle domains property
          domainList = data.result.domains
        } else if (data.domains && Array.isArray(data.domains)) {
          // Handle direct domains property
          domainList = data.domains
        }

        console.log("[v0] Parsed domain list:", domainList)
        console.log("[v0] Domain list length:", domainList.length)

        setDomains(domainList)
      } else {
        const errorText = await response.text()
        console.error("[v0] API error response:", errorText)
        try {
          const errorData = JSON.parse(errorText)
          console.error("[v0] Parsed error data:", errorData)
        } catch (e) {
          console.error("[v0] Could not parse error response as JSON")
        }
      }
    } catch (error) {
      console.error("[v0] Network error fetching page domains:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddDomain = async () => {
    if (!newDomain || !page?.name) return

    const validationError = validateDomain(newDomain)
    if (validationError) {
      setDomainError(validationError)
      return
    }

    const cleanDomain = newDomain.replace(/^https?:\/\//, "").trim()
    const isDuplicate = domains.some((domain) => domain.name?.toLowerCase() === cleanDomain.toLowerCase())

    if (isDuplicate) {
      setDomainError("This domain is already added to this project")
      return
    }

    try {
      setLoading(true)

      const response = await fetch("/api/cloudflare/pages/domains", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "add",
          account: account,
          pageName: page.name,
          hostname: cleanDomain,
        }),
      })

      if (response.ok) {
        setNewDomain("")
        setDomainError("")
        await fetchPageDomains()
      } else {
        const error = await response.json()
        console.error("Error adding domain:", error)

        if (error.error?.includes("8000018") || error.error?.includes("already added this custom domain")) {
          setDomainError("This domain is already configured for this project")
          // Refresh domains list to show current state
          await fetchPageDomains()
        } else if (error.error?.includes("8000015") || error.error?.includes("invalid TLD")) {
          setDomainError("Invalid domain format or TLD")
        } else {
          alert(`Failed to add domain: ${error.error || "Unknown error"}`)
        }
      }
    } catch (error) {
      console.error("Error adding domain:", error)
      alert(`Network error: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveDomain = async (domainName: string) => {
    if (!confirm(`Are you sure you want to remove domain "${domainName}"?`)) return

    try {
      setLoading(true)
      const response = await fetch(`/api/cloudflare/pages/domains`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "delete",
          account: account,
          pageName: page.name,
          hostname: domainName,
        }),
      })

      if (response.ok) {
        await fetchPageDomains()
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

  if (!page || !account) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Custom Domains - {page?.name || "Unknown Page"}</DialogTitle>
          <DialogDescription>Manage custom domains for this Cloudflare Page</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 overflow-hidden flex-1">
          {/* Add New Domain Form */}
          <div className="flex-shrink-0 border rounded-lg p-4 bg-muted/20">
            <Label className="text-sm font-medium">Add New Domain</Label>
            <div className="mt-3 flex gap-4">
              <div className="flex-1">
                <Label htmlFor="hostname" className="text-xs">
                  Domain Name
                </Label>
                <Input
                  id="hostname"
                  placeholder="www.example.com"
                  value={newDomain}
                  onChange={(e) => handleDomainChange(e.target.value)}
                  className={`mt-1 ${domainError ? "border-red-500" : ""}`}
                />
                {domainError && (
                  <div className="flex items-center gap-1 mt-1 text-red-600 text-xs">
                    <AlertCircle className="w-3 h-3" />
                    {domainError}
                  </div>
                )}
              </div>
            </div>
            <Button onClick={handleAddDomain} disabled={loading || !newDomain || !!domainError} className="w-full mt-4">
              <Plus className="w-4 h-4 mr-2" />
              Add Custom Domain
            </Button>
          </div>

          {/* Current Domains List */}
          <div className="flex-1 overflow-hidden">
            <Label className="text-sm font-medium">Current Domains ({domains.length})</Label>
            <div className="mt-2 max-h-80 overflow-y-auto space-y-2 pr-2 border rounded-lg p-2">
              {domains.length === 0 ? (
                <div className="flex items-center justify-center p-8 border-2 border-dashed rounded-lg">
                  <p className="text-sm text-muted-foreground">No custom domains configured</p>
                </div>
              ) : (
                domains.map((domain, index) => (
                  <div
                    key={domain.name || index}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{domain.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={domain.status === "active" ? "default" : "secondary"} className="text-xs">
                            {domain.status || "pending"}
                          </Badge>
                          {domain.validation_method && (
                            <Badge variant="outline" className="text-xs">
                              {domain.validation_method}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`https://${domain.name}`, "_blank")}
                        className="h-8 w-8 p-0"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRemoveDomain(domain.name)}
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
