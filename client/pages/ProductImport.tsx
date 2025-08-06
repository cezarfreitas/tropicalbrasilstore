import { useState, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
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
  { key: "size_group_id", label: "Grupo de Tamanhos", required: false },
  { key: "color", label: "Cor (uma por linha)", required: true },
  { key: "sku", label: "SKU", required: false },
  { key: "parent_sku", label: "SKU Pai", required: false },
  { key: "description", label: "Descrição", required: false },
  { key: "suggested_price", label: "Preço Sugerido", required: false },
  { key: "brand_name", label: "Marca (Nome)", required: false },
  { key: "gender_name", label: "Gênero (Nome)", required: false },
  { key: "type_name", label: "Tipo de Produto (Nome)", required: false },
  { key: "stock_type", label: "Tipo de Estoque (grade/size)", required: false },
  { key: "grade_name", label: "Nome da Grade Vendida", required: false },
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

// Custom fetch function using XMLHttpRequest to avoid FullStory conflicts
const customFetch = async (url: string, options?: RequestInit): Promise<Response> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const method = options?.method || 'GET';

    console.log("🌐 CustomFetch:", method, url);
    console.log("📦 Body length:", options?.body?.length || 0);

    xhr.open(method, url);

    // Handle credentials
    if (options?.credentials === 'include' || options?.credentials === 'same-origin') {
      xhr.withCredentials = true;
    }

    // Set default headers
    xhr.setRequestHeader('Accept', 'application/json');

    // Only set Content-Type to JSON if body is not FormData
    // FormData will automatically set the correct multipart/form-data content-type
    if (method !== 'GET' && method !== 'HEAD' && !(options?.body instanceof FormData)) {
      xhr.setRequestHeader('Content-Type', 'application/json');
    }

    // Set custom headers
    if (options?.headers) {
      const headers = options.headers as Record<string, string>;
      Object.entries(headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });
    }

    // Handle abort signal
    if (options?.signal) {
      options.signal.addEventListener('abort', () => {
        xhr.abort();
        reject(new Error('Request aborted'));
      });
    }

    xhr.onload = () => {
      console.log("📥 Response received:", xhr.status, xhr.statusText);
      console.log("���� Response text:", xhr.responseText);

      // Parse response headers
      const responseHeaders: Record<string, string> = {};
      const headerText = xhr.getAllResponseHeaders();
      if (headerText) {
        headerText.split('\r\n').forEach((line) => {
          const parts = line.split(': ');
          if (parts.length === 2) {
            responseHeaders[parts[0].toLowerCase()] = parts[1];
          }
        });
      }

      const response = new Response(xhr.responseText, {
        status: xhr.status,
        statusText: xhr.statusText,
        headers: new Headers(responseHeaders),
      });

      resolve(response);
    };

    xhr.onerror = () => {
      reject(new Error(`Network request failed for ${url}`));
    };

    xhr.ontimeout = () => {
      reject(new Error(`Request timeout for ${url}`));
    };

    // Set timeout
    xhr.timeout = 10000; // 10 second timeout

    xhr.send(options?.body || null);
  });
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
        const results = await Promise.allSettled([
          fetchCategories(),
          fetchSizeGroups(),
          fetchColors(),
          fetchProductCount(),
          fetchExportStats()
        ]);

        // Log any failures but don't block the UI
        results.forEach((result, index) => {
          const endpoints = ['categories', 'size-groups', 'colors', 'product-count', 'export-stats'];
          if (result.status === 'rejected') {
            console.warn(`Failed to fetch ${endpoints[index]}:`, result.reason);
          }
        });

        console.log("All data fetching completed");
      } catch (error) {
        console.error("Error in useEffect:", error);
      }
    };

    fetchData();
  }, []);

  const fetchCategories = async (retryCount = 0) => {
    try {
      const response = await customFetch("/api/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      if (retryCount < 2) {
        console.log(`Retrying categories fetch... (${retryCount + 1}/3)`);
        setTimeout(() => fetchCategories(retryCount + 1), 1000 * (retryCount + 1));
      } else {
        setCategories([]);
      }
    }
  };

  const fetchSizeGroups = async (retryCount = 0) => {
    try {
      const response = await customFetch("/api/size-groups");
      if (response.ok) {
        const data = await response.json();
        setSizeGroups(data);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error fetching size groups:", error);
      if (retryCount < 2) {
        console.log(`Retrying size groups fetch... (${retryCount + 1}/3)`);
        setTimeout(() => fetchSizeGroups(retryCount + 1), 1000 * (retryCount + 1));
      } else {
        setSizeGroups([]);
      }
    }
  };

  const fetchColors = async (retryCount = 0) => {
    try {
      const response = await customFetch("/api/colors");
      if (response.ok) {
        const data = await response.json();
        setColors(data);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error fetching colors:", error);
      if (retryCount < 2) {
        console.log(`Retrying colors fetch... (${retryCount + 1}/3)`);
        setTimeout(() => fetchColors(retryCount + 1), 1000 * (retryCount + 1));
      } else {
        setColors([]);
      }
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
        console.log("🔍 Headers encontrados:", result.headers);

        const autoMappings: ColumnMapping[] = REQUIRED_FIELDS.map((field) => {
          const mappedColumn = autoMapColumn(result.headers, field.key);
          console.log(`📋 Campo "${field.key}" -> "${mappedColumn}"`);
          return {
            csvColumn: mappedColumn,
            targetField: field.key,
            required: field.required,
          };
        });

        setColumnMappings(autoMappings);

        // Contar quantos campos foram mapeados automaticamente
        const mappedCount = autoMappings.filter(m => m.csvColumn).length;
        console.log(`✅ ${mappedCount}/${autoMappings.length} campos mapeados automaticamente`);

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
        description: "Não foi poss��vel processar o arquivo",
        variant: "destructive",
      });
    }
  };

  // Função para normalizar texto removendo acentos e caracteres especiais
  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove acentos
      .replace(/[^a-z0-9\s]/g, " ") // Remove caracteres especiais
      .replace(/\s+/g, " ") // Remove espaços extras
      .trim();
  };

  const autoMapColumn = (headers: string[], targetField: string): string => {
    const commonMappings: Record<string, string[]> = {
      name: ["nome", "produto", "name", "product_name", "nome do produto"],
      category_id: ["categoria", "category", "category_id", "cat"],
      base_price: ["preco_base", "base_price", "preco_custo", "cost_price", "preço base"],
      sale_price: ["preco_venda", "sale_price", "preco", "price", "valor", "preço de venda"],
      photo_url: ["foto", "photo", "photo_url", "imagem", "image", "url da foto"],
      size_group_id: ["grupo_tamanho", "size_group", "tamanhos", "sizes", "grupo de tamanhos"],
      color: ["cor", "color", "cores", "colors", "cor (uma por linha)"],
      sku: ["sku", "codigo"],
      parent_sku: ["sku_pai", "parent_sku", "codigo_pai", "sku pai"],
      description: ["descricao", "description", "desc", "descrição"],
      suggested_price: ["preco_sugerido", "suggested_price", "msrp", "preço sugerido"],
      brand_name: ["marca", "brand", "brand_name", "nome_marca", "marca (nome)"],
      gender_name: ["genero", "gender", "gender_name", "sexo", "gênero (nome)"],
      type_name: ["tipo", "type", "type_name", "categoria_tipo", "tipo de produto (nome)"],
      stock_type: ["tipo_estoque", "stock_type", "estoque_tipo", "tipo de estoque (grade/size)", "tipo de estoque"],
      grade_name: ["nome_grade", "grade_name", "grade", "grade_vendida", "nome da grade vendida"],
      grade_stock: ["estoque_grade", "grade_stock", "estoque_total", "estoque por grade"],
      variant_sku: ["sku_variante", "variant_sku", "sku_cor", "sku da variante de cor"],
      color_price: ["preco_cor", "color_price", "preco_variante", "preço específico da cor"],
      color_sale_price: ["preco_promocional_cor", "color_sale_price", "preço promocional da cor"],
      color_image_url: ["imagem_cor", "color_image", "foto_variante", "imagem da variante de cor"],
      sell_without_stock: ["vender_sem_estoque", "sell_without_stock", "vender sem estoque (0/1)", "vender sem estoque"],
      size_37: ["tam_37", "size_37", "37", "tamanho_37", "estoque tam 37"],
      size_38: ["tam_38", "size_38", "38", "tamanho_38", "estoque tam 38"],
      size_39: ["tam_39", "size_39", "39", "tamanho_39", "estoque tam 39"],
      size_40: ["tam_40", "size_40", "40", "tamanho_40", "estoque tam 40"],
      size_41: ["tam_41", "size_41", "41", "tamanho_41", "estoque tam 41"],
      size_42: ["tam_42", "size_42", "42", "tamanho_42", "estoque tam 42"],
      size_43: ["tam_43", "size_43", "43", "tamanho_43", "estoque tam 43"],
      size_44: ["tam_44", "size_44", "44", "tamanho_44", "estoque tam 44"],
      stock_per_variant: ["estoque", "stock", "quantity", "qtd", "estoque por variante (deprecated)", "estoque por variante"],
    };

    const possibleHeaders = commonMappings[targetField] || [];
    const normalizedHeaders = headers.map((h) => normalizeText(h));
    const normalizedPossibles = possibleHeaders.map((p) => normalizeText(p));

    // Primeiro, buscar correspondência exata
    for (let i = 0; i < normalizedPossibles.length; i++) {
      const possible = normalizedPossibles[i];
      const index = normalizedHeaders.findIndex((h) => h === possible);
      if (index !== -1) {
        console.log(`🎯 Mapeamento exato: "${headers[index]}" -> ${targetField}`);
        return headers[index];
      }
    }

    // Se não encontrar correspondência exata, buscar por inclusão
    for (let i = 0; i < normalizedPossibles.length; i++) {
      const possible = normalizedPossibles[i];
      const index = normalizedHeaders.findIndex((h) =>
        h.includes(possible) || possible.includes(h)
      );
      if (index !== -1) {
        console.log(`🎯 Mapeamento por inclusão: "${headers[index]}" -> ${targetField}`);
        return headers[index];
      }
    }

    return "";
  };

  const validateMappings = (): boolean => {
    console.log("🔍 Validando mappings...");
    console.log("📋 Column mappings:", columnMappings);

    const requiredMappings = columnMappings.filter((m) => m.required);
    const missingMappings = requiredMappings.filter((m) => !m.csvColumn);

    console.log("🔸 Required mappings:", requiredMappings.map(m => m.targetField));
    console.log("❌ Missing mappings:", missingMappings.map(m => m.targetField));

    if (missingMappings.length > 0) {
      toast({
        title: "Mapeamento Incompleto",
        description: `Campos obrigatórios sem mapeamento: ${missingMappings.map((m) => m.targetField).join(", ")}`,
        variant: "destructive",
      });
      return false;
    }

    console.log("✅ Validação de mappings passou");
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
    console.log("🚀 Iniciando importação...");

    if (!validateMappings()) {
      console.log("❌ Validação de mappings falhou");
      return;
    }

    console.log("✅ Validação passou, iniciando importação");
    setIsImporting(true);
    setImportProgress({
      total: csvData.length,
      processed: 0,
      success: 0,
      errors: 0,
    });

    const fullImportData: ImportRow[] = csvData.map((row, index) => {
      const mappedData: Record<string, any> = {};

      console.log(`🔄 Mapeando linha ${index + 1}:`, row);

      columnMappings.forEach((mapping) => {
        if (mapping.csvColumn && mapping.csvColumn in row) {
          mappedData[mapping.targetField] = row[mapping.csvColumn];
          console.log(`  📋 ${mapping.csvColumn} -> ${mapping.targetField}: ${row[mapping.csvColumn]}`);
        }
      });

      console.log(`✅ Dados mapeados da linha ${index + 1}:`, mappedData);

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
        console.log("📤 Enviando batch único com", batches[0].length, "itens");
        console.log("📋 Sample data:", JSON.stringify(batches[0][0], null, 2));
        console.log("📊 Full batch[0]:", JSON.stringify(batches[0], null, 2));
        console.log("📊 Tipo de batches[0]:", typeof batches[0], Array.isArray(batches[0]));

        // Teste de serialização
        const payload = {
          data: batches[0],
          columnMappings,
        };
        console.log("📦 Payload antes de stringify:", payload);

        const jsonPayload = JSON.stringify(payload);
        console.log("📄 JSON serializado (primeiros 500 chars):", jsonPayload.substring(0, 500));

        // Teste de parsing de volta
        try {
          const parsed = JSON.parse(jsonPayload);
          console.log("✅ JSON parse test passou. Data é array?", Array.isArray(parsed.data));
        } catch (e) {
          console.error("❌ JSON parse test falhou:", e);
        }

        // Teste com fetch nativo para comparação
        console.log("🧪 Testando com fetch nativo...");

        try {
          const testResponse = await fetch("/api/import/products", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: jsonPayload,
          });

          console.log("🧪 Fetch nativo result:", testResponse.status, testResponse.statusText);
          const testText = await testResponse.text();
          console.log("🧪 Fetch nativo response:", testText);

          // Se fetch nativo funcionar, usar ele
          if (testResponse.ok) {
            console.log("✅ Fetch nativo funcionou! Prosseguindo...");
            pollImportProgress();
            return;
          }
        } catch (fetchError) {
          console.log("❌ Fetch nativo também falhou:", fetchError);
        }

        // Se chegou aqui, tenta com customFetch
        console.log("🔄 Tentando com customFetch...");
        const response = await customFetch("/api/import/products", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: jsonPayload,
        });

        console.log("📥 Resposta do servidor:", response.status, response.statusText);

        if (response.ok) {
          console.log("✅ Importação iniciada com sucesso");
          pollImportProgress();
        } else {
          const errorText = await response.text();
          console.error("❌ Erro na resposta:", errorText);
          throw new Error(`Erro ao iniciar importação: ${response.status} - ${errorText}`);
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
    } catch (error: any) {
      console.error("❌ Erro na importação:", error);
      console.error("📋 Column mappings:", columnMappings);
      console.error("📊 Import data:", fullImportData.slice(0, 2));

      toast({
        title: "Erro",
        description: `Não foi possível iniciar a importação: ${error.message}`,
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
            title: "Importação Conclu��da",
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

    console.log('📋 Template Completo - Campos:', REQUIRED_FIELDS.map(f => f.key));
    console.log('📋 Template Completo - Headers:', headers);

    const sampleRows = [
      [
        "Chinelo Havaianas Top",                      // name
        "Chinelos",                                   // category_id (nome da categoria)
        "18.50",                                      // base_price
        "25.90",                                      // sale_price
        "https://example.com/havaianas-top.jpg",      // photo_url
        "1",                                          // size_group_id
        "azul",                                       // color
        "HAV001-AZUL",                                // sku
        "HAV001",                                     // parent_sku
        "Chinelo clássico Havaianas Top",             // description
        "35.90",                                      // suggested_price
        "Havaianas",                                  // brand_name
        "Feminino",                                   // gender_name
        "Chinelo",                                    // type_name
        "size",                                       // stock_type (size ou grade)
        "",                                           // grade_name (vazio para stock_type=size)
        "",                                           // grade_stock (vazio para stock_type=size)
        "5",                                          // size_37
        "8",                                          // size_38
        "12",                                         // size_39
        "15",                                         // size_40
        "10",                                         // size_41
        "6",                                          // size_42
        "3",                                          // size_43
        "2",                                          // size_44
        "HAV001-AZUL-V1",                             // variant_sku
        "",                                           // color_price (vazio = usar base_price)
        "",                                           // color_sale_price
        "https://example.com/havaianas-azul.jpg",     // color_image_url
        "0",                                          // sell_without_stock (0=não, 1=sim)
        "",                                           // stock_per_variant (deprecated)
      ],
      [
        "Chinelo Grade Completa",                     // name
        "Chinelos",                                   // category_id (nome da categoria)
        "15.00",                                      // base_price
        "25.90",                                      // sale_price
        "https://example.com/chinelo-grade.jpg",      // photo_url
        "",                                           // size_group_id (vazio para grade)
        "preto",                                      // color
        "GRADE001-PRETO",                             // sku
        "GRADE001",                                   // parent_sku
        "Chinelo vendido por grade completa",         // description
        "29.90",                                      // suggested_price
        "Marca ABC",                                  // brand_name
        "Unissex",                                    // gender_name
        "Chinelo",                                    // type_name
        "grade",                                      // stock_type (grade ou size)
        "2549",                                       // grade_name (nome da grade)
        "25",                                         // grade_stock (estoque da grade)
        "",                                           // size_37 (vazio para grade)
        "",                                           // size_38 (vazio para grade)
        "",                                           // size_39 (vazio para grade)
        "",                                           // size_40 (vazio para grade)
        "",                                           // size_41 (vazio para grade)
        "",                                           // size_42 (vazio para grade)
        "",                                           // size_43 (vazio para grade)
        "",                                           // size_44 (vazio para grade)
        "GRADE001-PRETO-V1",                          // variant_sku
        "",                                           // color_price
        "",                                           // color_sale_price
        "https://example.com/chinelo-grade-preto.jpg", // color_image_url
        "0",                                          // sell_without_stock
        "",                                           // stock_per_variant (deprecated)
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
        "Havaianas", // Marca
        "Feminino", // Gênero
        "Chinelo", // Tipo
        "grade", // Tipo de Estoque
        "15", // Estoque por Grade (menor por ser ediç��o especial)
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

    downloadExcelFile("template_produtos_completo.xlsx", headers, sampleRows);

    toast({
      title: "✅ Template baixado!",
      description: "Template completo com exemplos de estoque por TAMANHO e por GRADE. Preencha e faça upload.",
    });
  };

  // Template específico para produto com 1 cor e múltiplas grades
  const downloadSingleColorTemplate = () => {
    const headers = REQUIRED_FIELDS.map((f) => f.label);

    // Template para produto com 1 cor e múltiplas grades com estoque por tamanho
    const sampleRows = [
      [
        "Tênis Esportivo ABC", // Nome do Produto
        "2", // Categoria (ex: Tênis)
        "89.90", // Preço Base
        "129.90", // Preço de Venda
        "https://example.com/tenis-abc.jpg", // URL da Foto
        "2", // Grupo de Tamanhos (ex: Calçados Adulto)
        "preto", // Cor (apenas uma cor)
        "ABC001-PRETO", // SKU
        "ABC001", // SKU Pai
        "Tênis esportivo ABC modelo clássico, disponível em várias grades", // Descrição
        "149.90", // Preço Sugerido
        "ABC Sports", // Marca (Nome)
        "Unissex", // Gênero (Nome)
        "Tênis", // Tipo de Produto (Nome)
        "size", // Tipo de Estoque = "size" para controle por tamanho
        "", // Estoque por Grade (vazio quando tipo = "size")
        "8", // Estoque Tam 37
        "12", // Estoque Tam 38
        "15", // Estoque Tam 39
        "18", // Estoque Tam 40
        "20", // Estoque Tam 41
        "16", // Estoque Tam 42
        "10", // Estoque Tam 43
        "6", // Estoque Tam 44
        "ABC001-PRETO-V1", // SKU da Variante de Cor
        "", // Preço Específico da Cor (vazio = usar preço base)
        "", // Preço Promocional da Cor
        "https://example.com/tenis-abc-preto.jpg", // Imagem da Variante de Cor
        "0", // Vender Sem Estoque (0=não, 1=sim)
        "", // Stock per variant (campo legado)
      ]
    ];

    downloadCSVFile("template_1_cor_multiplas_grades.csv", headers, sampleRows);
  };

  // Template para produto com 1 cor usando estoque por grade (não por tamanho)
  const downloadSingleColorGradeTemplate = () => {
    // Para grade, excluir campos de tamanho específicos
    const gradeFields = REQUIRED_FIELDS.filter(field =>
      !field.key.startsWith('size_') // Remove size_37, size_38, etc.
    );
    const headers = gradeFields.map((f) => f.label);

    const sampleRows = [
      [
        "Chinelo ABC Grade Completa",              // name - Nome do Produto
        "Chinelos",                                // category_id - Categoria
        "15.00",                                   // base_price - Preço Base
        "25.90",                                   // sale_price - Preço de Venda
        "https://exemplo.com/chinelo-abc.jpg",     // photo_url - URL da Foto
        "",                                        // size_group_id - Grupo de Tamanhos (OPCIONAL para grade)
        "preto",                                   // color - Cor
        "ABC001-PRETO",                           // sku - SKU
        "ABC001",                                 // parent_sku - SKU Pai
        "Chinelo ABC vendido por grade completa", // description - Descrição
        "29.90",                                  // suggested_price - Preço Sugerido
        "ABC",                                    // brand_name - Marca (Nome)
        "Unissex",                               // gender_name - Gênero (Nome)
        "Chinelo",                               // type_name - Tipo de Produto (Nome)
        "grade",                                 // stock_type - Tipo de Estoque (grade/size)
        "2549",                                  // grade_name - Nome da Grade Vendida
        "30",                                    // grade_stock - Estoque por Grade
        "ABC001-PRETO-GRADE",                    // variant_sku - SKU da Variante de Cor
        "",                                      // color_price - Preço Específico da Cor
        "",                                      // color_sale_price - Preço Promocional da Cor
        "https://exemplo.com/chinelo-abc-preto.jpg", // color_image_url - Imagem da Variante de Cor
        "0",                                     // sell_without_stock - Vender Sem Estoque
        ""                                       // stock_per_variant - Stock per variant (DEPRECATED)
      ],
      [
        "Sandália XYZ Grade Premium",             // name - Nome do Produto
        "Sandálias",                             // category_id - Categoria
        "35.00",                                 // base_price - Preço Base
        "55.90",                                 // sale_price - Preço de Venda
        "https://exemplo.com/sandalia-xyz.jpg",  // photo_url - URL da Foto
        "",                                      // size_group_id - Grupo de Tamanhos (OPCIONAL para grade)
        "marrom",                                // color - Cor
        "XYZ002-MARROM",                         // sku - SKU
        "XYZ002",                                // parent_sku - SKU Pai
        "Sandália XYZ premium vendida por grade", // description - Descrição
        "65.90",                                 // suggested_price - Preço Sugerido
        "XYZ Premium",                           // brand_name - Marca (Nome)
        "Feminino",                              // gender_name - Gênero (Nome)
        "Sandália",                              // type_name - Tipo de Produto (Nome)
        "grade",                                 // stock_type - Tipo de Estoque (grade/size)
        "2550",                                  // grade_name - Nome da Grade Vendida
        "15",                                    // grade_stock - Estoque por Grade
        "XYZ002-MARROM-GRADE",                   // variant_sku - SKU da Variante de Cor
        "49.90",                                 // color_price - Preço Específico da Cor
        "45.90",                                 // color_sale_price - Preço Promocional da Cor
        "https://exemplo.com/sandalia-xyz-marrom.jpg", // color_image_url - Imagem da Variante de Cor
        "0",                                     // sell_without_stock - Vender Sem Estoque
        ""                                       // stock_per_variant - Stock per variant (DEPRECATED)
      ]
    ];

    // Gerar tanto Excel quanto CSV para debug
    downloadExcelFile("template_1_cor_estoque_grade.xlsx", headers, sampleRows);

    // Também gerar CSV para teste
    setTimeout(() => {
      downloadCSVFile("template_1_cor_estoque_grade.csv", headers, sampleRows);
    }, 1000);
  };

  // Função auxiliar para download do CSV
  const downloadCSVFile = (filename: string, headers: string[], rows: string[][]) => {
    const csvContent =
      headers.join(",") +
      "\n" +
      rows.map((row) => row.join(",")).join("\n") +
      "\n";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Função auxiliar para download do Excel
  const downloadExcelFile = (filename: string, headers: string[], rows: string[][]) => {
    // Criar dados para o Excel
    const worksheetData = [headers, ...rows];

    // Criar workbook e worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Definir largura das colunas
    const colWidths = headers.map((header, index) => {
      const maxLength = Math.max(
        header.length,
        ...rows.map(row => String(row[index] || "").length)
      );
      return { wch: Math.min(Math.max(maxLength, 15), 40) };
    });
    worksheet['!cols'] = colWidths;

    // Estilizar cabeçalho
    const headerStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "2E7D32" } }, // Verde mais escuro para grade
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } }
      }
    };

    // Estilo para dados
    const dataStyle = {
      alignment: { horizontal: "left", vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "CCCCCC" } },
        bottom: { style: "thin", color: { rgb: "CCCCCC" } },
        left: { style: "thin", color: { rgb: "CCCCCC" } },
        right: { style: "thin", color: { rgb: "CCCCCC" } }
      }
    };

    // Aplicar estilo aos headers
    headers.forEach((_, index) => {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: index });
      if (!worksheet[cellAddress]) worksheet[cellAddress] = {};
      worksheet[cellAddress].s = headerStyle;
    });

    // Aplicar estilo aos dados
    rows.forEach((row, rowIndex) => {
      row.forEach((_, colIndex) => {
        const cellAddress = XLSX.utils.encode_cell({ r: rowIndex + 1, c: colIndex });
        if (!worksheet[cellAddress]) worksheet[cellAddress] = {};
        worksheet[cellAddress].s = dataStyle;
      });
    });

    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Produtos por Grade");

    // Gerar arquivo Excel
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
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
          title: "Exporta��ão Concluída",
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
                  • Nome da Grade Vendida: <code>2549</code> (nome da grade criada)<br/>
                  • Estoque por Grade: <code>25</code> (grades completas)<br/>
                  • Grupo de Tamanhos: pode ficar <strong>vazio</strong> (opcional para grade)<br/>
                  • <strong>IMPORTANTE:</strong> Deixe todos os campos "Estoque Tam XX" vazios<br/>
                  <em>→ Resultado: 25 grades completas para venda (sem controle por tamanho)</em>
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
                  • Estoque Tam 37: <code>5</code> pares<br/>
                  • Estoque Tam 38: <code>8</code> pares<br/>
                  • Estoque Tam 39: <code>3</code> pares<br/>
                  <em>→ Resultado: Venda individual por tamanho específico</em>
                </div>
              </div>
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Templates Específicos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-600" />
            Templates Específicos por Caso de Uso
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Templates otimizados para situações específicas de importação
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Template Completo */}
            <div className="p-4 border rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50">
              <div className="flex items-center gap-2 mb-3">
                <div className="text-2xl">📋</div>
                <div>
                  <h4 className="font-semibold text-blue-800">Template Completo</h4>
                  <p className="text-xs text-blue-600">Múltiplas cores e variações</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Template com todos os recursos: múltiplas cores, variações de pre��o e estoque por tamanho ou grade
              </p>
              <Button variant="outline" onClick={downloadTemplate} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Baixar Completo
              </Button>
            </div>

            {/* Template 1 Cor + Múltiplas Grades */}
            <div className="p-4 border rounded-lg bg-gradient-to-br from-green-50 to-emerald-50">
              <div className="flex items-center gap-2 mb-3">
                <div className="text-2xl">🎯</div>
                <div>
                  <h4 className="font-semibold text-green-800">1 Cor + Estoque por Tamanho</h4>
                  <p className="text-xs text-green-600">Venda individual por tamanho</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Produto vendido por tamanho individual. Cada tamanho tem seu próprio estoque (ex: 5 pares tam 37, 8 pares tam 38)
              </p>
              <Button variant="outline" onClick={downloadSingleColorTemplate} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Baixar Template
              </Button>
            </div>

            {/* Template 1 Cor + Estoque Grade */}
            <div className="p-4 border rounded-lg bg-gradient-to-br from-orange-50 to-amber-50">
              <div className="flex items-center gap-2 mb-3">
                <div className="text-2xl">📦</div>
                <div>
                  <h4 className="font-semibold text-orange-800">1 Cor + Venda por Grade</h4>
                  <p className="text-xs text-orange-600">Venda de grade completa</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Produto vendido como grade completa. Especifique qual grade vendida usar e quantas estão disponíveis (ex: Grade "2549" com 25 unidades).
                <strong className="text-orange-700 block mt-1">📊 Arquivo Excel organizado - sem campos de tamanho!</strong>
              </p>
              <Button variant="outline" onClick={downloadSingleColorGradeTemplate} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Baixar Excel
              </Button>
            </div>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h5 className="font-semibold text-yellow-800 mb-2">💡 Quando usar cada template:</h5>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li><strong>Completo:</strong> Produtos com múltiplas cores, preços e tipos de venda diferentes</li>
                  <li><strong>1 Cor + Tamanho:</strong> Venda individual por tamanho - cliente escolhe tam 37, 38, etc. (ex: sapatos, tênis)</li>
                  <li><strong>1 Cor + Grade:</strong> Venda por grade completa - especifique qual grade usar. Cliente compra a grade inteira (ex: atacado)</li>
                </ul>
              </div>
            </div>
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
                    Informações Incluídas na Exportaç��o:
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
                    <li>�� Análise de dados de produtos</li>
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
                      Dicas para Exporta��ão
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
                        <li>• <strong>Marca (Nome):</strong> "Havaianas", "Nike", "Adidas"...</li>
                        <li>• <strong>Gênero (Nome):</strong> "Masculino", "Feminino", "Unissex"</li>
                        <li>• <strong>Tipo (Nome):</strong> "Chinelo", "Sandália", "Tênis"...</li>
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
