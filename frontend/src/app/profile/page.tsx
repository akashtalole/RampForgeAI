'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/components/auth/AuthProvider';

function ProfileContent() {
  const { user } = useAuth();

  return (
    <MainLayout>
      <div className="p-6 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground font-headline">
            User Profile
          </h1>
          <p className="text-muted-foreground font-body">
            Manage your account information and preferences.
          </p>
        </div>

        <div className="grid gap-6 max-w-4xl">
          {/* Profile Information */}
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-xl">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <CardTitle className="text-foreground">{user?.name}</CardTitle>
                  <CardDescription className="text-muted-foreground">{user?.email}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">Full Name</label>
                    <p className="text-sm text-muted-foreground mt-1">{user?.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Email Address</label>
                    <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">Role</label>
                    <p className="text-sm text-muted-foreground mt-1">{user?.role}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Account Status</label>
                    <div className="flex items-center mt-1">
                      <div className={`w-2 h-2 rounded-full mr-2 ${user?.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="text-sm text-muted-foreground">
                        {user?.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Skills & Expertise */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Skills & Expertise</CardTitle>
              <CardDescription className="text-muted-foreground">
                Your technical skills and areas of expertise
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user?.skills && user.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {user.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No skills added yet</p>
                  <Button variant="outline" size="sm">
                    Add Skills
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Account Actions</CardTitle>
              <CardDescription className="text-muted-foreground">
                Manage your account settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button variant="outline">
                  Edit Profile
                </Button>
                <Button variant="outline">
                  Change Password
                </Button>
                <Button variant="outline">
                  Privacy Settings
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Activity Summary */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Activity Summary</CardTitle>
              <CardDescription className="text-muted-foreground">
                Your recent activity and progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">0</div>
                  <div className="text-sm text-muted-foreground">Projects Analyzed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">0%</div>
                  <div className="text-sm text-muted-foreground">Learning Progress</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">0</div>
                  <div className="text-sm text-muted-foreground">Knowledge Items</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}