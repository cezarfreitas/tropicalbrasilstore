import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Code,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  Plus,
  Trash2,
  AlertTriangle,
  Download,
  Activity,
  Clock,
  TrendingUp,
  Filter,
} from "lucide-react";
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
              preco: 29.9,
              grade: "Grade Unissex",
              foto: "https://exemplo.com/chinelo-preto.jpg",
            },
            {
              cor: "Azul",
              preco: 29.9,
              grade: "Grade Unissex",
              foto: "https://exemplo.com/chinelo-azul.jpg",
            },
          ],
        },
      ],
    },
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
      price: 29.9,
      category: "Chinelos",
      variants: 2,
    },
  },
  {
    method: "GET",
    endpoint: "/api/orders",
    description: "Listar pedidos",
    parameters: "?status=pending&customer_id=123",
    example: {
      id: 1,
      customer_id: 123,
      total: 89.9,
      status: "pending",
      items: [],
    },
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
      status: "approved",
    },
  },
  {
    method: "GET",
    endpoint: "/api/categories",
    description: "Listar categorias",
    parameters: "",
    example: {
      id: 1,
      name: "Chinelos",
      show_in_menu: true,
    },
  },
  {
    method: "GET",
    endpoint: "/api/colors",
    description: "Listar cores disponíveis",
    parameters: "",
    example: {
      id: 1,
      name: "Preto",
      hex_code: "#000000",
    },
  },
  {
    method: "GET",
    endpoint: "/api/grades",
    description: "Listar grades de tamanhos",
    parameters: "",
    example: {
      id: 1,
      name: "Grade Feminina",
      sizes: ["35", "36", "37", "38", "39", "40"],
    },
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
      preco: 199.9,
      grade: "Grade Feminina",
      foto: "https://exemplo.com/sandalia-rosa.jpg",
    },
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
        preco: 29.9,
        grade_id: 1,
        grade_nome: "Grade Unissex",
        foto: "url_da_foto",
        estoque_total: 240,
      },
      {
        id: 2,
        cor: "Azul",
        preco: 29.9,
        grade_id: 1,
        grade_nome: "Grade Unissex",
        foto: "url_da_foto",
        estoque_total: 240,
      },
    ],
  },
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
        total: 89.9,
        items: [],
      },
    },
  },
  {
    event: "customer.approved",
    description: "Disparado quando um cliente é aprovado",
    payload: {
      event: "customer.approved",
      data: {
        customer_id: 456,
        name: "João Silva",
        email: "joao@email.com",
      },
    },
  },
];

