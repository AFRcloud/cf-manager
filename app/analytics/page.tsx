"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { Area, AreaChart, Bar, BarChart, Line, LineChart, XAxis, YAxis } from "recharts"
import { Globe, TrendingUp, Shield, Zap, Activity, Users, Download, AlertTriangle, CheckCircle } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import Link from "next/link"

interface AnalyticsData {
  requests: Array<{ time: string; requests: number; cached: number; uncached: number }>
  bandwidth: Array<{ time: string; bandwidth: number; cached: number; uncached: number }>
  threats: Array<{ time: string; blocked: number; challenged: number; passed: number }>
  topCountries: Array<{ country: string; requests: number; percentage: number }>
  topPaths: Array<{ path: string; requests: number; percentage: number }>
  responseStatus: Array<{ status: string; count: number; percentage: number }>
}

export default function AnalyticsPage() {
  const { user, cloudflareAccounts } = useAuth()
  const [timeRange, setTimeRange] = useState("24h")
  const [selectedDomain, setSelectedDomain] = useState("all")
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Mock analytics data
  useEffect(() => {
    const loadAnalytics = async () => {
      setIsLoading(true)
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const mockData: AnalyticsData = {
        requests: [
          { time: "00:00", requests: 1200, cached: 800, uncached: 400 },
          { time: "04:00", requests: 800, cached: 600, uncached: 200 },
          { time: "08:00", requests: 2400, cached: 1800, uncached: 600 },
          { time: "12:00", requests: 3200, cached: 2400, uncached: 800 },
          { time: "16:00", requests: 2800, cached: 2100, uncached: 700 },
          { time: "20:00", requests: 1800, cached: 1350, uncached: 450 },
        ],
        bandwidth: [
          { time: "00:00", bandwidth: 45, cached: 30, uncached: 15 },
          { time: "04:00", bandwidth: 32, cached: 24, uncached: 8 },
          { time: "08:00", bandwidth: 78, cached: 58, uncached: 20 },
          { time: "12:00", bandwidth: 95, cached: 71, uncached: 24 },
          { time: "16:00", bandwidth: 88, cached: 66, uncached: 22 },
          { time: "20:00", bandwidth: 62, cached: 47, uncached: 15 },
        ],
        threats: [
          { time: "00:00", blocked: 45, challenged: 12, passed: 1143 },
          { time: "04:00", blocked: 32, challenged: 8, passed: 760 },
          { time: "08:00", blocked: 78, challenged: 22, passed: 2300 },
          { time: "12:00", blocked: 95, challenged: 28, passed: 3077 },
          { time: "16:00", blocked: 88, challenged: 25, passed: 2687 },
          { time: "20:00", blocked: 62, challenged: 18, passed: 1720 },
        ],
        topCountries: [
          { country: "United States", requests: 45230, percentage: 42.3 },
          { country: "Germany", requests: 18940, percentage: 17.7 },
          { country: "United Kingdom", requests: 12450, percentage: 11.6 },
          { country: "France", requests: 9870, percentage: 9.2 },
          { country: "Canada", requests: 7650, percentage: 7.1 },
          { country: "Others", requests: 12860, percentage: 12.1 },
        ],
        topPaths: [
          { path: "/", requests: 28450, percentage: 26.6 },
          { path: "/api/v1/users", requests: 15230, percentage: 14.2 },
          { path: "/dashboard", requests: 12890, percentage: 12.1 },
          { path: "/api/v1/data", requests: 9870, percentage: 9.2 },
          { path: "/login", requests: 8760, percentage: 8.2 },
          { path: "Others", requests: 31800, percentage: 29.7 },
        ],
        responseStatus: [
          { status: "2xx", count: 89450, percentage: 83.6 },
          { status: "3xx", count: 8970, percentage: 8.4 },
          { status: "4xx", count: 6540, percentage: 6.1 },
          { status: "5xx", count: 2040, percentage: 1.9 },
        ],
      }

      setAnalyticsData(mockData)
      setIsLoading(false)
    }

    if (cloudflareAccounts.length > 0) {
      loadAnalytics()
    } else {
      setIsLoading(false)
    }
  }, [cloudflareAccounts, timeRange, selectedDomain])

  const chartConfig = {
    requests: {
      label: "Requests",
      color: "hsl(var(--chart-1))",
    },
    cached: {
      label: "Cached",
      color: "hsl(var(--chart-2))",
    },
    uncached: {
      label: "Uncached",
      color: "hsl(var(--chart-3))",
    },
    bandwidth: {
      label: "Bandwidth (GB)",
      color: "hsl(var(--chart-1))",
    },
    blocked: {
      label: "Blocked",
      color: "hsl(var(--destructive))",
    },
    challenged: {
      label: "Challenged",
      color: "hsl(var(--chart-4))",
    },
    passed: {
      label: "Passed",
      color: "hsl(var(--chart-2))",
    },
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Please log in to access analytics.</p>
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
              <h2 className="text-lg font-heading font-semibold text-foreground">Analytics</h2>
            </div>
            <div className="flex items-center gap-3">
              <Select value={selectedDomain} onValueChange={setSelectedDomain}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select domain" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Domains</SelectItem>
                  <SelectItem value="example.com">example.com</SelectItem>
                  <SelectItem value="staging.example.com">staging.example.com</SelectItem>
                  <SelectItem value="api.example.com">api.example.com</SelectItem>
                </SelectContent>
              </Select>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">Last Hour</SelectItem>
                  <SelectItem value="24h">Last 24h</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {cloudflareAccounts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Activity className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-heading font-semibold mb-2">No analytics data available</h3>
            <p className="text-muted-foreground mb-6">Connect your Cloudflare accounts to view analytics data.</p>
            <Link href="/accounts">
              <Button>
                <Globe className="w-4 h-4 mr-2" />
                Add Cloudflare Account
              </Button>
            </Link>
          </div>
        ) : isLoading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading analytics data...</p>
          </div>
        ) : (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Requests</CardTitle>
                  <Activity className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-heading font-bold text-foreground">12.4K</div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-green-500" />
                    +12% from yesterday
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Bandwidth Saved</CardTitle>
                  <Zap className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-heading font-bold text-foreground">75%</div>
                  <p className="text-xs text-muted-foreground">400GB cached</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Threats Blocked</CardTitle>
                  <Shield className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-heading font-bold text-foreground">400</div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    Security active
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Unique Visitors</CardTitle>
                  <Users className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-heading font-bold text-foreground">8.2K</div>
                  <p className="text-xs text-muted-foreground">+5% from yesterday</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <Tabs defaultValue="traffic" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="traffic">Traffic</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
                <TabsTrigger value="insights">Insights</TabsTrigger>
              </TabsList>

              <TabsContent value="traffic" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="font-heading">Requests Over Time</CardTitle>
                      <CardDescription>Total requests with cache breakdown</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={chartConfig} className="h-[300px]">
                        <AreaChart data={analyticsData?.requests}>
                          <XAxis dataKey="time" />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <ChartLegend content={<ChartLegendContent />} />
                          <Area
                            type="monotone"
                            dataKey="cached"
                            stackId="1"
                            stroke="hsl(var(--chart-2))"
                            fill="hsl(var(--chart-2))"
                            fillOpacity={0.6}
                          />
                          <Area
                            type="monotone"
                            dataKey="uncached"
                            stackId="1"
                            stroke="hsl(var(--chart-3))"
                            fill="hsl(var(--chart-3))"
                            fillOpacity={0.6}
                          />
                        </AreaChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="font-heading">Bandwidth Usage</CardTitle>
                      <CardDescription>Data transfer with cache efficiency</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={chartConfig} className="h-[300px]">
                        <LineChart data={analyticsData?.bandwidth}>
                          <XAxis dataKey="time" />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <ChartLegend content={<ChartLegendContent />} />
                          <Line
                            type="monotone"
                            dataKey="bandwidth"
                            stroke="hsl(var(--chart-1))"
                            strokeWidth={3}
                            dot={{ fill: "hsl(var(--chart-1))" }}
                          />
                          <Line
                            type="monotone"
                            dataKey="cached"
                            stroke="hsl(var(--chart-2))"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                          />
                        </LineChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="font-heading">Top Countries</CardTitle>
                      <CardDescription>Requests by country</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {analyticsData?.topCountries.map((country, index) => (
                          <div key={country.country} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-primary" />
                              <span className="text-sm font-medium">{country.country}</span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium">{country.requests.toLocaleString()}</div>
                              <div className="text-xs text-muted-foreground">{country.percentage}%</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="font-heading">Response Status</CardTitle>
                      <CardDescription>HTTP response codes distribution</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {analyticsData?.responseStatus.map((status) => (
                          <div key={status.status} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Badge
                                variant={
                                  status.status === "2xx"
                                    ? "default"
                                    : status.status === "3xx"
                                      ? "secondary"
                                      : status.status === "4xx"
                                        ? "outline"
                                        : "destructive"
                                }
                              >
                                {status.status}
                              </Badge>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium">{status.count.toLocaleString()}</div>
                              <div className="text-xs text-muted-foreground">{status.percentage}%</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="performance" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="font-heading">Cache Performance</CardTitle>
                      <CardDescription>Cache hit ratio and efficiency</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8">
                        <div className="text-4xl font-heading font-bold text-primary mb-2">75.2%</div>
                        <p className="text-muted-foreground">Cache Hit Ratio</p>
                        <div className="mt-4 flex justify-center gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-chart-2" />
                            <span>Cached: 9.3K</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-chart-3" />
                            <span>Uncached: 3.1K</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="font-heading">Top Paths</CardTitle>
                      <CardDescription>Most requested paths</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {analyticsData?.topPaths.map((path) => (
                          <div key={path.path} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <code className="text-xs bg-muted px-2 py-1 rounded">{path.path}</code>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium">{path.requests.toLocaleString()}</div>
                              <div className="text-xs text-muted-foreground">{path.percentage}%</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="security" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-heading">Security Events</CardTitle>
                    <CardDescription>Threats blocked and challenged over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[400px]">
                      <BarChart data={analyticsData?.threats}>
                        <XAxis dataKey="time" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Bar dataKey="blocked" fill="hsl(var(--destructive))" />
                        <Bar dataKey="challenged" fill="hsl(var(--chart-4))" />
                        <Bar dataKey="passed" fill="hsl(var(--chart-2))" />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="insights" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="font-heading">Performance Insights</CardTitle>
                      <CardDescription>Key metrics and recommendations</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                        <div>
                          <p className="font-medium">Excellent cache performance</p>
                          <p className="text-sm text-muted-foreground">
                            Your cache hit ratio of 75.2% is above average
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
                        <div>
                          <p className="font-medium">Consider enabling compression</p>
                          <p className="text-sm text-muted-foreground">Could reduce bandwidth usage by up to 20%</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                        <div>
                          <p className="font-medium">Security is active</p>
                          <p className="text-sm text-muted-foreground">400 threats blocked in the last 24h</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="font-heading">Recommendations</CardTitle>
                      <CardDescription>Optimize your Cloudflare setup</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="font-medium text-sm">Enable Auto Minify</p>
                        <p className="text-xs text-muted-foreground mt-1">Reduce file sizes for faster loading</p>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="font-medium text-sm">Configure Page Rules</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Optimize caching for your most popular paths
                        </p>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="font-medium text-sm">Review Security Settings</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Consider enabling additional security features
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </div>
  )
}
