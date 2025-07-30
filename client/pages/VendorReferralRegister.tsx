import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, UserPlus, CheckCircle, User, Store } from 'lucide-react';

interface Vendor {
  id: number;
  name: string;
  avatar_url?: string;
  bio?: string;
}

export default function VendorReferralRegister() {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: ''
  });

  useEffect(() => {
    loadVendorInfo();
  }, [vendorId]);

  const loadVendorInfo = async () => {
    try {
      const response = await fetch(`/api/vendor/referral/vendor/${vendorId}`);
      const data = await response.json();
      
      if (response.ok) {
        setVendor(data.vendor);
      } else {
        setError(data.error || 'Vendedor não encontrado');
      }
    } catch (error) {
      setError('Erro ao carregar informações do vendedor');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/customers/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          vendor_ref: vendorId
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message);
        setFormData({ name: '', email: '', whatsapp: '' });
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(data.error || 'Erro no cadastro');
      }
    } catch (error) {
      setError('Erro ao realizar cadastro. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatWhatsApp = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 11) {
      return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return value;
  };

  const handleWhatsAppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatWhatsApp(e.target.value);
    setFormData(prev => ({ ...prev, whatsapp: formatted }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error && !vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">{error}</p>
              <Button 
                onClick={() => navigate('/')} 
                className="mt-4"
                variant="outline"
              >
                Voltar à loja
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Vendor Info Header */}
        {vendor && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={vendor.avatar_url} />
                  <AvatarFallback>
                    {vendor.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-xl font-semibold">{vendor.name}</h1>
                    <Badge variant="outline">Vendedor Oficial</Badge>
                  </div>
                  {vendor.bio && (
                    <p className="text-sm text-muted-foreground">{vendor.bio}</p>
                  )}
                  <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>Cadastro com aprovação automática</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Registration Form */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              <CardTitle>Cadastre-se como Cliente</CardTitle>
            </div>
            <CardDescription>
              Você está sendo cadastrado através do vendedor {vendor?.name}. 
              Seu cadastro será aprovado automaticamente!
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success && (
              <Alert className="mb-6">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  {success}
                  <br />
                  <span className="text-sm text-muted-foreground mt-1 block">
                    Redirecionando para o login em alguns segundos...
                  </span>
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Digite seu nome completo"
                  required
                  disabled={submitting || !!success}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="seu@email.com"
                  required
                  disabled={submitting || !!success}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  type="tel"
                  value={formData.whatsapp}
                  onChange={handleWhatsAppChange}
                  placeholder="(11) 99999-9999"
                  maxLength={15}
                  required
                  disabled={submitting || !!success}
                />
                <p className="text-xs text-muted-foreground">
                  Digite apenas números. Ex: 11999999999
                </p>
              </div>

              {!success && (
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cadastrando...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Cadastrar
                    </>
                  )}
                </Button>
              )}
            </form>

            {!success && (
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Já tem uma conta?{' '}
                  <a href="/login" className="text-primary hover:underline">
                    Faça login
                  </a>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <a 
            href="/" 
            className="text-sm text-muted-foreground hover:text-muted-foreground/80 hover:underline inline-flex items-center gap-1"
          >
            <Store className="h-3 w-3" />
            Voltar para a loja
          </a>
        </div>
      </div>
    </div>
  );
}
