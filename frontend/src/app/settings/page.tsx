'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useAuth } from '@/components/auth/AuthProvider';
import { MCPServiceList } from '@/components/mcp/MCPServiceList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function SettingsContent() {
  const { user } = useAuth();

  return (
    <MainLayout>
      <div className="p-6 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground font-headline">
            Settings
          </h1>
          <p className="text-muted-foreground font-body">
            Configure your preferences and account settings.
          </p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            {/* Theme Settings */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Appearance</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Customize how RampForgeAI looks and feels
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-foreground">Theme</h4>
                    <p className="text-sm text-muted-foreground">
                      Choose your preferred color scheme
                    </p>
                  </div>
                  <ThemeToggle />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6">
            {/* MCP Integration */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Development Tools</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Connect with your development tools using MCP (Model Context Protocol)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MCPServiceList />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account" className="space-y-6">
            {/* Account Settings */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Account Information</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Manage your account details and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">Name</label>
                    <p className="text-sm text-muted-foreground">{user?.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Email</label>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Role</label>
                    <p className="text-sm text-muted-foreground">{user?.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  );
}