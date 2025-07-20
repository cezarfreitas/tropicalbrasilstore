import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useCustomerAuth } from "@/hooks/use-customer-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Package, Lock, Phone, Eye, EyeOff, UserPlus } from "lucide-react";

export default function CustomerLogin() {
  const [whatsapp, setWhatsapp] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useCustomerAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const formatWhatsApp = (value: string) => {
    // Remove non-digits
    const digits = value.replace(/\D/g, "");

    // Apply mask (11) 99999-9999
    if (digits.length <= 2) {
      return `(${digits}`;
    } else if (digits.length <= 7) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    } else {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
    }
  };

  const handleWhatsAppChange = (value: string) => {
    const formatted = formatWhatsApp(value);
    setWhatsapp(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Extract only digits from WhatsApp
    const whatsappDigits = whatsapp.replace(/\D/g, "");

    if (whatsappDigits.length !== 11) {
      toast({
        title: "Erro no WhatsApp",
        description:
          "Por favor, insira um número de WhatsApp válido com 11 dígitos.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    const result = await login(whatsappDigits, password);

    if (result.success) {
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo de volta à Chinelos Store.",
      });

      // Check if it's first login and redirect to password change
      if (result.isFirstLogin) {
        navigate("/change-password");
      } else {
        navigate("/");
      }
    } else {
      toast({
        title: "Erro de autenticação",
        description:
          "WhatsApp ou senha incorretos. Verifique se sua conta foi aprovada.",
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4">
            <Package className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Chinelos Store</h1>
          <p className="text-gray-600 mt-2">
            Entre para ver preços e fazer pedidos
          </p>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-semibold text-center flex items-center justify-center gap-2">
              <Lock className="h-5 w-5" />
              Entrar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="whatsapp"
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => handleWhatsAppChange(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Use seu número de WhatsApp cadastrado
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  Senha (4 últimos dígitos do celular)
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="1234"
                    className="pl-10 pr-10"
                    maxLength={4}
                    pattern="[0-9]{4}"
                    required
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Ex: Se seu celular é (11) 99999-1234, a senha é 1234
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={
                  isLoading ||
                  whatsapp.replace(/\D/g, "").length !== 11 ||
                  password.length !== 4
                }
              >
                {isLoading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">ou</span>
              </div>
            </div>

            <Button variant="outline" className="w-full" asChild>
              <Link to="/cadastro" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Cadastrar-se
              </Link>
            </Button>

            <div className="text-center">
              <Button
                variant="link"
                className="text-sm text-muted-foreground"
                asChild
              >
                <Link to="/">Voltar para a loja</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            © 2024 Chinelos Store. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
