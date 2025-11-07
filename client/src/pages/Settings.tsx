import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings as SettingsIcon, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { PolicyConfig } from "@shared/firestoreTypes";

export default function Settings() {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();

  const { data: policy, isLoading } = useQuery<PolicyConfig>({
    queryKey: ["/api/policy"],
    enabled: userProfile?.role === "admin" || userProfile?.role === "md",
  });

  const [formData, setFormData] = useState<PolicyConfig | null>(null);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<PolicyConfig>) => apiRequest("/api/policy", "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/policy"] });
      toast({
        title: "Success",
        description: "Settings updated successfully",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
      updateMutation.mutate(formData);
    }
  };

  if (userProfile?.role !== "admin" && userProfile?.role !== "md") {
    return (
      <div className="p-8">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You do not have permission to view this page.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isLoading || !policy) {
    return <div className="p-8 text-center">Loading settings...</div>;
  }

  const currentPolicy = formData || policy;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">System Settings</h1>
          <p className="text-muted-foreground">Configure application policies and preferences</p>
        </div>
        <SettingsIcon className="h-8 w-8 text-muted-foreground" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>High-Value Loan Thresholds</CardTitle>
            <CardDescription>
              Define criteria for high-value quotations that require additional approvals
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="loanAmount">Minimum Loan Amount (₹)</Label>
                <Input
                  id="loanAmount"
                  type="number"
                  value={currentPolicy.highValueThresholds?.loanAmount || 0}
                  onChange={(e) => setFormData({
                    ...currentPolicy,
                    highValueThresholds: {
                      ...currentPolicy.highValueThresholds!,
                      loanAmount: parseInt(e.target.value),
                    },
                  })}
                  data-testid="input-loan-amount-threshold"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="minInterestRate">Minimum Interest Rate (%)</Label>
                <Input
                  id="minInterestRate"
                  type="number"
                  step="0.1"
                  value={currentPolicy.highValueThresholds?.minInterestRate || 0}
                  onChange={(e) => setFormData({
                    ...currentPolicy,
                    highValueThresholds: {
                      ...currentPolicy.highValueThresholds!,
                      minInterestRate: parseFloat(e.target.value),
                    },
                  })}
                  data-testid="input-min-interest-rate"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxTenure">Maximum Tenure (months)</Label>
                <Input
                  id="maxTenure"
                  type="number"
                  value={currentPolicy.highValueThresholds?.maxTenure || 0}
                  onChange={(e) => setFormData({
                    ...currentPolicy,
                    highValueThresholds: {
                      ...currentPolicy.highValueThresholds!,
                      maxTenure: parseInt(e.target.value),
                    },
                  })}
                  data-testid="input-max-tenure"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top-Up Eligibility</CardTitle>
            <CardDescription>
              Configure criteria for loan top-up eligibility
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="topUpMonths">Minimum Repayment Period (months)</Label>
              <Input
                id="topUpMonths"
                type="number"
                value={currentPolicy.topUpEligibilityMonths || 0}
                onChange={(e) => setFormData({
                  ...currentPolicy,
                  topUpEligibilityMonths: parseInt(e.target.value),
                })}
                data-testid="input-topup-months"
              />
              <p className="text-sm text-muted-foreground">
                Loans that have been repaid for this duration will be eligible for top-up
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attendance Settings</CardTitle>
            <CardDescription>
              Configure attendance tracking and validation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="geoFence">Geo-Fence Radius (meters)</Label>
              <Input
                id="geoFence"
                type="number"
                value={currentPolicy.attendanceGeoFenceRadius || 0}
                onChange={(e) => setFormData({
                  ...currentPolicy,
                  attendanceGeoFenceRadius: parseInt(e.target.value),
                })}
                data-testid="input-geofence-radius"
              />
              <p className="text-sm text-muted-foreground">
                Maximum distance allowed from office location for attendance check-in
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>
              Enable or disable various notification channels
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="emailNotif">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Send notifications via email
                </p>
              </div>
              <Switch
                id="emailNotif"
                checked={currentPolicy.emailNotifications || false}
                onCheckedChange={(checked) => setFormData({
                  ...currentPolicy,
                  emailNotifications: checked,
                })}
                data-testid="switch-email-notifications"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="smsNotif">SMS Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Send notifications via SMS
                </p>
              </div>
              <Switch
                id="smsNotif"
                checked={currentPolicy.smsNotifications || false}
                onCheckedChange={(checked) => setFormData({
                  ...currentPolicy,
                  smsNotifications: checked,
                })}
                data-testid="switch-sms-notifications"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={!formData || updateMutation.isPending}
            data-testid="button-save-settings"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </form>
    </div>
  );
}
