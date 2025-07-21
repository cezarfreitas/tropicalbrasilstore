import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCustomerAuth } from "@/hooks/use-customer-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Package, Lock, Phone, Eye, EyeOff, UserPlus } from "lucide-react";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
}

export function LoginModal({ isOpen, onClose, onSuccess, onSwitchToRegister }: LoginModalProps) {
  const [whatsapp, setWhatsapp] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useCustomerAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

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

  const resetForm = () => {
    setWhatsapp("");
    setPassword("");
    setShowPassword(false);
    setIsLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
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

      resetForm();
      onClose();

      // Check if it's first login and redirect to password change
      if (result.isFirstLogin) {
        navigate("/change-password");
      } else if (onSuccess) {
        onSuccess();
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
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
                <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="inline-flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
              <Package className="h-4 w-4 text-primary-foreground" />
            </div>
            Entrar na Chinelos Store
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Entre para ver preços e fazer pedidos
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="modal-whatsapp" className="text-sm">WhatsApp</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="modal-whatsapp"
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
              <Label htmlFor="modal-password" className="text-sm">
                Senha (4 últimos dígitos do celular)
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="modal-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="1234"
                  className="pl-10 pr-12 text-center"
                  maxLength={4}
                  pattern="[0-9]{4}"
                  required
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full w-12 hover:bg-transparent"
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
              <span className="bg-background px-2 text-muted-foreground">ou</span>
            </div>
          </div>

                    {onSwitchToRegister ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                handleClose();
                onSwitchToRegister();
              }}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Criar conta
            </Button>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                handleClose();
                navigate("/cadastro");
              }}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Criar conta
            </Button>
          )}

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Precisa de ajuda? Entre em contato conosco
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
