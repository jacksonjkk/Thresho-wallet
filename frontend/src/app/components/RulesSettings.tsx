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
  CheckCircle2,
  Shield,
  Activity
} from "lucide-react";
import { useState, useEffect, ChangeEvent } from "react";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { useAuth } from "@/app/context/AuthContext";
import { accountService } from "@/services/account.service";
import { inviteService } from "@/services/invite.service";
import { freighterService } from "@/services/freighter.service";
import { transactionService } from "@/services/transaction.service";
import { toast } from "sonner";

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
  const { user, updateProfile, deleteAccount } = useAuth();
  const [signers, setSigners] = useState<Signer[]>([]);
  const [threshold, setThreshold] = useState(2);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [profileFirstName, setProfileFirstName] = useState("");
  const [profileLastName, setProfileLastName] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileSaved, setProfileSaved] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    newTransaction: true,
    approvalRequired: true,
    completed: false
  });

  const [syncLoading, setSyncLoading] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  const [showAddSigner, setShowAddSigner] = useState(false);
  const [newSignerName, setNewSignerName] = useState("");
  const [newSignerPublicKey, setNewSignerPublicKey] = useState("");

  const [inviteLink, setInviteLink] = useState("");
  const [inviteExpiresAt, setInviteExpiresAt] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);

  // Delete account state
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    setDeleteError("");
    try {
      await deleteAccount();
      setDeleteSuccess(true);
      setShowDeleteConfirm(false);
    } catch (err) {
      setDeleteError("Failed to delete account. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

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
        setIsOwner(account.owner.id === user.id);
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

  const handleSyncMultisig = async () => {
    if (!user?.accountId || !user.publicKey) {
      setError("Account or wallet not connected");
      return;
    }

    setSyncLoading(true);
    setError("");

    let createdTxId: string | null = null;
    try {
      // 1. Create the sync transaction
      const { transactionId, xdr, networkPassphrase } = await accountService.syncMultisig(user.accountId);
      createdTxId = transactionId;

      // 2. Sign it with Freighter
      const signedXdr = await freighterService.signChallenge(xdr, networkPassphrase);

      // 3. Submit signature
      await transactionService.signTransaction(transactionId, {
        signedXdr,
        signerPublicKey: user.publicKey,
      });

      // 4. Try execute immediately (since it's the owner and currently the only signer on-chain)
      try {
        await transactionService.executeTransaction(transactionId);
        setSyncSuccess(true);
        setTimeout(() => setSyncSuccess(false), 5000);
        toast.success("Multisig configuration synced to blockchain!");
      } catch (execErr: any) {
        toast.info("Configuration proposal created. It requires approvals to be applied.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to sync multisig configuration");
      if (createdTxId) {
        transactionService.deleteTransaction(createdTxId).catch(console.error);
      }
    } finally {
      setSyncLoading(false);
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
        <Card className="border-white/5 bg-white/5 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold tracking-tight uppercase">Account Not Found</CardTitle>
            <CardDescription className="text-[10px] uppercase font-bold tracking-widest opacity-60">Authentication failed or record removed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm text-muted-foreground leading-relaxed">
              You need to create an account or be invited to an existing wallet before you can access this section.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button onClick={() => onNavigate("dashboard")} className="min-w-[200px] h-12 rounded-xl font-bold tracking-widest uppercase text-xs">
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && user?.accountId && (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-2">
            <div className="flex items-center">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-4xl font-bold tracking-tight">Security & <span className="text-primary">Rules</span></h1>
                  {!isOwner && <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">View Only</Badge>}
                </div>
                <p className="text-muted-foreground font-medium uppercase tracking-[0.2em] text-[10px] opacity-60">Manage your wallet policy</p>
              </div>
            </div>
            {isOwner && (
              <Button onClick={handleSave} className="min-w-[160px] shadow-[0_4px_15px_rgba(99,102,241,0.2)]">
                {saved ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    SYSTEM SAVED
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    SAVE CHANGES
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Warning Alert */}
          <Alert className="border-orange-200 bg-orange-50">
            <AlertCircle className="w-4 h-4 text-orange-600" />
            <AlertDescription className="text-orange-900">
              Changing threshold rules requires approval from existing signers. Changes will be pending until approved.
            </AlertDescription>
          </Alert>

          {/* Profile Settings */}
          <Card className="overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors"></div>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Profile Information</CardTitle>
                  <CardDescription>
                    Manage your personal identity and linked Stellar keys
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="flex flex-col sm:flex-row items-center gap-8 p-6 rounded-2xl border border-white/5 bg-white/5">
                <div className="relative group/avatar">
                  <div className="absolute inset-0 bg-primary/40 blur-2xl rounded-full opacity-40 group-hover/avatar:opacity-60 transition-opacity"></div>
                  <div className="w-24 h-24 rounded-2xl bg-[#1D1D26] border border-white/10 flex items-center justify-center text-white overflow-hidden relative z-10 shadow-2xl">
                    {profileImage ? (
                      <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl font-bold tracking-tighter text-primary">
                        {profileFirstName?.[0]?.toUpperCase()}{profileLastName?.[0]?.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-1 w-full space-y-4">
                  <Label htmlFor="profile-image" className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 block">Avatar Synchronizer</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="profile-image"
                      type="file"
                      accept="image/*"
                      onChange={handleProfileImageChange}
                      className="bg-background/50 border-white/10"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">Supported: JPG, PNG, WEBP (Max 2MB)</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="profile-first-name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground opacity-70">First Name</Label>
                  <Input
                    id="profile-first-name"
                    value={profileFirstName}
                    onChange={(e) => setProfileFirstName(e.target.value)}
                    placeholder="Enter first name"
                    className="h-12 bg-white/5 border-white/10 focus:border-primary/50 transition-all rounded-xl"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="profile-last-name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground opacity-70">Last Name</Label>
                  <Input
                    id="profile-last-name"
                    value={profileLastName}
                    onChange={(e) => setProfileLastName(e.target.value)}
                    placeholder="Enter last name"
                    className="h-12 bg-white/5 border-white/10 focus:border-primary/50 transition-all rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground opacity-70">Authenticated Public Key</Label>
                <div className="relative group">
                  <Input
                    value={user?.publicKey || "Not connected"}
                    readOnly
                    className="h-12 font-mono text-xs bg-[#0D0D11] border-white/10 rounded-xl pr-12 text-primary/80"
                  />
                  <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-40" />
                </div>
              </div>

              <div className="flex justify-center pt-4">
                <Button onClick={handleProfileSave} className="min-w-[200px] shadow-lg">
                  <Save className="w-4 h-4 mr-2" />
                  UPDATE PROFILE
                </Button>
              </div>

              {profileSaved && (
                <div className="flex items-center justify-center p-4 rounded-xl border border-status-success/20 bg-status-success/5 text-status-success text-sm font-bold tracking-tight animate-in fade-in zoom-in">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  IDENTITY UPDATED SUCCESSFULLY
                </div>
              )}
            </CardContent>
          </Card>

          {/* Threshold Rules */}
          {isOwner && (
            <Card className="relative overflow-hidden group">
              <div className="absolute bottom-0 right-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-[80px] -mr-24 -mb-24"></div>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-cyan-500/10">
                    <Shield className="w-5 h-5 text-cyan-500" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Approval Rules</CardTitle>
                    <CardDescription>
                      Configure how many signatures are required for transactions
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-6 p-6 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm tracking-tight mb-1 uppercase">Required Signatures</h4>
                      <p className="text-xs text-muted-foreground">Number of members needed to authorize a transaction</p>
                    </div>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-bold px-3 py-1">
                      {threshold} OF {signers.length}
                    </Badge>
                  </div>

                  {threshold > signers.length && (
                    <div className="p-4 rounded-xl border border-status-error/30 bg-status-error/10 text-status-error text-xs flex items-center space-x-3">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <p>Critical: Threshold exceeds active signer count. Execution restricted.</p>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-70">
                      <Label>Required Signatures</Label>
                      <span className="text-primary">{threshold} Nodes</span>
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Button
                      onClick={handleSave}
                      className="shadow-lg"
                      disabled={loading || threshold > signers.length}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {loading ? 'SYNCHRONIZING...' : 'COMMIT THRESHOLD'}
                    </Button>

                    <Button
                      onClick={handleSyncMultisig}
                      variant="outline"
                      className="border-primary/20 hover:bg-primary/10 text-primary uppercase font-bold text-xs tracking-tight"
                      disabled={syncLoading}
                    >
                      <Activity className={`w-4 h-4 mr-2 ${syncLoading ? 'animate-spin' : ''}`} />
                      {syncLoading ? 'DEPLOYING...' : 'SYNC BLOCKCHAIN'}
                    </Button>
                  </div>

                  {syncSuccess ? (
                    <div className="p-4 rounded-xl border border-status-success/30 bg-status-success/10 text-status-success text-xs flex items-center space-x-3 animate-in fade-in slide-in-from-top-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <p>Blockchain node synchronized successfully.</p>
                    </div>
                  ) : (
                    <div className="text-[10px] text-muted-foreground text-center font-bold uppercase tracking-widest opacity-40 italic">
                      Off-chain state may differ from network registry
                    </div>
                  )}

                  {saved && (
                    <div className="p-4 rounded-xl border border-status-success/30 bg-status-success/10 text-status-success text-xs flex items-center space-x-3">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <p>Internal security policy updated.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Signer Management */}
          {isOwner && (
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-purple-500/10 shrink-0">
                      <User className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Wallet Signers</CardTitle>
                      <CardDescription>
                        Manage who can authorize transactions for this wallet
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg h-9 w-full sm:w-auto"
                    onClick={() => setShowAddSigner(!showAddSigner)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    NEW SIGNER
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add Signer Form */}
                {showAddSigner && (
                  <div className="p-6 rounded-2xl border border-primary/20 bg-primary/5 space-y-5 animate-in slide-in-from-top-4 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="signer-name" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Entity Identifier</Label>
                        <Input
                          id="signer-name"
                          placeholder="e.g., Cold Storage 01"
                          value={newSignerName}
                          onChange={(e) => setNewSignerName(e.target.value)}
                          className="bg-background/50 border-white/10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signer-public-key" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Network Public Key</Label>
                        <Input
                          id="signer-public-key"
                          placeholder="G..."
                          value={newSignerPublicKey}
                          onChange={(e) => setNewSignerPublicKey(e.target.value)}
                          className="font-mono text-xs bg-background/50 border-white/10"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                      <Button variant="ghost" onClick={() => setShowAddSigner(false)} className="text-muted-foreground uppercase text-xs w-full sm:w-auto">
                        Abort
                      </Button>
                      <Button onClick={handleAddSigner} className="shadow-lg w-full sm:w-auto">
                        <Plus className="w-4 h-4 mr-2" />
                        REGISTER SIGNER
                      </Button>
                    </div>
                  </div>
                )}

                {/* Signers List */}
                <div className="space-y-4">
                  {loading ? (
                    <div className="text-center py-10">
                      <Activity className="w-8 h-8 text-primary/40 animate-spin mx-auto mb-3" />
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Loading Registry...</p>
                    </div>
                  ) : signers.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-white/10 rounded-2xl text-muted-foreground">
                      No signers initialized in registry.
                    </div>
                  ) : (
                    signers.map((signer) => (
                      <div key={signer.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all duration-300 group/signer gap-4">
                        <div className="flex items-center space-x-4 min-w-0">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover/signer:bg-primary group-hover/signer:text-white transition-all duration-500 shrink-0">
                            <User className="w-5 h-5 sm:w-6 sm:h-6" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold tracking-tight text-foreground truncate">{signer.name}</div>
                            <div className="text-[10px] text-muted-foreground font-mono opacity-80 mt-1 truncate">
                              {formatPublicKey(signer.publicKey)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end space-x-6 border-t border-white/5 pt-4 sm:border-0 sm:pt-0">
                          <div className="text-left sm:text-right px-4">
                            <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest opacity-50 mb-1">Weight</div>
                            <Badge variant="outline" className="font-mono border-primary/30 bg-primary/5 text-primary font-bold">{signer.weight}</Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveSigner(signer.id)}
                            className="text-red-400/60 hover:text-status-error hover:bg-status-error/10 h-10 w-10 rounded-full"
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
                  <div className="p-4 rounded-xl border border-status-error/30 bg-status-error/10 text-status-error text-xs flex items-center space-x-3">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <p>{error}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Invite Signers */}
          {isOwner && (
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Plus className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Invite Members</CardTitle>
                    <CardDescription>
                      Generate a secure link to invite new members to this wallet
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-center">
                  <Button onClick={handleCreateInvite} disabled={inviteLoading} className="w-full sm:w-auto sm:min-w-[240px]">
                    {inviteLoading ? "GENERATING TOKEN..." : "GENERATE INVITE LINK"}
                  </Button>
                </div>

                {inviteLink && (
                  <div className="p-6 rounded-2xl border border-primary/20 bg-primary/5 space-y-4 animate-in fade-in zoom-in duration-300">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/70">Secure Invitation URI</Label>
                      <div className="break-all text-xs font-mono bg-[#0D0D11] p-4 rounded-xl border border-white/5 text-primary/90 leading-relaxed">{inviteLink}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      {inviteExpiresAt && (
                        <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-50">
                          TTL: {new Date(inviteExpiresAt).toLocaleTimeString()}
                        </div>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-lg h-9 border-primary/20 text-primary hover:bg-primary/10"
                        onClick={handleCopyInviteLink}
                      >
                        {inviteCopied ? "LINK COPIED" : "COPY TO CLIPBOARD"}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-cyan-500/10">
                  <Bell className="w-5 h-5 text-cyan-500" />
                </div>
                <div>
                  <CardTitle className="text-xl">Notifications</CardTitle>
                  <CardDescription>
                    Choose how you want to be alerted about activity
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Notification Channels */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground opacity-60 mb-6">Delivery Channels</h4>
                  <div className="space-y-3">
                    {[
                      { id: 'email', label: 'Email Node', desc: 'Secure asynchronous updates', checked: notifications.email },
                      { id: 'push', label: 'Push Pulse', desc: 'Real-time websocket events', checked: notifications.push },
                      { id: 'sms', label: 'SMS Carrier', desc: 'Cellular network alerts', checked: notifications.sms },
                    ].map((channel) => (
                      <div key={channel.id} className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all gap-4">
                        <div className="min-w-0">
                          <div className="font-bold text-sm tracking-tight truncate">{channel.label}</div>
                          <div className="text-[10px] text-muted-foreground uppercase font-medium tracking-tight opacity-50 truncate">{channel.desc}</div>
                        </div>
                        <Switch
                          className="shrink-0"
                          checked={channel.checked}
                          onCheckedChange={(checked) =>
                            setNotifications({ ...notifications, [channel.id]: checked })
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Event Types */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground opacity-60 mb-6">Event Subscription</h4>
                  <div className="space-y-3">
                    {[
                      { id: 'newTransaction', label: 'Inbound Request', desc: 'When a new proposal is initiated', checked: notifications.newTransaction },
                      { id: 'approvalRequired', label: 'Approval Required', desc: 'When your signature is vital', checked: notifications.approvalRequired },
                      { id: 'completed', label: 'Sync Complete', desc: 'When execution is finalized', checked: notifications.completed },
                    ].map((event) => (
                      <div key={event.id} className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all">
                        <div>
                          <div className="font-bold text-sm tracking-tight">{event.label}</div>
                          <div className="text-[10px] text-muted-foreground uppercase font-medium tracking-tight opacity-50">{event.desc}</div>
                        </div>
                        <Switch
                          checked={event.checked}
                          onCheckedChange={(checked) =>
                            setNotifications({ ...notifications, [event.id]: checked })
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security & Access */}
          <Card className="border-status-error/10">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-status-error/10">
                  <Lock className="w-5 h-5 text-status-error" />
                </div>
                <div>
                  <CardTitle className="text-xl">Advanced Security</CardTitle>
                  <CardDescription>
                    Biometric access and account deletion controls
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/5 gap-4">
                  <div className="min-w-0">
                    <div className="font-bold text-sm tracking-tight truncate">Two-Factor Auth</div>
                    <div className="text-[10px] text-muted-foreground uppercase font-medium tracking-tight opacity-50 truncate">Extra security layer</div>
                  </div>
                  <Switch className="shrink-0" defaultChecked />
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/5 gap-4">
                  <div className="min-w-0">
                    <div className="font-bold text-sm tracking-tight truncate">Biometric Unlock</div>
                    <div className="text-[10px] text-muted-foreground uppercase font-medium tracking-tight opacity-50 truncate">Fingerprint or FaceID</div>
                  </div>
                  <Switch className="shrink-0" defaultChecked />
                </div>
              </div>

              {/* Termination Area */}
              <div className="mt-8 p-6 rounded-2xl border border-status-error/20 bg-status-error/5 group">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div>
                    <div className="font-bold text-status-error uppercase tracking-widest text-xs mb-2">Delete Account</div>
                    <div className="text-xs text-muted-foreground max-w-md leading-relaxed">
                      Permanently delete your account and all associated data. This action is **permanent** and cannot be undone.
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    className="text-status-error hover:bg-status-error/10 border border-status-error/20 rounded-xl px-6 h-11"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={deleteLoading}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    DELETE ACCOUNT
                  </Button>
                </div>
              </div>

              {/* Delete Confirmation Modal */}
              {showDeleteConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-sm shadow-2xl" onClick={() => setShowDeleteConfirm(false)}></div>
                  <div className="bg-[#17171C] border border-status-error/30 rounded-3xl p-8 max-w-md w-full relative z-10 shadow-3xl animate-in zoom-in-95 duration-200">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="w-16 h-16 rounded-full bg-status-error/10 flex items-center justify-center text-status-error mb-2">
                        <AlertCircle className="w-10 h-10" />
                      </div>
                      <h2 className="text-2xl font-bold tracking-tight text-white">Delete Account?</h2>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Are you sure you want to delete your account? This action cannot be undone.
                      </p>

                      <div className="w-full pt-4 space-y-4">
                        <div className="p-4 rounded-xl bg-status-error/5 border border-status-error/10">
                          <p className="text-[10px] uppercase font-bold text-status-error tracking-widest mb-2">Type full name to verify</p>
                          <Input
                            placeholder="Enter your full name"
                            value={deleteConfirmName}
                            onChange={e => setDeleteConfirmName(e.target.value)}
                            className="bg-black/50 border-white/10 text-center font-bold tracking-tight h-12"
                            disabled={deleteLoading}
                          />
                        </div>
                        <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-[0.2em] opacity-40">
                          {user?.firstName} {user?.lastName}
                        </div>
                      </div>

                      <div className="flex flex-col w-full gap-3 pt-4">
                        <Button
                          variant="destructive"
                          onClick={handleDeleteAccount}
                          className="h-12 text-sm font-bold tracking-widest uppercase shadow-status-error/20"
                          disabled={deleteLoading || deleteConfirmName.trim() !== `${user?.firstName} ${user?.lastName}`}
                        >
                          {deleteLoading ? 'DELETING...' : 'DELETE PERMANENTLY'}
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => setShowDeleteConfirm(false)}
                          className="text-muted-foreground font-bold text-xs uppercase tracking-widest"
                          disabled={deleteLoading}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {deleteSuccess && (
                <div className="mt-4 p-4 rounded-xl border border-status-success/30 bg-status-success/10 text-status-success text-center text-sm font-bold tracking-tight animate-in slide-in-from-bottom-4">
                  ACCOUNT DELETED. REDIRECTING...
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
