"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Plus, Globe, Zap, LogOut, Server, Edit2, Check, X, Menu, Settings, Trash2, Wifi, FileText } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { AddAccountDialog } from "@/components/add-account-dialog"
import { EditAccountDialog } from "@/components/edit-account-dialog"
import { DeleteAccountDialog } from "@/components/delete-account-dialog"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { apiOptimizer } from "@/lib/api-optimizer"

const SimpleButton = ({
  children,
  onClick,
  className = "",
  variant = "default",
  size = "default",
  disabled = false,
  title,
  onMouseEnter,
  ...props
}: any) => {
  const baseClasses =
    "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"

  const variantClasses = {
    default: "bg-black text-white hover:bg-gray-800",
    outline: "border border-gray-300 bg-white hover:bg-gray-50",
    ghost: "hover:bg-gray-100",
  }

  const sizeClasses = {
    default: "h-10 px-4 py-2",
    sm: "h-8 px-3 text-sm",
    lg: "h-11 px-8",
  }

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
      onMouseEnter={onMouseEnter}
      {...props}
    >
      {children}
    </button>
  )
}

const SimpleBadge = ({ children, variant = "default", className = "" }: any) => {
  const baseClasses = "inline-flex items-center px-2 py-1 text-xs font-medium border"
  const variantClasses = {
    default: "bg-black text-white border-black",
    secondary: "bg-gray-100 text-gray-800 border-gray-300",
  }

  return <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>{children}</span>
}

