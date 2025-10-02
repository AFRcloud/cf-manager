"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Globe,
  ArrowLeft,
  Plus,
  Search,
  MoreHorizontal,
  Settings,
  ExternalLink,
  Copy,
  RefreshCw,
  Trash2,
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { AddDomainDialog } from "@/components/add-domain-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"

export default function AccountDomainsPage() {
  const params = useParams()
  const router = useRouter()
  const { cloudflareAccounts, isLoading } = useAuth()
  const [account, setAccount] = useState<any>(null)
  const [domains, setDomains] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  const accountId = params.accountId as string

  useEffect(() => {
    if (!isLoading && cloudflareAccounts.length > 0) {
      const foundAccount = cloudflareAccounts.find(
        (acc) => acc.id === accountId || acc.name === decodeURIComponent(accountId),
      )
      if (foundAccount) {
        setAccount(foundAccount)
        loadDomains(foundAccount)
      } else {
        router.push("/")
      }
    }
  }, [accountId, cloudflareAccounts, isLoading, router])

  const loadDomains = async (accountData: any) => {
    try {
      setLoading(true)
      const response = await fetch("/api/cloudflare/zones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accounts: [accountData] }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data?.domains) {
          setDomains(data.domains)
        }
      }
    } catch (error) {
      console.error("Error loading domains:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDomain = async (domain: any) => {
    if (!window.confirm(`Are you sure you want to delete ${domain.name}? This action cannot be undone.`)) {
      return
    }

    try {
      console.log(`[v0] Deleting domain ${domain.name}`)

      const response = await fetch("/api/cloudflare/zones/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zoneId: domain.id,
          account: account,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          // Reload domains to reflect the deletion
          loadDomains(account)
          alert(`Domain ${domain.name} has been deleted successfully`)
        } else {
          throw new Error(result.error || "Failed to delete domain")
        }
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }
    } catch (error) {
      console.error("Error deleting domain:", error)
      alert(`Failed to delete domain ${domain.name}: ${error.message}`)
    }
  }

  const filteredDomains = domains.filter((domain) => domain.name.toLowerCase().includes(searchTerm.toLowerCase()))

  if (isLoading || !account) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-6 h-6 md:w-8 md:h-8 bg-primary rounded-lg flex items-center justify-center mx-auto mb-2 md:mb-4">
            <Globe className="w-3 h-3 md:w-5 md:h-5 text-primary-foreground animate-pulse" />
          </div>
          <p className="text-xs md:text-sm text-muted-foreground">Loading domains...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-2 py-2 md:px-6 md:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 md:gap-3 flex-1 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/account/${accountId}`)}
                className="p-1 md:p-2"
              >
                <ArrowLeft className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
                <span className="hidden md:inline">Back to Account</span>
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-sm md:text-xl font-heading font-bold text-foreground truncate">Domains</h1>
                <p className="text-xs md:text-sm text-muted-foreground truncate">{account.name}</p>
              </div>
            </div>
            <AddDomainDialog>
              <Button size="sm" className="px-2 py-1 md:px-4 md:py-2 shrink-0">
                <Plus className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
                <span className="hidden md:inline">Add Domain</span>
              </Button>
            </AddDomainDialog>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-2 py-3 md:px-6 md:py-8">
        {/* Search and Filter */}
        <div className="flex items-center gap-2 mb-3 md:gap-4 md:mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground w-3 h-3 md:w-4 md:h-4" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-7 py-1 text-xs md:pl-10 md:py-2 md:text-sm"
            />
          </div>
          <Badge variant="outline" className="px-2 py-0.5 text-xs md:px-3 md:py-1 md:text-sm whitespace-nowrap">
            {account.name} • {filteredDomains.length}
          </Badge>
        </div>

        <div className="md:hidden">
          {loading ? (
            <div className="text-center py-4">
              <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center mx-auto mb-2">
                <Globe className="w-3 h-3 text-primary-foreground animate-pulse" />
              </div>
              <p className="text-xs text-muted-foreground">Loading...</p>
            </div>
          ) : filteredDomains.length === 0 ? (
            <div className="text-center py-4">
              <Globe className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <h3 className="text-sm font-semibold mb-1">No domains</h3>
              <p className="text-xs text-muted-foreground mb-2">{searchTerm ? "No matches" : "No domains yet"}</p>
              {!searchTerm && (
                <AddDomainDialog>
                  <Button size="sm" className="px-3 py-1">
                    <Plus className="w-3 h-3 mr-1" />
                    Add Domain
                  </Button>
                </AddDomainDialog>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredDomains.map((domain) => (
                <div key={domain.id} className="border rounded p-2 bg-card">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm truncate">{domain.name}</h3>
                        <Badge
                          variant={domain.status === "active" ? "default" : "secondary"}
                          className="text-xs px-1 py-0"
                        >
                          {domain.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {domain.plan} • {new Date(domain.createdOn).toLocaleDateString()}
                      </p>
                      {domain.status === "pending" && domain.nameServers && (
                        <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs">
                          <p className="font-medium text-amber-800 mb-1">⚠️ Setup Required</p>
                          <p className="text-amber-700 mb-1">Update nameservers:</p>
                          <div className="space-y-1">
                            {domain.nameServers.map((ns: string, index: number) => (
                              <code key={index} className="block bg-white px-1 py-0.5 rounded text-xs font-mono">
                                {ns}
                              </code>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="relative">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteDomain(domain)}
                          className="p-1 h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Delete domain"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="z-50 min-w-[160px]">
                            <DropdownMenuItem asChild>
                              <Link href={`/account/${accountId}/dns?domain=${domain.name}`} className="cursor-pointer">
                                <Settings className="mr-2 h-3 w-3" />
                                DNS
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <a
                                href={`https://dash.cloudflare.com/${domain.accountId}/${domain.name}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="cursor-pointer"
                              >
                                <ExternalLink className="mr-2 h-3 w-3" />
                                Cloudflare
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => navigator.clipboard.writeText(domain.name)}
                              className="cursor-pointer"
                            >
                              <Copy className="mr-2 h-3 w-3" />
                              Copy
                            </DropdownMenuItem>
                            {domain.status === "pending" && (
                              <DropdownMenuItem onClick={() => loadDomains(account)} className="cursor-pointer">
                                <RefreshCw className="mr-2 h-3 w-3" />
                                Re-check
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Card className="hidden md:block">
          <CardHeader>
            <CardTitle>Domains for {account.name}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Globe className="w-5 h-5 text-primary-foreground animate-pulse" />
                </div>
                <p className="text-muted-foreground">Loading domains...</p>
              </div>
            ) : filteredDomains.length === 0 ? (
              <div className="text-center py-8">
                <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No domains found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? "No domains match your search." : "This account has no domains yet."}
                </p>
                {!searchTerm && (
                  <AddDomainDialog>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Domain
                    </Button>
                  </AddDomainDialog>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredDomains.map((domain) => (
                  <div key={domain.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{domain.name}</h3>
                        <Badge variant={domain.status === "active" ? "default" : "secondary"}>{domain.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Plan: {domain.plan} • Created: {new Date(domain.createdOn).toLocaleDateString()}
                      </p>
                      {domain.status === "pending" && domain.nameServers && (
                        <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-sm">
                          <p className="font-medium text-amber-800 mb-1">⚠️ Domain Setup Required</p>
                          <p className="text-amber-700 mb-2">Update your nameservers at your registrar:</p>
                          <div className="space-y-1">
                            {domain.nameServers.map((ns: string, index: number) => (
                              <code key={index} className="block bg-white px-2 py-1 rounded text-xs font-mono">
                                {ns}
                              </code>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="relative">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteDomain(domain)}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Delete domain"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="z-50 min-w-[180px]">
                            <DropdownMenuItem asChild>
                              <Link href={`/account/${accountId}/dns?domain=${domain.name}`} className="cursor-pointer">
                                <Settings className="mr-2 h-4 w-4" />
                                DNS Management
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <a
                                href={`https://dash.cloudflare.com/${domain.accountId}/${domain.name}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="cursor-pointer"
                              >
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Open in Cloudflare
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => navigator.clipboard.writeText(domain.name)}
                              className="cursor-pointer"
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              Copy Domain Name
                            </DropdownMenuItem>
                            {domain.status === "pending" && (
                              <DropdownMenuItem onClick={() => loadDomains(account)} className="cursor-pointer">
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Re-check Nameserver
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
