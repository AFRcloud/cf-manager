import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { AuthProvider } from "@/components/auth-provider"

export const metadata: Metadata = {
  title: "Cloudflare Account Manager",
  description: "Manage multiple Cloudflare accounts in one dashboard",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <link rel="preload" href="/api/cloudflare/zones" as="fetch" crossOrigin="anonymous" />
        <link rel="preload" href="/api/cloudflare/workers" as="fetch" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="//api.cloudflare.com" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('[v0] SW registered: ', registration);
                    })
                    .catch(function(registrationError) {
                      console.log('[v0] SW registration failed: ', registrationError);
                    });
                });
              }
            `,
          }}
        />
      </head>
      <body className="bg-background text-foreground">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
