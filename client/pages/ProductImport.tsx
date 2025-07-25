import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  FileText,
  Download,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Play,
  Pause,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImportRow {
  row: number;
  data: Record<string, any>;
  status: "pending" | "processing" | "success" | "error";
  error?: string;
  productId?: number;
}

interface ImportProgress {
  total: number;
  processed: number;
  success: number;
  errors: number;
  current?: string;
}

interface ColumnMapping {
  csvColumn: string;
  targetField: string;
  required: boolean;
}

const REQUIRED_FIELDS = [
  { key: "name", label: "Nome do Produto", required: true },
  { key: "category_id", label: "Categoria", required: true },
  { key: "base_price", label: "Preço Base", required: true },
  { key: "sale_price", label: "Preço de Venda", required: false },
  { key: "photo_url", label: "URL da Foto", required: false },
  { key: "size_group_id", label: "Grupo de Tamanhos", required: true },
  { key: "color", label: "Cor (uma por linha)", required: true },
  { key: "sku", label: "SKU", required: false },
  { key: "parent_sku", label: "SKU Pai", required: false },
  { key: "description", label: "Descrição", required: false },
  { key: "suggested_price", label: "Preço Sugerido", required: false },
  { key: "stock_per_variant", label: "Estoque por Variante", required: false },
];

