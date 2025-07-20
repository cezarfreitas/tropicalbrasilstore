import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCustomerAuth } from "@/hooks/use-customer-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Package, UserPlus, User, Mail, Phone, ArrowLeft } from "lucide-react";

export default function CustomerRegister() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    whatsapp: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useCustomerAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

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
    handleInputChange("whatsapp", formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Extract only digits from WhatsApp
    const whatsappDigits = formData.whatsapp.replace(/\D/g, "");

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

    const result = await register(
      formData.name,
      formData.email,
      whatsappDigits,
    );

    if (result.success) {
      toast({
        title: "Cadastro realizado!",
        description: result.message,
      });
      navigate("/login");
    } else {
      toast({
        title: "Erro no cadastro",
        description: result.message,
        variant: "destructive",
      });
    }

    setIsLoading(false);
  };

  const isFormValid =
    formData.name &&
    formData.email &&
    formData.whatsapp.replace(/\D/g, "").length === 11;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4">
            <Package className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Chinelos Store</h1>
          <p className="text-gray-600 mt-2">
            Cadastre-se para acessar preços exclusivos
          </p>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-semibold text-center flex items-center justify-center gap-2">
              <UserPlus className="h-5 w-5" />
              Cadastrar-se
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="João Silva"
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="joao@exemplo.com"
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="whatsapp"
                    type="tel"
                    value={formData.whatsapp}
                    onChange={(e) => handleWhatsAppChange(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="pl-10"
                    required
                    disabled={isLoading}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Sua senha será os 4 últimos dígitos do seu WhatsApp
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Package className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Após o cadastro
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Seu cadastro será enviado para aprovação</li>
                        <li>Você receberá uma confirmação por WhatsApp</li>
                        <li>
                          Sua senha será os 4 últimos dígitos do seu celular
                        </li>
                        <li>
                          Após aprovação, você poderá ver preços exclusivos
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

                            <Button
                type="submit"
                className="w-full h-11 text-base"
                disabled={isLoading || !isFormValid}
              >
                {isLoading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Cadastrando...
                  </>
                ) : (
                  "Cadastrar"
                )}
              </Button>
            </form>

            <div className="text-center space-y-2">
              <Button
                variant="link"
                className="text-sm text-muted-foreground"
                asChild
              >
                <Link to="/login" className="flex items-center gap-2">
                  <ArrowLeft className="h-3 w-3" />
                  Já tem conta? Entrar
                </Link>
              </Button>

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
