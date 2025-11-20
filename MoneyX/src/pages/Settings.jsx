import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '@/components/common/BottomNav';
import { Navbar } from '@/components/common/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/common/Toast';
import { formatDate } from '@/lib/utils';
import {
  User,
  Mail,
  Calendar,
  LogOut,
  Trash2,
  Info,
  Shield,
  Bell,
  Palette,
  Database,
} from 'lucide-react';

export default function Settings() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const toast = useToast();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await signOut();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to logout. Please try again.');
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar title="Settings" />

      <main className="max-w-lg mx-auto p-4 space-y-4">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{user?.displayName || 'User'}</p>
                <p className="text-sm text-muted-foreground">Account Holder</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{user?.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Member Since</p>
                  <p className="font-medium">
                    {user?.createdAt
                      ? formatDate(user.createdAt.toDate?.() || new Date())
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* App Information */}
        <Card>
          <CardHeader>
            <CardTitle>App Information</CardTitle>
            <CardDescription>About Finance Tracker</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Info className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Version</span>
              </div>
              <span className="text-sm font-medium">1.0.0</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Database className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Currency</span>
              </div>
              <span className="text-sm font-medium">BDT (৳)</span>
            </div>
          </CardContent>
        </Card>

        {/* Preferences (Placeholder for future features) */}
        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>Customize your experience</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between opacity-50">
              <div className="flex items-center gap-3">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Notifications</span>
              </div>
              <span className="text-xs text-muted-foreground">Coming Soon</span>
            </div>

            <div className="flex items-center justify-between opacity-50">
              <div className="flex items-center gap-3">
                <Palette className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Theme</span>
              </div>
              <span className="text-xs text-muted-foreground">Coming Soon</span>
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Security */}
        <Card>
          <CardHeader>
            <CardTitle>Privacy & Security</CardTitle>
            <CardDescription>Keep your data safe</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Your financial data is encrypted and stored securely in Firebase. Only you have
                access to your information.
              </AlertDescription>
            </Alert>

            <div className="pt-2 space-y-2">
              <p className="text-xs text-muted-foreground">
                • All transactions are encrypted end-to-end
              </p>
              <p className="text-xs text-muted-foreground">
                • Your data is never shared with third parties
              </p>
              <p className="text-xs text-muted-foreground">
                • Firebase security rules protect your information
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
            <CardDescription>Manage your financial data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start" disabled>
              <Database className="h-4 w-4 mr-2" />
              Export Data
              <span className="ml-auto text-xs text-muted-foreground">Coming Soon</span>
            </Button>

            <Button variant="outline" className="w-full justify-start" disabled>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete All Data
              <span className="ml-auto text-xs text-muted-foreground">Coming Soon</span>
            </Button>
          </CardContent>
        </Card>

        {/* About */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <h3 className="font-semibold">💰 Finance Tracker</h3>
              <p className="text-sm text-muted-foreground">
                Your personal finance management companion
              </p>
              <p className="text-xs text-muted-foreground">
                Built with React, Firebase & Tailwind CSS
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Logout Button */}
        <Button
          variant="destructive"
          className="w-full"
          onClick={() => setShowLogoutDialog(true)}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>

        {/* Version Info */}
        <p className="text-center text-xs text-muted-foreground pb-4">
          Made with ❤️ for better financial management
        </p>
      </main>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        open={showLogoutDialog}
        onOpenChange={setShowLogoutDialog}
        onConfirm={handleLogout}
        title="Logout?"
        description="Are you sure you want to logout? Your data will remain safe and you can login anytime."
        confirmText="Logout"
        variant="destructive"
        isLoading={loggingOut}
      />

      <BottomNav />
    </div>
  );
}