"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
  Edit,
  Trash2,
  Copy,
  Download,
  Upload,
  Shield,
  CheckCircle,
  AlertTriangle,
  Server,
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { AddDNSRecordDialog } from "@/components/add-dns-record-dialog"
import { EditDNSRecordDialog } from "@/components/edit-dns-record-dialog"
import { DeleteDNSRecordDialog } from "@/components/delete-dns-record-dialog"
import Link from "next/link"

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

export default function DNSPage() {
  const { user, cloudflareAccounts } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDomain, setSelectedDomain] = useState("all")
  const [selectedType, setSelectedType] = useState("all")
  const [selectedAccount, setSelectedAccount] = useState<string>("all")
  const [dnsRecords, setDnsRecords] = useState<DNSRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadDNSRecords = async () => {
      setIsLoading(true)

      try {
        console.log("[v0] Fetching DNS records for all accounts")

        const response = await fetch("/api/cloudflare/dns", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            accounts: cloudflareAccounts,
          }),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        if (!data.success) {
          throw new Error("Failed to fetch DNS records")
        }

        // Transform Cloudflare API response to our interface
        const transformedRecords: DNSRecord[] = data.result.map((record: any) => ({
          id: record.id,
          domainName: record.domainName || record.zone_name,
          accountName: record.accountName,
          type: record.type,
          name: record.name,
          content: record.content,
          ttl: record.ttl,
          priority: record.priority,
          proxied: record.proxied,
          createdOn: record.created_on,
          modifiedOn: record.modified_on,
        }))

        console.log(`[v0] Total DNS records loaded: ${transformedRecords.length}`)
        setDnsRecords(transformedRecords)
      } catch (error) {
        console.error("[v0] Error loading DNS records:", error)
        setDnsRecords([])
      } finally {
        setIsLoading(false)
      }
    }

    if (cloudflareAccounts.length > 0) {
      loadDNSRecords()
    } else {
      setIsLoading(false)
    }
  }, [cloudflareAccounts])

  const filteredRecords = dnsRecords.filter((record) => {
    const matchesSearch =
      record.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.domainName.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesDomain = selectedDomain === "all" || record.domainName === selectedDomain
    const matchesType = selectedType === "all" || record.type === selectedType
    const matchesAccount = selectedAccount === "all" || record.accountName === selectedAccount

    return matchesSearch && matchesDomain && matchesType && matchesAccount
  })

  const getRecordTypeBadge = (type: string) => {
    const colors = {
      A: "bg-blue-100 text-blue-800 border-blue-200",
      AAAA: "bg-purple-100 text-purple-800 border-purple-200",
      CNAME: "bg-green-100 text-green-800 border-green-200",
      MX: "bg-orange-100 text-orange-800 border-orange-200",
      TXT: "bg-gray-100 text-gray-800 border-gray-200",
      NS: "bg-indigo-100 text-indigo-800 border-indigo-200",
      SRV: "bg-pink-100 text-pink-800 border-pink-200",
      PTR: "bg-yellow-100 text-yellow-800 border-yellow-200",
    }

    return (
      <Badge className={colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800 border-gray-200"}>
        {type}
      </Badge>
    )
  }

  const getTTLDisplay = (ttl: number) => {
    if (ttl < 60) return `${ttl}s`
    if (ttl < 3600) return `${Math.floor(ttl / 60)}m`
    if (ttl < 86400) return `${Math.floor(ttl / 3600)}h`
    return `${Math.floor(ttl / 86400)}d`
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    console.log("[v0] Copied to clipboard:", text)
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Please log in to access DNS management.</p>
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
              <h2 className="text-lg font-heading font-semibold text-foreground">DNS Management</h2>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <AddDNSRecordDialog>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Record
                </Button>
              </AddDNSRecordDialog>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Records</CardTitle>
              <Server className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-heading font-bold text-foreground">{dnsRecords.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Proxied Records</CardTitle>
              <Shield className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-heading font-bold text-foreground">
                {dnsRecords.filter((r) => r.proxied).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">A Records</CardTitle>
              <CheckCircle className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-heading font-bold text-foreground">
                {dnsRecords.filter((r) => r.type === "A").length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">CNAME Records</CardTitle>
              <Globe className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-heading font-bold text-foreground">
                {dnsRecords.filter((r) => r.type === "CNAME").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* DNS Management */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">DNS Records</CardTitle>
            <CardDescription>Manage DNS records across all your domains</CardDescription>
          </CardHeader>
          <CardContent>
            {cloudflareAccounts.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Server className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-heading font-semibold mb-2">No Cloudflare accounts connected</h3>
                <p className="text-muted-foreground mb-6">
                  Connect your Cloudflare accounts first to manage DNS records.
                </p>
                <Link href="/accounts">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Cloudflare Account
                  </Button>
                </Link>
              </div>
            ) : isLoading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading DNS records...</p>
              </div>
            ) : (
              <>
                {/* Prominent Account Selector */}
                <div className="mb-6 p-4 bg-muted/50 rounded-lg border">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-foreground">Filter by Account</h3>
                    <Badge variant="outline">{filteredRecords.length} records</Badge>
                  </div>
                  <select
                    value={selectedAccount}
                    onChange={(e) => setSelectedAccount(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm"
                  >
                    <option value="all">🌐 All Accounts ({dnsRecords.length} records)</option>
                    {cloudflareAccounts.map((account) => {
                      const accountRecords = dnsRecords.filter((r) => r.accountName === account.name).length
                      return (
                        <option key={account.id} value={account.name}>
                          🏢 {account.name} ({accountRecords} records)
                        </option>
                      )
                    })}
                  </select>
                  {selectedAccount !== "all" && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Showing DNS records for: <strong>{selectedAccount}</strong>
                    </div>
                  )}
                </div>

                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search records..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={selectedDomain} onValueChange={setSelectedDomain}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="All domains" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Domains</SelectItem>
                      {Array.from(
                        new Set(
                          dnsRecords
                            .filter((record) => selectedAccount === "all" || record.accountName === selectedAccount)
                            .map((record) => record.domainName),
                        ),
                      ).map((domain) => (
                        <SelectItem key={domain} value={domain}>
                          {domain}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="w-full sm:w-32">
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="A">A</SelectItem>
                      <SelectItem value="AAAA">AAAA</SelectItem>
                      <SelectItem value="CNAME">CNAME</SelectItem>
                      <SelectItem value="MX">MX</SelectItem>
                      <SelectItem value="TXT">TXT</SelectItem>
                      <SelectItem value="NS">NS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {filteredRecords.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <Server className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-heading font-semibold mb-2">No DNS records found</h3>
                    <p className="text-muted-foreground mb-6">
                      {searchQuery || selectedDomain !== "all" || selectedType !== "all" || selectedAccount !== "all"
                        ? "No records match your search criteria."
                        : "Add your first DNS record to get started."}
                    </p>
                    <AddDNSRecordDialog>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Add DNS Record
                      </Button>
                    </AddDNSRecordDialog>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Content</TableHead>
                          <TableHead>TTL</TableHead>
                          <TableHead>Proxy</TableHead>
                          <TableHead>Domain</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRecords.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell>{getRecordTypeBadge(record.type)}</TableCell>
                            <TableCell>
                              <div className="font-medium">{record.name}</div>
                              {record.priority && (
                                <div className="text-sm text-muted-foreground">Priority: {record.priority}</div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <code className="text-sm bg-muted px-2 py-1 rounded max-w-xs truncate">
                                  {record.content}
                                </code>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => copyToClipboard(record.content)}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{getTTLDisplay(record.ttl)}</Badge>
                            </TableCell>
                            <TableCell>
                              {record.proxied ? (
                                <div className="flex items-center gap-1">
                                  <Shield className="w-3 h-3 text-primary" />
                                  <span className="text-sm text-primary">Proxied</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <Globe className="w-3 h-3 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">DNS Only</span>
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div className="font-medium">{record.domainName}</div>
                                <div className="text-muted-foreground">{record.accountName}</div>
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
                                  <EditDNSRecordDialog record={record}>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>
                                  </EditDNSRecordDialog>
                                  <DropdownMenuItem onClick={() => copyToClipboard(record.content)}>
                                    <Copy className="mr-2 h-4 w-4" />
                                    Copy Content
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DeleteDNSRecordDialog record={record}>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DeleteDNSRecordDialog>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Help Section */}
        <Alert className="mt-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>DNS Management Tips:</strong> Proxied records benefit from Cloudflare's security and performance
            features. Use lower TTL values for records that change frequently. Always test DNS changes before applying
            them to production domains.
          </AlertDescription>
        </Alert>
      </main>
    </div>
  )
}
