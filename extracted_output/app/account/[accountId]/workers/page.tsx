"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Zap, ArrowLeft, Search, ExternalLink, Globe, Trash2 } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { WorkerCustomDomainDialog } from "@/components/worker-custom-domain-dialog"

export default function AccountWorkersPage() {
  const params = useParams()
  const router = useRouter()
  const { cloudflareAccounts, isLoading } = useAuth()
  const [account, setAccount] = useState<any>(null)
  const [workers, setWorkers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [deletingWorker, setDeletingWorker] = useState<string | null>(null)
  const [customDomainDialog, setCustomDomainDialog] = useState<{
    open: boolean
    worker: any
  }>({ open: false, worker: null })

  const accountId = params.accountId as string

  useEffect(() => {
    if (!isLoading && cloudflareAccounts.length > 0) {
      const foundAccount = cloudflareAccounts.find(
        (acc) => acc.id === accountId || acc.name === decodeURIComponent(accountId),
      )
      if (foundAccount) {
        setAccount(foundAccount)
        loadWorkers(foundAccount)
      } else {
        router.push("/")
      }
    }
  }, [accountId, cloudflareAccounts, isLoading, router])

  const loadWorkers = async (accountData: any) => {
    try {
      setLoading(true)
      const response = await fetch("/api/cloudflare/workers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accounts: [accountData] }),
      })

      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data) && data[0]?.workers) {
          setWorkers(data[0].workers)
        }
      }
    } catch (error) {
      console.error("Error loading workers:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteWorker = async (worker: any) => {
    if (!confirm(`Are you sure you want to delete worker "${worker.id}"? This action cannot be undone.`)) {
      return
    }

    try {
      setDeletingWorker(worker.id)

      const response = await fetch("/api/cloudflare/workers/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: account.accountId || account.id,
          workerId: worker.id,
          apiKey: account.apiKey,
          email: account.email,
          apiType: account.apiType,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Remove worker from local state
        setWorkers((prev) => prev.filter((w) => w.id !== worker.id))
        alert("Worker deleted successfully!")
      } else {
        alert(`Failed to delete worker: ${data.error}`)
      }
    } catch (error) {
      console.error("Error deleting worker:", error)
      alert("Failed to delete worker. Please try again.")
    } finally {
      setDeletingWorker(null)
    }
  }

  const handleCustomDomain = (worker: any) => {
    setCustomDomainDialog({ open: true, worker })
  }

  const filteredWorkers = workers.filter((worker) => worker.id.toLowerCase().includes(searchTerm.toLowerCase()))

  if (isLoading || !account) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-black text-white flex items-center justify-center mx-auto mb-4">
            <Zap className="w-5 h-5 animate-pulse" />
          </div>
          <p className="text-gray-600">Loading workers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/account/${accountId}`)}
                className="p-1 sm:p-2"
              >
                <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="text-xs sm:text-sm">Back</span>
              </Button>
              <div>
                <h1 className="text-sm sm:text-lg font-medium text-black truncate max-w-32 sm:max-w-none">
                  {account.name}
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Manage serverless functions</p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild className="text-xs sm:text-sm p-1 sm:p-2 bg-transparent">
              <a href={`https://dash.cloudflare.com`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Create Worker</span>
                <span className="sm:hidden">New</span>
              </a>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3 sm:mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4" />
            <Input
              placeholder="Search workers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 sm:pl-10 border-gray-300 text-xs sm:text-sm h-8 sm:h-10"
            />
          </div>
          <span className="text-xs sm:text-sm text-gray-600">{filteredWorkers.length} workers</span>
        </div>

        {loading ? (
          <div className="text-center py-4 sm:py-8">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-black text-white flex items-center justify-center mx-auto mb-2 sm:mb-4">
              <Zap className="w-3 h-3 sm:w-5 sm:h-5 animate-pulse" />
            </div>
            <p className="text-gray-600 text-xs sm:text-sm">Loading workers...</p>
          </div>
        ) : filteredWorkers.length === 0 ? (
          <div className="text-center py-4 sm:py-8">
            <Zap className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-2 sm:mb-4" />
            <h3 className="text-sm sm:text-lg font-medium mb-1 sm:mb-2">No workers found</h3>
            <p className="text-gray-600 mb-2 sm:mb-4 text-xs sm:text-sm">
              {searchTerm ? "No workers match your search." : "This account has no workers yet."}
            </p>
            <Button variant="outline" size="sm" asChild className="text-xs sm:text-sm bg-transparent">
              <a href={`https://dash.cloudflare.com`} target="_blank" rel="noopener noreferrer">
                <Zap className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Create Your First Worker
              </a>
            </Button>
          </div>
        ) : (
          <>
            <div className="hidden md:block border border-gray-200">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 border-b border-gray-200">
                      Worker ID
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 border-b border-gray-200">
                      Created
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 border-b border-gray-200">
                      Modified
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 border-b border-gray-200">
                      Handlers
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 border-b border-gray-200">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWorkers.map((worker, index) => (
                    <tr key={worker.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-200">
                        <div>
                          <div className="font-medium">{worker.id}</div>
                          <div className="text-xs text-gray-500">Active</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 border-b border-gray-200">
                        {new Date(worker.created_on).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 border-b border-gray-200">
                        {new Date(worker.modified_on).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 border-b border-gray-200">
                        {worker.handlers?.join(", ") || "fetch"}
                      </td>
                      <td className="px-4 py-3 text-sm border-b border-gray-200">
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" asChild>
                            <a href={`https://dash.cloudflare.com`} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleCustomDomain(worker)}>
                            <Globe className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteWorker(worker)}
                            disabled={deletingWorker === worker.id}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden space-y-2">
              {filteredWorkers.map((worker) => (
                <div key={worker.id} className="border border-gray-200 p-2 bg-white">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 text-xs truncate">{worker.id}</h3>
                      <span className="text-xs text-gray-500">Active</span>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Button size="sm" variant="outline" asChild className="p-1 bg-transparent">
                        <a href={`https://dash.cloudflare.com`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleCustomDomain(worker)} className="p-1">
                        <Globe className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteWorker(worker)}
                        disabled={deletingWorker === worker.id}
                        className="p-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-xs text-gray-600">
                    <div>
                      <span className="font-medium">Created:</span>
                      <div className="truncate">{new Date(worker.created_on).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <span className="font-medium">Modified:</span>
                      <div className="truncate">{new Date(worker.modified_on).toLocaleDateString()}</div>
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium">Handlers:</span>
                      <span className="truncate ml-1">{worker.handlers?.join(", ") || "fetch"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* WorkerCustomDomainDialog component */}
      <WorkerCustomDomainDialog
        open={customDomainDialog.open}
        onOpenChange={(open) => setCustomDomainDialog({ open, worker: null })}
        worker={customDomainDialog.worker}
        account={account}
      />
    </div>
  )
}
