import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Mail, 
  Webhook, 
  Save, 
  TestTube,
  Bell,
  Settings,
  AlertCircle,
  CheckCircle
} from "lucide-react";

interface NotificationSettings {
  // Email settings
  email_enabled: string;
  smtp_host: string;
  smtp_port: string;
  smtp_user: string;
  smtp_password: string;
  smtp_from_email: string;
  smtp_from_name: string;
  email_subject: string;
  email_template: string;
  
  // Webhook settings
  webhook_enabled: string;
  webhook_url: string;
  webhook_method: string;
  webhook_headers: string;
  webhook_template: string;
}

export default function Notifications() {
  const [settings, setSettings] = useState<NotificationSettings>({
    email_enabled: 'false',
    smtp_host: '',
    smtp_port: '587',
    smtp_user: '',
    smtp_password: '',
    smtp_from_email: '',
    smtp_from_name: 'Chinelos Store',
    email_subject: '🎉 Novo Pedido Recebido - Chinelos Store',
    email_template: '',
    webhook_enabled: 'false',
    webhook_url: '',
    webhook_method: 'POST',
    webhook_headers: '{"Content-Type": "application/json"}',
    webhook_template: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const { toast } = useToast();

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch("/api/notifications");
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      } else {
        toast({
          title: "Erro",
          description: "Falha ao carregar configurações",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar configurações",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (key: keyof NotificationSettings, value: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSwitchChange = (key: keyof NotificationSettings, checked: boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: checked ? 'true' : 'false'
    }));
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Configurações salvas com sucesso!",
        });
      } else {
        toast({
          title: "Erro",
          description: "Falha ao salvar configurações",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const testEmail = async () => {
    setTestingEmail(true);
    try {
      const response = await fetch("/api/notifications/test-email", {
        method: "POST",
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Email de teste enviado com sucesso!",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Erro",
          description: error.error || "Falha ao enviar email de teste",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error testing email:", error);
      toast({
        title: "Erro",
        description: "Erro ao testar email",
        variant: "destructive",
      });
    } finally {
      setTestingEmail(false);
    }
  };

  const testWebhook = async () => {
    setTestingWebhook(true);
    try {
      const response = await fetch("/api/notifications/test-webhook", {
        method: "POST",
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Webhook de teste enviado com sucesso!",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Erro",
          description: error.error || "Falha ao enviar webhook de teste",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error testing webhook:", error);
      toast({
        title: "Erro",
        description: "Erro ao testar webhook",
        variant: "destructive",
      });
    } finally {
      setTestingWebhook(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Settings className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Carregando configurações...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Bell className="h-8 w-8" />
              Notificações
            </h1>
            <p className="text-muted-foreground">
              Configure emails e webhooks enviados quando um pedido é criado
            </p>
          </div>
          <Button onClick={saveSettings} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </div>

        <Tabs defaultValue="email" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email" className="gap-2">
              <Mail className="h-4 w-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="webhook" className="gap-2">
              <Webhook className="h-4 w-4" />
              Webhook
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Configurações de Email
                  <div className="ml-auto flex items-center gap-2">
                    <Switch
                      checked={settings.email_enabled === 'true'}
                      onCheckedChange={(checked) => handleSwitchChange('email_enabled', checked)}
                    />
                    <span className="text-sm">
                      {settings.email_enabled === 'true' ? (
                        <span className="text-green-600 flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" />
                          Ativo
                        </span>
                      ) : (
                        <span className="text-gray-500 flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          Inativo
                        </span>
                      )}
                    </span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="smtp_host">Servidor SMTP</Label>
                    <Input
                      id="smtp_host"
                      value={settings.smtp_host}
                      onChange={(e) => handleInputChange('smtp_host', e.target.value)}
                      placeholder="smtp.gmail.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="smtp_port">Porta</Label>
                    <Input
                      id="smtp_port"
                      value={settings.smtp_port}
                      onChange={(e) => handleInputChange('smtp_port', e.target.value)}
                      placeholder="587"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="smtp_user">Usuário</Label>
                    <Input
                      id="smtp_user"
                      value={settings.smtp_user}
                      onChange={(e) => handleInputChange('smtp_user', e.target.value)}
                      placeholder="seu-email@gmail.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="smtp_password">Senha</Label>
                    <Input
                      id="smtp_password"
                      type="password"
                      value={settings.smtp_password}
                      onChange={(e) => handleInputChange('smtp_password', e.target.value)}
                      placeholder="sua-senha-de-app"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="smtp_from_email">Email Remetente</Label>
                    <Input
                      id="smtp_from_email"
                      value={settings.smtp_from_email}
                      onChange={(e) => handleInputChange('smtp_from_email', e.target.value)}
                      placeholder="loja@chinelos.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="smtp_from_name">Nome Remetente</Label>
                    <Input
                      id="smtp_from_name"
                      value={settings.smtp_from_name}
                      onChange={(e) => handleInputChange('smtp_from_name', e.target.value)}
                      placeholder="Chinelos Store"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email_subject">Assunto do Email</Label>
                  <Input
                    id="email_subject"
                    value={settings.email_subject}
                    onChange={(e) => handleInputChange('email_subject', e.target.value)}
                    placeholder="🎉 Novo Pedido Recebido - Chinelos Store"
                  />
                </div>

                <div>
                  <Label htmlFor="email_template">Template HTML do Email</Label>
                  <Textarea
                    id="email_template"
                    value={settings.email_template}
                    onChange={(e) => handleInputChange('email_template', e.target.value)}
                    placeholder="Template HTML..."
                    rows={10}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Variáveis disponíveis: {{ORDER_ID}}, {{CUSTOMER_NAME}}, {{CUSTOMER_EMAIL}}, {{CUSTOMER_WHATSAPP}}, {{TOTAL_PRICE}}, {{ORDER_DATE}}, {{ORDER_STATUS}}, {{ORDER_ITEMS}}, {{EMAIL_DATE}}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={testEmail} 
                    disabled={testingEmail || settings.email_enabled !== 'true'}
                    className="gap-2"
                  >
                    <TestTube className="h-4 w-4" />
                    {testingEmail ? "Enviando..." : "Testar Email"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="webhook" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Webhook className="h-5 w-5" />
                  Configurações de Webhook
                  <div className="ml-auto flex items-center gap-2">
                    <Switch
                      checked={settings.webhook_enabled === 'true'}
                      onCheckedChange={(checked) => handleSwitchChange('webhook_enabled', checked)}
                    />
                    <span className="text-sm">
                      {settings.webhook_enabled === 'true' ? (
                        <span className="text-green-600 flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" />
                          Ativo
                        </span>
                      ) : (
                        <span className="text-gray-500 flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          Inativo
                        </span>
                      )}
                    </span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="webhook_url">URL do Webhook</Label>
                  <Input
                    id="webhook_url"
                    value={settings.webhook_url}
                    onChange={(e) => handleInputChange('webhook_url', e.target.value)}
                    placeholder="https://seu-webhook.com/novo-pedido"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="webhook_method">Método HTTP</Label>
                    <Input
                      id="webhook_method"
                      value={settings.webhook_method}
                      onChange={(e) => handleInputChange('webhook_method', e.target.value)}
                      placeholder="POST"
                    />
                  </div>
                  <div>
                    <Label htmlFor="webhook_headers">Headers (JSON)</Label>
                    <Input
                      id="webhook_headers"
                      value={settings.webhook_headers}
                      onChange={(e) => handleInputChange('webhook_headers', e.target.value)}
                      placeholder='{"Content-Type": "application/json"}'
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="webhook_template">Template JSON do Webhook</Label>
                  <Textarea
                    id="webhook_template"
                    value={settings.webhook_template}
                    onChange={(e) => handleInputChange('webhook_template', e.target.value)}
                    placeholder="Template JSON..."
                    rows={10}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Variáveis disponíveis: {{ORDER_ID}}, {{CUSTOMER_NAME}}, {{CUSTOMER_EMAIL}}, {{CUSTOMER_WHATSAPP}}, {{TOTAL_PRICE}}, {{ORDER_DATE}}, {{ORDER_STATUS}}, {{ORDER_ITEMS_JSON}}, {{TIMESTAMP}}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={testWebhook} 
                    disabled={testingWebhook || settings.webhook_enabled !== 'true'}
                    className="gap-2"
                  >
                    <TestTube className="h-4 w-4" />
                    {testingWebhook ? "Enviando..." : "Testar Webhook"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </tabs>
      </div>
    </AdminLayout>
  );
}