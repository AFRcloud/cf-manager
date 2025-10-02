"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Zap, Search, ExternalLink, Globe } from "lucide-react"
import Link from "next/link"

interface Worker {
  id: string
  name: string
  created_on: string
  modified_on: string
  account: string
  routes?: string[]
  custom_domains?: string[]
}

interface CustomDomainDialogProps {
  worker: Worker
  isOpen: boolean
  onClose: () => void
  onSave: (workerId: string, domains: string[]) => void
}

function CustomDomainDialog({ worker, isOpen, onClose, onSave }: CustomDomainDialogProps) {
  const [domains, setDomains] = useState<string[]>(worker.custom_domains || [])
  const [newDomain, setNewDomain] = useState("")

  const addDomain = () => {
    if (newDomain.trim() && !domains.includes(newDomain.trim())) {
      setDomains([...domains, newDomain.trim()])
      setNewDomain("")
    }
  }

  const removeDomain = (index: number) => {
    setDomains(domains.filter((_, i) => i !== index))
  }

  const handleSave = () => {
    onSave(worker.id, domains)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background p-6 rounded-lg w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Edit Custom Domains</h3>
        <p className="text-sm text-muted-foreground mb-4">Worker: {worker.name || worker.id}</p>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter domain (e.g., api.example.com)"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addDomain()}
            />
            <Button onClick={addDomain} size="sm">
              Add
            </Button>
          </div>

          <div className="space-y-2">
            {domains.map((domain, index) => (
              <div key={index} className="flex items-center justify-between p-2 border rounded">
                <span className="text-sm">{domain}</span>
                <Button variant="outline" size="sm" onClick={() => removeDomain(index)}>
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <Button onClick={handleSave}>Save Changes</Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function WorkersPage() {
  const { cloudflareAccounts } = useAuth()
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedAccount, setSelectedAccount] = useState<string>("all")
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    if (cloudflareAccounts.length > 0) {
      fetchWorkers()
    } else {
      setLoading(false)
    }
  }, [cloudflareAccounts])

  const fetchWorkers = async () => {
    try {
      const response = await fetch("/api/cloudflare/workers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accounts: cloudflareAccounts }),
      })
      const data = await response.json()

      const allWorkers: Worker[] = []
      data.forEach((accountData: any) => {
        accountData.workers?.forEach((worker: any) => {
          allWorkers.push({
            ...worker,
            account: accountData.accountName,
          })
        })
      })

      setWorkers(allWorkers)
    } catch (error) {
      console.error("Error fetching workers:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredWorkers = workers.filter((worker) => {
    const matchesSearch =
      worker.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      worker.account.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesAccount = selectedAccount === "all" || worker.account === selectedAccount
    return matchesSearch && matchesAccount
  })

  const handleCustomDomainUpdate = async (workerId: string, domains: string[]) => {
    try {
      setWorkers(workers.map((worker) => (worker.id === workerId ? { ...worker, custom_domains: domains } : worker)))

      console.log(`[v0] Updating custom domains for worker ${workerId}:`, domains)

      // TODO: Implement actual API call to Cloudflare
    } catch (error) {
      console.error("Error updating custom domains:", error)
    }
  }

  const openCustomDomainDialog = (worker: Worker) => {
    setSelectedWorker(worker)
    setIsDialogOpen(true)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Cloudflare Workers</h1>
            <p className="text-muted-foreground">Manage your serverless functions</p>
          </div>
          <Link href="/">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search workers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="px-3 py-2 border border-border rounded-md bg-background text-foreground min-w-[200px]"
          >
            <option value="all">All Accounts ({workers.length})</option>
            {cloudflareAccounts.map((account) => {
              const accountWorkers = workers.filter((w) => w.account === account.name).length
              return (
                <option key={account.id} value={account.name}>
                  {account.name} ({accountWorkers})
                </option>
              )
            })}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="text-muted-foreground">Loading workers...</div>
          </div>
        ) : filteredWorkers.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Workers Found</h3>
              <p className="text-muted-foreground">
                {searchTerm || selectedAccount !== "all"
                  ? "No workers match your search criteria."
                  : "No workers found in your accounts."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorkers.map((worker) => (
              <Card key={`${worker.account}-${worker.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{worker.name || worker.id}</CardTitle>
                      <p className="text-sm text-muted-foreground">{worker.account}</p>
                    </div>
                    <Badge variant="secondary">
                      <Zap className="w-3 h-3 mr-1" />
                      Worker
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm">
                      <p className="text-muted-foreground">
                        Created: {new Date(worker.created_on).toLocaleDateString()}
                      </p>
                      <p className="text-muted-foreground">
                        Modified: {new Date(worker.modified_on).toLocaleDateString()}
                      </p>
                    </div>

                    {worker.routes && worker.routes.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-1">Routes:</p>
                        <div className="space-y-1">
                          {worker.routes.slice(0, 2).map((route, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {route}
                            </Badge>
                          ))}
                          {worker.routes.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{worker.routes.length - 2} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {worker.custom_domains && worker.custom_domains.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-1">Custom Domains:</p>
                        <div className="space-y-1">
                          {worker.custom_domains.map((domain, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              <Globe className="w-3 h-3 mr-1" />
                              {domain}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`https://dash.cloudflare.com/workers/view/${worker.id}`, "_blank")}
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openCustomDomainDialog(worker)}>
                        <Globe className="w-3 h-3 mr-1" />
                        Custom Domain
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {selectedWorker && (
          <CustomDomainDialog
            worker={selectedWorker}
            isOpen={isDialogOpen}
            onClose={() => setIsDialogOpen(false)}
            onSave={handleCustomDomainUpdate}
          />
        )}
      </div>
    </div>
  )
}