export default function ApiDocs() {
  const {
    apiKeys,
    loading,
    database,
    createApiKey,
    revokeApiKey,
    regenerateApiKey,
    exportJson,
  } = useApiKeys();
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
    setShowKeys((prev) => ({ ...prev, [keyId]: !prev[keyId] }));
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
      setShowKeys((prev) => ({ ...prev, [newKey.id]: true }));
    }
  };

  const handleRevokeKey = async (keyId: string, keyName: string) => {
    if (
      confirm(
        `Tem certeza que deseja revogar a chave "${keyName}"? Esta ação não pode ser desfeita.`,
      )
    ) {
      await revokeApiKey(keyId);
    }
  };

  const handleRegenerateKey = async (keyId: string, keyName: string) => {
    if (
      confirm(
        `Tem certeza que deseja regenerar a chave "${keyName}"? A chave atual será invalidada.`,
      )
    ) {
      const updatedKey = await regenerateApiKey(keyId);
      if (updatedKey) {
        // Auto-show the regenerated key
        setShowKeys((prev) => ({ ...prev, [keyId]: true }));
      }
    }
  };

  const downloadJsonFile = () => {
    const jsonData = exportJson();
    if (jsonData) {
      const blob = new Blob([jsonData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "api-keys-database.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Arquivo baixado",
        description: "O arquivo JSON foi baixado com sucesso.",
      });
    }
  };

  const MethodBadge = ({ method }: { method: string }) => {
    const colors = {
      GET: "bg-green-100 text-green-800",
      POST: "bg-blue-100 text-blue-800",
      PUT: "bg-yellow-100 text-yellow-800",
      DELETE: "bg-red-100 text-red-800",
    };

    return (
      <Badge
        className={
          colors[method as keyof typeof colors] || "bg-gray-100 text-gray-800"
        }
      >
        {method}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Documentação da API
        </h1>
        <p className="text-gray-600 mt-2">
          Gerencie e integre com a API da loja de chinelos
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="products">Cadastro de Produtos</TabsTrigger>
          <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="authentication">Autenticação</TabsTrigger>
          <TabsTrigger value="logs">Logs de API</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API de Cadastro de Produtos</CardTitle>
              <CardDescription>
                Sistema automatizado para cadastro de produtos com variantes e
                grades
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">
                  Características Principais
                </h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>
                    • <strong>Agrupamento por código:</strong> Produtos são
                    agrupados por código único
                  </li>
                  <li>
                    • <strong>Variantes obrigatórias:</strong> Todo produto deve
                    ter pelo menos uma variante (cor)
                  </li>
                  <li>
                    • <strong>Grades inteligentes:</strong> Apenas o nome da
                    grade é necessário - os tamanhos são criados automaticamente
                    baseado no padrão da grade
                  </li>
                  <li>
                    • <strong>Auto-cadastro:</strong> Categorias, tipos e cores
                    são criados automaticamente se não existirem
                  </li>
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
  "genero": "Unissex",             // Gênero (criado automaticamente se não existir)
  "descricao": "Descrição...",    // Descrição do produto (opcional)
  "preco_sugerido": 39.90,        // Preço sugerido de venda (opcional)
  "vender_infinito": false,       // Flag para venda sem controle de estoque (opcional)
  "tipo_estoque": "grade",        // "grade" ou "size" - Define o tipo de controle de estoque
  "variantes": [                  // Array de variantes (obrigatório, mín: 1)
    {
      "cor": "Preto",             // Cor (criada automaticamente se não existir)
      "preco": 29.90,             // Preço da variante (obrigatório)
      "grade": "Grade Unissex",   // Nome da grade (tamanhos criados automaticamente)
      "foto": "https://...",      // URL da foto (opcional)
      "sku": "CHN001-PRETO",      // SKU específico (opcional, gerado automaticamente)
      "estoque_grade": 25,        // Quantidade fixa para estoque por grade (se tipo_estoque = "grade")
      "estoque_tamanhos": {       // Estoque individual por tamanho (se tipo_estoque = "size")
        "37": 5,
        "38": 8,
        "39": 3
      }
    }
  ]
}`}
                </pre>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Tipos de Controle de Estoque</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h5 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                      🎯 Estoque por Grade
                    </h5>
                    <p className="text-sm text-blue-700 mb-2">
                      <code>"tipo_estoque": "grade"</code>
                    </p>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Quantidade fixa por grade/cor</li>
                      <li>• Independente dos tamanhos individuais</li>
                      <li>• Exemplo: 25 pares no total</li>
                      <li>• Use "estoque_grade" na variante</li>
                    </ul>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h5 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                      📏 Estoque por Tamanho
                    </h5>
                    <p className="text-sm text-green-700 mb-2">
                      <code>"tipo_estoque": "size"</code>
                    </p>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Quantidade específica por tamanho/cor</li>
                      <li>• Controle granular por variante</li>
                      <li>• Exemplo: 5 tam 38, 3 tam 39</li>
                      <li>• Use "estoque_tamanhos" na variante</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Regras de Negócio</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-blue-800 mb-2">
                      ✓ Comportamentos Automáticos
                    </h5>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Criação automática de categorias</li>
                      <li>• Criação automática de tipos</li>
                      <li>• Criação automática de gêneros</li>
                      <li>• Criação automática de cores</li>
                      <li>• Geração automática de SKUs</li>
                      <li>• Criação de grades com tamanhos automáticos</li>
                      <li>• Criação de variantes físicas para cada cor</li>
                    </ul>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-yellow-800 mb-2">
                      ⚠️ Validações
                    </h5>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• C��digo deve ser ��nico</li>
                      <li>• Mínimo 1 variante por produto</li>
                      <li>• Preço deve ser maior que 0</li>
                      <li>• Nome da grade é obrigatório</li>
                      <li>• Nome da cor não pode ser vazio</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-semibold">
                  Exemplo de Requisição Completa
                </h4>
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
      "genero": "Unissex",
      "descricao": "O chinelo mais famoso do Brasil",
      "preco_sugerido": 39.90,
      "vender_infinito": true,
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
      "categoria": "Sand��lias",
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
                    <h5 className="font-medium text-red-700 mb-2">
                      Código Duplicado (400)
                    </h5>
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
                    <h5 className="font-medium text-red-700 mb-2">
                      Dados Inválidos (422)
                    </h5>
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
                <h5 className="font-semibold text-blue-800 mb-2">
                  💡 Dicas de Implementação
                </h5>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Use códigos alfanuméricos únicos para cada produto</li>
                  <li>
                    • Use nomes de grades padronizados (ex: "Grade Feminina",
                    "Grade Masculina", "Grade Infantil")
                  </li>
                  <li>
                    • Os tamanhos são criados automaticamente baseados no nome
                    da grade informada
                  </li>
                  <li>
                    • Mantenha nomes de cores consistentes para evitar
                    duplicatas
                  </li>
                  <li>• Use URLs válidas para as fotos dos produtos</li>
                  <li>
                    • Teste com poucos produtos antes de enviar grandes lotes
                  </li>
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
                      onClick={() =>
                        copyToClipboard(
                          `${endpoint.method} ${endpoint.endpoint}`,
                        )
                      }
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
                Receba notificações em tempo real quando eventos importantes
                acontecem
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
                      onClick={() =>
                        copyToClipboard(
                          JSON.stringify(webhook.payload, null, 2),
                        )
                      }
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
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Chaves de API</CardTitle>
                  <CardDescription>
                    Gerencie suas chaves de API para autenticar requisições
                  </CardDescription>
                </div>
                <Dialog
                  open={createDialogOpen}
                  onOpenChange={setCreateDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Chave
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Criar Nova Chave de API</DialogTitle>
                      <DialogDescription>
                        Crie uma nova chave de API para autenticar suas
                        requisições.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="key-name">Nome da Chave</Label>
                        <Input
                          id="key-name"
                          placeholder="Ex: Integração Mobile"
                          value={newKeyName}
                          onChange={(e) => setNewKeyName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="key-description">
                          Descrição (Opcional)
                        </Label>
                        <Input
                          id="key-description"
                          placeholder="Para que será usada esta chave?"
                          value={newKeyDescription}
                          onChange={(e) => setNewKeyDescription(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setCreateDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button onClick={handleCreateKey}>Criar Chave</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {database && (
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-green-700">
                        <Code className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          Arquivo JSON Ativo
                        </span>
                      </div>
                      <p className="text-sm text-green-600 mt-1">
                        Chaves salvas em:{" "}
                        <code className="bg-green-100 px-1 rounded">
                          api-keys-database.json
                        </code>
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        Versão: {database.version} • Atualizado:{" "}
                        {new Date(database.updated_at).toLocaleString("pt-BR")}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const jsonData = exportJson();
                          if (jsonData) {
                            copyToClipboard(jsonData);
                            toast({
                              title: "JSON Copiado",
                              description:
                                "Estrutura completa do arquivo JSON copiada para área de transferência.",
                            });
                          }
                        }}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copiar JSON
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={downloadJsonFile}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Baixar JSON
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mr-3"></div>
                  <span>Carregando chaves...</span>
                </div>
              ) : apiKeys.length === 0 ? (
                <div className="text-center py-8">
                  <Code className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Nenhuma chave de API
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Crie sua primeira chave de API para começar a usar a
                    integração.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {apiKeys.map((key) => (
                    <div
                      key={key.id}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">{key.name}</h4>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>
                              Criada em{" "}
                              {new Date(key.created_at).toLocaleDateString(
                                "pt-BR",
                              )}
                            </span>
                            {key.last_used && (
                              <>
                                <span>•</span>
                                <span>
                                  Último uso:{" "}
                                  {new Date(key.last_used).toLocaleDateString(
                                    "pt-BR",
                                  )}
                                </span>
                              </>
                            )}
                            <Badge
                              variant={
                                key.status === "active"
                                  ? "default"
                                  : "destructive"
                              }
                              className="ml-2"
                            >
                              {key.status === "active" ? "Ativa" : "Revogada"}
                            </Badge>
                          </div>
                        </div>
                        {key.status === "active" && (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleRegenerateKey(key.id, key.name)
                              }
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRevokeKey(key.id, key.name)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>

                      {key.status === "active" && (
                        <div className="space-y-2">
                          <h5 className="font-medium text-sm">Chave de API</h5>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 relative">
                              <input
                                type={showKeys[key.id] ? "text" : "password"}
                                value={key.key}
                                readOnly
                                className="w-full px-3 py-2 border rounded-md bg-gray-50 font-mono text-sm"
                              />
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleShowKey(key.id)}
                            >
                              {showKeys[key.id] ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(key.key)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {key.status === "revoked" && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-3">
                          <div className="flex items-center gap-2 text-red-700">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="text-sm font-medium">
                              Esta chave foi revogada e não pode mais ser usada
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <h5 className="font-medium text-yellow-800 mb-2">
                  ⚠️ Importante
                </h5>
                <p className="text-sm text-yellow-700">
                  Mantenha suas chaves de API seguras. Não as compartilhe
                  publicamente ou as inclua em c��digo front-end. Use sempre
                  HTTPS em produção.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">Exemplo de Uso</h4>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
                  {`curl -X GET "https://sua-loja.com/api/products" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`}
                </pre>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <h5 className="font-medium text-green-800 mb-2">
                  🚀 APIs Implementadas
                </h5>
                <p className="text-sm text-green-600">
                  As APIs de cadastro de produtos estão funcionais e
                  implementadas no backend! Use suas chaves de API para testar
                  os endpoints <code>/api/products/bulk</code> e
                  <code>/api/products/single</code>. A autenticação por Bearer
                  token está ativa.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h5 className="font-medium text-blue-800 mb-2">
                  💾 Sistema de Persistência
                </h5>
                <p className="text-sm text-blue-600">
                  As chaves de API são salvas automaticamente em um arquivo JSON
                  estruturado no localStorage. Todas as operações (criar,
                  revogar, regenerar) são persistidas imediatamente. Use o botão
                  "Exportar JSON" para ver a estrutura completa dos dados.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <ApiLogsInterface />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Componente para interface de logs da API
function ApiLogsInterface() {
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    method: "",
    endpoint: "",
    status: "",
    from_date: "",
    to_date: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Carregar logs
  const fetchLogs = async (page = 1) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v)),
      });

      const response = await fetch(`/api/admin/logs?${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error("Erro ao carregar logs:", error);
    }
    setLoading(false);
  };

  // Carregar estatísticas
  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/logs/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, []);

  // Aplicar filtros
  const applyFilters = () => {
    setCurrentPage(1);
    fetchLogs(1);
  };

  // Limpar filtros
  const clearFilters = () => {
    setFilters({
      method: "",
      endpoint: "",
      status: "",
      from_date: "",
      to_date: "",
    });
    setCurrentPage(1);
    fetchLogs(1);
  };

  // Formatar status
  const getStatusBadge = (status: number) => {
    if (status >= 200 && status < 300) {
      return <Badge className="bg-green-500">Sucesso</Badge>;
    } else if (status >= 400 && status < 500) {
      return <Badge variant="destructive">Erro Cliente</Badge>;
    } else if (status >= 500) {
      return <Badge variant="destructive">Erro Servidor</Badge>;
    }
    return <Badge variant="secondary">{status}</Badge>;
  };

  // Formatar método HTTP
  const getMethodBadge = (method: string) => {
    const colors: any = {
      GET: "bg-blue-500",
      POST: "bg-green-500",
      PUT: "bg-yellow-500",
      DELETE: "bg-red-500",
    };
    return <Badge className={colors[method] || "bg-gray-500"}>{method}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Requisições
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.overview.total_requests}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Taxa de Sucesso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.overview.total_requests > 0
                  ? Math.round(
                      (stats.overview.success_requests /
                        stats.overview.total_requests) *
                        100,
                    )
                  : 0}
                %
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.overview.avg_response_time
                  ? Math.round(stats.overview.avg_response_time)
                  : 0}
                ms
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Erros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.overview.error_requests}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Logs de Requisições API
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchLogs(currentPage)}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </div>
        </CardHeader>

        {showFilters && (
          <CardContent className="border-t">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
              <div>
                <Label htmlFor="method">Método</Label>
                <select
                  id="method"
                  className="w-full px-3 py-2 border rounded-md"
                  value={filters.method}
                  onChange={(e) =>
                    setFilters({ ...filters, method: e.target.value })
                  }
                >
                  <option value="">Todos</option>
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>

              <div>
                <Label htmlFor="endpoint">Endpoint</Label>
                <Input
                  id="endpoint"
                  placeholder="/admin/..."
                  value={filters.endpoint}
                  onChange={(e) =>
                    setFilters({ ...filters, endpoint: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  className="w-full px-3 py-2 border rounded-md"
                  value={filters.status}
                  onChange={(e) =>
                    setFilters({ ...filters, status: e.target.value })
                  }
                >
                  <option value="">Todos</option>
                  <option value="200">200 - OK</option>
                  <option value="400">400 - Bad Request</option>
                  <option value="401">401 - Unauthorized</option>
                  <option value="404">404 - Not Found</option>
                  <option value="500">500 - Server Error</option>
                </select>
              </div>

              <div>
                <Label htmlFor="from_date">Data Inicial</Label>
                <Input
                  id="from_date"
                  type="datetime-local"
                  value={filters.from_date}
                  onChange={(e) =>
                    setFilters({ ...filters, from_date: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="to_date">Data Final</Label>
                <Input
                  id="to_date"
                  type="datetime-local"
                  value={filters.to_date}
                  onChange={(e) =>
                    setFilters({ ...filters, to_date: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={applyFilters}>Aplicar Filtros</Button>
              <Button variant="outline" onClick={clearFilters}>
                Limpar
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Lista de Logs */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mr-3"></div>
              <span>Carregando logs...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhum log encontrado
              </h3>
              <p className="text-gray-600">
                Não há registros de requisições com os filtros aplicados.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {logs.map((log: any) => (
                <div key={log.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {getMethodBadge(log.method)}
                      <span className="font-mono text-sm">{log.endpoint}</span>
                      {getStatusBadge(log.response_status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {log.response_time_ms}ms
                      </div>
                      <span>
                        {new Date(log.created_at).toLocaleString("pt-BR")}
                      </span>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium">IP:</span>{" "}
                        {log.ip_address}
                      </div>
                      <div className="truncate">
                        <span className="font-medium">User Agent:</span>{" "}
                        {log.user_agent}
                      </div>
                    </div>

                    {log.error_message && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700">
                        <span className="font-medium">Erro:</span>{" "}
                        {log.error_message}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paginação */}
      <div className="flex justify-center gap-2">
        <Button
          variant="outline"
          onClick={() => fetchLogs(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          Anterior
        </Button>
        <span className="flex items-center px-4">Página {currentPage}</span>
        <Button
          variant="outline"
          onClick={() => fetchLogs(currentPage + 1)}
          disabled={logs.length < 20}
        >
          Próxima
        </Button>
      </div>
    </div>
  );
}
