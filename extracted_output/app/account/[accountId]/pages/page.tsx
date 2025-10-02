"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileText, ArrowLeft, Search, ExternalLink, Globe, Trash2 } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { PageCustomDomainDialog } from "@/components/page-custom-domain-dialog"

export default function AccountPagesPage() {
  const params = useParams()
  const router = useRouter()
  const { cloudflareAccounts, isLoading } = useAuth()
  const [account, setAccount] = useState<any>(null)
  const [pages, setPages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [deletingPage, setDeletingPage] = useState<string | null>(null)
  const [customDomainDialog, setCustomDomainDialog] = useState<{
    open: boolean
    page: any
  }>({ open: false, page: null })

  const accountId = params.accountId as string

  useEffect(() => {
    if (!isLoading && cloudflareAccounts.length > 0) {
      const foundAccount = cloudflareAccounts.find(
        (acc) => acc.id === accountId || acc.name === decodeURIComponent(accountId),
      )
      if (foundAccount) {
        setAccount(foundAccount)
        loadPages(foundAccount)
      } else {
        router.push("/")
      }
    }
  }, [accountId, cloudflareAccounts, isLoading, router])

  const loadPages = async (accountData: any) => {
    try {
      setLoading(true)
      const response = await fetch("/api/cloudflare/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accounts: [accountData] }),
      })

      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data) && data[0]?.pages) {
          setPages(data[0].pages)
        }
      }
    } catch (error) {
      console.error("Error loading pages:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePage = async (page: any) => {
    if (!confirm(`Are you sure you want to delete page "${page.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      setDeletingPage(page.name)

      const response = await fetch("/api/cloudflare/pages/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: account.accountId || account.id,
          pageName: page.name,
          apiKey: account.apiKey,
          email: account.email,
          apiType: account.apiType,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Remove page from local state
        setPages((prev) => prev.filter((p) => p.name !== page.name))
        alert("Page deleted successfully!")
      } else {
        alert(`Failed to delete page: ${data.error}`)
      }
    } catch (error) {
      console.error("Error deleting page:", error)
      alert("Failed to delete page. Please try again.")
    } finally {
      setDeletingPage(null)
    }
  }

  const handleCustomDomain = (page: any) => {
    setCustomDomainDialog({ open: true, page })
  }

  const filteredPages = pages.filter((page) => page.name.toLowerCase().includes(searchTerm.toLowerCase()))

  if (isLoading || !account) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-black text-white flex items-center justify-center mx-auto mb-4">
            <FileText className="w-5 h-5 animate-pulse" />
          </div>
          <p className="text-gray-600">Loading pages...</p>
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
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Manage static sites</p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild className="text-xs sm:text-sm p-1 sm:p-2 bg-transparent">
              <a href={`https://dash.cloudflare.com`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Create Page</span>
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
              placeholder="Search pages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 sm:pl-10 border-gray-300 text-xs sm:text-sm h-8 sm:h-10"
            />
          </div>
          <span className="text-xs sm:text-sm text-gray-600">{filteredPages.length} pages</span>
        </div>

        {loading ? (
          <div className="text-center py-4 sm:py-8">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-black text-white flex items-center justify-center mx-auto mb-2 sm:mb-4">
              <FileText className="w-3 h-3 sm:w-5 sm:h-5 animate-pulse" />
            </div>
            <p className="text-gray-600 text-xs sm:text-sm">Loading pages...</p>
          </div>
        ) : filteredPages.length === 0 ? (
          <div className="text-center py-4 sm:py-8">
            <FileText className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-2 sm:mb-4" />
            <h3 className="text-sm sm:text-lg font-medium mb-1 sm:mb-2">No pages found</h3>
            <p className="text-gray-600 mb-2 sm:mb-4 text-xs sm:text-sm">
              {searchTerm ? "No pages match your search." : "This account has no pages yet."}
            </p>
            <Button variant="outline" size="sm" asChild className="text-xs sm:text-sm bg-transparent">
              <a href={`https://dash.cloudflare.com`} target="_blank" rel="noopener noreferrer">
                <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Create Your First Page
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
                      Page Name
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 border-b border-gray-200">
                      Domain
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 border-b border-gray-200">
                      Created
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 border-b border-gray-200">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 border-b border-gray-200">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPages.map((page, index) => (
                    <tr key={page.name} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-200">
                        <div>
                          <div className="font-medium">{page.name}</div>
                          <div className="text-xs text-gray-500">{page.source?.type || "Git"}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 border-b border-gray-200">
                        {page.subdomain || `${page.name}.pages.dev`}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 border-b border-gray-200">
                        {new Date(page.created_on).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm border-b border-gray-200">
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            page.latest_deployment?.stage === "success"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {page.latest_deployment?.stage || "Active"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm border-b border-gray-200">
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" asChild>
                            <a
                              href={`https://${page.subdomain || `${page.name}.pages.dev`}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleCustomDomain(page)}>
                            <Globe className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeletePage(page)}
                            disabled={deletingPage === page.name}
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
              {filteredPages.map((page) => (
                <div key={page.name} className="border border-gray-200 p-2 bg-white">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 text-xs truncate">{page.name}</h3>
                      <span className="text-xs text-gray-500">{page.source?.type || "Git"}</span>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Button size="sm" variant="outline" asChild className="p-1 bg-transparent">
                        <a
                          href={`https://${page.subdomain || `${page.name}.pages.dev`}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleCustomDomain(page)} className="p-1">
                        <Globe className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeletePage(page)}
                        disabled={deletingPage === page.name}
                        className="p-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-xs text-gray-600">
                    <div>
                      <span className="font-medium">Domain:</span>
                      <div className="truncate">{page.subdomain || `${page.name}.pages.dev`}</div>
                    </div>
                    <div>
                      <span className="font-medium">Created:</span>
                      <div className="truncate">{new Date(page.created_on).toLocaleDateString()}</div>
                    </div>
                    <div className="col-span-2">
                      <span className="font-medium">Status:</span>
                      <span
                        className={`ml-1 px-2 py-1 text-xs rounded ${
                          page.latest_deployment?.stage === "success"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {page.latest_deployment?.stage || "Active"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      <PageCustomDomainDialog
        open={customDomainDialog.open}
        onOpenChange={(open) => setCustomDomainDialog({ open, page: null })}
        page={customDomainDialog.page}
        account={account}
      />
    </div>
  )
}
