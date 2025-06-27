
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Navigate } from 'react-router-dom';

const Auth = () => {
  const { signIn, signUp, user, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Eğer kullanıcı zaten giriş yapmışsa ana sayfaya yönlendir
  if (user && !loading) {
    return <Navigate to="/" replace />;
  }

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { error } = await signIn(email, password);
    
    if (error) {
      toast({
        title: "Giriş Hatası",
        description: error.message === 'Invalid login credentials' 
          ? "Geçersiz e-posta veya şifre"
          : error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Başarılı",
        description: "Giriş başarılı!",
      });
    }
    
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;

    const { error } = await signUp(email, password, firstName, lastName);
    
    if (error) {
      toast({
        title: "Kayıt Hatası",
        description: error.message === 'User already registered'
          ? "Bu e-posta adresi zaten kayıtlı"
          : error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Başarılı",
        description: "Kayıt başarılı! E-posta onayını kontrol edin.",
      });
    }
    
    setIsLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">CRM Sistemi</CardTitle>
          <p className="text-gray-600">Müşteri İlişkileri Yönetim Sistemi</p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin">Giriş Yap</TabsTrigger>
              <TabsTrigger value="signup">Kayıt Ol</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <Label htmlFor="signin-email">E-posta</Label>
                  <Input
                    id="signin-email"
                    name="email"
                    type="email"
                    required
                    placeholder="ornek@email.com"
                  />
                </div>
                <div>
                  <Label htmlFor="signin-password">Şifre</Label>
                  <Input
                    id="signin-password"
                    name="password"
                    type="password"
                    required
                    placeholder="••••••••"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? "Giriş yapılıyor..." : "Giriş Yap"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="signup-firstName">Ad</Label>
                    <Input
                      id="signup-firstName"
                      name="firstName"
                      required
                      placeholder="Adınız"
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-lastName">Soyad</Label>
                    <Input
                      id="signup-lastName"
                      name="lastName"
                      required
                      placeholder="Soyadınız"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="signup-email">E-posta</Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    required
                    placeholder="ornek@email.com"
                  />
                </div>
                <div>
                  <Label htmlFor="signup-password">Şifre</Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    minLength={6}
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? "Kayıt yapılıyor..." : "Kayıt Ol"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
