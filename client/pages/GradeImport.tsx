import { useState, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  Download,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  RotateCcw,
  Loader2,
  Grid3X3,
  Package,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Campos específicos para importação por grade (simplificado)
const GRADE_FIELDS = [
  { key: "name", label: "Nome do Produto", required: true },
  { key: "category_id", label: "Categoria", required: true },
  { key: "base_price", label: "Preço Base", required: true },
  { key: "sale_price", label: "Preço de Venda", required: false },
  { key: "photo_url", label: "URL da Foto", required: false },
  { key: "color", label: "Cor", required: true },
  { key: "sku", label: "SKU", required: false },
  { key: "parent_sku", label: "SKU Pai", required: false },
  { key: "description", label: "Descrição", required: false },
  { key: "suggested_price", label: "Preço Sugerido", required: false },
  { key: "brand_name", label: "Marca", required: false },
  { key: "gender_name", label: "Gênero", required: false },
  { key: "type_name", label: "Tipo de Produto", required: false },
  { key: "grade_name", label: "Nome da Grade", required: true },
  { key: "grade_stock", label: "Estoque da Grade", required: true },
  { key: "variant_sku", label: "SKU da Variante", required: false },
  { key: "color_price", label: "Preço da Cor", required: false },
  { key: "color_sale_price", label: "Preço Promocional da Cor", required: false },
  { key: "color_image_url", label: "Imagem da Cor", required: false },
  { key: "sell_without_stock", label: "Vender Sem Estoque (0/1)", required: false },
];

interface ImportProgress {
  total: number;
  processed: number;
  success: number;
  errors: number;
}

interface ColumnMapping {
  csvColumn: string;
  targetField: string;
  required: boolean;
}

// customFetch function
let customFetch: typeof fetch;

const initCustomFetch = () => {
  const method = (window as any).FS ? (window as any).FS.getCurrentSessionURL ? 'fullstory' : 'builtin' : 'builtin';
  
  if (method === 'fullstory') {
    customFetch = async (url: string, options?: RequestInit) => {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options?.headers,
          'X-FS-Proxy': 'true',
        },
      });
      return response;
    };
  } else {
    customFetch = fetch;
  }
};

