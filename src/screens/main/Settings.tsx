import { useState, useEffect, useRef } from 'react';
import { 
  Lock, 
  Shield, 
  Bell, 
  Trash2, 
  ChevronRight, 
  Check, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Building2, 
  Loader2, 
  Camera, 
  X,
  Palette,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { authFetch } from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

const TABS = [
  { id: 'Profile', key: 'settings.tabProfile', name: 'Profile' },
  { id: 'Business Information', key: 'settings.tabBusiness', name: 'Business Information' },
  { id: 'Account Settings', key: 'settings.tabAccount', name: 'Account Settings' },
  { id: 'Notifications', key: 'settings.tabNotifications', name: 'Notifications' },
  { id: 'Appearance', key: 'settings.tabAppearance', name: 'Appearance' },
];

export default function Settings() {
  const { user, updateUser, logout, refreshProfile } = useAuth();
  const navigate = useNavigate();

  // Tab State
  const [activeTab, setActiveTab] = useState('Profile');

  // Notification Toast State
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // ----------------------------------------------------
  // Tab 1: Profile Information State
  // ----------------------------------------------------
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '+92 300 1234567');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    refreshProfile();
  }, []);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '+92 300 1234567');
      setAvatar(user.avatar || '');
      setTwoFactorEnabled(!!user.twoFactorEnabled);
    }
  }, [user]);



  // Handle Photo Upload
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('error', 'Image size must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setAvatar(result);
      showToast('success', 'Photo selected. Click "Save Changes" to apply.');
    };
    reader.readAsDataURL(file);
  };

  // Save Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      showToast('error', 'Name and email are required');
      return;
    }

    setIsSavingProfile(true);
    try {
      const res = await authFetch('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          avatar,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        updateUser({
          name: data.name,
          email: data.email,
          phone: data.phone,
          avatar: data.avatar,
        });
        showToast('success', 'Profile information saved successfully!');
      } else {
        showToast('error', data.message || 'Failed to update profile');
      }
    } catch {
      showToast('error', 'Network error. Please try again.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // ----------------------------------------------------
  // Tab 2: Business Information State
  // ----------------------------------------------------
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('Retail Clothing');
  const [city, setCity] = useState('');
  const [currency, setCurrency] = useState('PKR');
  const [businessPhone, setBusinessPhone] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [isLoadingBusiness, setIsLoadingBusiness] = useState(false);
  const [isSavingBusiness, setIsSavingBusiness] = useState(false);

  useEffect(() => {
    const fetchBusiness = async () => {
      setIsLoadingBusiness(true);
      try {
        const res = await authFetch('/api/business');
        if (res.ok) {
          const data = await res.json();
          setBusinessName(data.businessName || '');
          setBusinessType(data.businessType || 'Retail Clothing');
          setCity(data.city || '');
          setCurrency(data.currency || 'PKR');
          setBusinessPhone(data.phone || '');
          setBusinessAddress(data.address || '');
          setTaxNumber(data.taxNumber || '');
        }
      } catch (err) {
        console.error('Failed to load business profile', err);
      } finally {
        setIsLoadingBusiness(false);
      }
    };

    fetchBusiness();
  }, []);

  const handleSaveBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim()) {
      showToast('error', 'Business name is required');
      return;
    }

    setIsSavingBusiness(true);
    try {
      const res = await authFetch('/api/business', {
        method: 'PUT',
        body: JSON.stringify({
          businessName: businessName.trim(),
          businessType,
          city: city.trim(),
          currency,
          phone: businessPhone.trim(),
          address: businessAddress.trim(),
          taxNumber: taxNumber.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast('success', 'Business information updated successfully!');
      } else {
        showToast('error', data.message || 'Failed to update business information');
      }
    } catch {
      showToast('error', 'Network error. Please try again.');
    } finally {
      setIsSavingBusiness(false);
    }
  };

  // ----------------------------------------------------
  // Tab 3: Account Settings / Password Change State
  // ----------------------------------------------------
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword.trim()) {
      setPasswordError('Please enter your current password');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await authFetch('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setPasswordSuccess('Password updated successfully! Keep your new password secure.');
        showToast('success', 'Password updated successfully!');
        setIsPasswordModalOpen(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        if (data.token) {
          updateUser({ token: data.token });
        }
      } else {
        setPasswordError(data.message || 'Failed to update password');
        showToast('error', data.message || 'Failed to update password');
      }
    } catch {
      setPasswordError('Network error. Please try again.');
      showToast('error', 'Network error. Please try again.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // 2FA State
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(user?.twoFactorEnabled || false);
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [isToggling2FA, setIsToggling2FA] = useState(false);
  const [verificationCodeInput, setVerificationCodeInput] = useState('');
  const [twoFAError, setTwoFAError] = useState('');

  const handleOpen2FAModal = () => {
    setVerificationCodeInput('');
    setTwoFAError('');
    setIs2FAModalOpen(true);
  };

  const handleToggle2FA = async () => {
    // If activating 2FA and code is typed, check if valid
    if (!twoFactorEnabled && verificationCodeInput.trim() !== '' && verificationCodeInput.trim() !== '123456') {
      setTwoFAError('Please enter valid verification code (123456)');
      return;
    }

    setIsToggling2FA(true);
    setTwoFAError('');
    try {
      const nextState = !twoFactorEnabled;
      const res = await authFetch('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ twoFactorEnabled: nextState }),
      });

      const data = await res.json();
      if (res.ok) {
        setTwoFactorEnabled(nextState);
        updateUser({ twoFactorEnabled: nextState });
        showToast('success', nextState ? 'Two-Factor Authentication successfully activated!' : 'Two-Factor Authentication disabled.');
        setIs2FAModalOpen(false);
        setVerificationCodeInput('');
      } else {
        setTwoFAError(data.message || 'Failed to update 2FA status');
        showToast('error', data.message || 'Failed to update 2FA status');
      }
    } catch {
      setTwoFAError('Network error. Please try again.');
      showToast('error', 'Network error. Please try again.');
    } finally {
      setIsToggling2FA(false);
    }
  };

  // ----------------------------------------------------
  // Tab 4: Notifications State
  // ----------------------------------------------------
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    stockAlerts: true,
    salesAlerts: true,
    marketingTips: false,
  });
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);

  const handleSaveNotifications = async () => {
    setIsSavingNotifications(true);
    try {
      const res = await authFetch('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ notificationPreferences: notifications }),
      });

      if (res.ok) {
        updateUser({ notificationPreferences: notifications });
        showToast('success', 'Notification preferences saved!');
      } else {
        showToast('error', 'Failed to save notifications');
      }
    } catch {
      showToast('error', 'Network error. Please try again.');
    } finally {
      setIsSavingNotifications(false);
    }
  };

  // ----------------------------------------------------
  // Tab 5: Appearance State
  // ----------------------------------------------------
  const { theme, setTheme, compactMode, setCompactMode } = useTheme();
  const [isSavingAppearance, setIsSavingAppearance] = useState(false);

  const handleSaveAppearance = async () => {
    setIsSavingAppearance(true);
    try {
      const res = await authFetch('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({
          appearance: { theme, compactMode },
        }),
      });

      if (res.ok) {
        updateUser({ appearance: { theme, compactMode } });
        showToast('success', t('settings.appearanceSuccess', 'Appearance preferences saved!'));
      } else {
        showToast('error', 'Failed to save appearance settings');
      }
    } catch {
      showToast('error', 'Network error. Please try again.');
    } finally {
      setIsSavingAppearance(false);
    }
  };

  const { t } = useLanguage();

  // Sync with auth user when loaded
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      if (user.phone) setPhone(user.phone);
      if (user.avatar) setAvatar(user.avatar);
      if (user.twoFactorEnabled !== undefined) setTwoFactorEnabled(user.twoFactorEnabled);
      if (user.notificationPreferences) {
        setNotifications((prev) => ({ ...prev, ...user.notificationPreferences }));
      }
      if (user.appearance?.theme) setTheme(user.appearance.theme as 'light' | 'dark' | 'system');
      if (user.appearance?.compactMode !== undefined) setCompactMode(user.appearance.compactMode);
    }
  }, [user]);

  // ----------------------------------------------------
  // Delete Account State
  // ----------------------------------------------------
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      showToast('error', 'Please type DELETE to confirm');
      return;
    }

    setIsDeletingAccount(true);
    try {
      const res = await authFetch('/api/auth/profile', {
        method: 'DELETE',
      });

      if (res.ok) {
        logout();
        navigate('/login');
      } else {
        const data = await res.json();
        showToast('error', data.message || 'Failed to delete account');
        setIsDeletingAccount(false);
      }
    } catch {
      showToast('error', 'Network error. Please try again.');
      setIsDeletingAccount(false);
    }
  };

  // Initials for avatar placeholder
  const initials = name
    ? name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <div className="space-y-6 relative pb-12">
      {/* Toast Notification */}
      {toast && (
        <div 
          className={clsx(
            "fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl text-sm font-medium transition-all transform animate-in fade-in slide-in-from-top-4 duration-300",
            toast.type === 'success' 
              ? "bg-emerald-900 text-white shadow-emerald-900/20 border border-emerald-700" 
              : "bg-red-600 text-white shadow-red-900/20 border border-red-500"
          )}
        >
          {toast.type === 'success' ? (
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5 text-emerald-300" />
            </div>
          ) : (
            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <AlertCircle className="w-3.5 h-3.5 text-white" />
            </div>
          )}
          <span>{toast.message}</span>
          <button 
            onClick={() => setToast(null)} 
            className="ml-2 p-1 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-3.5 h-3.5 opacity-70 hover:opacity-100" />
          </button>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t('settings.title', 'Profile / Settings')}</h1>
        <p className="text-gray-500 text-sm mt-1">{t('settings.subtitle', 'Manage your account, business information and app settings.')}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar border-b border-gray-200">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-[1px] whitespace-nowrap",
                isActive 
                  ? "border-brand-800 text-brand-800 font-semibold" 
                  : "border-transparent text-gray-500 hover:text-gray-900"
              )}
            >
              {t(tab.key, tab.name)}
            </button>
          );
        })}
      </div>

      {/* Hidden File Input for Avatar */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handlePhotoSelect} 
        accept="image/png, image/jpeg, image/jpg, image/webp" 
        className="hidden" 
      />

      {/* TAB 1: PROFILE TAB */}
      {activeTab === 'Profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-xl font-bold text-gray-500 border-2 border-dashed border-gray-300 overflow-hidden relative group shrink-0">
                    {avatar ? (
                      <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      initials
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Upload photo"
                    >
                      <Camera className="w-5 h-5" />
                    </button>
                  </div>
                  <div>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      className="mb-1"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Change Photo
                    </Button>
                    <p className="text-xs text-gray-400">JPG, PNG up to 2MB</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ali Khan"
                      required
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input 
                      type="text" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+92 300 1234567"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-gray-900"
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  variant="primary" 
                  disabled={isSavingProfile}
                  className="w-full mt-6 flex items-center justify-center gap-2"
                >
                  {isSavingProfile ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Account Settings Side Card */}
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100">
                {/* Change Password */}
                <div 
                  onClick={() => setIsPasswordModalOpen(true)}
                  className="p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors group"
                >
                  <div className="flex gap-4 items-center">
                    <div className="p-2 rounded-lg bg-gray-50 group-hover:bg-brand-50 text-gray-500 group-hover:text-brand-800 transition-colors">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">Change Password</p>
                      <p className="text-xs text-gray-500">Update your password regularly</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-900 transition-colors" />
                </div>
                
                {/* Two-Factor Authentication */}
                <div 
                  onClick={() => setIs2FAModalOpen(true)}
                  className="p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors group"
                >
                  <div className="flex gap-4 items-center">
                    <div className="p-2 rounded-lg bg-gray-50 group-hover:bg-brand-50 text-gray-500 group-hover:text-brand-800 transition-colors">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-gray-900">Two-Factor Authentication</p>
                        <span className={clsx(
                          "px-2 py-0.5 rounded text-[10px] font-semibold",
                          twoFactorEnabled ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"
                        )}>
                          {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">Add an extra layer of security</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-900 transition-colors" />
                </div>

                {/* Notification Preferences */}
                <div 
                  onClick={() => setActiveTab('Notifications')}
                  className="p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors group"
                >
                  <div className="flex gap-4 items-center">
                    <div className="p-2 rounded-lg bg-gray-50 group-hover:bg-brand-50 text-gray-500 group-hover:text-brand-800 transition-colors">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">Notification Preferences</p>
                      <p className="text-xs text-gray-500">Manage your notification settings</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-900 transition-colors" />
                </div>



                {/* Delete Account */}
                <div 
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="p-4 flex items-center justify-between hover:bg-red-50/70 cursor-pointer transition-colors group mt-2 border-t border-gray-100"
                >
                  <div className="flex gap-4 items-center">
                    <div className="p-2 rounded-lg bg-red-50 text-red-500 transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-red-600">Delete Account</p>
                      <p className="text-xs text-red-500">Permanently delete your account and all data.</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-red-400 group-hover:text-red-600 transition-colors" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: BUSINESS INFORMATION */}
      {activeTab === 'Business Information' && (
        <Card className="max-w-3xl">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-50 text-brand-800 rounded-lg">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <CardTitle>Business Information</CardTitle>
                <p className="text-xs text-gray-500 mt-0.5">Details displayed on customer receipts and invoice summaries</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingBusiness ? (
              <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin mb-2 text-brand-800" />
                <p className="text-sm">Loading business profile...</p>
              </div>
            ) : (
              <form onSubmit={handleSaveBusiness} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
                    <input 
                      type="text" 
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Threadly Fashion Studio"
                      required
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
                    <select
                      value={businessType}
                      onChange={(e) => setBusinessType(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-gray-900"
                    >
                      <option value="Retail Clothing">Retail Clothing Store</option>
                      <option value="Boutique">Designer Boutique</option>
                      <option value="Wholesale & Distribution">Wholesale & Distribution</option>
                      <option value="Online Store">E-Commerce / Online Store</option>
                      <option value="Custom Tailoring">Custom Tailoring & Fabrics</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input 
                      type="text" 
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Lahore, Karachi, Islamabad"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-gray-900"
                    >
                      <option value="PKR">Pakistani Rupee (PKR)</option>
                      <option value="USD">US Dollar (USD $)</option>
                      <option value="EUR">Euro (EUR €)</option>
                      <option value="GBP">British Pound (GBP £)</option>
                      <option value="AED">UAE Dirham (AED)</option>
                      <option value="SAR">Saudi Riyal (SAR)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Contact Phone</label>
                    <input 
                      type="text" 
                      value={businessPhone}
                      onChange={(e) => setBusinessPhone(e.target.value)}
                      placeholder="e.g. +92 42 35789012"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">NTN / Tax ID (Optional)</label>
                    <input 
                      type="text" 
                      value={taxNumber}
                      onChange={(e) => setTaxNumber(e.target.value)}
                      placeholder="e.g. 1234567-8"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-gray-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Store / Warehouse Address</label>
                  <textarea 
                    rows={3}
                    value={businessAddress}
                    onChange={(e) => setBusinessAddress(e.target.value)}
                    placeholder="Shop #12, Fashion Plaza, Main Boulevard..."
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-gray-900"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button 
                    type="submit" 
                    variant="primary" 
                    disabled={isSavingBusiness}
                    className="flex items-center gap-2 px-6"
                  >
                    {isSavingBusiness ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Business Information'
                    )}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 3: ACCOUNT SETTINGS TAB */}
      {activeTab === 'Account Settings' && (
        <div className="space-y-6 max-w-3xl">
          {/* Change Password Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-50 text-brand-800 rounded-lg">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle>Change Password</CardTitle>
                  <p className="text-xs text-gray-500 mt-0.5">Ensure your account is using a long and random password</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                {passwordError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}

                {passwordSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>{passwordSuccess}</span>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                  <div className="relative">
                    <input 
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-gray-900 pr-10"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <div className="relative">
                    <input 
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-gray-900 pr-10"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                  <div className="relative">
                    <input 
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-gray-900 pr-10"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  variant="primary" 
                  disabled={isChangingPassword}
                  className="mt-2 flex items-center gap-2"
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Updating Password...
                    </>
                  ) : (
                    'Update Password'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Two-Factor Authentication Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-50 text-brand-800 rounded-lg">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle>Two-Factor Authentication (2FA)</CardTitle>
                  <p className="text-xs text-gray-500 mt-0.5">Adds an additional security layer when logging into your assistant</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">Status:</span>
                    <span className={clsx(
                      "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold",
                      twoFactorEnabled ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-gray-100 text-gray-600 border border-gray-200"
                    )}>
                      {twoFactorEnabled ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Enabled (Active)
                        </>
                      ) : (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                          Disabled
                        </>
                      )}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {twoFactorEnabled 
                      ? 'Your account is secured with secondary code verification on every sign-in.' 
                      : 'Enable 2FA for enhanced protection of inventory and financial data.'}
                  </p>
                </div>
                <Button 
                  variant={twoFactorEnabled ? 'outline' : 'primary'}
                  size="sm"
                  onClick={handleOpen2FAModal}
                  disabled={isToggling2FA}
                  className={twoFactorEnabled ? 'border-red-200 text-red-600 hover:bg-red-50' : ''}
                >
                  {isToggling2FA ? <Loader2 className="w-4 h-4 animate-spin" /> : twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone: Delete Account */}
          <Card className="border-red-200 bg-red-50/20">
            <CardHeader className="border-red-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-red-600">Danger Zone: Delete Account</CardTitle>
                  <p className="text-xs text-red-500 mt-0.5">This action is irreversible and will delete all sales, products, and inventory.</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Permanently Remove Account</p>
                  <p className="text-xs text-gray-500">All data including analytics, receipts, and customers will be erased.</p>
                </div>
                <Button 
                  variant="outline"
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                >
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 4: NOTIFICATIONS TAB */}
      {activeTab === 'Notifications' && (
        <Card className="max-w-2xl">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-50 text-brand-800 rounded-lg">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <CardTitle>Notification Preferences</CardTitle>
                <p className="text-xs text-gray-500 mt-0.5">Choose how and when you receive business alerts</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {/* Email Alerts */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div>
                  <p className="text-sm font-bold text-gray-900">Email Digest & Alerts</p>
                  <p className="text-xs text-gray-500 mt-0.5">Receive weekly sales summaries and vital account updates</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotifications({ ...notifications, emailAlerts: !notifications.emailAlerts })}
                  className={clsx(
                    "w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 focus:outline-none",
                    notifications.emailAlerts ? "bg-brand-800" : "bg-gray-300"
                  )}
                >
                  <div className={clsx(
                    "bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200",
                    notifications.emailAlerts ? "translate-x-6" : "translate-x-0"
                  )} />
                </button>
              </div>

              {/* Stock Alerts */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div>
                  <p className="text-sm font-bold text-gray-900">Low Stock Warnings</p>
                  <p className="text-xs text-gray-500 mt-0.5">Alert when inventory drops below reorder threshold</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotifications({ ...notifications, stockAlerts: !notifications.stockAlerts })}
                  className={clsx(
                    "w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 focus:outline-none",
                    notifications.stockAlerts ? "bg-brand-800" : "bg-gray-300"
                  )}
                >
                  <div className={clsx(
                    "bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200",
                    notifications.stockAlerts ? "translate-x-6" : "translate-x-0"
                  )} />
                </button>
              </div>

              {/* Sales Alerts */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div>
                  <p className="text-sm font-bold text-gray-900">Sales & Order Notifications</p>
                  <p className="text-xs text-gray-500 mt-0.5">Get notified whenever a customer transaction is recorded</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotifications({ ...notifications, salesAlerts: !notifications.salesAlerts })}
                  className={clsx(
                    "w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 focus:outline-none",
                    notifications.salesAlerts ? "bg-brand-800" : "bg-gray-300"
                  )}
                >
                  <div className={clsx(
                    "bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200",
                    notifications.salesAlerts ? "translate-x-6" : "translate-x-0"
                  )} />
                </button>
              </div>

              {/* Marketing Tips */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div>
                  <p className="text-sm font-bold text-gray-900">AI Growth Insights & Tips</p>
                  <p className="text-xs text-gray-500 mt-0.5">Personalized recommendations to increase profit and optimize margins</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotifications({ ...notifications, marketingTips: !notifications.marketingTips })}
                  className={clsx(
                    "w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 focus:outline-none",
                    notifications.marketingTips ? "bg-brand-800" : "bg-gray-300"
                  )}
                >
                  <div className={clsx(
                    "bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200",
                    notifications.marketingTips ? "translate-x-6" : "translate-x-0"
                  )} />
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button 
                onClick={handleSaveNotifications}
                disabled={isSavingNotifications}
                variant="primary"
                className="flex items-center gap-2 px-6"
              >
                {isSavingNotifications ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Preferences'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 5: APPEARANCE TAB */}
      {activeTab === 'Appearance' && (
        <Card className="max-w-2xl">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-50 text-brand-800 rounded-lg">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <CardTitle>{t('settings.appearanceTitle', 'Appearance & Theme')}</CardTitle>
                <p className="text-xs text-gray-500 mt-0.5">{t('settings.appearanceDesc', 'Customize the interface visual theme and display density')}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">{t('settings.themeMode', 'Theme Mode')}</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'light', name: t('settings.themeLight', 'Light'), desc: t('settings.themeLightDesc', 'Clean, bright aesthetic') },
                  { id: 'dark', name: t('settings.themeDark', 'Dark'), desc: t('settings.themeDarkDesc', 'Comfortable in low light') },
                  { id: 'system', name: t('settings.themeSystem', 'System'), desc: t('settings.themeSystemDesc', 'Sync with OS setting') },
                ].map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setTheme(item.id as 'light' | 'dark' | 'system')}
                    className={clsx(
                      "p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between",
                      theme === item.id 
                        ? "border-brand-800 bg-brand-50/30" 
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-sm text-gray-900">{item.name}</span>
                      {theme === item.id && (
                        <div className="w-4 h-4 rounded-full bg-brand-800 text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Compact Mode Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div>
                <p className="text-sm font-bold text-gray-900">{t('settings.compactLayout', 'Compact Table Layout')}</p>
                <p className="text-xs text-gray-500 mt-0.5">{t('settings.compactDesc', 'Display more products and transactions per screen view')}</p>
              </div>
              <button
                type="button"
                onClick={() => setCompactMode(!compactMode)}
                className={clsx(
                  "w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 focus:outline-none cursor-pointer",
                  compactMode ? "bg-brand-800" : "bg-gray-300"
                )}
              >
                <div className={clsx(
                  "bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200",
                  compactMode ? "translate-x-6" : "translate-x-0"
                )} />
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <Button 
                onClick={handleSaveAppearance}
                disabled={isSavingAppearance}
                variant="primary"
                className="flex items-center gap-2 px-6"
              >
                {isSavingAppearance ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('settings.saving', 'Saving...')}
                  </>
                ) : (
                  t('settings.saveAppearance', 'Save Appearance')
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}



      {/* ========================================================= */}
      {/* MODAL 1: CHANGE PASSWORD MODAL */}
      {/* ========================================================= */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-brand-800" />
                <h3 className="font-bold text-gray-900">Change Password</h3>
              </div>
              <button 
                onClick={() => setIsPasswordModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {passwordError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Current Password</label>
                <div className="relative">
                  <input 
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-gray-900 pr-10"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">New Password</label>
                <div className="relative">
                  <input 
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-gray-900 pr-10"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Confirm New Password</label>
                <div className="relative">
                  <input 
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-gray-900 pr-10"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsPasswordModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="primary" 
                  disabled={isChangingPassword}
                  className="flex items-center gap-2"
                >
                  {isChangingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Password'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: TWO-FACTOR AUTHENTICATION MODAL */}
      {/* ========================================================= */}
      {is2FAModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-brand-800" />
                <h3 className="font-bold text-gray-900">
                  {twoFactorEnabled ? 'Disable Two-Factor Authentication' : 'Activate Two-Factor Authentication (2FA)'}
                </h3>
              </div>
              <button 
                onClick={() => setIs2FAModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {twoFAError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{twoFAError}</span>
              </div>
            )}

            <div className="py-2 space-y-3">
              {!twoFactorEnabled ? (
                <>
                  <div className="flex items-center gap-3 p-3 bg-brand-50 rounded-xl text-brand-800 text-xs">
                    <Sparkles className="w-5 h-5 shrink-0" />
                    <span>
                      2FA adds an essential security layer. Whenever you sign in, you will be asked for a 6-digit verification code.
                    </span>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>Setup Verification Code:</span>
                      <span className="font-mono font-bold text-brand-900 bg-brand-100/60 px-2 py-0.5 rounded">
                        123456
                      </span>
                    </div>
                    <label className="block text-xs font-semibold text-gray-700">Enter Confirmation Code</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={verificationCodeInput}
                      onChange={(e) => setVerificationCodeInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-center font-mono text-lg tracking-widest text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                  </div>
                </>
              ) : (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-sm space-y-1">
                  <p className="font-semibold">Disable 2FA Protection?</p>
                  <p className="text-xs text-amber-800">
                    Disabling two-factor authentication lowers account security for financial and inventory management.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end pt-3 border-t border-gray-100">
              <Button 
                variant="outline" 
                onClick={() => setIs2FAModalOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                variant={twoFactorEnabled ? 'outline' : 'primary'}
                onClick={handleToggle2FA}
                disabled={isToggling2FA}
                className={clsx("flex items-center gap-2", twoFactorEnabled && "text-red-600 border-red-200 hover:bg-red-50")}
              >
                {isToggling2FA ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : twoFactorEnabled ? (
                  'Confirm Disable 2FA'
                ) : (
                  'Activate 2FA Now'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: DELETE ACCOUNT MODAL */}
      {/* ========================================================= */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 border-2 border-red-100">
            <div className="flex items-center gap-3 pb-2 text-red-600">
              <div className="p-2.5 bg-red-100 rounded-xl">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">Permanently Delete Account</h3>
                <p className="text-xs text-red-500">This action cannot be undone</p>
              </div>
            </div>

            <div className="p-3.5 bg-red-50 rounded-xl border border-red-200 text-xs text-red-700 leading-relaxed space-y-1">
              <p className="font-semibold">Deleting your account will immediately:</p>
              <ul className="list-disc list-inside space-y-0.5 opacity-90">
                <li>Erase all product catalog items and stock logs</li>
                <li>Delete sales records, receipts, and order history</li>
                <li>Remove customer details, ledger records, and expenses</li>
              </ul>
            </div>

            <div className="space-y-2 pt-1">
              <label className="block text-xs font-semibold text-gray-700">
                Type <span className="font-bold text-red-600">DELETE</span> to confirm:
              </label>
              <input 
                type="text" 
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold tracking-wider text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </div>

            <div className="flex gap-3 justify-end pt-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteConfirmText('');
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="primary"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || isDeletingAccount}
                className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 disabled:opacity-50"
              >
                {isDeletingAccount ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Permanently Delete'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification Container */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className={clsx(
            "flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium border",
            toast.type === 'success' 
              ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
              : "bg-red-50 border-red-200 text-red-800"
          )}>
            {toast.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{toast.message}</span>
            <button 
              type="button"
              onClick={() => setToast(null)}
              className="ml-2 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
