import { useState } from 'react';
import { Settings as SettingsIcon, User, Lock, Bell, Palette, Save } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Switch } from '../components/ui/switch';
import { useAuth } from '../app/context/AuthContext';
import { useTheme } from '../app/context/ThemeContext';

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [username, setUsername] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    taskReminders: true,
    meetingReminders: true,
    newsDigest: false,
  });

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicture(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveChanges = () => {
    // Mock save functionality
    alert('Settings saved successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] rounded-3xl p-8 text-white shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <SettingsIcon className="w-10 h-10" />
          <h1 className="text-4xl font-bold">Settings</h1>
        </div>
        <p className="text-lg text-white/90">Manage your account and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Navigation */}
        <div className="lg:col-span-1 space-y-2">
          <div className="bg-[#1E1E1E] backdrop-blur-sm rounded-2xl p-2 shadow-lg border border-[#2A2A2A]">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] text-white">
              <User className="w-5 h-5" />
              <span>Profile</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#A3A3A3] hover:bg-[#171717] transition-all mt-1">
              <Lock className="w-5 h-5" />
              <span>Security</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#A3A3A3] hover:bg-[#171717] transition-all mt-1">
              <Bell className="w-5 h-5" />
              <span>Notifications</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#A3A3A3] hover:bg-[#171717] transition-all mt-1">
              <Palette className="w-5 h-5" />
              <span>Appearance</span>
            </button>
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Section */}
          <div className="bg-[#1E1E1E] backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-[#2A2A2A]">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-[#EDEDED]">
              <User className="w-6 h-6 text-[#7C3AED]" />
              Profile Settings
            </h2>

            {/* Profile Picture */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-[#EDEDED] mb-3">
                Profile Picture
              </label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#8B5CF6] flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                  {profilePicture ? (
                    <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    user?.name?.charAt(0).toUpperCase() || 'A'
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    id="profile-picture"
                    accept="image/*"
                    onChange={handleProfilePictureChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="profile-picture"
                    className="px-4 py-2 rounded-xl bg-[#171717] text-[#EDEDED] border border-[#2A2A2A] hover:bg-[#1E1E1E] cursor-pointer inline-block text-sm transition-all"
                  >
                    Change Picture
                  </label>
                  <p className="text-xs text-[#A3A3A3] mt-2">JPG, PNG or GIF. Max size 2MB</p>
                </div>
              </div>
            </div>

            {/* Username */}
            <div className="mb-6">
              <label htmlFor="username" className="block text-sm font-medium text-[#EDEDED] mb-2">
                Username
              </label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-12 bg-[#171717] border-[#2A2A2A] text-[#EDEDED] rounded-xl"
              />
            </div>

            {/* Email */}
            <div className="mb-6">
              <label htmlFor="email" className="block text-sm font-medium text-[#EDEDED] mb-2">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 bg-[#171717] border-[#2A2A2A] text-[#EDEDED] rounded-xl"
              />
            </div>
          </div>

          {/* Security Section */}
          <div className="bg-[#1E1E1E] backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-[#2A2A2A]">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-[#EDEDED]">
              <Lock className="w-6 h-6 text-[#7C3AED]" />
              Security Settings
            </h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="current-password" className="block text-sm font-medium text-[#EDEDED] mb-2">
                  Current Password
                </label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="h-12 bg-[#171717] border-[#2A2A2A] text-[#EDEDED] rounded-xl"
                />
              </div>

              <div>
                <label htmlFor="new-password" className="block text-sm font-medium text-[#EDEDED] mb-2">
                  New Password
                </label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="h-12 bg-[#171717] border-[#2A2A2A] text-[#EDEDED] rounded-xl"
                />
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-[#EDEDED] mb-2">
                  Confirm New Password
                </label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="h-12 bg-[#171717] border-[#2A2A2A] text-[#EDEDED] rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Notifications Section */}
          <div className="bg-[#1E1E1E] backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-[#2A2A2A]">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-[#EDEDED]">
              <Bell className="w-6 h-6 text-[#7C3AED]" />
              Notification Preferences
            </h2>

            <div className="space-y-4">
              {Object.entries(notifications).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-4 bg-[#171717] rounded-xl border border-[#2A2A2A]">
                  <div>
                    <p className="font-medium text-[#EDEDED]">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                    </p>
                    <p className="text-sm text-[#A3A3A3]">
                      {key === 'emailNotifications' && 'Receive notifications via email'}
                      {key === 'pushNotifications' && 'Receive push notifications on your device'}
                      {key === 'taskReminders' && 'Get reminders for upcoming tasks'}
                      {key === 'meetingReminders' && 'Get reminders for scheduled meetings'}
                      {key === 'newsDigest' && 'Receive daily news digest'}
                    </p>
                  </div>
                  <Switch
                    checked={value}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, [key]: checked })
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Appearance Section */}
          <div className="bg-[#1E1E1E] backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-[#2A2A2A]">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-[#EDEDED]">
              <Palette className="w-6 h-6 text-[#7C3AED]" />
              Appearance
            </h2>

            <div className="p-4 bg-[#171717] rounded-xl border border-[#2A2A2A]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-[#EDEDED]">Dark Mode</p>
                  <p className="text-sm text-[#A3A3A3]">
                    {theme === 'dark' ? 'Currently enabled' : 'Currently disabled'}
                  </p>
                </div>
                <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSaveChanges}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] text-white font-semibold shadow-lg hover:shadow-xl hover:shadow-[#7C3AED]/30 transition-all flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            Save All Changes
          </button>
        </div>
      </div>
    </div>
  );
}
