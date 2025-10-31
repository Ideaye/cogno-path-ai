import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { CollapsibleSideNav } from '@/components/layout/CollapsibleSideNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, User, Lock, LogOut, Edit2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface ProfileData {
  name: string;
  email: string;
  gender?: string;
  first_name?: string;
  last_name?: string;
  address?: string;
  phone?: string;
  dob?: string;
  location?: string;
  postal_code?: string;
}

export default function ProfileNew() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'security' | 'logout'>('personal');
  const [profile, setProfile] = useState<ProfileData>({
    name: '',
    email: '',
    gender: 'male',
    first_name: '',
    last_name: '',
    address: '',
    phone: '',
    dob: '',
    location: '',
    postal_code: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
      return;
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profileData) {
      const cognitiveProfile = profileData.cognitive_profile as any;
      setProfile({
        name: profileData.name || '',
        email: user.email || '',
        gender: cognitiveProfile?.gender || 'male',
        first_name: profileData.name?.split(' ')[0] || '',
        last_name: profileData.name?.split(' ')[1] || '',
        address: cognitiveProfile?.address || '',
        phone: cognitiveProfile?.phone || '',
        dob: cognitiveProfile?.dob || '',
        location: cognitiveProfile?.location || '',
        postal_code: cognitiveProfile?.postal_code || '',
      });
    } else {
      setProfile(prev => ({ ...prev, email: user.email || '' }));
    }

    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const fullName = `${profile.first_name} ${profile.last_name}`.trim();
      
      await supabase
        .from('profiles')
        .update({
          name: fullName,
          cognitive_profile: {
            gender: profile.gender,
            address: profile.address,
            phone: profile.phone,
            dob: profile.dob,
            location: profile.location,
            postal_code: profile.postal_code,
          }
        })
        .eq('id', user.id);

      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    loadProfile();
    toast.info('Changes discarded');
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen w-full">
        <CollapsibleSideNav />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <CollapsibleSideNav />
      
      <main className="flex-1 p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Sidebar */}
            <div className="lg:col-span-3">
              <div className="bg-card rounded-2xl p-6 space-y-6">
                {/* Avatar Section */}
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-primary/20 text-primary text-2xl">
                        {profile.first_name?.[0]}{profile.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <button className="absolute bottom-0 right-0 bg-primary rounded-full p-2 hover:opacity-90">
                      <Edit2 className="h-3 w-3 text-foreground" />
                    </button>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">
                      {profile.first_name} {profile.last_name}
                    </h2>
                    <p className="text-sm text-muted-foreground">Student</p>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="space-y-2">
                  <button
                    onClick={() => setActiveTab('personal')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                      activeTab === 'personal'
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <User className="h-5 w-5" />
                    <span className="font-medium">Personal Information</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('security')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                      activeTab === 'security'
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <Lock className="h-5 w-5" />
                    <span className="font-medium">Login & Password</span>
                  </button>

                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="font-medium">Log Out</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-9">
              <div className="bg-card rounded-2xl p-6 lg:p-8">
                {activeTab === 'personal' && (
                  <div className="space-y-6">
                    <h1 className="text-2xl lg:text-3xl font-bold">Personal Information</h1>

                    {/* Gender */}
                    <div className="space-y-3">
                      <RadioGroup
                        value={profile.gender}
                        onValueChange={(value) => setProfile({ ...profile, gender: value })}
                        className="flex gap-6"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="male" id="male" />
                          <Label htmlFor="male">Male</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="female" id="female" />
                          <Label htmlFor="female">Female</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Name Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-muted-foreground">First Name</Label>
                        <Input
                          id="firstName"
                          value={profile.first_name}
                          onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                          className="bg-muted/50 border-0 h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-muted-foreground">Last Name</Label>
                        <Input
                          id="lastName"
                          value={profile.last_name}
                          onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                          className="bg-muted/50 border-0 h-12"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-muted-foreground">Email</Label>
                      <div className="relative">
                        <Input
                          id="email"
                          type="email"
                          value={profile.email}
                          disabled
                          className="bg-muted/50 border-0 h-12 pr-24"
                        />
                        <Badge className="absolute right-3 top-1/2 -translate-y-1/2 bg-success/20 text-success hover:bg-success/20 border-0">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      </div>
                    </div>

                    {/* Address */}
                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-muted-foreground">Address</Label>
                      <Input
                        id="address"
                        value={profile.address}
                        onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                        className="bg-muted/50 border-0 h-12"
                        placeholder="3605 Parker Rd."
                      />
                    </div>

                    {/* Phone and DOB */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-muted-foreground">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={profile.phone}
                          onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                          className="bg-muted/50 border-0 h-12"
                          placeholder="(405) 555-0128"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dob" className="text-muted-foreground">Date of Birth</Label>
                        <Input
                          id="dob"
                          type="date"
                          value={profile.dob}
                          onChange={(e) => setProfile({ ...profile, dob: e.target.value })}
                          className="bg-muted/50 border-0 h-12"
                        />
                      </div>
                    </div>

                    {/* Location and Postal Code */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="location" className="text-muted-foreground">Location</Label>
                        <Select value={profile.location} onValueChange={(value) => setProfile({ ...profile, location: value })}>
                          <SelectTrigger className="bg-muted/50 border-0 h-12">
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="atlanta">Atlanta, USA</SelectItem>
                            <SelectItem value="newyork">New York, USA</SelectItem>
                            <SelectItem value="losangeles">Los Angeles, USA</SelectItem>
                            <SelectItem value="chicago">Chicago, USA</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="postalCode" className="text-muted-foreground">Postal Code</Label>
                        <Input
                          id="postalCode"
                          value={profile.postal_code}
                          onChange={(e) => setProfile({ ...profile, postal_code: e.target.value })}
                          className="bg-muted/50 border-0 h-12"
                          placeholder="30301"
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-6">
                      <Button
                        variant="outline"
                        onClick={handleDiscard}
                        className="flex-1 h-12 border-2 border-primary text-primary hover:bg-primary/10"
                      >
                        Discard Changes
                      </Button>
                      <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 h-12 bg-primary hover:bg-primary-hover text-foreground"
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </div>
                )}

                {activeTab === 'security' && (
                  <div className="space-y-6">
                    <h1 className="text-2xl lg:text-3xl font-bold">Login & Password</h1>
                    <p className="text-muted-foreground">
                      Password management features coming soon.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
