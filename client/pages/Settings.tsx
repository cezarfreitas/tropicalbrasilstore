import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Settings as SettingsIcon,
  Store,
  Contact,
  Truck,
  CreditCard,
  Share2,
  Image,
  Shield,
  Save,
  Loader2,
  Database,
  Download,
  Upload,
  RefreshCw,
  Palette,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { ThemeDebug } from "@/components/ThemeDebug";

interface StoreSettings {
  id?: number;
  store_name: string;
  store_description: string;
  contact_email: string;
  contact_phone: string;
  contact_whatsapp: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  shipping_fee: number;
  free_shipping_threshold: number;
  payment_methods: string[];
  social_instagram: string;
  social_facebook: string;
  logo_url: string;
  banner_url: string;
  maintenance_mode: boolean;
  allow_orders: boolean;
  tax_rate: number;
  // Design fields
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
}

const paymentMethodOptions = [
  { id: "pix", label: "PIX" },
  { id: "credit_card", label: "Cartão de Crédito" },
  { id: "debit_card", label: "Cartão de Débito" },
  { id: "boleto", label: "Boleto Bancário" },
];

export default function Settings() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);
  const { toast } = useToast();

  // Apply theme colors in real time
  useThemeColors(
    settings
      ? {
          primary_color: settings.primary_color,
          secondary_color: settings.secondary_color,
          accent_color: settings.accent_color,
          background_color: settings.background_color,
          text_color: settings.text_color,
        }
      : {},
  );

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/settings");
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as configurações",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Configurações salvas com sucesso",
        });

        // Trigger theme refresh event for all components
        window.dispatchEvent(new CustomEvent("themeRefresh"));
        console.log("🎨 Settings saved, triggering theme refresh...");
      } else {
        throw new Error("Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSettings = (field: string, value: any) => {
    if (!settings) return;
    setSettings({
      ...settings,
      [field]: value,
    });
  };

  const handleLogoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !settings) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo de imagem válido",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "O arquivo deve ter no máximo 5MB",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("🔄 Starting logo upload...", file.name, file.size);

      const formData = new FormData();
      formData.append("logo", file);

      const response = await fetch("/api/settings/upload-logo", {
        method: "POST",
        body: formData,
      });

      console.log("📡 Upload response status:", response.status);

      if (response.ok) {
        const result = await response.json();
        console.log("✅ Upload successful:", result);

        updateSettings("logo_url", result.logo_url);
        toast({
          title: "Sucesso",
          description: "Logo carregado com sucesso!",
        });
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        console.error("❌ Upload failed:", response.status, errorData);
        throw new Error(errorData.error || `Upload failed with status ${response.status}`);
      }
    } catch (error) {
      console.error("💥 Logo upload error:", error);

      let errorMessage = "Não foi possível fazer upload do logo";
      if (error instanceof Error) {
        if (error.message.includes("File too large")) {
          errorMessage = "Arquivo muito grande. Tamanho máximo: 5MB";
        } else if (error.message.includes("Only image files")) {
          errorMessage = "Apenas arquivos de imagem são permitidos";
        } else if (error.message.includes("No file uploaded")) {
          errorMessage = "Nenhum arquivo foi selecionado";
        } else if (error.message !== "Upload failed") {
          errorMessage = error.message;
        }
      }

      toast({
        title: "Erro no Upload",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const togglePaymentMethod = (methodId: string) => {
    if (!settings) return;
    const methods = [...settings.payment_methods];
    const index = methods.indexOf(methodId);

    if (index > -1) {
      methods.splice(index, 1);
    } else {
      methods.push(methodId);
    }

    updateSettings("payment_methods", methods);
  };

  const downloadBackup = async () => {
    setBackupLoading(true);
    try {
      const response = await fetch("/api/settings/backup", {
        method: "POST",
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = `backup-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);

        toast({
          title: "Sucesso",
          description: "Backup criado e baixado com sucesso",
        });
      } else {
        throw new Error("Failed to create backup");
      }
    } catch (error) {
      console.error("Error creating backup:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o backup",
        variant: "destructive",
      });
    } finally {
      setBackupLoading(false);
    }
  };

  const restoreBackup = async (file: File) => {
    setRestoreLoading(true);
    try {
      const text = await file.text();
      const backup = JSON.parse(text);

      const response = await fetch("/api/settings/restore", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ backup, preserveOrders: true }),
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Backup restaurado com sucesso",
        });
        // Refresh settings
        fetchSettings();
      } else {
        throw new Error("Failed to restore backup");
      }
    } catch (error) {
      console.error("Error restoring backup:", error);
      toast({
        title: "Erro",
        description: "Não foi poss��vel restaurar o backup",
        variant: "destructive",
      });
    } finally {
      setRestoreLoading(false);
    }
  };

  const createTemplate = async () => {
    if (
      !confirm(
        "Isso irá substituir todos os produtos, categorias e configurações por dados de template. Pedidos e clientes serão preservados. Tem certeza?",
      )
    ) {
      return;
    }

    setTemplateLoading(true);
    try {
      const response = await fetch("/api/settings/restore-template", {
        method: "POST",
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Banco de dados template criado com sucesso",
        });
        fetchSettings();
      } else {
        throw new Error("Failed to create template");
      }
    } catch (error) {
      console.error("Error creating template:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o banco template",
        variant: "destructive",
      });
    } finally {
      setTemplateLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      restoreBackup(file);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">
            Carregando configurações...
          </p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-8">
        <SettingsIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-semibold">
          Erro ao carregar configurações
        </h3>
        <p className="mt-2 text-muted-foreground">
          Tente recarregar a página ou entre em contato com o suporte.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">
            Configure as informações e preferências da loja
          </p>
        </div>
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salvar Configurações
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="general">
            <Store className="h-4 w-4 mr-0 sm:mr-2" />
            <span className="hidden sm:inline">Geral</span>
          </TabsTrigger>
          <TabsTrigger value="designer">
            <Palette className="h-4 w-4 mr-0 sm:mr-2" />
            <span className="hidden sm:inline">Designer</span>
          </TabsTrigger>
          <TabsTrigger value="contact">
            <Contact className="h-4 w-4 mr-0 sm:mr-2" />
            <span className="hidden sm:inline">Contato</span>
          </TabsTrigger>
          <TabsTrigger value="shipping">
            <Truck className="h-4 w-4 mr-0 sm:mr-2" />
            <span className="hidden sm:inline">Entrega</span>
          </TabsTrigger>
          <TabsTrigger value="payment">
            <CreditCard className="h-4 w-4 mr-0 sm:mr-2" />
            <span className="hidden sm:inline">Pagamento</span>
          </TabsTrigger>
          <TabsTrigger value="social">
            <Share2 className="h-4 w-4 mr-0 sm:mr-2" />
            <span className="hidden sm:inline">Social</span>
          </TabsTrigger>
          <TabsTrigger value="backup">
            <Database className="h-4 w-4 mr-0 sm:mr-2" />
            <span className="hidden sm:inline">Backup</span>
          </TabsTrigger>
          <TabsTrigger value="advanced">
            <Shield className="h-4 w-4 mr-0 sm:mr-2" />
            <span className="hidden sm:inline">Avançado</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Loja</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="store_name">Nome da Loja</Label>
                <Input
                  id="store_name"
                  value={settings.store_name}
                  onChange={(e) => updateSettings("store_name", e.target.value)}
                  placeholder="Nome da sua loja"
                />
              </div>
              <div>
                <Label htmlFor="store_description">Descri��ão</Label>
                <Textarea
                  id="store_description"
                  value={settings.store_description}
                  onChange={(e) =>
                    updateSettings("store_description", e.target.value)
                  }
                  placeholder="Descrição da sua loja"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="logo_url">URL do Logo</Label>
                <Input
                  id="logo_url"
                  value={settings.logo_url || ""}
                  onChange={(e) => updateSettings("logo_url", e.target.value)}
                  placeholder="https://exemplo.com/logo.png"
                />
              </div>
              <div>
                <Label htmlFor="banner_url">URL do Banner</Label>
                <Input
                  id="banner_url"
                  value={settings.banner_url || ""}
                  onChange={(e) => updateSettings("banner_url", e.target.value)}
                  placeholder="https://exemplo.com/banner.jpg"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="designer" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Design da Loja
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Personalize as cores e visual da sua loja
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo Upload */}
              <div>
                <Label className="text-base font-medium">Logo da Loja</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Faça upload do logo que aparecerá no cabeçalho da loja
                </p>
                <div className="flex items-center gap-4">
                  {settings?.logo_url && (
                    <div className="w-16 h-16 border rounded-lg overflow-hidden">
                      <img
                        src={settings.logo_url}
                        alt="Logo atual"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      style={{ display: "none" }}
                      id="logo-upload"
                    />
                    <Button
                      variant="outline"
                      onClick={() =>
                        document.getElementById("logo-upload")?.click()
                      }
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Escolher Logo
                    </Button>
                    {settings?.logo_url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateSettings("logo_url", "")}
                      >
                        Remover
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Color Customization */}
              <div>
                <Label className="text-base font-medium">Cores da Loja</Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Personalize a paleta de cores da sua loja
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="primary_color">Cor Primária</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="color"
                        id="primary_color"
                        value={settings?.primary_color || "#f97316"}
                        onChange={(e) =>
                          updateSettings("primary_color", e.target.value)
                        }
                        className="w-12 h-10 border rounded cursor-pointer"
                      />
                      <Input
                        value={settings?.primary_color || "#f97316"}
                        onChange={(e) =>
                          updateSettings("primary_color", e.target.value)
                        }
                        placeholder="#f97316"
                        className="font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="secondary_color">Cor Secundária</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="color"
                        id="secondary_color"
                        value={settings?.secondary_color || "#ea580c"}
                        onChange={(e) =>
                          updateSettings("secondary_color", e.target.value)
                        }
                        className="w-12 h-10 border rounded cursor-pointer"
                      />
                      <Input
                        value={settings?.secondary_color || "#ea580c"}
                        onChange={(e) =>
                          updateSettings("secondary_color", e.target.value)
                        }
                        placeholder="#ea580c"
                        className="font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="accent_color">Cor de Destaque</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="color"
                        id="accent_color"
                        value={settings?.accent_color || "#fed7aa"}
                        onChange={(e) =>
                          updateSettings("accent_color", e.target.value)
                        }
                        className="w-12 h-10 border rounded cursor-pointer"
                      />
                      <Input
                        value={settings?.accent_color || "#fed7aa"}
                        onChange={(e) =>
                          updateSettings("accent_color", e.target.value)
                        }
                        placeholder="#fed7aa"
                        className="font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="background_color">Cor de Fundo</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="color"
                        id="background_color"
                        value={settings?.background_color || "#ffffff"}
                        onChange={(e) =>
                          updateSettings("background_color", e.target.value)
                        }
                        className="w-12 h-10 border rounded cursor-pointer"
                      />
                      <Input
                        value={settings?.background_color || "#ffffff"}
                        onChange={(e) =>
                          updateSettings("background_color", e.target.value)
                        }
                        placeholder="#ffffff"
                        className="font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Predefined Color Palettes */}
              <div>
                <Label className="text-base font-medium">Paletas Predefinidas</Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Escolha uma paleta de cores pronta ou personalize as suas próprias
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {/* Orange (Current) */}
                  <div
                    className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => {
                      updateSettings("primary_color", "#f97316");
                      updateSettings("secondary_color", "#ea580c");
                      updateSettings("accent_color", "#fed7aa");
                      updateSettings("background_color", "#ffffff");
                      updateSettings("text_color", "#000000");
                    }}
                  >
                    <div className="flex gap-1 mb-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: "#f97316" }}></div>
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: "#ea580c" }}></div>
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: "#fed7aa" }}></div>
                    </div>
                    <p className="text-xs font-medium">Laranja</p>
                  </div>

                  {/* Blue */}
                  <div
                    className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => {
                      updateSettings("primary_color", "#3b82f6");
                      updateSettings("secondary_color", "#1d4ed8");
                      updateSettings("accent_color", "#dbeafe");
                      updateSettings("background_color", "#ffffff");
                      updateSettings("text_color", "#000000");
                    }}
                  >
                    <div className="flex gap-1 mb-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: "#3b82f6" }}></div>
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: "#1d4ed8" }}></div>
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: "#dbeafe" }}></div>
                    </div>
                    <p className="text-xs font-medium">Azul</p>
                  </div>

                  {/* Green */}
                  <div
                    className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => {
                      updateSettings("primary_color", "#10b981");
                      updateSettings("secondary_color", "#059669");
                      updateSettings("accent_color", "#d1fae5");
                      updateSettings("background_color", "#ffffff");
                      updateSettings("text_color", "#000000");
                    }}
                  >
                    <div className="flex gap-1 mb-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: "#10b981" }}></div>
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: "#059669" }}></div>
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: "#d1fae5" }}></div>
                    </div>
                    <p className="text-xs font-medium">Verde</p>
                  </div>

                  {/* Purple */}
                  <div
                    className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => {
                      updateSettings("primary_color", "#8b5cf6");
                      updateSettings("secondary_color", "#7c3aed");
                      updateSettings("accent_color", "#ede9fe");
                      updateSettings("background_color", "#ffffff");
                      updateSettings("text_color", "#000000");
                    }}
                  >
                    <div className="flex gap-1 mb-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: "#8b5cf6" }}></div>
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: "#7c3aed" }}></div>
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: "#ede9fe" }}></div>
                    </div>
                    <p className="text-xs font-medium">Roxo</p>
                  </div>

                  {/* Red */}
                  <div
                    className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => {
                      updateSettings("primary_color", "#ef4444");
                      updateSettings("secondary_color", "#dc2626");
                      updateSettings("accent_color", "#fecaca");
                      updateSettings("background_color", "#ffffff");
                      updateSettings("text_color", "#000000");
                    }}
                  >
                    <div className="flex gap-1 mb-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: "#ef4444" }}></div>
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: "#dc2626" }}></div>
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: "#fecaca" }}></div>
                    </div>
                    <p className="text-xs font-medium">Vermelho</p>
                  </div>

                  {/* Pink */}
                  <div
                    className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => {
                      updateSettings("primary_color", "#ec4899");
                      updateSettings("secondary_color", "#db2777");
                      updateSettings("accent_color", "#fce7f3");
                      updateSettings("background_color", "#ffffff");
                      updateSettings("text_color", "#000000");
                    }}
                  >
                    <div className="flex gap-1 mb-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: "#ec4899" }}></div>
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: "#db2777" }}></div>
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: "#fce7f3" }}></div>
                    </div>
                    <p className="text-xs font-medium">Rosa</p>
                  </div>

                  {/* Dark */}
                  <div
                    className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => {
                      updateSettings("primary_color", "#374151");
                      updateSettings("secondary_color", "#1f2937");
                      updateSettings("accent_color", "#f3f4f6");
                      updateSettings("background_color", "#ffffff");
                      updateSettings("text_color", "#000000");
                    }}
                  >
                    <div className="flex gap-1 mb-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: "#374151" }}></div>
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: "#1f2937" }}></div>
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: "#f3f4f6" }}></div>
                    </div>
                    <p className="text-xs font-medium">Escuro</p>
                  </div>

                  {/* Teal */}
                  <div
                    className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => {
                      updateSettings("primary_color", "#14b8a6");
                      updateSettings("secondary_color", "#0f766e");
                      updateSettings("accent_color", "#ccfbf1");
                      updateSettings("background_color", "#ffffff");
                      updateSettings("text_color", "#000000");
                    }}
                  >
                    <div className="flex gap-1 mb-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: "#14b8a6" }}></div>
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: "#0f766e" }}></div>
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: "#ccfbf1" }}></div>
                    </div>
                    <p className="text-xs font-medium">Turquesa</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Preview */}
              <div>
                <Label className="text-base font-medium">
                  Prévia das Cores
                </Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Veja como ficará a aparência com as cores selecionadas
                </p>
                <div
                  className="border rounded-lg p-4 space-y-3"
                  style={{
                    backgroundColor: settings?.background_color || "#ffffff",
                  }}
                >
                  <div
                    className="px-4 py-2 rounded text-white font-medium"
                    style={{
                      backgroundColor: settings?.primary_color || "#f97316",
                    }}
                  >
                    Botão Primário
                  </div>
                  <div
                    className="px-4 py-2 rounded text-white font-medium"
                    style={{
                      backgroundColor: settings?.secondary_color || "#ea580c",
                    }}
                  >
                    Botão Secundário
                  </div>
                  <div
                    className="px-4 py-2 rounded border-2"
                    style={{
                      borderColor: settings?.primary_color || "#f97316",
                      color: settings?.primary_color || "#f97316",
                    }}
                  >
                    Botão Outline
                  </div>
                  <div
                    className="px-4 py-2 rounded"
                    style={{
                      backgroundColor: settings?.accent_color || "#fed7aa",
                    }}
                  >
                    Elemento de Destaque
                  </div>
                </div>
              </div>

              {/* Test Colors Button */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    // Apply colors immediately without saving
                    window.dispatchEvent(new CustomEvent("themeRefresh"));
                    toast({
                      title: "Cores aplicadas",
                      description:
                        "As cores foram aplicadas temporariamente. Salve para torná-las permanentes.",
                    });
                  }}
                  className="flex-1"
                >
                  <Palette className="h-4 w-4 mr-2" />
                  Testar Cores
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    // Reset to original colors
                    fetchSettings();
                    window.dispatchEvent(new CustomEvent("themeRefresh"));
                    toast({
                      title: "Cores resetadas",
                      description:
                        "As cores foram resetadas para os valores salvos.",
                    });
                  }}
                >
                  Resetar
                </Button>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900">💡 Dica</h4>
                <p className="text-sm text-blue-800 mt-1">
                  Use "Testar Cores" para aplicar as mudanças temporariamente.
                  As cores serão aplicadas automaticamente em toda a loja após
                  salvar as configurações. Teste diferentes combinações para
                  encontrar o visual perfeito!
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações de Contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="contact_email">Email de Contato</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={settings.contact_email}
                  onChange={(e) =>
                    updateSettings("contact_email", e.target.value)
                  }
                  placeholder="contato@loja.com"
                />
              </div>
              <div>
                <Label htmlFor="contact_phone">Telefone</Label>
                <Input
                  id="contact_phone"
                  value={settings.contact_phone}
                  onChange={(e) =>
                    updateSettings("contact_phone", e.target.value)
                  }
                  placeholder="(11) 9999-9999"
                />
              </div>
              <div>
                <Label htmlFor="contact_whatsapp">WhatsApp</Label>
                <Input
                  id="contact_whatsapp"
                  value={settings.contact_whatsapp}
                  onChange={(e) =>
                    updateSettings("contact_whatsapp", e.target.value)
                  }
                  placeholder="(11) 99999-9999"
                />
              </div>
              <Separator />
              <div>
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  value={settings.address}
                  onChange={(e) => updateSettings("address", e.target.value)}
                  placeholder="Rua Principal, 123"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={settings.city}
                    onChange={(e) => updateSettings("city", e.target.value)}
                    placeholder="São Paulo"
                  />
                </div>
                <div>
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    value={settings.state}
                    onChange={(e) => updateSettings("state", e.target.value)}
                    placeholder="SP"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="postal_code">CEP</Label>
                <Input
                  id="postal_code"
                  value={settings.postal_code}
                  onChange={(e) =>
                    updateSettings("postal_code", e.target.value)
                  }
                  placeholder="01234-567"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shipping" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Entrega</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="shipping_fee">Taxa de Entrega (R$)</Label>
                <Input
                  id="shipping_fee"
                  type="number"
                  step="0.01"
                  value={settings.shipping_fee}
                  onChange={(e) =>
                    updateSettings(
                      "shipping_fee",
                      parseFloat(e.target.value) || 0,
                    )
                  }
                  placeholder="15.00"
                />
              </div>
              <div>
                <Label htmlFor="free_shipping_threshold">
                  Frete Grátis a partir de (R$)
                </Label>
                <Input
                  id="free_shipping_threshold"
                  type="number"
                  step="0.01"
                  value={settings.free_shipping_threshold}
                  onChange={(e) =>
                    updateSettings(
                      "free_shipping_threshold",
                      parseFloat(e.target.value) || 0,
                    )
                  }
                  placeholder="150.00"
                />
              </div>
              <div>
                <Label htmlFor="tax_rate">Taxa de Impostos (%)</Label>
                <Input
                  id="tax_rate"
                  type="number"
                  step="0.01"
                  value={settings.tax_rate * 100}
                  onChange={(e) =>
                    updateSettings(
                      "tax_rate",
                      (parseFloat(e.target.value) || 0) / 100,
                    )
                  }
                  placeholder="0.00"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Métodos de Pagamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {paymentMethodOptions.map((method) => (
                  <div key={method.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={method.id}
                      checked={settings.payment_methods.includes(method.id)}
                      onCheckedChange={() => togglePaymentMethod(method.id)}
                    />
                    <Label htmlFor={method.id}>{method.label}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Redes Sociais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="social_instagram">Instagram</Label>
                <Input
                  id="social_instagram"
                  value={settings.social_instagram}
                  onChange={(e) =>
                    updateSettings("social_instagram", e.target.value)
                  }
                  placeholder="@loja"
                />
              </div>
              <div>
                <Label htmlFor="social_facebook">Facebook</Label>
                <Input
                  id="social_facebook"
                  value={settings.social_facebook}
                  onChange={(e) =>
                    updateSettings("social_facebook", e.target.value)
                  }
                  placeholder="facebook.com/loja"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Backup e Restauração</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-medium">Fazer Backup</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Crie um backup completo de todos os dados da loja (produtos,
                    pedidos, configurações)
                  </p>
                  <Button
                    onClick={downloadBackup}
                    disabled={backupLoading}
                    variant="outline"
                  >
                    {backupLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Baixar Backup
                  </Button>
                </div>

                <Separator />

                <div>
                  <h4 className="text-lg font-medium">Restaurar Backup</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Restaure dados de um arquivo de backup (pedidos e clientes
                    serão preservados)
                  </p>
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      style={{ display: "none" }}
                      id="backup-upload"
                      disabled={restoreLoading}
                    />
                    <Button
                      onClick={() =>
                        document.getElementById("backup-upload")?.click()
                      }
                      disabled={restoreLoading}
                      variant="outline"
                    >
                      {restoreLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      Carregar Backup
                    </Button>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-lg font-medium">Criar Banco Template</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Crie um banco de dados com produtos, categorias e
                    configurações de exemplo. Ideal para começar uma nova loja
                    do zero.
                  </p>
                  <Button
                    onClick={createTemplate}
                    disabled={templateLoading}
                    variant="destructive"
                  >
                    {templateLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Criar Template
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    ⚠️ Esta ação substituirá produtos e categorias existentes
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Avançadas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="maintenance_mode">Modo de Manutenção</Label>
                  <p className="text-sm text-muted-foreground">
                    Quando ativado, a loja fica temporariamente indisponível
                  </p>
                </div>
                <Switch
                  id="maintenance_mode"
                  checked={settings.maintenance_mode}
                  onCheckedChange={(checked) =>
                    updateSettings("maintenance_mode", checked)
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="allow_orders">Permitir Pedidos</Label>
                  <p className="text-sm text-muted-foreground">
                    Quando desativado, clientes não podem fazer pedidos
                  </p>
                </div>
                <Switch
                  id="allow_orders"
                  checked={settings.allow_orders}
                  onCheckedChange={(checked) =>
                    updateSettings("allow_orders", checked)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Theme Debug Component */}
      <ThemeDebug />
    </div>
  );
}
