import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useCustomerAuth } from "@/hooks/use-customer-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Package, Lock, Eye, EyeOff, Key } from "lucide-react";

export default function CustomerChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [keepDefault, setKeepDefault] = useState(false);

  const {
    customer,
    isAuthenticated,
    isApproved,
    isFirstLogin,
    changePassword,
    logout,
  } = useCustomerAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Redirect if not authenticated or not approved
  if (!isAuthenticated || !isApproved) {
    return <Navigate to="/login" replace />;
  }

  // If not first login, redirect to store
  if (!isFirstLogin) {
    return <Navigate to="/" replace />;
  }

  const getDefaultPassword = () => {
    if (customer?.whatsapp) {
      // Get last 4 digits from WhatsApp number
      const digits = customer.whatsapp.replace(/\D/g, "");
      return digits.slice(-4);
    }
    return "";
  };

  const defaultPassword = getDefaultPassword();

  const handleKeepDefault = () => {
    setKeepDefault(true);
    setIsLoading(true);

    // Just mark first login as complete without changing password
    changePassword(defaultPassword).then((result) => {
      if (result.success) {
        toast({
          title: "Senha mantida!",
          description:
            "Você manteve a senha padrão. Bem-vindo à Chinelos Store!",
        });
        navigate("/");
      } else {
        toast({
          title: "Erro",
          description: result.message,
          variant: "destructive",
        });
      }
      setIsLoading(false);
      setKeepDefault(false);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate current password
    if (currentPassword !== defaultPassword) {
      toast({
        title: "Senha atual incorreta",
        description:
          "A senha atual deve ser os 4 últimos dígitos do seu celular.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Validate new password
    if (newPassword.length < 4) {
      toast({
        title: "Senha muito curta",
        description: "A nova senha deve ter pelo menos 4 caracteres.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "A confirmação da senha deve ser igual à nova senha.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    const result = await changePassword(newPassword);

    if (result.success) {
      toast({
        title: "Senha alterada!",
        description:
          "Sua senha foi alterada com sucesso. Bem-vindo à Chinelos Store!",
      });
      navigate("/");
    } else {
      toast({
        title: "Erro ao alterar senha",
        description: result.message,
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
            Primeiro acesso - Configure sua senha
          </p>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-semibold text-center flex items-center justify-center gap-2">
              <Key className="h-5 w-5" />
              Alterar Senha
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Bem-vindo, {customer?.name}!
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>Este é seu primeiro acesso. Você pode:</p>
                    <ul className="list-disc pl-5 mt-1 space-y-1">
                      <li>Manter a senha padrão ({defaultPassword})</li>
                      <li>Ou criar uma nova senha personalizada</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">
                  Senha Atual ({defaultPassword})
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Senha atual"
                    className="pl-10 pr-10"
                    required
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    disabled={isLoading}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nova senha (mínimo 4 caracteres)"
                    className="pl-10 pr-10"
                    minLength={4}
                    required
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    disabled={isLoading}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirme a nova senha"
                    className="pl-10 pr-10"
                    minLength={4}
                    required
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={
                    isLoading ||
                    !currentPassword ||
                    !newPassword ||
                    !confirmPassword
                  }
                >
                  {isLoading && !keepDefault ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      Alterando...
                    </>
                  ) : (
                    "Alterar Senha"
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleKeepDefault}
                  disabled={isLoading}
                >
                  {isLoading && keepDefault ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-border border-t-transparent" />
                      Mantendo...
                    </>
                  ) : (
                    "Manter Padrão"
                  )}
                </Button>
              </div>
            </form>

            <div className="text-center">
              <Button
                variant="link"
                className="text-sm text-muted-foreground"
                onClick={logout}
                disabled={isLoading}
              >
                Sair da conta
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
