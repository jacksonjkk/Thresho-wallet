import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Switch } from "@/app/components/ui/switch";
import { Badge } from "@/app/components/ui/badge";
import { Slider } from "@/app/components/ui/slider";
import { 
  ArrowLeft, 
  User, 
  Bell, 
  Lock, 
  Plus,
  Trash2,
  Save,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { useState, useEffect, ChangeEvent } from "react";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { useAuth } from "@/app/context/AuthContext";
import { accountService } from "@/services/account.service";
import { inviteService } from "@/services/invite.service";

interface Signer {
  id: string;
  name: string;
  publicKey: string;
  weight: number;
}

interface RulesSettingsProps {
  onNavigate: (page: string) => void;
}

export function RulesSettings({ onNavigate }: RulesSettingsProps) {
  const { user, updateProfile } = useAuth();
  const [signers, setSigners] = useState<Signer[]>([]);
  const [threshold, setThreshold] = useState(2);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [profileFirstName, setProfileFirstName] = useState("");
  const [profileLastName, setProfileLastName] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileSaved, setProfileSaved] = useState(false);

  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    newTransaction: true,
    approvalRequired: true,
    completed: false
  });

  const [showAddSigner, setShowAddSigner] = useState(false);
  const [newSignerName, setNewSignerName] = useState("");
  const [newSignerPublicKey, setNewSignerPublicKey] = useState("");

  const [inviteLink, setInviteLink] = useState("");
  const [inviteExpiresAt, setInviteExpiresAt] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);

  const formatPublicKey = (key: string) => {
    if (!key) return "-";
    if (key.length <= 12) return key;
    return `${key.slice(0, 4)}...${key.slice(-6)}`;
  };

  // Load account data on mount
  useEffect(() => {
    const loadAccount = async () => {
      if (!user?.accountId) {
        setLoading(false);
        return;
      }

      try {
        const account = await accountService.getAccount(user.accountId);
        setThreshold(account.threshold);
        setSigners(account.signers);
      } catch (err) {
        setError("Failed to load account data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadAccount();
  }, [user?.accountId]);

  // Load profile data from user context
  useEffect(() => {
    setProfileFirstName(user?.firstName ?? "");
    setProfileLastName(user?.lastName ?? "");
    setProfileImage(user?.avatarUrl ?? null);
  }, [user?.firstName, user?.lastName, user?.avatarUrl]);

  const handleAddSigner = async () => {
    if (!newSignerName.trim() || !newSignerPublicKey.trim()) {
      setError("Please enter signer name and public key");
      return;
    }

    if (!user?.accountId) {
      setError("No account selected");
      return;
    }

    try {
      const created = await accountService.addSigner(user.accountId, {
        name: newSignerName,
        publicKey: newSignerPublicKey,
        weight: 1,
      });

      setSigners([...signers, created]);
      setNewSignerName("");
      setNewSignerPublicKey("");
      setShowAddSigner(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add signer");
    }
  };

  const handleRemoveSigner = async (id: string) => {
    if (!user?.accountId) return;
    try {
      await accountService.removeSigner(user.accountId, id);
      setSigners(signers.filter((s) => s.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove signer");
    }
  };

  const handleSave = async () => {
    if (!user?.accountId) return;

    try {
      setLoading(true);
      await accountService.updateRules(user.accountId, threshold);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError("Failed to save changes");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setProfileImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleProfileSave = async () => {
    try {
      await updateProfile({
        firstName: profileFirstName.trim(),
        lastName: profileLastName.trim(),
        avatarUrl: profileImage,
      });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (err) {
      setError('Failed to update profile');
    }
  };

  const handleCreateInvite = async () => {
    if (!user?.accountId) {
      setError("No account selected");
      return;
    }

    setInviteLoading(true);
    setError("");
    setInviteLink("");
    setInviteExpiresAt("");

    try {
      const result = await inviteService.createInvite({
        accountId: user.accountId,
      });

      setInviteLink(result.inviteLink);
      setInviteExpiresAt(result.expiresAt);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create invite");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleCopyInviteLink = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 5000);
  };

  return (
    <div className="space-y-6">
      {loading && (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Loading account settings...</p>
          </CardContent>
        </Card>
      )}

      {!loading && !user?.accountId && (
        <Card>
          <CardHeader>
            <CardTitle>No Account Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              You need to create an account first before you can manage signers and rules.
            </p>
            <Button onClick={() => onNavigate("dashboard")}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      )}

      {!loading && user?.accountId && (
        <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => onNavigate("dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl">Rules & Settings</h1>
            <p className="text-muted-foreground">Configure your multi-sig wallet security</p>
          </div>
        </div>
        <Button onClick={handleSave} className="bg-gradient-to-r from-blue-600 to-purple-600">
          {saved ? (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Saved!
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Warning Alert */}
      <Alert className="border-orange-200 bg-orange-50">
        <AlertCircle className="w-4 h-4 text-orange-600" />
        <AlertDescription className="text-orange-900">
          Changing threshold rules requires approval from existing signers. Changes will be pending until approved.
        </AlertDescription>
      </Alert>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5 text-blue-600" />
            <CardTitle>Profile</CardTitle>
          </div>
          <CardDescription>
            Manage your profile details and connected wallet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white overflow-hidden">
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-lg font-semibold">
                  {profileFirstName?.[0]?.toUpperCase()}{profileLastName?.[0]?.toUpperCase()}
                </span>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-image">Profile Picture</Label>
              <Input
                id="profile-image"
                type="file"
                accept="image/*"
                onChange={handleProfileImageChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="profile-first-name">First Name</Label>
              <Input
                id="profile-first-name"
                value={profileFirstName}
                onChange={(e) => setProfileFirstName(e.target.value)}
                placeholder="First name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-last-name">Last Name</Label>
              <Input
                id="profile-last-name"
                value={profileLastName}
                onChange={(e) => setProfileLastName(e.target.value)}
                placeholder="Last name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Connected Public Key</Label>
            <Input
              value={user?.publicKey || "Not connected"}
              readOnly
              className="font-mono text-sm"
            />
          </div>

          <Button onClick={handleProfileSave} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            Save Profile
          </Button>

          {profileSaved && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <AlertDescription className="text-green-900">
                Profile updated successfully.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Threshold Rules */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <img src="/logo.png" alt="Thresho" className="w-10 h-10" />
            <CardTitle>Account Settings</CardTitle>
          </div>
          <CardDescription>
            Manage your multisig account threshold and signers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4 p-4 rounded-lg border bg-muted/50">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="mb-1">Signature Threshold</h4>
                <p className="text-sm text-muted-foreground">Number of required signatures to approve transactions</p>
              </div>
              <Badge variant="outline">{threshold} of {signers.length}</Badge>
            </div>
            
            {threshold > signers.length && (
              <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>
                  Threshold ({threshold}) cannot exceed number of signers ({signers.length}). Add more signers or reduce the threshold.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <Label>Required Signatures</Label>
                <span className="text-muted-foreground">{threshold}</span>
              </div>
              <Slider
                value={[threshold]}
                onValueChange={(value) => setThreshold(value[0])}
                min={1}
                max={Math.max(signers.length, 1)}
                step={1}
                className="flex-1"
              />
            </div>
            
            <Button 
              onClick={handleSave} 
              className="w-full"
              disabled={loading || threshold > signers.length}
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : 'Save Threshold'}
            </Button>
            
            {saved && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <AlertDescription className="text-green-900">
                  Threshold updated successfully!
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Signer Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5 text-purple-600" />
              <CardTitle>Manage Signers</CardTitle>
            </div>
            <Button 
              variant="outline"
              onClick={() => setShowAddSigner(!showAddSigner)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Signer
            </Button>
          </div>
          <CardDescription>
            Add or remove authorized signers for this wallet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Signer Form */}
          {showAddSigner && (
            <div className="p-4 rounded-lg border bg-muted/50 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signer-name">Signer Name</Label>
                <Input
                  id="signer-name"
                  placeholder="e.g., Alice Smith"
                  value={newSignerName}
                  onChange={(e) => setNewSignerName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signer-public-key">Public Key</Label>
                <Input
                  id="signer-public-key"
                  placeholder="Stellar public key"
                  value={newSignerPublicKey}
                  onChange={(e) => setNewSignerPublicKey(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>
              <div className="flex space-x-3">
                <Button onClick={handleAddSigner} className="flex-1">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Signer
                </Button>
                <Button variant="outline" onClick={() => setShowAddSigner(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Signers List */}
          <div className="space-y-3">
            {loading ? (
              <div className="text-center text-muted-foreground">Loading signers...</div>
            ) : signers.length === 0 ? (
              <Alert>
                <AlertDescription>
                  No signers added yet. Click "Add Signer" to get started.
                </AlertDescription>
              </Alert>
            ) : (
              signers.map((signer) => (
                <div key={signer.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-medium">{signer.name}</div>
                      <div className="text-sm text-muted-foreground font-mono truncate">
                        {formatPublicKey(signer.publicKey)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground mb-1">Weight</div>
                      <Badge variant="outline">{signer.weight}</Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveSigner(signer.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      disabled={signers.length <= 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Invite Signers */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5 text-blue-600" />
            <CardTitle>Invite Signers</CardTitle>
          </div>
          <CardDescription>
            Create a 24-hour invitation link for signers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleCreateInvite} disabled={inviteLoading}>
            {inviteLoading ? "Creating Invitation Link..." : "Create Invitation Link"}
          </Button>

          {inviteLink && (
            <Alert>
              <AlertDescription>
                <div className="space-y-2">
                  <div className="text-sm">Invite Link:</div>
                  <div className="break-all text-sm font-mono bg-muted p-2 rounded">{inviteLink}</div>
                  {inviteExpiresAt && (
                    <div className="text-xs text-muted-foreground">Expires: {new Date(inviteExpiresAt).toLocaleString()}</div>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCopyInviteLink}
                  >
                    {inviteCopied ? "Copied" : "Copy Link"}
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-cyan-600" />
            <CardTitle>Notification Settings</CardTitle>
          </div>
          <CardDescription>
            Choose how you want to be notified about transactions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Notification Channels */}
          <div>
            <h4 className="mb-4">Notification Channels</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <div className="font-medium">Email Notifications</div>
                  <div className="text-sm text-muted-foreground">Receive updates via email</div>
                </div>
                <Switch
                  checked={notifications.email}
                  onCheckedChange={(checked) => 
                    setNotifications({ ...notifications, email: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <div className="font-medium">Push Notifications</div>
                  <div className="text-sm text-muted-foreground">Browser and mobile alerts</div>
                </div>
                <Switch
                  checked={notifications.push}
                  onCheckedChange={(checked) => 
                    setNotifications({ ...notifications, push: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <div className="font-medium">SMS Notifications</div>
                  <div className="text-sm text-muted-foreground">Text message alerts</div>
                </div>
                <Switch
                  checked={notifications.sms}
                  onCheckedChange={(checked) => 
                    setNotifications({ ...notifications, sms: checked })
                  }
                />
              </div>
            </div>
          </div>

          {/* Event Types */}
          <div>
            <h4 className="mb-4">Notify Me About</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <div className="font-medium">New Transaction Created</div>
                  <div className="text-sm text-muted-foreground">When a new transaction is submitted</div>
                </div>
                <Switch
                  checked={notifications.newTransaction}
                  onCheckedChange={(checked) => 
                    setNotifications({ ...notifications, newTransaction: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <div className="font-medium">Approval Required</div>
                  <div className="text-sm text-muted-foreground">When your signature is needed</div>
                </div>
                <Switch
                  checked={notifications.approvalRequired}
                  onCheckedChange={(checked) => 
                    setNotifications({ ...notifications, approvalRequired: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <div className="font-medium">Transaction Completed</div>
                  <div className="text-sm text-muted-foreground">When a transaction is executed</div>
                </div>
                <Switch
                  checked={notifications.completed}
                  onCheckedChange={(checked) => 
                    setNotifications({ ...notifications, completed: checked })
                  }
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Options */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Lock className="w-5 h-5 text-red-600" />
            <CardTitle>Security Options</CardTitle>
          </div>
          <CardDescription>
            Additional security settings for your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <div className="font-medium">Two-Factor Authentication</div>
              <div className="text-sm text-muted-foreground">Extra security for account access</div>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <div className="font-medium">Biometric Login</div>
              <div className="text-sm text-muted-foreground">Use fingerprint or face ID</div>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <div className="font-medium">Transaction Limits</div>
              <div className="text-sm text-muted-foreground">Set maximum transaction amounts</div>
            </div>
            <Button variant="outline" size="sm">Configure</Button>
          </div>
        </CardContent>
      </Card>
        </>
      )}
    </div>
  );
}
