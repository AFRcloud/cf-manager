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

interface CloudflareAccount {
  id: string
  name: string
  email: string
  apiKey: string
  accountId: string
  isActive: boolean
}

interface DeleteAccountDialogProps {
  account: CloudflareAccount
  children: React.ReactNode
}

export function DeleteAccountDialog({ account, children }: DeleteAccountDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const { removeCloudflareAccount } = useAuth()

  const handleDelete = async () => {
    setIsLoading(true)
    setError("")

    try {
      await removeCloudflareAccount(account.id)
      console.log(`[v0] Account deleted: ${account.name}`)
    } catch (err) {
      setError("Failed to delete account. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-heading">Delete Cloudflare Account</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the account "{account.name}" ({account.email})? This action cannot be undone
            and you will lose access to manage this Cloudflare account from this dashboard.
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
            {isLoading ? "Deleting..." : "Delete Account"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
