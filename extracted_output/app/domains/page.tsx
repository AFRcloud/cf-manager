"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Plus,
  Search,
  MoreHorizontal,
  Globe,
  Shield,
  Settings,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Activity,
  Lock,
  Unlock,
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { AddDomainDialog } from "@/components/add-domain-dialog"
import Link from "next/link"

interface Domain {
  id: string
  name: string
  accountId: string
  accountName: string
  status: "active" | "pending" | "moved" | "deleted"
  nameServers: string[]
  sslStatus: "active" | "pending" | "off"
  proxyStatus: "proxied" | "dns_only"
  createdOn: string
  modifiedOn: string
  plan: "free" | "pro" | "business" | "enterprise"
}

export default function DomainsPage() {
  const { user, cloudflareAccounts } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTab, setSelectedTab] = useState("all")
  const [selectedAccount, setSelectedAccount] = useState<string>("all")
  const [domains, setDomains] = useState<Domain[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadDomains = async () => {
      if (cloudflareAccounts.length === 0) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        console.log("[v0] Fetching domains for all accounts")

        const response = await fetch("/api/cloudflare/zones", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            accounts: cloudflareAccounts,
          }),
        })

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`)
        }

        const data = await response.json()

        if (data.error) {
          throw new Error(data.error)
        }

        const allDomains: Domain[] = data.domains.map((zone: any) => ({
          id: zone.id,
          name: zone.name,
          accountId: zone.accountId,
          accountName: zone.account,
          status: zone.status,
          nameServers: zone.nameServers || [],
          sslStatus: "active", // Default SSL status
          proxyStatus: zone.paused ? "dns_only" : "proxied",
          createdOn: zone.createdOn,
          modifiedOn: zone.modifiedOn,
          plan: zone.plan?.toLowerCase() || "free",
        }))

        console.log("[v0] Total domains loaded:", allDomains.length)
        setDomains(allDomains)
      } catch (err) {
        console.error("[v0] Error loading domains:", err)
        setError("Failed to load domains. Please check your API keys and try again.")
      } finally {
        setIsLoading(false)
      }
    }

    loadDomains()
  }, [cloudflareAccounts])

  const filteredDomains = domains.filter((domain) => {
    const matchesSearch = domain.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesAccount = selectedAccount === "all" || domain.accountName === selectedAccount
    const matchesTab =
      selectedTab === "all" ||
      (selectedTab === "active" && domain.status === "active") ||
      (selectedTab === "pending" && domain.status === "pending") ||
      (selectedTab === "proxied" && domain.proxyStatus === "proxied") ||
      (selectedTab === "dns_only" && domain.proxyStatus === "dns_only")

    return matchesSearch && matchesTab && matchesAccount
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>
      case "pending":
        return <Badge variant="secondary">Pending</Badge>
      case "moved":
        return <Badge variant="outline">Moved</Badge>
      case "deleted":
        return <Badge variant="destructive">Deleted</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getSSLBadge = (sslStatus: string) => {
    switch (sslStatus) {
      case "active":
        return (
          <div className="flex items-center gap-1">
            <Lock className="w-3 h-3 text-green-600" />
            <span className="text-sm text-green-600">Active</span>
          </div>
        )
      case "pending":
        return (
          <div className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-yellow-600" />
            <span className="text-sm text-yellow-600">Pending</span>
          </div>
        )
      case "off":
        return (
          <div className="flex items-center gap-1">
            <Unlock className="w-3 h-3 text-red-600" />
            <span className="text-sm text-red-600">Off</span>
          </div>
        )
      default:
        return <span className="text-sm text-muted-foreground">{sslStatus}</span>
    }
  }

  const getProxyBadge = (proxyStatus: string) => {
    switch (proxyStatus) {
      case "proxied":
        return (
          <div className="flex items-center gap-1">
            <Shield className="w-3 h-3 text-primary" />
            <span className="text-sm text-primary">Proxied</span>
          </div>
        )
      case "dns_only":
        return (
          <div className="flex items-center gap-1">
            <Globe className="w-3 h-3 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">DNS Only</span>
          </div>
        )
      default:
        return <span className="text-sm text-muted-foreground">{proxyStatus}</span>
    }
  }

  const handleRemoveDomain = async (domainId: string, domainName: string, accountName: string) => {
    try {
      console.log(`[v0] Removing domain ${domainName} from account ${accountName}`)

      // Find the account for this domain
      const account = cloudflareAccounts.find((acc) => acc.name === accountName)
      if (!account) {
        throw new Error("Account not found")
      }

      const response = await fetch("/api/cloudflare/zones/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          zoneId: domainId,
          account: account,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to remove domain: ${response.status}`)
      }

      const result = await response.json()

      if (result.error) {
        throw new Error(result.error)
      }

      console.log(`[v0] Successfully removed domain ${domainName}`)

      // Remove domain from local state
      setDomains((prev) => prev.filter((d) => d.id !== domainId))

      // You could add a toast notification here
      alert(`Domain ${domainName} has been removed successfully`)
    } catch (error) {
      console.error(`[v0] Error removing domain:`, error)
      alert(`Failed to remove domain ${domainName}. Please try again.`)
    }
  }

  const handleRecheckNameserver = async (domainId: string, domainName: string, accountName: string) => {
    try {
      console.log(`[v0] Re-checking nameserver for domain ${domainName}`)

      // Find the account for this domain
      const account = cloudflareAccounts.find((acc) => acc.name === accountName)
      if (!account) {
        throw new Error("Account not found")
      }

      const response = await fetch("/api/cloudflare/zones/recheck", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          zoneId: domainId,
          accountId: account.id,
          accounts: cloudflareAccounts,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to recheck nameserver: ${response.status}`)
      }

      const result = await response.json()

      if (result.error) {
        throw new Error(result.error)
      }

      console.log(`[v0] Nameserver recheck result:`, result.zone?.status)

      // Update domain status in local state
      setDomains((prev) =>
        prev.map((d) =>
          d.id === domainId
            ? {
                ...d,
                status: result.zone?.status || d.status,
                modifiedOn: new Date().toISOString(),
              }
            : d,
        ),
      )

      // Show result to user
      alert(`${result.message || `Domain ${domainName} status updated`}`)
    } catch (error) {
      console.error(`[v0] Error rechecking nameserver:`, error)
      alert(`Failed to recheck nameserver for ${domainName}. Please try again.`)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Please log in to access domain management.</p>
          <Link href="/login">
            <Button className="mt-4">Go to Login</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Globe className="w-5 h-5 text-primary-foreground" />
                </div>
                <h1 className="text-xl font-heading font-bold text-foreground">Cloudflare Manager</h1>
              </Link>
              <span className="text-muted-foreground">/</span>
              <h2 className="text-lg font-heading font-semibold text-foreground">Domain Management</h2>
            </div>
            <AddDomainDialog>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Domain
              </Button>
            </AddDomainDialog>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Domains</CardTitle>
              <Globe className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-heading font-bold text-foreground">{domains.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Domains</CardTitle>
              <CheckCircle className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-heading font-bold text-foreground">
                {domains.filter((d) => d.status === "active").length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">SSL Enabled</CardTitle>
              <Lock className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-heading font-bold text-foreground">
                {domains.filter((d) => d.sslStatus === "active").length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Proxied</CardTitle>
              <Shield className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-heading font-bold text-foreground">
                {domains.filter((d) => d.proxyStatus === "proxied").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Domains Management */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Domain Management</CardTitle>
            <CardDescription>Manage all domains across your Cloudflare accounts</CardDescription>
          </CardHeader>
          <CardContent>
            {cloudflareAccounts.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Globe className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-heading font-semibold mb-2">No Cloudflare accounts connected</h3>
                <p className="text-muted-foreground mb-6">
                  Connect your Cloudflare accounts first to manage your domains.
                </p>
                <Link href="/accounts">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Cloudflare Account
                  </Button>
                </Link>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-lg font-heading font-semibold mb-2">Error loading domains</h3>
                <p className="text-muted-foreground mb-6">{error}</p>
                <Button onClick={() => window.location.reload()}>Try Again</Button>
              </div>
            ) : isLoading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading domains from Cloudflare...</p>
              </div>
            ) : (
              <>
                <div className="mb-6 p-4 bg-muted/50 rounded-lg border">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-foreground">Filter by Account</h3>
                    <Badge variant="outline">{filteredDomains.length} domains</Badge>
                  </div>
                  <select
                    value={selectedAccount}
                    onChange={(e) => setSelectedAccount(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm"
                  >
                    <option value="all">🌐 All Accounts ({domains.length} domains)</option>
                    {cloudflareAccounts.map((account) => {
                      const accountDomains = domains.filter((d) => d.accountName === account.name).length
                      return (
                        <option key={account.id} value={account.name}>
                          🏢 {account.name} ({accountDomains} domains)
                        </option>
                      )
                    })}
                  </select>
                  {selectedAccount !== "all" && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Showing domains for: <strong>{selectedAccount}</strong>
                    </div>
                  )}
                </div>

                {/* Search and Filters */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search domains..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="all">All ({domains.length})</TabsTrigger>
                    <TabsTrigger value="active">
                      Active ({domains.filter((d) => d.status === "active").length})
                    </TabsTrigger>
                    <TabsTrigger value="pending">
                      Pending ({domains.filter((d) => d.status === "pending").length})
                    </TabsTrigger>
                    <TabsTrigger value="proxied">
                      Proxied ({domains.filter((d) => d.proxyStatus === "proxied").length})
                    </TabsTrigger>
                    <TabsTrigger value="dns_only">
                      DNS Only ({domains.filter((d) => d.proxyStatus === "dns_only").length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value={selectedTab} className="mt-6">
                    {filteredDomains.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                          <Globe className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-heading font-semibold mb-2">No domains found</h3>
                        <p className="text-muted-foreground mb-6">
                          {searchQuery
                            ? "No domains match your search criteria."
                            : "Add your first domain to get started."}
                        </p>
                        <AddDomainDialog>
                          <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Domain
                          </Button>
                        </AddDomainDialog>
                      </div>
                    ) : (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Domain Name</TableHead>
                              <TableHead>Account</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>SSL</TableHead>
                              <TableHead>Proxy</TableHead>
                              <TableHead>Plan</TableHead>
                              <TableHead>Nameservers</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredDomains.map((domain) => (
                              <TableRow key={domain.id}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-muted-foreground" />
                                    <div>
                                      <div className="font-medium">{domain.name}</div>
                                      <div className="text-sm text-muted-foreground">
                                        Created {new Date(domain.createdOn).toLocaleDateString()}
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    <div className="font-medium">{domain.accountName}</div>
                                  </div>
                                </TableCell>
                                <TableCell>{getStatusBadge(domain.status)}</TableCell>
                                <TableCell>{getSSLBadge(domain.sslStatus)}</TableCell>
                                <TableCell>{getProxyBadge(domain.proxyStatus)}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="capitalize">
                                    {domain.plan}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    {domain.nameServers && domain.nameServers.length > 0 ? (
                                      <div className="space-y-1">
                                        {domain.nameServers.map((ns, index) => (
                                          <div key={index} className="font-mono text-xs bg-muted px-2 py-1 rounded">
                                            {ns}
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="text-muted-foreground">Not available</span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" className="h-8 w-8 p-0">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                        onClick={() => {
                                          // Navigate to DNS management for this domain
                                          window.location.href = `/dns?domain=${domain.name}&account=${domain.accountName}`
                                        }}
                                      >
                                        <Settings className="mr-2 h-4 w-4" />
                                        DNS Management
                                      </DropdownMenuItem>
                                      {domain.status === "pending" && (
                                        <DropdownMenuItem
                                          onClick={() => {
                                            handleRecheckNameserver(domain.id, domain.name, domain.accountName)
                                          }}
                                        >
                                          <Activity className="mr-2 h-4 w-4" />
                                          Re-check Nameserver
                                        </DropdownMenuItem>
                                      )}
                                      <DropdownMenuItem
                                        onClick={() => {
                                          // Open Cloudflare dashboard for this domain
                                          window.open(
                                            `https://dash.cloudflare.com/${domain.accountId}/${domain.name}`,
                                            "_blank",
                                          )
                                        }}
                                      >
                                        <ExternalLink className="mr-2 h-4 w-4" />
                                        Open in Cloudflare
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => {
                                          // Copy domain name to clipboard
                                          navigator.clipboard.writeText(domain.name)
                                          // You could add a toast notification here
                                          console.log(`[v0] Copied ${domain.name} to clipboard`)
                                        }}
                                      >
                                        <Activity className="mr-2 h-4 w-4" />
                                        Copy Domain Name
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        className="text-destructive"
                                        onClick={() => {
                                          // Confirm before removing domain
                                          if (
                                            window.confirm(
                                              `Are you sure you want to remove ${domain.name} from Cloudflare? This action cannot be undone.`,
                                            )
                                          ) {
                                            handleRemoveDomain(domain.id, domain.name, domain.accountName)
                                          }
                                        }}
                                      >
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Remove Domain
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </>
            )}
          </CardContent>
        </Card>

        {/* Pending Domains Alert */}
        {domains.some((d) => d.status === "pending") && (
          <Alert className="mt-6 border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Pending Domains Detected:</strong> You have domains with pending status. To activate them, update
              your domain's nameservers at your registrar to use the Cloudflare nameservers shown in the table above.
              {domains
                .filter((d) => d.status === "pending")
                .map((domain) => (
                  <div key={domain.id} className="mt-2 p-2 bg-yellow-100 rounded border">
                    <div className="font-medium">{domain.name}</div>
                    <div className="text-sm mt-1">
                      <strong>Cloudflare Nameservers:</strong>
                      <div className="mt-1 space-y-1">
                        {domain.nameServers.map((ns, index) => (
                          <div key={index} className="font-mono text-xs bg-white px-2 py-1 rounded border">
                            {ns}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
            </AlertDescription>
          </Alert>
        )}

        {/* Help Section */}
        <Alert className="mt-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Domain Management Tips: Proxied domains benefit from Cloudflare&apos;s security and performance features,
            while DNS-only domains bypass the proxy. SSL certificates are automatically provisioned for proxied domains.
          </AlertDescription>
        </Alert>
      </main>
    </div>
  )
}
