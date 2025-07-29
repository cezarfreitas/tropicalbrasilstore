import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, Copy, Eye, EyeOff, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const apiEndpoints = [
  {
    method: "POST",
    endpoint: "/api/products/bulk",
    description: "Cadastrar produtos em lote com variantes e grades",
    parameters: "Body: Array de produtos agrupados por código",
    example: {
      products: [
        {
          codigo: "CHN001",
          nome: "Chinelo Havaianas Top",
          categoria: "Chinelos",
          tipo: "Casual",
          descricao: "Chinelo tradicional Havaianas",
          variantes: [
            {
              cor: "Preto",
              preco: 29.90,
              grade: {
                nome: "Grade Unissex",
                tamanhos: ["35", "36", "37", "38", "39", "40", "41", "42"]
              },
              foto: "https://exemplo.com/chinelo-preto.jpg"
            },
            {
              cor: "Azul",
              preco: 29.90,
              grade: {
                nome: "Grade Unissex",
                tamanhos: ["35", "36", "37", "38", "39", "40", "41", "42"]
              },
              foto: "https://exemplo.com/chinelo-azul.jpg"
            }
          ]
        }
      ]
    }
  },
  {
    method: "GET",
    endpoint: "/api/products",
    description: "Listar todos os produtos",
    parameters: "?page=1&limit=20&search=termo&codigo=CHN001",
    example: {
      id: 1,
      codigo: "CHN001",
      name: "Chinelo Havaianas Top",
      price: 29.90,
      category: "Chinelos",
      variants: 2
    }
  },
  {
    method: "GET",
    endpoint: "/api/orders",
    description: "Listar pedidos",
    parameters: "?status=pending&customer_id=123",
    example: {
      id: 1,
      customer_id: 123,
      total: 89.90,
      status: "pending",
      items: []
    }
  },
  {
    method: "GET",
    endpoint: "/api/customers",
    description: "Listar clientes",
    parameters: "?approved=true&page=1",
    example: {
      id: 1,
      name: "João Silva",
      email: "joao@email.com",
      whatsapp: "(11) 99999-9999",
      status: "approved"
    }
  },
  {
    method: "GET",
    endpoint: "/api/categories",
    description: "Listar categorias",
    parameters: "",
    example: {
      id: 1,
      name: "Chinelos",
      show_in_menu: true
    }
  },
  {
    method: "GET",
    endpoint: "/api/colors",
    description: "Listar cores disponíveis",
    parameters: "",
    example: {
      id: 1,
      name: "Preto",
      hex_code: "#000000"
    }
  },
  {
    method: "GET",
    endpoint: "/api/grades",
    description: "Listar grades de tamanhos",
    parameters: "",
    example: {
      id: 1,
      name: "Grade Feminina",
      sizes: ["35", "36", "37", "38", "39", "40"]
    }
  }
];

const webhookExamples = [
  {
    event: "order.created",
    description: "Disparado quando um novo pedido é criado",
    payload: {
      event: "order.created",
      data: {
        order_id: 123,
        customer_id: 456,
        total: 89.90,
        items: []
      }
    }
  },
  {
    event: "customer.approved",
    description: "Disparado quando um cliente é aprovado",
    payload: {
      event: "customer.approved",
      data: {
        customer_id: 456,
        name: "João Silva",
        email: "joao@email.com"
      }
    }
  }
];

export default function ApiDocs() {
  const [apiKey, setApiKey] = useState("sk_live_example_key_12345678901234567890");
  const [showApiKey, setShowApiKey] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "Texto copiado para a área de transferência.",
    });
  };

  const generateNewApiKey = () => {
    const newKey = `sk_live_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
    setApiKey(newKey);
    toast({
      title: "Nova chave gerada",
      description: "Uma nova chave de API foi gerada com sucesso.",
    });
  };

  const MethodBadge = ({ method }: { method: string }) => {
    const colors = {
      GET: "bg-green-100 text-green-800",
      POST: "bg-blue-100 text-blue-800",
      PUT: "bg-yellow-100 text-yellow-800",
      DELETE: "bg-red-100 text-red-800"
    };
    
    return (
      <Badge className={colors[method as keyof typeof colors] || "bg-gray-100 text-gray-800"}>
        {method}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Documentação da API</h1>
        <p className="text-gray-600 mt-2">
          Gerencie e integre com a API da loja de chinelos
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="authentication">Autenticação</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                API REST
              </CardTitle>
              <CardDescription>
                API RESTful para integração com sistemas externos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Base URL</h4>
                  <code className="block bg-gray-100 p-2 rounded text-sm">
                    https://sua-loja.com/api
                  </code>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Formato</h4>
                  <code className="block bg-gray-100 p-2 rounded text-sm">
                    JSON
                  </code>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold">Headers Obrigatórios</h4>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
{`Content-Type: application/json
Authorization: Bearer YOUR_API_KEY`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="endpoints" className="space-y-4">
          <div className="space-y-4">
            {apiEndpoints.map((endpoint, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MethodBadge method={endpoint.method} />
                      <code className="text-sm">{endpoint.endpoint}</code>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(`${endpoint.method} ${endpoint.endpoint}`)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardDescription>{endpoint.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {endpoint.parameters && (
                    <div>
                      <h5 className="font-medium mb-2">Parâmetros</h5>
                      <code className="block bg-gray-100 p-2 rounded text-sm">
                        {endpoint.parameters}
                      </code>
                    </div>
                  )}
                  
                  <div>
                    <h5 className="font-medium mb-2">Exemplo de Resposta</h5>
                    <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
                      {JSON.stringify(endpoint.example, null, 2)}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurar Webhooks</CardTitle>
              <CardDescription>
                Receba notificações em tempo real quando eventos importantes acontecem
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold">URL do Webhook</h4>
                <div className="flex gap-2">
                  <input
                    type="url"
                    className="flex-1 px-3 py-2 border rounded-md"
                    placeholder="https://sua-aplicacao.com/webhook"
                  />
                  <Button>Salvar</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Eventos Disponíveis</h3>
            {webhookExamples.map((webhook, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <code className="text-sm font-medium">{webhook.event}</code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(JSON.stringify(webhook.payload, null, 2))}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardDescription>{webhook.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <h5 className="font-medium mb-2">Payload de Exemplo</h5>
                  <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
                    {JSON.stringify(webhook.payload, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="authentication" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Chave de API</CardTitle>
              <CardDescription>
                Use sua chave de API para autenticar suas requisições
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold">Sua Chave de API</h4>
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={apiKey}
                      readOnly
                      className="w-full px-3 py-2 border rounded-md bg-gray-50 font-mono text-sm"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(apiKey)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateNewApiKey}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <h5 className="font-medium text-yellow-800 mb-2">⚠️ Importante</h5>
                <p className="text-sm text-yellow-700">
                  Mantenha sua chave de API segura. Não a compartilhe publicamente ou a inclua 
                  em código front-end. Use sempre HTTPS em produção.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">Exemplo de Uso</h4>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
{`curl -X GET "https://sua-loja.com/api/products" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json"`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
