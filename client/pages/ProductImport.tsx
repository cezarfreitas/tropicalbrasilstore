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
  errorDetails?: Array<{
    row: number;
    productName: string;
    error: string;
  }>;
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
  { key: "brand_id", label: "Marca (ID)", required: false },
  { key: "gender_id", label: "Gênero (ID)", required: false },
  { key: "type_id", label: "Tipo de Produto (ID)", required: false },
  { key: "stock_type", label: "Tipo de Estoque (grade/size)", required: false },
  { key: "grade_stock", label: "Estoque por Grade", required: false },
  { key: "size_37", label: "Estoque Tam 37", required: false },
  { key: "size_38", label: "Estoque Tam 38", required: false },
  { key: "size_39", label: "Estoque Tam 39", required: false },
  { key: "size_40", label: "Estoque Tam 40", required: false },
  { key: "size_41", label: "Estoque Tam 41", required: false },
  { key: "size_42", label: "Estoque Tam 42", required: false },
  { key: "size_43", label: "Estoque Tam 43", required: false },
  { key: "size_44", label: "Estoque Tam 44", required: false },
  { key: "variant_sku", label: "SKU da Variante de Cor", required: false },
  { key: "color_price", label: "Preço Específico da Cor", required: false },
  { key: "color_sale_price", label: "Preço Promocional da Cor", required: false },
  { key: "color_image_url", label: "Imagem da Variante de Cor", required: false },
  { key: "sell_without_stock", label: "Vender Sem Estoque (0/1)", required: false },
  { key: "stock_per_variant", label: "Estoque por Variante (DEPRECATED)", required: false },
];

