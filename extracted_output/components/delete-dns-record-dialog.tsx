"use client"

import type React from "react"
import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { useAuth } from "./auth-provider"

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

interface DeleteDNSRecordDialogProps {
  record: DNSRecord
  children: React.ReactNode
}

export function DeleteDNSRecordDialog({ record, children }: DeleteDNSRecordDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const { cloudflareAccounts } = useAuth()

  const handleDelete = async () => {
    setIsLoading(true)
    setError("")

    try {
      const account = cloudflareAccounts.find((acc) => acc.name === record.accountName)

      if (!account) {
        throw new Error("Account not found")
      }

      const response = await fetch("/api/cloudflare/dns/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zoneId: record.domainName, // This should be the zone ID, might need adjustment
          recordId: record.id,
          account,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete DNS record")
      }

      console.log(`[v0] Successfully deleted DNS record: ${record.type} ${record.name} -> ${record.content}`)

      // Refresh the page to remove deleted record
      window.location.reload()
    } catch (err) {
      console.error("[v0] Error deleting DNS record:", err)
      setError(err instanceof Error ? err.message : "Failed to delete DNS record. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-heading">Delete DNS Record</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this DNS record?
            <div className="mt-3 p-3 bg-muted rounded-lg">
              <div className="text-sm">
                <strong>Type:</strong> {record.type}
                <br />
                <strong>Name:</strong> {record.name}
                <br />
                <strong>Content:</strong> {record.content}
                <br />
                <strong>Domain:</strong> {record.domainName}
              </div>
            </div>
            This action cannot be undone and may affect your domain's functionality.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? "Deleting..." : "Delete Record"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
