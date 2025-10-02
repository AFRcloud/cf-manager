"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Server, ArrowLeft, Plus, Search, MoreHorizontal, Edit, Trash2 } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { AddDNSRecordDialog } from "@/components/add-dns-record-dialog"
import { EditDNSRecordDialog } from "@/components/edit-dns-record-dialog"
import { DeleteDNSRecordDialog } from "@/components/delete-dns-record-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function AccountDNSPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { cloudflareAccounts, isLoading } = useAuth()
  const [account, setAccount] = useState<any>(null)
  const [dnsRecords, setDnsRecords] = useState<any[]>([])
  const [domains, setDomains] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDomain, setSelectedDomain] = useState<string>("all")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [editingRecord, setEditingRecord] = useState<any>(null)
  const [deletingRecord, setDeletingRecord] = useState<any>(null)

  const accountId = params.accountId as string
  const domainParam = searchParams.get("domain")

  useEffect(() => {
    if (!isLoading && cloudflareAccounts.length > 0) {
      const foundAccount = cloudflareAccounts.find(
        (acc) => acc.id === accountId || acc.name === decodeURIComponent(accountId),
      )
      if (foundAccount) {
        setAccount(foundAccount)
        loadDNSRecords(foundAccount)
      } else {
        router.push("/")
      }
    }
  }, [accountId, cloudflareAccounts, isLoading, router])

  useEffect(() => {
    if (domainParam) {
      setSelectedDomain(domainParam)
    }
  }, [domainParam])

  const loadDNSRecords = async (accountData: any) => {
    try {
      setLoading(true)
      console.log("[v0] Loading DNS records for account:", accountData.name)
      const response = await fetch("/api/cloudflare/dns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accounts: [accountData] }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log("[v0] DNS API response:", data)
        let records = []
        if (data?.records) {
          records = data.records
        } else if (Array.isArray(data)) {
          records = data
        } else if (data?.result) {
          records = data.result
        }

        console.log("[v0] Parsed DNS records:", records)
        setDnsRecords(records)

        const uniqueDomains = [
          ...new Set(records.map((record: any) => record.domainName || record.zone_name).filter(Boolean)),
        ]
        setDomains(uniqueDomains.map((domain) => ({ name: domain })))
        console.log("[v0] Unique domains:", uniqueDomains)
      } else {
        console.error("[v0] DNS API error:", response.status, response.statusText)
      }
    } catch (error) {
      console.error("[v0] Error loading DNS records:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredRecords = dnsRecords.filter((record) => {
    const matchesSearch =
      record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDomain =
      selectedDomain === "all" || record.domainName === selectedDomain || record.zone_name === selectedDomain
    const matchesType = selectedType === "all" || record.type === selectedType
    return matchesSearch && matchesDomain && matchesType
  })

  const recordTypes = [...new Set(dnsRecords.map((record) => record.type))].sort()

  if (isLoading || !account) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
            <Server className="w-5 h-5 text-primary-foreground animate-pulse" />
          </div>
          <p className="text-muted-foreground">Loading DNS records...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-2 md:px-6 py-2 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 md:gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/account/${accountId}`)}
                className="h-6 md:h-9 px-1 md:px-3"
              >
                <ArrowLeft className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                <span className="text-xs md:text-sm">Back</span>
              </Button>
              <div>
                <h1 className="text-sm md:text-xl font-heading font-bold text-foreground truncate max-w-32 md:max-w-none">
                  DNS - {account.name}
                </h1>
                <p className="text-xs md:text-sm text-muted-foreground hidden md:block">
                  Manage DNS records for this account only
                </p>
              </div>
            </div>
            <AddDNSRecordDialog>
              <Button className="h-6 md:h-9 px-2 md:px-4 text-xs md:text-sm">
                <Plus className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                <span className="hidden md:inline">Add Record</span>
                <span className="md:hidden">Add</span>
              </Button>
            </AddDNSRecordDialog>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-2 md:px-6 py-2 md:py-8">
        {/* Filters */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-4 mb-3 md:mb-6">
          <div className="relative flex-1 max-w-full md:max-w-md">
            <Search className="absolute left-2 md:left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-3 h-3 md:w-4 md:h-4" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-7 md:pl-10 h-7 md:h-9 text-xs md:text-sm"
            />
          </div>
          <div className="flex gap-2 md:gap-4">
            <Select value={selectedDomain} onValueChange={setSelectedDomain}>
              <SelectTrigger className="w-24 md:w-48 h-7 md:h-9 text-xs md:text-sm">
                <SelectValue placeholder="Domain" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Domains</SelectItem>
                {domains.map((domain) => (
                  <SelectItem key={domain.name} value={domain.name}>
                    {domain.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-20 md:w-32 h-7 md:h-9 text-xs md:text-sm">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {recordTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Badge variant="outline" className="px-2 py-1 text-xs md:text-sm">
            {account.name} • {filteredRecords.length}
          </Badge>
        </div>

        {/* DNS Records - Mobile/Desktop Layout */}
        <div className="md:hidden">
          {/* Mobile Card Layout */}
          {loading ? (
            <div className="text-center py-4">
              <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center mx-auto mb-2">
                <Server className="w-3 h-3 text-primary-foreground animate-pulse" />
              </div>
              <p className="text-xs text-muted-foreground">Loading...</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-4">
              <Server className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <h3 className="text-sm font-semibold mb-1">No DNS records</h3>
              <p className="text-xs text-muted-foreground mb-2">
                {searchTerm || selectedDomain !== "all" || selectedType !== "all" ? "No matches." : "No records yet."}
              </p>
              <AddDNSRecordDialog>
                <Button size="sm" className="h-6 px-2 text-xs">
                  <Plus className="w-3 h-3 mr-1" />
                  Add Record
                </Button>
              </AddDNSRecordDialog>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredRecords.map((record) => (
                <div key={record.id} className="border rounded p-2">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="text-xs px-1 py-0">
                        {record.type}
                      </Badge>
                      {record.proxied && (
                        <Badge variant="default" className="text-xs px-1 py-0">
                          Proxied
                        </Badge>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingRecord(record)}>
                          <Edit className="mr-2 h-3 w-3" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDeletingRecord(record)}>
                          <Trash2 className="mr-2 h-3 w-3" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <h3 className="font-semibold text-xs truncate">{record.name}</h3>
                  <p className="text-xs text-muted-foreground truncate">
                    {record.content} • TTL: {record.ttl === 1 ? "Auto" : record.ttl}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    Zone: {record.domainName || record.zone_name}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Desktop Table Layout */}
        <Card className="hidden md:block">
          <CardHeader className="py-3">
            <CardTitle className="text-lg">DNS Records for {account.name}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Server className="w-5 h-5 text-primary-foreground animate-pulse" />
                </div>
                <p className="text-muted-foreground">Loading DNS records...</p>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="text-center py-8">
                <Server className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No DNS records found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || selectedDomain !== "all" || selectedType !== "all"
                    ? "No records match your filters."
                    : "This account has no DNS records yet."}
                </p>
                <AddDNSRecordDialog>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add DNS Record
                  </Button>
                </AddDNSRecordDialog>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRecords.map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{record.type}</Badge>
                        <h3 className="font-semibold">{record.name}</h3>
                        {record.proxied && <Badge variant="default">Proxied</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Content: {record.content} • TTL: {record.ttl === 1 ? "Auto" : record.ttl}
                      </p>
                      <p className="text-xs text-muted-foreground">Zone: {record.domainName || record.zone_name}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingRecord(record)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Record
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDeletingRecord(record)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Record
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        {editingRecord && (
          <EditDNSRecordDialog
            record={editingRecord}
            open={!!editingRecord}
            onOpenChange={(open) => !open && setEditingRecord(null)}
            onSuccess={() => {
              setEditingRecord(null)
              loadDNSRecords(account)
            }}
          />
        )}

        {/* Delete Dialog */}
        {deletingRecord && (
          <DeleteDNSRecordDialog
            record={deletingRecord}
            open={!!deletingRecord}
            onOpenChange={(open) => !open && setDeletingRecord(null)}
            onSuccess={() => {
              setDeletingRecord(null)
              loadDNSRecords(account)
            }}
          />
        )}
      </main>
    </div>
  )
}