export default function ProductImport() {
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [importData, setImportData] = useState<ImportRow[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgress>({
    total: 0,
    processed: 0,
    success: 0,
    errors: 0,
  });
  const [showPreview, setShowPreview] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [sizeGroups, setSizeGroups] = useState<any[]>([]);
  const [colors, setColors] = useState<any[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [productCount, setProductCount] = useState<number>(0);
  const [exportStats, setExportStats] = useState<{
    total_products: number;
    active_products: number;
    inactive_products: number;
  }>({
    total_products: 0,
    active_products: 0,
    inactive_products: 0,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Fetch required data
  useEffect(() => {
    fetchCategories();
    fetchSizeGroups();
    fetchColors();
    fetchProductCount();
    fetchExportStats();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchSizeGroups = async () => {
    try {
      const response = await fetch("/api/size-groups");
      if (response.ok) {
        const data = await response.json();
        setSizeGroups(data);
      }
    } catch (error) {
      console.error("Error fetching size groups:", error);
    }
  };

  const fetchColors = async () => {
    try {
      const response = await fetch("/api/colors");
      if (response.ok) {
        const data = await response.json();
        setColors(data);
      }
    } catch (error) {
      console.error("Error fetching colors:", error);
    }
  };

  const fetchProductCount = async () => {
    try {
      const response = await fetch("/api/products-enhanced?page=1&limit=1");
      if (response.ok) {
        const data = await response.json();
        setProductCount(data.pagination?.totalProducts || 0);
      }
    } catch (error) {
      console.error("Error fetching product count:", error);
    }
  };

  const fetchExportStats = async () => {
    try {
      const response = await fetch("/api/import/export-stats");
      if (response.ok) {
        const data = await response.json();
        setExportStats(data);
      }
    } catch (error) {
      console.error("Error fetching export stats:", error);
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    if (
      !uploadedFile.name.endsWith(".csv") &&
      !uploadedFile.name.endsWith(".xlsx")
    ) {
      toast({
        title: "Formato Inválido",
        description: "Por favor, selecione um arquivo CSV ou Excel (.xlsx)",
        variant: "destructive",
      });
      return;
    }

    setFile(uploadedFile);

    try {
      const formData = new FormData();
      formData.append("file", uploadedFile);

      const response = await fetch("/api/import/parse-csv", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setCsvData(result.data);
        setCsvHeaders(result.headers);

        // Auto-map columns based on header names
        const autoMappings: ColumnMapping[] = REQUIRED_FIELDS.map((field) => ({
          csvColumn: autoMapColumn(result.headers, field.key),
          targetField: field.key,
          required: field.required,
        }));
        setColumnMappings(autoMappings);

        toast({
          title: "Arquivo Processado",
          description: `${result.data.length} linhas encontradas`,
        });
      } else {
        throw new Error("Erro ao processar arquivo");
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível processar o arquivo",
        variant: "destructive",
      });
    }
  };

  const autoMapColumn = (headers: string[], targetField: string): string => {
    const commonMappings: Record<string, string[]> = {
      name: ["nome", "produto", "name", "product_name"],
      category_id: ["categoria", "category", "category_id", "cat"],
      base_price: ["preco_base", "base_price", "preco_custo", "cost_price"],
      sale_price: ["preco_venda", "sale_price", "preco", "price", "valor"],
      photo_url: ["foto", "photo", "photo_url", "imagem", "image"],
      size_group_id: ["grupo_tamanho", "size_group", "tamanhos", "sizes"],
      color: ["cor", "color", "cores", "colors"],
      sku: ["sku", "codigo"],
      description: ["descricao", "description", "desc"],
      stock_per_variant: ["estoque", "stock", "quantity", "qtd"],
    };

    const possibleHeaders = commonMappings[targetField] || [];
    const normalizedHeaders = headers.map((h) => h.toLowerCase().trim());

    for (const possible of possibleHeaders) {
      const index = normalizedHeaders.findIndex((h) =>
        h.includes(possible.toLowerCase()),
      );
      if (index !== -1) {
        return headers[index];
      }
    }

    return "";
  };

  const validateMappings = (): boolean => {
    const requiredMappings = columnMappings.filter((m) => m.required);
    const missingMappings = requiredMappings.filter((m) => !m.csvColumn);

    if (missingMappings.length > 0) {
      toast({
        title: "Mapeamento Incompleto",
        description: `Campos obrigatórios sem mapeamento: ${missingMappings.map((m) => m.targetField).join(", ")}`,
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const generatePreview = () => {
    if (!validateMappings()) return;

    const preview: ImportRow[] = csvData.slice(0, 10).map((row, index) => {
      const mappedData: Record<string, any> = {};

      columnMappings.forEach((mapping) => {
        if (mapping.csvColumn && mapping.csvColumn in row) {
          mappedData[mapping.targetField] = row[mapping.csvColumn];
        }
      });

      return {
        row: index + 1,
        data: mappedData,
        status: "pending" as const,
      };
    });

    setImportData(preview);
    setShowPreview(true);
  };

  const startImport = async () => {
    if (!validateMappings()) return;

    setIsImporting(true);
    setImportProgress({
      total: csvData.length,
      processed: 0,
      success: 0,
      errors: 0,
    });

    const fullImportData: ImportRow[] = csvData.map((row, index) => {
      const mappedData: Record<string, any> = {};

      columnMappings.forEach((mapping) => {
        if (mapping.csvColumn && mapping.csvColumn in row) {
          mappedData[mapping.targetField] = row[mapping.csvColumn];
        }
      });

      return {
        row: index + 1,
        data: mappedData,
        status: "pending" as const,
      };
    });

    setImportData(fullImportData);

    try {
      const response = await fetch("/api/import/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: fullImportData.map((item) => item.data),
          columnMappings,
        }),
      });

      if (response.ok) {
        // Start polling for progress
        pollImportProgress();
      } else {
        throw new Error("Erro ao iniciar importação");
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível iniciar a importação",
        variant: "destructive",
      });
      setIsImporting(false);
    }
  };

  const pollImportProgress = async () => {
    try {
      const response = await fetch("/api/import/progress");
      if (response.ok) {
        const progress = await response.json();
        setImportProgress(progress);

        if (progress.processed < progress.total) {
          setTimeout(pollImportProgress, 1000);
        } else {
          setIsImporting(false);
          toast({
            title: "Importação Concluída",
            description: `${progress.success} produtos importados com sucesso, ${progress.errors} erros`,
          });
        }
      }
    } catch (error) {
      console.error("Error polling progress:", error);
    }
  };

  const downloadTemplate = () => {
    const headers = REQUIRED_FIELDS.map((f) => f.label);
    const sampleRows = [
      [
        "Chinelo Havaianas Top",
        "1",
        "18.50",
        "25.90",
        "https://example.com/havaianas-top.jpg",
        "1",
        "azul",
        "HAV001-AZUL",
        "HAV001",
        "Chinelo clássico Havaianas Top",
        "35.90",
        "100",
      ],
      [
        "Chinelo Havaianas Top",
        "1",
        "18.50",
        "25.90",
        "https://example.com/havaianas-top.jpg",
        "1",
        "branco",
        "HAV001-BRANCO",
        "HAV001",
        "Chinelo clássico Havaianas Top",
        "35.90",
        "100",
      ],
      [
        "Chinelo Havaianas Top",
        "1",
        "18.50",
        "25.90",
        "https://example.com/havaianas-top.jpg",
        "1",
        "preto",
        "HAV001-PRETO",
        "HAV001",
        "Chinelo clássico Havaianas Top",
        "35.90",
        "100",
      ],
    ];

    const csvContent =
      headers.join(",") +
      "\n" +
      sampleRows.map((row) => row.join(",")).join("\n") +
      "\n";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template_importacao_produtos.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportProducts = async (filter: string = "all") => {
    setIsExporting(true);
    try {
      toast({
        title: "Preparando Exportação",
        description: "Gerando arquivo de produtos...",
      });

      const response = await fetch(
        `/api/import/export-products?filter=${filter}`,
      );

      if (response.ok) {
        // Create download link
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const filterSuffix =
          filter === "active"
            ? "_ativos"
            : filter === "inactive"
              ? "_inativos"
              : "";
        a.download = `produtos_exportados${filterSuffix}_${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

        toast({
          title: "Exportação Concluída",
          description: `Arquivo de produtos ${
            filter === "active"
              ? "ativos"
              : filter === "inactive"
                ? "inativos"
                : "todos"
          } baixado com sucesso`,
        });
      } else {
        throw new Error("Erro ao exportar produtos");
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível exportar os produtos",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const resetImport = () => {
    setFile(null);
    setCsvData([]);
    setCsvHeaders([]);
    setColumnMappings([]);
    setImportData([]);
    setIsImporting(false);
    setShowPreview(false);
    setImportProgress({
      total: 0,
      processed: 0,
      success: 0,
      errors: 0,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Importação de Produtos
          </h1>
          <p className="text-muted-foreground">
            Importe produtos em massa com upload automático de fotos
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Baixar Template
          </Button>
          <Button variant="outline" onClick={exportProducts}>
            <Download className="h-4 w-4 mr-2" />
            Exportar Produtos
          </Button>
          <Button variant="outline" onClick={resetImport}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reiniciar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="export" className="space-y-4">
        <TabsList>
          <TabsTrigger value="export">Exportação</TabsTrigger>
          <TabsTrigger value="upload">1. Upload do Arquivo</TabsTrigger>
          <TabsTrigger value="mapping" disabled={!csvHeaders.length}>
            2. Mapeamento de Colunas
          </TabsTrigger>
          <TabsTrigger value="import" disabled={!columnMappings.length}>
            3. Importação
          </TabsTrigger>
        </TabsList>

        <TabsContent value="export">
          <Card>
            <CardHeader>
              <CardTitle>Exportar Produtos Existentes</CardTitle>
              <p className="text-sm text-muted-foreground">
                Exporte todos os produtos cadastrados para um arquivo CSV
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">
                    Informações Incluídas na Exportação:
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Nome do produto e descrição
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Categoria e grupo de tamanhos
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Preços (base, venda, sugerido)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      SKU e código pai
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      URLs das fotos dos produtos
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Cores disponíveis
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Estoque médio por variante
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Casos de Uso:</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Backup completo dos produtos</li>
                    <li>• Edição em massa no Excel</li>
                    <li>• Migração para outro sistema</li>
                    <li>• Análise de dados de produtos</li>
                    <li>• Compartilhamento de cat��logo</li>
                    <li>• Importação em outro ambiente</li>
                  </ul>
                </div>
              </div>

              <div className="border-t pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">Todos os Produtos</h4>
                        <p className="text-sm text-muted-foreground">
                          {exportStats.total_products > 0
                            ? `${exportStats.total_products} produtos`
                            : "Todos os produtos"}{" "}
                          (ativos e inativos)
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => exportProducts("all")}
                      className="w-full"
                      disabled={isExporting}
                    >
                      {isExporting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      {isExporting ? "Exportando..." : "Exportar Todos"}
                    </Button>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">
                          Apenas Produtos Ativos
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {exportStats.active_products > 0
                            ? `${exportStats.active_products} produtos ativos`
                            : "Somente produtos disponíveis"}{" "}
                          na loja
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => exportProducts("active")}
                      variant="outline"
                      className="w-full"
                      disabled={isExporting}
                    >
                      {isExporting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      {isExporting ? "Exportando..." : "Exportar Ativos"}
                    </Button>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">
                          Apenas Produtos Inativos
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {exportStats.inactive_products > 0
                            ? `${exportStats.inactive_products} produtos inativos`
                            : "Produtos desabilitados"}{" "}
                          no sistema
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => exportProducts("inactive")}
                      variant="secondary"
                      className="w-full"
                      disabled={
                        isExporting || exportStats.inactive_products === 0
                      }
                    >
                      {isExporting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      {isExporting ? "Exportando..." : "Exportar Inativos"}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <h5 className="font-medium text-amber-900">
                      Dicas para Exportação
                    </h5>
                    <ul className="text-sm text-amber-800 mt-2 space-y-1">
                      <li>
                        • O arquivo exportado pode ser editado e re-importado
                      </li>
                      <li>• URLs das fotos são geradas automaticamente</li>
                      <li>• Formato compatível com Excel e Google Sheets</li>
                      <li>• Codificação UTF-8 para caracteres especiais</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle>Upload do Arquivo CSV/Excel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">
                    Selecione um arquivo CSV ou Excel
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Arquivo deve conter colunas para nome, categoria, preço,
                    fotos e variantes
                  </p>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx"
                    onChange={handleFileUpload}
                    className="max-w-sm mx-auto"
                  />
                </div>
              </div>

              {file && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">{file.name}</p>
                      <p className="text-sm text-green-700">
                        {csvData.length} linhas encontradas
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">
                    Formato Esperado:
                  </h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>
                      • <strong>Nome:</strong> Nome do produto
                    </li>
                    <li>
                      • <strong>Categoria:</strong> ID ou nome da categoria
                    </li>
                    <li>
                      • <strong>Preço Base:</strong> Preço de custo/base do
                      produto
                    </li>
                    <li>
                      • <strong>Preço de Venda:</strong> Preço final de venda ao
                      cliente
                    </li>
                    <li>
                      • <strong>URL da Foto:</strong> Link direto para imagem
                    </li>
                    <li>
                      • <strong>Grupo de Tamanhos:</strong> ID do grupo (ex:
                      1=Feminino, 2=Masculino)
                    </li>
                    <li>
                      • <strong>Cor:</strong> Uma cor por linha (repita produto
                      para cada cor)
                    </li>
                    <li>
                      • <strong>Estoque:</strong> Quantidade por variante
                      (opcional)
                    </li>
                  </ul>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-amber-900 mb-2">
                        ⚠️ Novo Formato: Uma Cor Por Linha
                      </h5>
                      <div className="text-sm text-amber-800 space-y-2">
                        <p>
                          <strong>
                            Agora cada cor deve ser uma linha separada!
                          </strong>
                        </p>
                        <p>
                          Se um produto tem 3 cores, você deve criar 3 linhas
                          com as mesmas informações do produto, mudando apenas a
                          cor e opcionalmente o SKU.
                        </p>
                        <p className="font-medium">Exemplo:</p>
                        <div className="bg-white/50 rounded p-2 text-xs font-mono">
                          Havaianas Top,1,18.50,25.90,...,azul,HAV001-AZUL
                          <br />
                          Havaianas Top,1,18.50,25.90,...,branco,HAV001-BRANCO
                          <br />
                          Havaianas Top,1,18.50,25.90,...,preto,HAV001-PRETO
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mapping">
          <Card>
            <CardHeader>
              <CardTitle>Mapeamento de Colunas</CardTitle>
              <p className="text-sm text-muted-foreground">
                Relacione as colunas do seu arquivo com os campos do sistema
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {REQUIRED_FIELDS.map((field, index) => (
                  <div key={field.key} className="flex items-center gap-4">
                    <div className="w-48">
                      <Label className="text-sm font-medium">
                        {field.label}
                        {field.required && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </Label>
                    </div>
                    <Select
                      value={columnMappings[index]?.csvColumn || ""}
                      onValueChange={(value) => {
                        const newMappings = [...columnMappings];
                        newMappings[index] = {
                          ...newMappings[index],
                          csvColumn: value,
                        };
                        setColumnMappings(newMappings);
                      }}
                    >
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="Selecione uma coluna" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Nenhuma</SelectItem>
                        {csvHeaders.map((header) => (
                          <SelectItem key={header} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mt-6">
                <Button onClick={generatePreview}>
                  <Eye className="h-4 w-4 mr-2" />
                  Visualizar Dados
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import">
          <Card>
            <CardHeader>
              <CardTitle>Importação dos Produtos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isImporting && importData.length === 0 && (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
                  <h3 className="text-lg font-semibold mb-2">
                    Pronto para Importar
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {csvData.length} produtos serão processados
                  </p>
                  <Button onClick={startImport} size="lg">
                    <Play className="h-5 w-5 mr-2" />
                    Iniciar Importação
                  </Button>
                </div>
              )}

              {isImporting && (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Progresso da Importação</span>
                      <span>
                        {importProgress.processed} / {importProgress.total}
                      </span>
                    </div>
                    <Progress
                      value={
                        (importProgress.processed / importProgress.total) * 100
                      }
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                      <div className="text-2xl font-bold text-green-700">
                        {importProgress.success}
                      </div>
                      <div className="text-sm text-green-600">Sucessos</div>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg">
                      <XCircle className="h-8 w-8 mx-auto mb-2 text-red-600" />
                      <div className="text-2xl font-bold text-red-700">
                        {importProgress.errors}
                      </div>
                      <div className="text-sm text-red-600">Erros</div>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <Loader2 className="h-8 w-8 mx-auto mb-2 text-blue-600 animate-spin" />
                      <div className="text-2xl font-bold text-blue-700">
                        {importProgress.total - importProgress.processed}
                      </div>
                      <div className="text-sm text-blue-600">Restantes</div>
                    </div>
                  </div>

                  {importProgress.current && (
                    <div className="text-center text-sm text-muted-foreground">
                      Processando: {importProgress.current}
                    </div>
                  )}
                </div>
              )}

              {importData.length > 0 && !isImporting && (
                <div className="space-y-4">
                  <h4 className="font-semibold">Resultados da Importação</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Linha</TableHead>
                        <TableHead>Produto</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Erro</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importData.slice(0, 50).map((item) => (
                        <TableRow key={item.row}>
                          <TableCell>{item.row}</TableCell>
                          <TableCell>{item.data.name}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                item.status === "success"
                                  ? "default"
                                  : item.status === "error"
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {item.status === "success" && "Sucesso"}
                              {item.status === "error" && "Erro"}
                              {item.status === "pending" && "Pendente"}
                              {item.status === "processing" && "Processando"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {item.error && (
                              <span className="text-sm text-red-600">
                                {item.error}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview dos Dados</DialogTitle>
            <DialogDescription>
              Primeiras 10 linhas mapeadas do arquivo
            </DialogDescription>
          </DialogHeader>

          {importData.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Linha</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Preço Base</TableHead>
                  <TableHead>Preço Venda</TableHead>
                  <TableHead>Foto</TableHead>
                  <TableHead>Cor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {importData.map((item) => (
                  <TableRow key={item.row}>
                    <TableCell>{item.row}</TableCell>
                    <TableCell>{item.data.name}</TableCell>
                    <TableCell>{item.data.category_id}</TableCell>
                    <TableCell>{item.data.base_price}</TableCell>
                    <TableCell>{item.data.sale_price}</TableCell>
                    <TableCell>
                      {item.data.photo_url && (
                        <a
                          href={item.data.photo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-xs"
                        >
                          Ver foto
                        </a>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">{item.data.color}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
