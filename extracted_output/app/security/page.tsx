"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Shield, AlertTriangle, Lock, Bot, Plus, Settings, Eye, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function SecurityPage() {
  const [selectedDomain, setSelectedDomain] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  // Mock data for security events
  const securityEvents = [
    {
      id: 1,
      type: "DDoS Attack",
      domain: "example.com",
      severity: "high",
      blocked: 1250,
      timestamp: "2024-01-15 14:30",
    },
    {
      id: 2,
      type: "Bot Traffic",
      domain: "mysite.com",
      severity: "medium",
      blocked: 89,
      timestamp: "2024-01-15 14:25",
    },
    {
      id: 3,
      type: "SQL Injection",
      domain: "webapp.com",
      severity: "critical",
      blocked: 5,
      timestamp: "2024-01-15 14:20",
    },
    {
      id: 4,
      type: "Rate Limit",
      domain: "api.example.com",
      severity: "low",
      blocked: 234,
      timestamp: "2024-01-15 14:15",
    },
  ]

  // Mock data for firewall rules
  const firewallRules = [
    {
      id: 1,
      name: "Block Bad IPs",
      expression: "ip.src in {192.168.1.100 192.168.1.101}",
      action: "block",
      enabled: true,
    },
    { id: 2, name: "Allow Known Bots", expression: "cf.bot_management.verified_bot", action: "allow", enabled: true },
    {
      id: 3,
      name: "Rate Limit API",
      expression: 'http.request.uri.path matches "^/api/"',
      action: "rate_limit",
      enabled: false,
    },
  ]

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200"
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Security Center</h1>
          <p className="text-gray-600 mt-1">Monitor and manage security across all your domains</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedDomain} onValueChange={setSelectedDomain}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select domain" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Domains</SelectItem>
              <SelectItem value="example.com">example.com</SelectItem>
              <SelectItem value="mysite.com">mysite.com</SelectItem>
              <SelectItem value="webapp.com">webapp.com</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Security Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Threats Blocked</CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">12,847</div>
            <p className="text-xs text-gray-600">+23% from last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Events</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">1,578</div>
            <p className="text-xs text-gray-600">-12% from last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SSL Certificates</CardTitle>
            <Lock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">24/24</div>
            <p className="text-xs text-gray-600">All domains secured</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bot Score</CardTitle>
            <Bot className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">98.5%</div>
            <p className="text-xs text-gray-600">Excellent protection</p>
          </CardContent>
        </Card>
      </div>

      {/* Security Tabs */}
      <Tabs defaultValue="events" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="events">Security Events</TabsTrigger>
          <TabsTrigger value="firewall">Firewall Rules</TabsTrigger>
          <TabsTrigger value="ssl">SSL/TLS</TabsTrigger>
          <TabsTrigger value="bot">Bot Management</TabsTrigger>
          <TabsTrigger value="settings">Security Settings</TabsTrigger>
        </TabsList>

        {/* Security Events Tab */}
        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Security Events</CardTitle>
              <CardDescription>Monitor threats and attacks across your domains</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  placeholder="Search security events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />

                <div className="space-y-3">
                  {securityEvents.map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                        <div>
                          <div className="font-medium">{event.type}</div>
                          <div className="text-sm text-gray-600">
                            {event.domain} • {event.timestamp}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getSeverityColor(event.severity)}>{event.severity}</Badge>
                        <div className="text-sm font-medium">{event.blocked} blocked</div>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Firewall Rules Tab */}
        <TabsContent value="firewall" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Firewall Rules</CardTitle>
                <CardDescription>Manage custom firewall rules and filters</CardDescription>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Rule
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add Firewall Rule</DialogTitle>
                    <DialogDescription>Create a new firewall rule to protect your domains</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="rule-name">Rule Name</Label>
                      <Input id="rule-name" placeholder="Enter rule name" />
                    </div>
                    <div>
                      <Label htmlFor="expression">Expression</Label>
                      <Input id="expression" placeholder="Enter firewall expression" />
                    </div>
                    <div>
                      <Label htmlFor="action">Action</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select action" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="allow">Allow</SelectItem>
                          <SelectItem value="block">Block</SelectItem>
                          <SelectItem value="challenge">Challenge</SelectItem>
                          <SelectItem value="rate_limit">Rate Limit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline">Cancel</Button>
                    <Button>Create Rule</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {firewallRules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Switch checked={rule.enabled} />
                      <div>
                        <div className="font-medium">{rule.name}</div>
                        <div className="text-sm text-gray-600 font-mono">{rule.expression}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{rule.action}</Badge>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SSL/TLS Tab */}
        <TabsContent value="ssl" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>SSL/TLS Encryption</CardTitle>
                <CardDescription>Configure SSL/TLS settings for your domains</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>SSL/TLS Mode</Label>
                    <p className="text-sm text-gray-600">Choose encryption level</p>
                  </div>
                  <Select defaultValue="full">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="off">Off</SelectItem>
                      <SelectItem value="flexible">Flexible</SelectItem>
                      <SelectItem value="full">Full</SelectItem>
                      <SelectItem value="strict">Full (Strict)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Always Use HTTPS</Label>
                    <p className="text-sm text-gray-600">Redirect all HTTP to HTTPS</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>HSTS</Label>
                    <p className="text-sm text-gray-600">HTTP Strict Transport Security</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Certificate Status</CardTitle>
                <CardDescription>SSL certificate information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">example.com</span>
                    <Badge className="bg-green-100 text-green-800">Valid</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">mysite.com</span>
                    <Badge className="bg-green-100 text-green-800">Valid</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">webapp.com</span>
                    <Badge className="bg-yellow-100 text-yellow-800">Expires Soon</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Bot Management Tab */}
        <TabsContent value="bot" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bot Management</CardTitle>
              <CardDescription>Configure bot detection and mitigation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Bot Fight Mode</Label>
                  <p className="text-sm text-gray-600">Basic bot protection</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Super Bot Fight Mode</Label>
                  <p className="text-sm text-gray-600">Advanced bot protection</p>
                </div>
                <Switch />
              </div>

              <div className="space-y-3">
                <Label>Bot Score Threshold</Label>
                <Select defaultValue="30">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Very Strict</SelectItem>
                    <SelectItem value="10">10 - Strict</SelectItem>
                    <SelectItem value="30">30 - Medium</SelectItem>
                    <SelectItem value="50">50 - Lenient</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Level</CardTitle>
                <CardDescription>Configure overall security settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Security Level</Label>
                  <Select defaultValue="medium">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="off">Off</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="under_attack">Under Attack</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Browser Integrity Check</Label>
                    <p className="text-sm text-gray-600">Verify browser headers</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>DDoS Protection</CardTitle>
                <CardDescription>Distributed Denial of Service protection</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>DDoS Protection</Label>
                    <p className="text-sm text-gray-600">Automatic DDoS mitigation</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Rate Limiting</Label>
                    <p className="text-sm text-gray-600">Limit requests per IP</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