export default function GradeImport() {
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [importData, setImportData] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgress>({
    total: 0,
    processed: 0,
    success: 0,
    errors: 0,
  });
  const [showPreview, setShowPreview] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Initialize customFetch
  useEffect(() => {
    initCustomFetch();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await customFetch("/api/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
    }
  };

  // Download template específico para grades
  const downloadGradeTemplate = () => {
    const headers = GRADE_FIELDS.map((f) => f.label);
    
    console.log('📦 Template Grade - Campos:', GRADE_FIELDS.map(f => f.key));
    console.log('📦 Template Grade - Headers:', headers);

    const sampleRows = [
      [
        "Chinelo ABC Grade Completa",              // name
        "Chinelos",                                // category_id
        "15.00",                                   // base_price
        "25.90",                                   // sale_price
        "https://exemplo.com/chinelo-abc.jpg",     // photo_url
        "preto",                                   // color
        "ABC001-PRETO",                           // sku
        "ABC001",                                 // parent_sku
        "Chinelo ABC vendido por grade completa", // description
        "29.90",                                  // suggested_price
        "ABC",                                    // brand_name
        "Unissex",                               // gender_name
        "Chinelo",                               // type_name
        "2549",                                  // grade_name
        "30",                                    // grade_stock
        "ABC001-PRETO-GRADE",                    // variant_sku
        "",                                      // color_price
        "",                                      // color_sale_price
        "https://exemplo.com/chinelo-abc-preto.jpg", // color_image_url
        "0",                                     // sell_without_stock
      ],
      [
        "Sandália XYZ Grade Premium",             // name
        "Sandálias",                             // category_id
        "35.00",                                 // base_price
        "55.90",                                 // sale_price
        "https://exemplo.com/sandalia-xyz.jpg",  // photo_url
        "marrom",                                // color
        "XYZ002-MARROM",                         // sku
        "XYZ002",                                // parent_sku
        "Sandália XYZ premium vendida por grade", // description
        "65.90",                                 // suggested_price
        "XYZ Premium",                           // brand_name
        "Feminino",                              // gender_name
        "Sandália",                              // type_name
        "2550",                                  // grade_name
        "15",                                    // grade_stock
        "XYZ002-MARROM-GRADE",                   // variant_sku
        "49.90",                                 // color_price
        "45.90",                                 // color_sale_price
        "https://exemplo.com/sandalia-xyz-marrom.jpg", // color_image_url
        "0",                                     // sell_without_stock
      ]
    ];

    downloadExcelFile("template_grade_produtos.xlsx", headers, sampleRows);
    
    toast({
      title: "✅ Template de Grade baixado!",
      description: "Template exclusivo para produtos vendidos por grade. Preencha e faça upload.",
    });
  };

  // Função auxiliar para download do Excel
  const downloadExcelFile = (filename: string, headers: string[], rows: string[][]) => {
    const worksheetData = [headers, ...rows];
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
      fill: { fgColor: { rgb: "1565C0" } }, // Azul para grade
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } }
      }
    };

    // Aplicar estilo ao cabeçalho
    headers.forEach((_, index) => {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: index });
      if (!worksheet[cellRef].s) worksheet[cellRef].s = {};
      worksheet[cellRef].s = headerStyle;
    });

    XLSX.utils.book_append_sheet(workbook, worksheet, "Produtos Grade");
    XLSX.writeFile(workbook, filename);
  };

  // Upload e processamento do arquivo
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);

    const formData = new FormData();
    formData.append("file", uploadedFile);

    try {
      const response = await customFetch("/api/import/parse-csv", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setCsvData(data.data);
        setCsvHeaders(data.headers);
        
        // Auto mapear colunas baseado nos headers do template
        const autoMappings = createAutoColumnMappings(data.headers);
        setColumnMappings(autoMappings);

        toast({
          title: "✅ Arquivo carregado!",
          description: `${data.data.length} linhas detectadas. Verifique o mapeamento abaixo.`,
        });
      } else {
        throw new Error("Erro ao processar arquivo");
      }
    } catch (error) {
      toast({
        title: "❌ Erro",
        description: "Não foi possível processar o arquivo",
        variant: "destructive",
      });
    }
  };

  // Criar mapeamento automático baseado nos headers
  const createAutoColumnMappings = (headers: string[]): ColumnMapping[] => {
    return GRADE_FIELDS.map(field => {
      // Tentar encontrar correspondência exata primeiro
      let matchedHeader = headers.find(h => 
        h.toLowerCase().trim() === field.label.toLowerCase().trim()
      );

      // Se não encontrar, tentar correspondências parciais
      if (!matchedHeader) {
        matchedHeader = headers.find(h => {
          const headerLower = h.toLowerCase().trim();
          const labelLower = field.label.toLowerCase().trim();
          return headerLower.includes(labelLower) || labelLower.includes(headerLower);
        });
      }

      return {
        csvColumn: matchedHeader || "",
        targetField: field.key,
        required: field.required
      };
    });
  };

  // Processar dados para importação
  const processImportData = () => {
    const processedData = csvData.map(row => {
      const processedRow: any = {};
      
      columnMappings.forEach(mapping => {
        if (mapping.csvColumn && row[mapping.csvColumn] !== undefined) {
          processedRow[mapping.targetField] = row[mapping.csvColumn];
        }
      });
      
      // Garantir que stock_type seja sempre 'grade' para este sistema
      processedRow.stock_type = 'grade';
      
      return processedRow;
    });

    setImportData(processedData);
    return processedData;
  };

  // Iniciar importação
  const startImport = async () => {
    const data = processImportData();
    
    // Validar campos obrigatórios
    const requiredFields = columnMappings.filter(m => m.required);
    const missingFields = requiredFields.filter(field => 
      !field.csvColumn || field.csvColumn.trim() === ""
    );

    if (missingFields.length > 0) {
      toast({
        title: "❌ Campos obrigatórios não mapeados",
        description: `Campos faltando: ${missingFields.map(f => f.targetField).join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setImportProgress({ total: data.length, processed: 0, success: 0, errors: 0 });

    try {
      const response = await customFetch("/api/import/products-grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data,
          columnMappings: columnMappings.map(m => ({
            csvColumn: m.csvColumn,
            targetField: m.targetField,
            required: m.required
          }))
        }),
      });

      if (response.ok) {
        // Monitorar progresso
        const progressInterval = setInterval(async () => {
          try {
            const progressResponse = await customFetch("/api/import/progress");
            if (progressResponse.ok) {
              const progressData = await progressResponse.json();
              setImportProgress(progressData);
              
              if (!progressData.isRunning) {
                clearInterval(progressInterval);
                setIsImporting(false);
                
                toast({
                  title: "✅ Importação concluída!",
                  description: `${progressData.success} produtos importados com sucesso${progressData.errors > 0 ? `, ${progressData.errors} erros` : ''}.`,
                });
              }
            }
          } catch (error) {
            console.error("Erro ao buscar progresso:", error);
          }
        }, 1000);

      } else {
        throw new Error("Erro na importação");
      }
    } catch (error) {
      setIsImporting(false);
      toast({
        title: "❌ Erro na importação",
        description: "Não foi possível importar os produtos",
        variant: "destructive",
      });
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
    setImportProgress({ total: 0, processed: 0, success: 0, errors: 0 });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Grid3X3 className="h-8 w-8 text-primary" />
            Importação de Grades
          </h1>
          <p className="text-muted-foreground">
            Sistema exclusivo para importar produtos vendidos por grade completa
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={downloadGradeTemplate} className="gap-2">
            <Download className="h-4 w-4" />
            Baixar Template Grade
          </Button>
          <Button variant="outline" onClick={resetImport} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Reiniciar
          </Button>
        </div>
      </div>

      {/* Guia do Sistema */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Package className="h-5 w-5" />
            Como Funciona - Sistema de Grades
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Download className="h-5 w-5 text-blue-600" />
                <strong>1. Baixe o Template</strong>
              </div>
              <p className="text-sm text-muted-foreground">
                Template exclusivo para produtos de grade com campos simplificados
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Upload className="h-5 w-5 text-green-600" />
                <strong>2. Preencha e Faça Upload</strong>
              </div>
              <p className="text-sm text-muted-foreground">
                Cada linha = 1 produto com 1 cor vendido por grade completa
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-purple-600" />
                <strong>3. Importação Automática</strong>
              </div>
              <p className="text-sm text-muted-foreground">
                Sistema configura automaticamente o estoque por grade
              </p>
            </div>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
            <h4 className="font-semibold text-amber-800 mb-2">📋 Campos Importantes:</h4>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• <strong>Nome da Grade:</strong> Ex: "2549", "Grade A", etc (identifica a grade)</li>
              <li>• <strong>Estoque da Grade:</strong> Quantidade de grades completas disponíveis</li>
              <li>• <strong>Categoria:</strong> Nome da categoria (ex: "Chinelos", "Sandálias")</li>
              <li>• <strong>Cor:</strong> Uma cor por linha do produto</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Upload de Arquivo */}
      <Card>
        <CardHeader>
          <CardTitle>📁 Upload do Arquivo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" />
                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-semibold">Clique para fazer upload</span> ou arraste o arquivo
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Excel (.xlsx) ou CSV (.csv)
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".csv,.xlsx"
                onChange={handleFileUpload}
              />
            </label>
          </div>
          
          {file && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-800">
                📁 <strong>Arquivo carregado:</strong> {file.name}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mapeamento de Colunas */}
      {csvHeaders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>🔗 Mapeamento de Colunas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {columnMappings.map((mapping, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Label className="min-w-[150px] text-sm">
                    {GRADE_FIELDS.find(f => f.key === mapping.targetField)?.label}
                    {mapping.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  <Select
                    value={mapping.csvColumn}
                    onValueChange={(value) => {
                      const newMappings = [...columnMappings];
                      newMappings[index].csvColumn = value;
                      setColumnMappings(newMappings);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar coluna..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">-- Não mapear --</SelectItem>
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
            
            <div className="mt-6 flex gap-2">
              <Button onClick={() => setShowPreview(true)} variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                Visualizar Dados
              </Button>
              <Button onClick={startImport} disabled={isImporting}>
                {isImporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {isImporting ? "Importando..." : "Iniciar Importação"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progresso da Importação */}
      {isImporting && (
        <Card>
          <CardHeader>
            <CardTitle>📊 Progresso da Importação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Progress value={(importProgress.processed / importProgress.total) * 100} />
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Total:</span>
                  <span className="ml-2 font-medium">{importProgress.total}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Processados:</span>
                  <span className="ml-2 font-medium">{importProgress.processed}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Sucessos:</span>
                  <span className="ml-2 font-medium text-green-600">{importProgress.success}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Erros:</span>
                  <span className="ml-2 font-medium text-red-600">{importProgress.errors}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Visualização dos Dados</DialogTitle>
            <DialogDescription>
              Primeiras 5 linhas que serão importadas
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  {GRADE_FIELDS.slice(0, 8).map((field) => (
                    <TableHead key={field.key} className="text-xs">
                      {field.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {processImportData().slice(0, 5).map((row, index) => (
                  <TableRow key={index}>
                    {GRADE_FIELDS.slice(0, 8).map((field) => (
                      <TableCell key={field.key} className="text-xs">
                        {row[field.key] || "—"}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
