"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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
  Edit,
  Trash2,
  TestTube,
  Globe,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { AddAccountDialog } from "@/components/add-account-dialog"
import { EditAccountDialog } from "@/components/edit-account-dialog"
import { DeleteAccountDialog } from "@/components/delete-account-dialog"
import Link from "next/link"

export default function AccountsPage() {
  const { user, cloudflareAccounts } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [testingAccounts, setTestingAccounts] = useState<Set<string>>(new Set())
  const [testResults, setTestResults] = useState<Record<string, "success" | "error">>({})

  const filteredAccounts = cloudflareAccounts.filter(
    (account) =>
      account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const testConnection = async (accountId: string) => {
    setTestingAccounts((prev) => new Set(prev).add(accountId))
    setTestResults((prev) => ({ ...prev, [accountId]: undefined }))

    try {
      // Simulate API test
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Randomly succeed or fail for demo
      const success = Math.random() > 0.3
      setTestResults((prev) => ({ ...prev, [accountId]: success ? "success" : "error" }))

      console.log(`[v0] Connection test for account ${accountId}:`, success ? "success" : "failed")
    } catch (error) {
      setTestResults((prev) => ({ ...prev, [accountId]: "error" }))
      console.error(`[v0] Connection test failed for account ${accountId}:`, error)
    } finally {
      setTestingAccounts((prev) => {
        const newSet = new Set(prev)
        newSet.delete(accountId)
        return newSet
      })
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Please log in to access account management.</p>
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
              <h2 className="text-lg font-heading font-semibold text-foreground">Account Management</h2>
            </div>
            <AddAccountDialog>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Account
              </Button>
            </AddAccountDialog>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Accounts</CardTitle>
              <Globe className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-heading font-bold text-foreground">{cloudflareAccounts.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Accounts</CardTitle>
              <CheckCircle className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-heading font-bold text-foreground">
                {cloudflareAccounts.filter((acc) => acc.isActive).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Last Tested</CardTitle>
              <TestTube className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-heading font-bold text-foreground">{Object.keys(testResults).length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="font-heading">Manage Accounts</CardTitle>
            <CardDescription>View and manage all your connected Cloudflare accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search accounts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {cloudflareAccounts.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Globe className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-heading font-semibold mb-2">No accounts found</h3>
                <p className="text-muted-foreground mb-6">Add your first Cloudflare account to get started.</p>
                <AddAccountDialog>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Account
                  </Button>
                </AddAccountDialog>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Connection</TableHead>
                      <TableHead>Account ID</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAccounts.map((account) => (
                      <TableRow key={account.id}>
                        <TableCell className="font-medium">{account.name}</TableCell>
                        <TableCell>{account.email}</TableCell>
                        <TableCell>
                          <Badge variant={account.isActive ? "default" : "secondary"}>
                            {account.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {testingAccounts.has(account.id) ? (
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                <span className="text-sm text-muted-foreground">Testing...</span>
                              </div>
                            ) : testResults[account.id] === "success" ? (
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span className="text-sm text-green-600">Connected</span>
                              </div>
                            ) : testResults[account.id] === "error" ? (
                              <div className="flex items-center gap-2">
                                <XCircle className="w-4 h-4 text-red-500" />
                                <span className="text-sm text-red-600">Failed</span>
                              </div>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => testConnection(account.id)}
                                disabled={testingAccounts.has(account.id)}
                              >
                                <TestTube className="w-3 h-3 mr-1" />
                                Test
                              </Button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">{account.accountId || "Global"}</code>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <EditAccountDialog account={account}>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                              </EditAccountDialog>
                              <DropdownMenuItem onClick={() => testConnection(account.id)}>
                                <TestTube className="mr-2 h-4 w-4" />
                                Test Connection
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DeleteAccountDialog account={account}>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DeleteAccountDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Help Section */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Need help?</strong> Make sure your Cloudflare API keys have the necessary permissions. You can test
            connections to verify your credentials are working correctly.
          </AlertDescription>
        </Alert>
      </main>
    </div>
  )
}
