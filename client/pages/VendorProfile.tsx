import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useVendorAuth } from '@/hooks/use-vendor-auth';
import { User, Mail, Phone, FileText, Lock, Save, CheckCircle, AlertCircle } from 'lucide-react';

export default function VendorProfile() {
  const { vendor, updateProfile, changePassword } = useVendorAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  // Profile form state
  const [profileData, setProfileData] = useState({
    name: vendor?.name || '',
    phone: vendor?.phone || '',
    bio: vendor?.bio || '',
    avatar_url: vendor?.avatar_url || ''
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const success = await updateProfile(profileData);
      if (success) {
        setMessage('Perfil atualizado com sucesso!');
        setMessageType('success');
        setIsEditing(false);
      } else {
        setMessage('Erro ao atualizar perfil. Tente novamente.');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Erro ao atualizar perfil. Tente novamente.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      setMessage('As senhas não coincidem.');
      setMessageType('error');
      return;
    }

    if (passwordData.new_password.length < 6) {
      setMessage('A nova senha deve ter pelo menos 6 caracteres.');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const success = await changePassword(passwordData.current_password, passwordData.new_password);
      if (success) {
        setMessage('Senha alterada com sucesso!');
        setMessageType('success');
        setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
        setShowPasswordForm(false);
      } else {
        setMessage('Senha atual incorreta ou erro ao alterar senha.');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Erro ao alterar senha. Tente novamente.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Meu Perfil</h1>
        <p className="text-muted-foreground">
          Gerencie suas informações pessoais e configurações
        </p>
      </div>

      {message && (
        <Alert variant={messageType === 'error' ? 'destructive' : 'default'}>
          {messageType === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>
                Atualize suas informações de perfil
              </CardDescription>
            </div>
            {!isEditing && (
              <Button 
                variant="outline" 
                onClick={() => setIsEditing(true)}
              >
                Editar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="avatar_url">URL do Avatar</Label>
                <Input
                  id="avatar_url"
                  value={profileData.avatar_url}
                  onChange={(e) => setProfileData(prev => ({ ...prev, avatar_url: e.target.value }))}
                  placeholder="https://exemplo.com/avatar.jpg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Biografia</Label>
                <Textarea
                  id="bio"
                  value={profileData.bio}
                  onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Conte um pouco sobre você..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar
                    </>
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsEditing(false);
                    setProfileData({
                      name: vendor?.name || '',
                      phone: vendor?.phone || '',
                      bio: vendor?.bio || '',
                      avatar_url: vendor?.avatar_url || ''
                    });
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Nome</p>
                    <p className="text-sm text-muted-foreground">{vendor?.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">{vendor?.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Telefone</p>
                    <p className="text-sm text-muted-foreground">
                      {vendor?.phone || 'Não informado'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant="outline">
                    {vendor?.commission_percentage}% comissão
                  </Badge>
                </div>
              </div>

              {vendor?.bio && (
                <div className="flex items-start gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Biografia</p>
                    <p className="text-sm text-muted-foreground">{vendor.bio}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Alterar Senha</CardTitle>
              <CardDescription>
                Mantenha sua conta segura alterando sua senha regularmente
              </CardDescription>
            </div>
            {!showPasswordForm && (
              <Button 
                variant="outline" 
                onClick={() => setShowPasswordForm(true)}
              >
                <Lock className="h-4 w-4 mr-2" />
                Alterar Senha
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {showPasswordForm ? (
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current_password">Senha Atual</Label>
                <Input
                  id="current_password"
                  type="password"
                  value={passwordData.current_password}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, current_password: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new_password">Nova Senha</Label>
                <Input
                  id="new_password"
                  type="password"
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))}
                  required
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm_password">Confirmar Nova Senha</Label>
                <Input
                  id="confirm_password"
                  type="password"
                  value={passwordData.confirm_password}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirm_password: e.target.value }))}
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Alterando...
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Alterar Senha
                    </>
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowPasswordForm(false);
                    setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
                    setMessage('');
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          ) : (
            <p className="text-sm text-muted-foreground">
              Clique em "Alterar Senha" para modificar sua senha atual.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>Informações da Conta</CardTitle>
          <CardDescription>
            Detalhes da sua conta de vendedor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Status da Conta</span>
              <Badge variant="default">Ativo</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Percentual de Comissão</span>
              <span className="text-sm">{vendor?.commission_percentage}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Data de Cadastro</span>
              <span className="text-sm text-muted-foreground">
                {vendor?.created_at ? formatDate(vendor.created_at) : 'N/A'}
              </span>
            </div>
            {vendor?.last_login && (
              <div className="flex justify-between">
                <span className="text-sm font-medium">Último Login</span>
                <span className="text-sm text-muted-foreground">
                  {formatDate(vendor.last_login)}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
