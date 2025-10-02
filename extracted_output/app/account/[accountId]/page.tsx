"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Globe, Zap, Server, ExternalLink } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import Link from "next/link"

export default function AccountPage() {
  const params = useParams()
  const router = useRouter()
  const { cloudflareAccounts, isLoading } = useAuth()
  const [account, setAccount] = useState<any>(null)
  const [stats, setStats] = useState({ domains: 0, workers: 0, loading: true })

  const accountId = params.accountId as string

  useEffect(() => {
    if (!isLoading && cloudflareAccounts.length > 0) {
      const foundAccount = cloudflareAccounts.find(
        (acc) => acc.id === accountId || acc.name === decodeURIComponent(accountId),
      )
      if (foundAccount) {
        setAccount(foundAccount)
        fetchAccountStats(foundAccount)
      } else {
        router.push("/")
      }
    }
  }, [accountId, cloudflareAccounts, isLoading, router])

  const fetchAccountStats = async (accountData: any) => {
    try {
      // Fetch domains for this specific account
      const domainsResponse = await fetch("/api/cloudflare/zones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accounts: [accountData] }),
      })

      // Fetch workers for this specific account
      const workersResponse = await fetch("/api/cloudflare/workers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accounts: [accountData] }),
      })

      let domains = 0
      let workers = 0

      if (domainsResponse.ok) {
        const domainsData = await domainsResponse.json()
        if (domainsData?.domains) {
          domains = domainsData.domains.length
        }
      }

      if (workersResponse.ok) {
        const workersData = await workersResponse.json()
        if (Array.isArray(workersData) && workersData[0]?.workers) {
          workers = workersData[0].workers.length
        }
      }

      setStats({ domains, workers, loading: false })
    } catch (error) {
      console.error("Error fetching account stats:", error)
      setStats({ domains: 0, workers: 0, loading: false })
    }
  }

  if (isLoading || !account) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-black rounded flex items-center justify-center mx-auto mb-4">
            <Globe className="w-5 h-5 text-white animate-pulse" />
          </div>
          <p className="text-gray-600">Loading account...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-1 sm:py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 sm:gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/")}
                className="text-gray-600 hover:text-black p-1 sm:p-2 text-xs sm:text-sm"
              >
                <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-0 sm:mr-1" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              <div className="flex items-center gap-1 sm:gap-2">
                <div className="w-4 h-4 sm:w-6 sm:h-6 bg-black rounded flex items-center justify-center">
                  <Globe className="w-2 h-2 sm:w-4 sm:h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-sm sm:text-lg font-medium text-black truncate max-w-32 sm:max-w-none">
                    {account.name}
                  </h1>
                  <p className="text-xs text-gray-500 truncate max-w-32 sm:max-w-none">{account.email}</p>
                </div>
              </div>
            </div>
            <span
              className={`px-1 sm:px-2 py-0.5 sm:py-1 text-xs rounded ${account.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
            >
              {account.isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-6">
        <div className="flex gap-3 sm:gap-8 mb-3 sm:mb-6 pb-2 sm:pb-4 border-b border-gray-200">
          <div className="flex items-center gap-1 sm:gap-2">
            <Globe className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
            <span className="text-xs sm:text-sm text-gray-600">Domains:</span>
            <span className="font-medium text-black text-xs sm:text-sm">{stats.loading ? "..." : stats.domains}</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
            <span className="text-xs sm:text-sm text-gray-600">Workers:</span>
            <span className="font-medium text-black text-xs sm:text-sm">{stats.loading ? "..." : stats.workers}</span>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="block sm:hidden space-y-2">
          <div className="border border-gray-200 rounded p-2">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1">
                <Globe className="w-3 h-3 text-gray-400" />
                <span className="font-medium text-black text-xs">Domain Management</span>
              </div>
            </div>
            <p className="text-xs text-gray-600 mb-2">Manage domains and DNS settings</p>
            <div className="flex gap-1">
              <Link href={`/account/${accountId}/domains`}>
                <Button size="sm" className="bg-black text-white hover:bg-gray-800 text-xs px-2 py-1 h-6">
                  Domains
                </Button>
              </Link>
              <Link href={`/account/${accountId}/dns`}>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent text-xs px-2 py-1 h-6"
                >
                  DNS
                </Button>
              </Link>
            </div>
          </div>

          <div className="border border-gray-200 rounded p-2">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-gray-400" />
                <span className="font-medium text-black text-xs">Worker Management</span>
              </div>
            </div>
            <p className="text-xs text-gray-600 mb-2">Deploy and manage serverless functions</p>
            <div className="flex gap-1">
              <Link href={`/account/${accountId}/workers`}>
                <Button size="sm" className="bg-black text-white hover:bg-gray-800 text-xs px-2 py-1 h-6">
                  Workers
                </Button>
              </Link>
              <Button
                size="sm"
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent text-xs px-2 py-1 h-6"
                asChild
              >
                <a href={`https://dash.cloudflare.com`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-2 h-2 mr-0.5" />
                  CF
                </a>
              </Button>
            </div>
          </div>

          <div className="border border-gray-200 rounded p-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Server className="w-3 h-3 text-gray-400" />
                <span className="font-medium text-black text-xs">Account Info</span>
              </div>
              <span className="text-xs text-gray-500">Read-only</span>
            </div>
            <p className="text-xs text-gray-600 mt-1 truncate">
              {account.name} • {account.email} • {account.apiType || "Global API Key"}
            </p>
          </div>
        </div>

        {/* Desktop Table Layout */}
        <div className="hidden sm:block border border-gray-200 rounded">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 font-medium text-gray-900">Service</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Description</th>
                <th className="text-right py-3 px-4 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-black">Domain Management</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">Manage domains and DNS settings for this account</td>
                <td className="py-3 px-4 text-right">
                  <div className="flex gap-2 justify-end">
                    <Link href={`/account/${accountId}/domains`}>
                      <Button size="sm" className="bg-black text-white hover:bg-gray-800">
                        Domains
                      </Button>
                    </Link>
                    <Link href={`/account/${accountId}/dns`}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"
                      >
                        DNS
                      </Button>
                    </Link>
                  </div>
                </td>
              </tr>
              <tr className="border-b border-gray-200 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-black">Worker Management</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">Deploy and manage serverless functions</td>
                <td className="py-3 px-4 text-right">
                  <div className="flex gap-2 justify-end">
                    <Link href={`/account/${accountId}/workers`}>
                      <Button size="sm" className="bg-black text-white hover:bg-gray-800">
                        Workers
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"
                      asChild
                    >
                      <a href={`https://dash.cloudflare.com`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Cloudflare
                      </a>
                    </Button>
                  </div>
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-black">Account Info</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">
                  {account.name} • {account.email} • {account.apiType || "Global API Key"}
                </td>
                <td className="py-3 px-4 text-right">
                  <span className="text-xs text-gray-500">Read-only</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