// Custom fetch function to avoid conflicts with external libraries
const customFetch = async (url: string, options?: RequestInit): Promise<Response> => {
  try {
    // Use native fetch directly without any modifications
    const response = await window.fetch(url, {
      ...options,
      credentials: 'same-origin'
    });
    return response;
  } catch (error) {
    console.error(`Network error for ${url}:`, error);
    throw error;
  }
};

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
    const fetchData = async () => {
      try {
        console.log("Starting to fetch data...");
        await Promise.allSettled([
          fetchCategories(),
          fetchSizeGroups(),
          fetchColors(),
          fetchProductCount(),
          fetchExportStats()
        ]);
        console.log("All data fetching completed");
      } catch (error) {
        console.error("Error in useEffect:", error);
      }
    };

    fetchData();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await customFetch("/api/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      } else {
        console.error("Error response from categories:", response.status, response.statusText);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
    }
  };

  const fetchSizeGroups = async () => {
    try {
      const response = await customFetch("/api/size-groups");
      if (response.ok) {
        const data = await response.json();
        setSizeGroups(data);
      } else {
        console.error("Error response from size-groups:", response.status, response.statusText);
      }
    } catch (error) {
      console.error("Error fetching size groups:", error);
      setSizeGroups([]);
    }
  };

  const fetchColors = async () => {
    try {
      const response = await customFetch("/api/colors");
      if (response.ok) {
        const data = await response.json();
        setColors(data);
      } else {
        console.error("Error response from colors:", response.status, response.statusText);
      }
    } catch (error) {
      console.error("Error fetching colors:", error);
      setColors([]);
    }
  };

  const fetchProductCount = async () => {
    try {
      const response = await customFetch("/api/products-enhanced?page=1&limit=1");
      if (response.ok) {
        const data = await response.json();
        setProductCount(data.pagination?.totalProducts || 0);
      } else {
        console.error("Error response from products-enhanced:", response.status, response.statusText);
      }
    } catch (error) {
      console.error("Error fetching product count:", error);
      // Set default count on error to prevent UI issues
      setProductCount(0);
    }
  };

  const fetchExportStats = async () => {
    try {
      const response = await customFetch("/api/import/export-stats");
      if (response.ok) {
        const data = await response.json();
        setExportStats(data);
      } else {
        console.error("Error response from export-stats:", response.status, response.statusText);
      }
    } catch (error) {
      console.error("Error fetching export stats:", error);
      setExportStats({
        total_products: 0,
        active_products: 0,
        inactive_products: 0,
      });
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

      const response = await customFetch("/api/import/parse-csv", {
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
      // Process in smaller batches to avoid payload size limits
      const batchSize = 50; // Process 50 items at a time
      const batches = [];

      for (let i = 0; i < fullImportData.length; i += batchSize) {
        const batch = fullImportData.slice(i, i + batchSize);
        batches.push(batch.map((item) => item.data));
      }

      if (batches.length === 1) {
        // Single batch - use original method
        const response = await customFetch("/api/import/products", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            data: batches[0],
            columnMappings,
          }),
        });

        if (response.ok) {
          pollImportProgress();
        } else {
          throw new Error("Erro ao iniciar importação");
        }
      } else {
        // Multiple batches - use batch processing
        toast({
          title: "Processando arquivo grande",
          description: `Enviando dados em ${batches.length} lotes...`,
        });

        // Send first batch
        const firstResponse = await customFetch("/api/import/products", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            data: batches[0],
            columnMappings,
            totalBatches: batches.length,
            currentBatch: 1,
          }),
        });

        if (!firstResponse.ok) {
          throw new Error("Erro ao enviar primeiro lote");
        }

        // Send remaining batches
        for (let i = 1; i < batches.length; i++) {
          const batchResponse = await customFetch("/api/import/products-batch", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              data: batches[i],
              batchNumber: i + 1,
            }),
          });

          if (!batchResponse.ok) {
            throw new Error(`Erro ao enviar lote ${i + 1}`);
          }
        }

        // Start processing all batches
        const startResponse = await customFetch("/api/import/start-batch-processing", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (startResponse.ok) {
          toast({
            title: "Importação Iniciada",
            description: `Processando ${fullImportData.length} produtos...`,
          });
          pollImportProgress();
        } else {
          throw new Error("Erro ao iniciar processamento");
        }
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
      const response = await customFetch("/api/import/progress");
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
        "6", // Marca (Havaianas)
        "9", // Gênero (Feminino)
        "11", // Tipo (Chinelo)
        "grade", // Tipo de Estoque
        "25", // Estoque por Grade
        "", // Tam 37 (vazio para estoque por grade)
        "", // Tam 38
        "", // Tam 39
        "", // Tam 40
        "", // Tam 41
        "", // Tam 42
        "", // Tam 43
        "", // Tam 44
        "HAV001-AZUL-V1", // SKU da Variante
        "", // Preço da Cor (vazio = usar base_price)
        "", // Preço Promocional da Cor
        "https://example.com/havaianas-azul.jpg", // Imagem da Cor
        "0", // Vender Sem Estoque (0=não, 1=sim)
        "", // Stock per variant (deprecated)
      ],
      [
        "Tênis Nike Air Max",
        "2",
        "150.00",
        "199.90",
        "https://example.com/nike-air-max.jpg",
        "2",
        "preto",
        "NIKE001-PRETO",
        "NIKE001",
        "Tênis esportivo Nike Air Max",
        "249.90",
        "9", // Marca (Rider)
        "8", // Gênero (Masculino)
        "13", // Tipo (Tênis)
        "size", // Tipo de Estoque
        "", // Estoque por Grade (vazio para estoque por tamanho)
        "5", // Tam 37
        "8", // Tam 38
        "12", // Tam 39
        "10", // Tam 40
        "6", // Tam 41
        "4", // Tam 42
        "2", // Tam 43
        "1", // Tam 44
        "NIKE001-PRETO-V1", // SKU da Variante
        "", // Preço da Cor
        "", // Preço Promocional da Cor
        "https://example.com/nike-preto.jpg", // Imagem da Cor
        "0", // Vender Sem Estoque
        "100",
      ],
      [
        "Chinelo Havaianas Top",
        "1",
        "18.50",
        "25.90",
        "https://example.com/havaianas-top.jpg",
        "1",
        "dourado",
        "HAV001-DOURADO",
        "HAV001",
        "Chinelo clássico Havaianas Top - Edição Especial",
        "45.90",
        "6", // Marca (Havaianas)
        "9", // Gênero (Feminino)
        "11", // Tipo (Chinelo)
        "grade", // Tipo de Estoque
        "15", // Estoque por Grade (menor por ser edição especial)
        "", // Tam 37
        "", // Tam 38
        "", // Tam 39
        "", // Tam 40
        "", // Tam 41
        "", // Tam 42
        "", // Tam 43
        "", // Tam 44
        "HAV001-DOURADO-ESPECIAL", // SKU da Variante
        "35.90", // Preço específico da cor dourada (premium)
        "29.90", // Preço promocional
        "https://example.com/havaianas-dourado.jpg", // Imagem específica
        "1", // Vender Sem Estoque (permitir pré-venda)
        "", // Stock per variant (deprecated)
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

      const response = await customFetch(
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

      {/* Guia de Tipos de Estoque e Novos Campos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-blue-600" />
            Sistema de Produtos Atualizado - Guia Completo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tipos de Estoque */}
          <div>
            <h3 className="font-semibold text-lg mb-4">📦 Tipos de Estoque</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Estoque por Grade */}
              <div className="space-y-3">
                <h4 className="font-semibold text-blue-800 flex items-center gap-2">
                  🎯 Estoque por Grade
                </h4>
                <p className="text-sm text-muted-foreground">
                  Configure <code>Tipo de Estoque = "grade"</code> e use <code>Estoque por Grade</code>
                </p>
                <div className="bg-blue-50 p-3 rounded text-sm">
                  <strong>Exemplo:</strong><br/>
                  • Tipo de Estoque: <code>grade</code><br/>
                  • Estoque por Grade: <code>25</code><br/>
                  • Deixe os campos de tamanho vazios<br/>
                  <em>→ Resultado: 25 pares no total, independente dos tamanhos</em>
                </div>
              </div>

              {/* Estoque por Tamanho */}
              <div className="space-y-3">
                <h4 className="font-semibold text-green-800 flex items-center gap-2">
                  📏 Estoque por Tamanho
                </h4>
                <p className="text-sm text-muted-foreground">
                  Configure <code>Tipo de Estoque = "size"</code> e use os campos <code>Estoque Tam XX</code>
                </p>
                <div className="bg-green-50 p-3 rounded text-sm">
                  <strong>Exemplo:</strong><br/>
                  • Tipo de Estoque: <code>size</code><br/>
                  • Estoque Tam 37: <code>5</code><br/>
                  • Estoque Tam 38: <code>8</code><br/>
                  • Estoque Tam 39: <code>3</code><br/>
                  <em>→ Resultado: Estoque específico por tamanho</em>
                </div>
              </div>
            </div>
          </div>

          {/* Classificação de Produtos */}
          <div>
            <h3 className="font-semibold text-lg mb-4">🏷️ Classificação de Produtos</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-purple-50 p-3 rounded text-sm">
                <h5 className="font-semibold text-purple-800 mb-2">Marcas (ID)</h5>
                <ul className="text-purple-700 space-y-1">
                  <li>6: Havaianas</li>
                  <li>7: Ipanema</li>
                  <li>8: Melissa</li>
                  <li>9: Rider</li>
                  <li>10: Grendene</li>
                </ul>
              </div>
              <div className="bg-orange-50 p-3 rounded text-sm">
                <h5 className="font-semibold text-orange-800 mb-2">Gêneros (ID)</h5>
                <ul className="text-orange-700 space-y-1">
                  <li>8: Masculino</li>
                  <li>9: Feminino</li>
                  <li>10: Unissex</li>
                  <li>11: Infantil</li>
                </ul>
              </div>
              <div className="bg-teal-50 p-3 rounded text-sm">
                <h5 className="font-semibold text-teal-800 mb-2">Tipos (ID)</h5>
                <ul className="text-teal-700 space-y-1">
                  <li>11: Chinelo</li>
                  <li>12: Sandália</li>
                  <li>13: Tênis</li>
                  <li>14: Papete</li>
                  <li>15: Rasteirinha</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Variantes de Cor Avançadas */}
          <div>
            <h3 className="font-semibold text-lg mb-4">🎨 Variantes de Cor Avançadas</h3>
            <div className="bg-indigo-50 p-4 rounded">
              <p className="text-sm text-indigo-800 mb-3">
                <strong>Novo sistema de variantes:</strong> Cada cor pode ter SKU, preço e imagem específicos
              </p>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h5 className="font-semibold mb-2">Campos Disponíveis:</h5>
                  <ul className="space-y-1 text-indigo-700">
                    <li>• <code>SKU da Variante de Cor</code> - SKU específico da cor</li>
                    <li>• <code>Preço Específico da Cor</code> - Preço único para esta cor</li>
                    <li>• <code>Preço Promocional da Cor</code> - Promoção específica</li>
                    <li>• <code>Imagem da Variante de Cor</code> - Foto específica da cor</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-semibold mb-2">Exemplo:</h5>
                  <div className="bg-white/50 p-2 rounded font-mono text-xs">
                    SKU da Variante: HAV001-DOURADO<br/>
                    Preço da Cor: 35.90<br/>
                    Imagem da Cor: /uploads/dourado.jpg<br/>
                    <em>→ Cor dourada com preço premium</em>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
            <p className="text-sm text-yellow-800">
              <strong>💡 Dicas:</strong><br/>
              • Se não especificar o "Tipo de Estoque", será usado "grade" por padrão<br/>
              • IDs de marca, gênero e tipo são opcionais, mas ajudam na organização<br/>
              • Variantes de cor com imagens específicas aparecem automaticamente no catálogo<br/>
              • Use "Vender Sem Estoque = 1" para permitir vendas mesmo sem estoque
            </p>
          </div>
        </CardContent>
      </Card>

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
                    <li>• Migraç��o para outro sistema</li>
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
                  <h4 className="font-semibold text-blue-900 mb-3">
                    Formato Esperado (Campos Principais):
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-semibold text-blue-800 mb-2">Obrigatórios:</h5>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• <strong>Nome:</strong> Nome do produto</li>
                        <li>• <strong>Categoria:</strong> ID da categoria</li>
                        <li>• <strong>Preço Base:</strong> Preço de custo</li>
                        <li>• <strong>Grupo de Tamanhos:</strong> ID do grupo</li>
                        <li>• <strong>Cor:</strong> Uma cor por linha</li>
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-semibold text-blue-800 mb-2">Classificação (Opcional):</h5>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• <strong>Marca (ID):</strong> 6=Havaianas, 7=Ipanema...</li>
                        <li>• <strong>Gênero (ID):</strong> 8=Masc, 9=Fem, 10=Unissex</li>
                        <li>• <strong>Tipo (ID):</strong> 11=Chinelo, 12=Sandália...</li>
                        <li>• <strong>SKU Pai:</strong> Agrupa variantes</li>
                      </ul>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-blue-200">
                    <h5 className="font-semibold text-blue-800 mb-2">Variantes de Cor (Avançado):</h5>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• <strong>SKU da Variante:</strong> SKU específico da cor</li>
                      <li>• <strong>Preço da Cor:</strong> Preço único para esta cor</li>
                      <li>• <strong>Imagem da Cor:</strong> Foto específica da variante</li>
                      <li>• <strong>Vender Sem Estoque:</strong> 0=não, 1=sim</li>
                    </ul>
                  </div>
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
                      value={columnMappings[index]?.csvColumn || "__none__"}
                      onValueChange={(value) => {
                        const newMappings = [...columnMappings];
                        newMappings[index] = {
                          ...newMappings[index],
                          csvColumn: value === "__none__" ? "" : value,
                        };
                        setColumnMappings(newMappings);
                      }}
                    >
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="Selecione uma coluna" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Nenhuma</SelectItem>
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

              {!isImporting && (importData.length > 0 || importProgress.errorDetails?.length > 0) && (
                <div className="space-y-4">
                  <h4 className="font-semibold">Resultados da Importação</h4>

                  {/* Show error details if available */}
                  {importProgress.errorDetails && importProgress.errorDetails.length > 0 && (
                    <div className="space-y-4">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <h5 className="font-medium text-red-900 mb-3">
                          Detalhes dos Erros ({importProgress.errorDetails.length} erros encontrados)
                        </h5>
                        <div className="max-h-96 overflow-y-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Linha</TableHead>
                                <TableHead>Produto</TableHead>
                                <TableHead>Erro</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {importProgress.errorDetails.map((errorDetail, index) => (
                                <TableRow key={index}>
                                  <TableCell>{errorDetail.row}</TableCell>
                                  <TableCell className="max-w-xs truncate">
                                    {errorDetail.productName}
                                  </TableCell>
                                  <TableCell className="text-red-600 text-sm">
                                    {errorDetail.error}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Show import data table if available */}
                  {importData.length > 0 && (
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
                  )}
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