export default function Dashboard() {
  const { user, cloudflareAccounts, logout, isLoading, updateCloudflareAccount, deleteCloudflareAccount } = useAuth()
  const router = useRouter()
  const [editingAccount, setEditingAccount] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  const [realStats, setRealStats] = useState({
    domains: 0,
    workers: 0,
    pages: 0,
    loading: true,
  })
  const [accountStats, setAccountStats] = useState<Record<string, any>>({})
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [testingConnection, setTestingConnection] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<Record<string, "success" | "error" | null>>({})
  const [showDomainInfo, setShowDomainInfo] = useState<string | null>(null)
  const [domainData, setDomainData] = useState<Record<string, any[]>>({})

  const prefetchAccountData = async (accountName: string, dataType: "domains" | "dns" | "workers" | "pages") => {
    const account = cloudflareAccounts.find((acc) => acc.name === accountName)
    if (!account) return

    const cacheKey = `${accountName}-${dataType}`

    const fetcher = async () => {
      console.log(`[v0] Optimized prefetch ${dataType} for account: ${accountName}`)

      // Use batch API for better performance
      const response = await fetch("/api/cloudflare/optimized", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accounts: [account],
          operations: [
            dataType === "domains"
              ? "zones"
              : dataType === "dns"
                ? "zones/*/dns_records"
                : dataType === "pages"
                  ? "pages/projects"
                  : "workers/scripts",
          ],
        }),
      })

      if (!response.ok) throw new Error(`Failed to fetch ${dataType}`)
      return response.json()
    }

    await apiOptimizer.optimizedFetch(cacheKey, fetcher, 60000)
  }

  const fetchRealStats = async () => {
    if (cloudflareAccounts.length === 0) {
      setRealStats({ domains: 0, workers: 0, pages: 0, loading: false })
      setAccountStats({})
      return
    }

    try {
      console.log("[v0] Fetching optimized real stats for dashboard")

      // Batch all operations for maximum speed
      const batchOperations = [
        () =>
          apiOptimizer.optimizedFetch(
            "dashboard-batch-data",
            async () => {
              const response = await fetch("/api/cloudflare/optimized", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  accounts: cloudflareAccounts,
                  operations: ["zones", "workers/scripts", "pages/projects"],
                }),
              })
              if (!response.ok) throw new Error("Failed to fetch batch data")
              return response.json()
            },
            30000,
          ),
      ]

      const [batchData] = await apiOptimizer.batchRequests(batchOperations)

      let totalDomains = 0
      let totalWorkers = 0
      let totalPages = 0
      const newAccountStats: Record<string, any> = {}

      // Process batch response data
      if (batchData && batchData.data) {
        batchData.data.forEach((accountData: any) => {
          const accountName = accountData.account
          let domains = 0
          let workers = 0
          let pages = 0

          // Count domains from zones
          if (accountData.results.zones && accountData.results.zones.result) {
            domains = accountData.results.zones.result.length
            totalDomains += domains
          }

          // Count workers from scripts
          if (accountData.results["workers/scripts"] && accountData.results["workers/scripts"].result) {
            workers = accountData.results["workers/scripts"].result.length
            totalWorkers += workers
          }

          // Count pages from projects
          if (accountData.results["pages/projects"] && accountData.results["pages/projects"].result) {
            pages = accountData.results["pages/projects"].result.length
            totalPages += pages
          }

          newAccountStats[accountName] = { domains, workers, pages }
        })
      }

      console.log("[v0] Optimized stats:", { totalDomains, totalWorkers, totalPages, accountStats: newAccountStats })

      setRealStats({ domains: totalDomains, workers: totalWorkers, pages: totalPages, loading: false })
      setAccountStats(newAccountStats)

      // Preload next likely data
      cloudflareAccounts.forEach((account) => {
        apiOptimizer.preloadData(`${account.name}-dns`, async () => {
          const response = await fetch("/api/cloudflare/dns", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ accounts: [account] }),
          })
          return response.json()
        })
      })
    } catch (error) {
      console.log("[v0] Error fetching optimized stats:", error)
      setRealStats({ domains: 0, workers: 0, pages: 0, loading: false })
      setAccountStats({})
    }
  }

  const handleEditSave = async (accountId: string) => {
    try {
      await updateCloudflareAccount(accountId, { name: editingName })
      setEditingAccount(null)
      setEditingName("")
      apiOptimizer.clearCache()
    } catch (error) {
      console.error("[v0] Failed to update account name:", error)
    }
  }

  const handleEditCancel = () => {
    setEditingAccount(null)
    setEditingName("")
  }

  const handleEditStart = (account: any) => {
    setEditingAccount(account.id)
    setEditingName(account.name)
  }

  const handleDeleteAccount = async (accountId: string) => {
    try {
      await deleteCloudflareAccount(accountId)
      apiOptimizer.clearCache()
    } catch (error) {
      console.error("[v0] Failed to delete account:", error)
    }
  }

  const testConnection = async (account: any) => {
    setTestingConnection(account.id)
    setConnectionStatus((prev) => ({ ...prev, [account.id]: null }))

    try {
      console.log(`[v0] Testing connection for account: ${account.name}`)

      const response = await fetch("/api/cloudflare/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account }),
      })

      const result = await response.json()

      if (result.success) {
        setConnectionStatus((prev) => ({ ...prev, [account.id]: "success" }))
      } else {
        setConnectionStatus((prev) => ({ ...prev, [account.id]: "error" }))
      }

      setTimeout(() => {
        setConnectionStatus((prev) => ({ ...prev, [account.id]: null }))
      }, 3000)
    } catch (error) {
      console.error("[v0] Test connection error:", error)
      setConnectionStatus((prev) => ({ ...prev, [account.id]: "error" }))
      setTimeout(() => {
        setConnectionStatus((prev) => ({ ...prev, [account.id]: null }))
      }, 3000)
    } finally {
      setTestingConnection(null)
    }
  }

  const showAccountDomains = async (account: any) => {
    if (domainData[account.name]) {
      setShowDomainInfo(account.id)
      return
    }

    try {
      const response = await fetch("/api/cloudflare/optimized", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accounts: [account],
          operations: ["zones"],
        }),
      })

      if (response.ok) {
        const result = await response.json()
        const domains = result.data?.[0]?.results?.zones?.result || []
        setDomainData((prev) => ({ ...prev, [account.name]: domains }))
      }
    } catch (error) {
      console.error("[v0] Failed to fetch domains:", error)
    }

    setShowDomainInfo(account.id)
  }

  useEffect(() => {
    if (!isLoading && !user && cloudflareAccounts.length === 0) {
      router.push("/login")
    }
  }, [user, isLoading, cloudflareAccounts, router])

  useEffect(() => {
    if (cloudflareAccounts.length > 0) {
      fetchRealStats()
    } else {
      setRealStats({ domains: 0, workers: 0, pages: 0, loading: false })
      setAccountStats({})
    }
  }, [cloudflareAccounts])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-black border flex items-center justify-center mx-auto mb-6">
            <Globe className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isLoading && !user) {
    return null
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-black border flex items-center justify-center">
              <Globe className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-bold">Cloudflare Manager</h1>
          </div>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-4">
            <AddAccountDialog>
              <SimpleButton size="sm" className="bg-black text-white hover:bg-gray-800">
                <Plus className="w-4 h-4 mr-2" />
                Add Account
              </SimpleButton>
            </AddAccountDialog>
            <SimpleButton variant="outline" size="sm" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </SimpleButton>
          </div>

          {/* Mobile menu button */}
          <SimpleButton
            variant="outline"
            size="sm"
            className="md:hidden bg-transparent"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="w-4 h-4" />
          </SimpleButton>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t space-y-2">
            <AddAccountDialog>
              <SimpleButton size="sm" className="w-full bg-black text-white hover:bg-gray-800">
                <Plus className="w-4 h-4 mr-2" />
                Add Account
              </SimpleButton>
            </AddAccountDialog>
            <SimpleButton variant="outline" size="sm" className="w-full bg-transparent" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </SimpleButton>
          </div>
        )}
      </header>

      <div className="border-b p-4 bg-gray-50">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-8 text-sm">
          <div>
            <span className="font-medium">Accounts:</span> {cloudflareAccounts.length}
          </div>
          <div>
            <span className="font-medium">Domains:</span> {realStats.loading ? "..." : realStats.domains}
          </div>
          <div>
            <span className="font-medium">Workers:</span> {realStats.loading ? "..." : realStats.workers}
          </div>
          <div>
            <span className="font-medium">Pages:</span> {realStats.loading ? "..." : realStats.pages}
          </div>
        </div>
      </div>

      <main className="p-2 sm:p-4">
        {cloudflareAccounts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 border flex items-center justify-center mx-auto mb-4">
              <Globe className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium mb-2">No accounts connected</h3>
            <p className="text-gray-600 mb-6">Connect your first Cloudflare account to get started.</p>
            <AddAccountDialog>
              <SimpleButton className="bg-black text-white hover:bg-gray-800">
                <Plus className="w-4 h-4 mr-2" />
                Connect Account
              </SimpleButton>
            </AddAccountDialog>
          </div>
        ) : (
          <>
            <div className="hidden lg:block border">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-3 font-medium">Account</th>
                    <th className="text-left p-3 font-medium">Email</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Domains</th>
                    <th className="text-left p-3 font-medium">Workers</th>
                    <th className="text-left p-3 font-medium">Pages</th>
                    <th className="text-left p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cloudflareAccounts.map((account) => (
                    <tr key={account.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        {editingAccount === account.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="h-8 text-sm"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleEditSave(account.id)
                                if (e.key === "Escape") handleEditCancel()
                              }}
                              autoFocus
                            />
                            <SimpleButton size="sm" variant="ghost" onClick={() => handleEditSave(account.id)}>
                              <Check className="w-4 h-4 text-green-600" />
                            </SimpleButton>
                            <SimpleButton size="sm" variant="ghost" onClick={handleEditCancel}>
                              <X className="w-4 h-4 text-red-600" />
                            </SimpleButton>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{account.name}</span>
                            <SimpleButton
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditStart(account)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Edit2 className="w-3 h-3" />
                            </SimpleButton>
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-sm text-gray-600">{account.email}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <SimpleBadge variant={account.isActive ? "default" : "secondary"} className="text-xs">
                            {account.isActive ? "Active" : "Inactive"}
                          </SimpleBadge>
                          <SimpleButton
                            size="sm"
                            variant="outline"
                            className={`h-7 w-7 p-0 ${
                              connectionStatus[account.id] === "success"
                                ? "border-green-300 hover:bg-green-50"
                                : connectionStatus[account.id] === "error"
                                  ? "border-red-300 hover:bg-red-50"
                                  : "border-blue-300 hover:bg-blue-50"
                            }`}
                            onClick={() => testConnection(account)}
                            disabled={testingConnection === account.id}
                            title="Test API Connection"
                          >
                            <Wifi
                              className={`w-4 h-4 ${
                                testingConnection === account.id
                                  ? "text-blue-600 animate-pulse"
                                  : connectionStatus[account.id] === "success"
                                    ? "text-green-600"
                                    : connectionStatus[account.id] === "error"
                                      ? "text-red-600"
                                      : "text-blue-600"
                              }`}
                            />
                          </SimpleButton>
                        </div>
                      </td>
                      <td className="p-3 font-medium">{accountStats[account.name]?.domains || 0}</td>
                      <td className="p-3 font-medium">{accountStats[account.name]?.workers || 0}</td>
                      <td className="p-3 font-medium">{accountStats[account.name]?.pages || 0}</td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Link href={`/account/${encodeURIComponent(account.name)}/domains`}>
                            <SimpleButton
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onMouseEnter={() => prefetchAccountData(account.name, "domains")}
                            >
                              <Globe className="w-3 h-3 mr-1" />
                              Domains
                            </SimpleButton>
                          </Link>
                          <Link href={`/account/${encodeURIComponent(account.name)}/dns`}>
                            <SimpleButton
                              size="sm"
                              className="h-7 text-xs bg-black text-white hover:bg-gray-800"
                              onMouseEnter={() => prefetchAccountData(account.name, "dns")}
                            >
                              <Server className="w-3 h-3 mr-1" />
                              DNS
                            </SimpleButton>
                          </Link>
                          <Link href={`/account/${encodeURIComponent(account.name)}/workers`}>
                            <SimpleButton
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onMouseEnter={() => prefetchAccountData(account.name, "workers")}
                            >
                              <Zap className="w-3 h-3 mr-1" />
                              Workers
                            </SimpleButton>
                          </Link>
                          <Link href={`/account/${encodeURIComponent(account.name)}/pages`}>
                            <SimpleButton
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onMouseEnter={() => prefetchAccountData(account.name, "pages")}
                            >
                              <FileText className="w-3 h-3 mr-1" />
                              Pages
                            </SimpleButton>
                          </Link>
                          <EditAccountDialog account={account}>
                            <SimpleButton size="sm" variant="outline" className="h-7 text-xs">
                              <Settings className="w-3 h-3" />
                            </SimpleButton>
                          </EditAccountDialog>
                          <DeleteAccountDialog account={account}>
                            <SimpleButton
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3" />
                            </SimpleButton>
                          </DeleteAccountDialog>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="lg:hidden space-y-3">
              {cloudflareAccounts.map((account) => (
                <div key={account.id} className="border p-3 bg-white">
                  <div className="flex items-center justify-between mb-2">
                    {editingAccount === account.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="h-7 text-sm flex-1"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleEditSave(account.id)
                            if (e.key === "Escape") handleEditCancel()
                          }}
                          autoFocus
                        />
                        <SimpleButton size="sm" variant="ghost" onClick={() => handleEditSave(account.id)}>
                          <Check className="w-3 h-3 text-green-600" />
                        </SimpleButton>
                        <SimpleButton size="sm" variant="ghost" onClick={handleEditCancel}>
                          <X className="w-3 h-3 text-red-600" />
                        </SimpleButton>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 flex-1">
                        <h3 className="font-medium text-base">{account.name}</h3>
                        <SimpleButton size="sm" variant="ghost" onClick={() => handleEditStart(account)}>
                          <Edit2 className="w-3 h-3" />
                        </SimpleButton>
                        <SimpleButton
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-blue-600 hover:bg-blue-50"
                          onClick={() => showAccountDomains(account)}
                          title="Show domain info"
                        >
                          <div className="w-4 h-4 rounded-full border border-blue-600 flex items-center justify-center text-xs font-bold">
                            i
                          </div>
                        </SimpleButton>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <SimpleBadge variant={account.isActive ? "default" : "secondary"} className="text-xs">
                      {account.isActive ? "Active" : "Inactive"}
                    </SimpleBadge>
                    <SimpleButton
                      size="sm"
                      variant="outline"
                      className={`h-6 px-2 text-xs ${
                        connectionStatus[account.id] === "success"
                          ? "border-green-300 hover:bg-green-50"
                          : connectionStatus[account.id] === "error"
                            ? "border-red-300 hover:bg-red-50"
                            : "border-blue-300 hover:bg-blue-50"
                      }`}
                      onClick={() => testConnection(account)}
                      disabled={testingConnection === account.id}
                      title="Test API Connection"
                    >
                      <Wifi
                        className={`w-3 h-3 mr-1 ${
                          testingConnection === account.id
                            ? "text-blue-600 animate-pulse"
                            : connectionStatus[account.id] === "success"
                              ? "text-green-600"
                              : connectionStatus[account.id] === "error"
                                ? "text-red-600"
                                : "text-blue-600"
                        }`}
                      />
                      Test
                    </SimpleButton>
                  </div>

                  <div className="grid grid-cols-4 gap-2 mb-3">
                    <Link href={`/account/${encodeURIComponent(account.name)}/domains`}>
                      <SimpleButton
                        size="sm"
                        variant="outline"
                        className="w-full h-8 text-xs"
                        onMouseEnter={() => prefetchAccountData(account.name, "domains")}
                      >
                        <Globe className="w-3 h-3 mr-1" />
                        Domains
                      </SimpleButton>
                    </Link>
                    <Link href={`/account/${encodeURIComponent(account.name)}/dns`}>
                      <SimpleButton
                        size="sm"
                        className="w-full h-8 text-xs bg-black text-white hover:bg-gray-800"
                        onMouseEnter={() => prefetchAccountData(account.name, "dns")}
                      >
                        <Server className="w-3 h-3 mr-1" />
                        DNS
                      </SimpleButton>
                    </Link>
                    <Link href={`/account/${encodeURIComponent(account.name)}/workers`}>
                      <SimpleButton
                        size="sm"
                        variant="outline"
                        className="w-full h-8 text-xs"
                        onMouseEnter={() => prefetchAccountData(account.name, "workers")}
                      >
                        <Zap className="w-3 h-3 mr-1" />
                        Workers
                      </SimpleButton>
                    </Link>
                    <Link href={`/account/${encodeURIComponent(account.name)}/pages`}>
                      <SimpleButton
                        size="sm"
                        variant="outline"
                        className="w-full h-8 text-xs"
                        onMouseEnter={() => prefetchAccountData(account.name, "pages")}
                      >
                        <FileText className="w-3 h-3 mr-1" />
                        Pages
                      </SimpleButton>
                    </Link>
                  </div>

                  <div className="flex gap-2 pt-2 border-t">
                    <EditAccountDialog account={account}>
                      <SimpleButton size="sm" variant="outline" className="flex-1 h-7 text-xs">
                        <Settings className="w-3 h-3 mr-1" />
                        Edit
                      </SimpleButton>
                    </EditAccountDialog>
                    <DeleteAccountDialog account={account}>
                      <SimpleButton
                        size="sm"
                        variant="outline"
                        className="flex-1 h-7 text-xs text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </SimpleButton>
                    </DeleteAccountDialog>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {showDomainInfo && (
          <div
            className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center p-4 z-50"
            onClick={() => setShowDomainInfo(null)}
          >
            <div
              className="bg-white border-2 border-gray-300 rounded-lg shadow-lg max-w-sm w-full max-h-80 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-3 border-b bg-gray-50 flex items-center justify-between">
                <h3 className="font-medium text-gray-900">Domain Information</h3>
                <SimpleButton
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 hover:bg-gray-200"
                  onClick={() => setShowDomainInfo(null)}
                >
                  <X className="w-4 h-4 text-gray-600" />
                </SimpleButton>
              </div>
              <div className="p-3 overflow-y-auto max-h-60 bg-white">
                {(() => {
                  const account = cloudflareAccounts.find((acc) => acc.id === showDomainInfo)
                  const domains = domainData[account?.name || ""] || []

                  if (domains.length === 0) {
                    return (
                      <div className="text-center py-4 text-gray-500">
                        <Globe className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">No domains found</p>
                      </div>
                    )
                  }

                  return (
                    <div className="space-y-2">
                      {domains.map((domain: any, index: number) => (
                        <div key={domain.id || index} className="p-2 border bg-gray-50">
                          <div className="font-medium text-sm">{domain.name}</div>
                          <div className="text-xs text-gray-600 mt-1">
                            Status:{" "}
                            <span className={domain.status === "active" ? "text-green-600" : "text-gray-600"}>
                              {domain.status || "Unknown"}
                            </span>
                          </div>
                          {domain.created_on && (
                            <div className="text-xs text-gray-500 mt-1">
                              Created: {new Date(domain.created_on).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
