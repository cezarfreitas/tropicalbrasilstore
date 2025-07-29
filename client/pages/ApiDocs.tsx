import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Code, Copy, Eye, EyeOff, RefreshCw, Plus, Trash2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useApiKeys } from "@/hooks/use-api-keys";

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
              grade: "Grade Unissex",
              foto: "https://exemplo.com/chinelo-preto.jpg"
            },
            {
              cor: "Azul",
              preco: 29.90,
              grade: "Grade Unissex",
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
  },
  {
    method: "POST",
    endpoint: "/api/products/single",
    description: "Cadastrar produto individual com variante única",
    parameters: "Body: Produto com uma variante",
    example: {
      codigo: "SND002",
      nome: "Sandália Melissa",
      categoria: "Sandálias",
      tipo: "Feminino",
      descricao: "Sandália elegante",
      cor: "Rosa",
      preco: 199.90,
      grade: "Grade Feminina",
      foto: "https://exemplo.com/sandalia-rosa.jpg"
    }
  },
  {
    method: "GET",
    endpoint: "/api/products/{codigo}/variants",
    description: "Listar variantes de um produto específico",
    parameters: "codigo: Código do produto",
    example: [
      {
        id: 1,
        cor: "Preto",
        preco: 29.90,
        grade_id: 1,
        grade_nome: "Grade Unissex",
        foto: "url_da_foto",
        estoque_total: 240
      },
      {
        id: 2,
        cor: "Azul",
        preco: 29.90,
        grade_id: 1,
        grade_nome: "Grade Unissex",
        foto: "url_da_foto",
        estoque_total: 240
      }
    ]
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
  const { apiKeys, loading, createApiKey, revokeApiKey, regenerateApiKey } = useApiKeys();
  const [showKeys, setShowKeys] = useState<{ [keyId: string]: boolean }>({});
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyDescription, setNewKeyDescription] = useState("");
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "Texto copiado para a área de transferência.",
    });
  };

  const toggleShowKey = (keyId: string) => {
    setShowKeys(prev => ({ ...prev, [keyId]: !prev[keyId] }));
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe um nome para a chave de API.",
        variant: "destructive",
      });
      return;
    }

    const newKey = await createApiKey({
      name: newKeyName.trim(),
      description: newKeyDescription.trim() || undefined,
    });

    if (newKey) {
      setCreateDialogOpen(false);
      setNewKeyName("");
      setNewKeyDescription("");
      // Auto-show the new key
      setShowKeys(prev => ({ ...prev, [newKey.id]: true }));
    }
  };

  const handleRevokeKey = async (keyId: string, keyName: string) => {
    if (confirm(`Tem certeza que deseja revogar a chave "${keyName}"? Esta ação não pode ser desfeita.`)) {
      await revokeApiKey(keyId);
    }
  };

  const handleRegenerateKey = async (keyId: string, keyName: string) => {
    if (confirm(`Tem certeza que deseja regenerar a chave "${keyName}"? A chave atual será invalidada.`)) {
      const updatedKey = await regenerateApiKey(keyId);
      if (updatedKey) {
        // Auto-show the regenerated key
        setShowKeys(prev => ({ ...prev, [keyId]: true }));
      }
    }
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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="products">Cadastro de Produtos</TabsTrigger>
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="authentication">Autenticação</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API de Cadastro de Produtos</CardTitle>
              <CardDescription>
                Sistema automatizado para cadastro de produtos com variantes e grades
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Características Principais</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• <strong>Agrupamento por código:</strong> Produtos são agrupados por código único</li>
                  <li>• <strong>Variantes obrigatórias:</strong> Todo produto deve ter pelo menos uma variante (cor)</li>
                  <li>• <strong>Grades inteligentes:</strong> Apenas o nome da grade é necessário - os tamanhos são criados automaticamente baseado no padrão da grade</li>
                  <li>• <strong>Auto-cadastro:</strong> Categorias, tipos e cores são criados automaticamente se não existirem</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Estrutura do Produto</h4>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
{`{
  "codigo": "CHN001",              // Código único do produto (obrigatório)
  "nome": "Chinelo Havaianas Top", // Nome do produto (obrigatório)
  "categoria": "Chinelos",         // Categoria (criada automaticamente se não existir)
  "tipo": "Casual",               // Tipo (criado automaticamente se não existir)
  "descricao": "Descrição...",    // Descrição do produto (opcional)
  "variantes": [                  // Array de variantes (obrigatório, mín: 1)
    {
      "cor": "Preto",             // Cor (criada automaticamente se não existir)
      "preco": 29.90,             // Preço da variante (obrigatório)
      "grade": "Grade Unissex",   // Nome da grade (tamanhos criados automaticamente)
      "foto": "https://...",      // URL da foto (opcional)
      "sku": "CHN001-PRETO"       // SKU específico (opcional, gerado automaticamente)
    }
  ]
}`}
                </pre>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Regras de Negócio</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-blue-800 mb-2">✓ Comportamentos Automáticos</h5>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Criação automática de categorias</li>
                      <li>• Criação automática de tipos</li>
                      <li>• Criação automática de cores</li>
                      <li>• Geração automática de SKUs</li>
                      <li>• Criação de grades com tamanhos automáticos</li>
                    </ul>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-yellow-800 mb-2">⚠️ Validações</h5>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• Código deve ser único</li>
                      <li>• Mínimo 1 variante por produto</li>
                      <li>• Preço deve ser maior que 0</li>
                      <li>• Nome da grade é obrigatório</li>
                      <li>• Nome da cor não pode ser vazio</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Exemplo de Requisição Completa</h4>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
{`POST /api/products/bulk
Content-Type: application/json
Authorization: Bearer your_api_key

{
  "products": [
    {
      "codigo": "CHN001",
      "nome": "Chinelo Havaianas Top",
      "categoria": "Chinelos",
      "tipo": "Casual",
      "descricao": "O chinelo mais famoso do Brasil",
      "variantes": [
        {
          "cor": "Preto",
          "preco": 29.90,
          "grade": "Grade Unissex",
          "foto": "https://exemplo.com/chinelo-preto.jpg"
        },
        {
          "cor": "Azul Marinho",
          "preco": 29.90,
          "grade": "Grade Unissex",
          "foto": "https://exemplo.com/chinelo-azul.jpg"
        }
      ]
    },
    {
      "codigo": "SND001",
      "nome": "Sandália Feminina Elegante",
      "categoria": "Sandálias",
      "tipo": "Feminino",
      "descricao": "Sandália para ocasiões especiais",
      "variantes": [
        {
          "cor": "Nude",
          "preco": 89.90,
          "grade": "Grade Feminina"
        }
      ]
    }
  ]
}`}
                </pre>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Resposta de Sucesso</h4>
                <pre className="bg-green-50 p-4 rounded text-sm overflow-x-auto border border-green-200">
{`{
  "success": true,
  "message": "Produtos cadastrados com sucesso",
  "data": {
    "produtos_criados": 2,
    "variantes_criadas": 3,
    "categorias_criadas": ["Chinelos", "Sandálias"],
    "tipos_criados": ["Casual", "Feminino"],
    "cores_criadas": ["Preto", "Azul Marinho", "Nude"],
    "grades_criadas": ["Grade Unissex", "Grade Feminina"],
    "produtos": [
      {
        "id": 1,
        "codigo": "CHN001",
        "nome": "Chinelo Havaianas Top",
        "variantes": [
          { "id": 1, "cor": "Preto", "sku": "CHN001-PRETO" },
          { "id": 2, "cor": "Azul Marinho", "sku": "CHN001-AZUL-MARINHO" }
        ]
      },
      {
        "id": 2,
        "codigo": "SND001",
        "nome": "Sandália Feminina Elegante",
        "variantes": [
          { "id": 3, "cor": "Nude", "sku": "SND001-NUDE" }
        ]
      }
    ]
  }
}`}
                </pre>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Exemplos de Erro</h4>

                <div className="space-y-3">
                  <div>
                    <h5 className="font-medium text-red-700 mb-2">Código Duplicado (400)</h5>
                    <pre className="bg-red-50 p-4 rounded text-sm overflow-x-auto border border-red-200">
{`{
  "success": false,
  "error": "Código já existe",
  "message": "O produto com código 'CHN001' já está cadastrado",
  "code": "DUPLICATE_CODE"
}`}
                    </pre>
                  </div>

                  <div>
                    <h5 className="font-medium text-red-700 mb-2">Dados Inválidos (422)</h5>
                    <pre className="bg-red-50 p-4 rounded text-sm overflow-x-auto border border-red-200">
{`{
  "success": false,
  "error": "Dados inválidos",
  "message": "Validação falhou",
  "errors": [
    {
      "field": "produtos[0].variantes",
      "message": "Produto deve ter pelo menos uma variante"
    },
    {
      "field": "produtos[1].variantes[0].preco",
      "message": "Preço deve ser maior que 0"
    }
  ]
}`}
                    </pre>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h5 className="font-semibold text-blue-800 mb-2">💡 Dicas de Implementação</h5>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Use códigos alfanuméricos únicos para cada produto</li>
                  <li>• Use nomes de grades padronizados (ex: "Grade Feminina", "Grade Masculina", "Grade Infantil")</li>
                  <li>• Os tamanhos são criados automaticamente baseados no nome da grade informada</li>
                  <li>• Mantenha nomes de cores consistentes para evitar duplicatas</li>
                  <li>• Use URLs válidas para as fotos dos produtos</li>
                  <li>• Teste com poucos produtos antes de enviar grandes lotes</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

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
