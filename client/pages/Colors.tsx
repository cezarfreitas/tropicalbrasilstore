import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Edit2, Trash2, Palette } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Color, CreateColorRequest } from "@shared/types";

// Mapeamento inteligente de nomes de cores para códigos hexadecimais
const COLOR_MAPPINGS: Record<string, string> = {
  // Cores básicas
  "preto": "#000000",
  "branco": "#FFFFFF",
  "vermelho": "#FF0000",
  "verde": "#008000",
  "azul": "#0000FF",
  "amarelo": "#FFFF00",
  "rosa": "#FFC0CB",
  "roxo": "#800080",
  "laranja": "#FFA500",
  "marrom": "#A52A2A",
  "cinza": "#808080",
  "dourado": "#FFD700",
  "prata": "#C0C0C0",

  // Tons de azul
  "azul marinho": "#000080",
  "azul royal": "#4169E1",
  "azul claro": "#ADD8E6",
  "azul escuro": "#00008B",
  "azul turquesa": "#40E0D0",
  "azul bebê": "#89CFF0",
  "azul celeste": "#87CEEB",
  "azul anil": "#4B0082",
  "azul petróleo": "#4682B4",

  // Tons de vermelho
  "vermelho escuro": "#8B0000",
  "vermelho claro": "#FFB6C1",
  "bordô": "#800020",
  "carmim": "#DC143C",
  "coral": "#FF7F50",
  "magenta": "#FF00FF",

  // Tons de verde
  "verde claro": "#90EE90",
  "verde escuro": "#006400",
  "verde água": "#00FFFF",
  "verde lima": "#32CD32",
  "verde oliva": "#808000",
  "verde militar": "#4B5320",
  "verde neon": "#39FF14",

  // Tons de amarelo/laranja
  "amarelo claro": "#FFFFE0",
  "amarelo ouro": "#FFD700",
  "laranja escuro": "#FF8C00",
  "laranja claro": "#FFE4B5",
  "pêssego": "#FFCBA4",
  "salmão": "#FA8072",

  // Tons de rosa/roxo
  "rosa claro": "#FFB6C1",
  "rosa escuro": "#C71585",
  "rosa pink": "#FF1493",
  "roxo claro": "#DDA0DD",
  "roxo escuro": "#4B0082",
  "violeta": "#8A2BE2",
  "lilás": "#B19CD9",

  // Tons neutros
  "cinza claro": "#D3D3D3",
  "cinza escuro": "#A9A9A9",
  "bege": "#F5F5DC",
  "creme": "#FFFDD0",
  "nude": "#E3BC9A",
  "terra": "#8B4513",
  "chocolate": "#D2691E",

  // Cores especiais
  "transparente": "#FFFFFF00",
  "neon": "#39FF14",
  "metálico": "#B8860B",
  "fosco": "#696969",
};

// Função para detectar cor inteligentemente
const detectColorFromName = (name: string): string | null => {
  const cleanName = name.toLowerCase().trim();

  // Busca exata
  if (COLOR_MAPPINGS[cleanName]) {
    return COLOR_MAPPINGS[cleanName];
  }

  // Busca por palavras-chave
  for (const [colorName, hexCode] of Object.entries(COLOR_MAPPINGS)) {
    if (cleanName.includes(colorName) || colorName.includes(cleanName)) {
      return hexCode;
    }
  }

  // Busca por partes do nome
  const words = cleanName.split(/[\s\-_]+/);
  for (const word of words) {
    if (word.length > 2) { // Ignore palavras muito curtas
      for (const [colorName, hexCode] of Object.entries(COLOR_MAPPINGS)) {
        if (colorName.includes(word) || word.includes(colorName)) {
          return hexCode;
        }
      }
    }
  }

  return null;
};

export default function Colors() {
  const [colors, setColors] = useState<Color[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingColor, setEditingColor] = useState<Color | null>(null);
  const [selectedColors, setSelectedColors] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestedColor, setSuggestedColor] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateColorRequest>({
    name: "",
    hex_code: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchColors();
  }, []);

  const fetchColors = async () => {
    try {
      const response = await fetch("/api/colors");
      if (response.ok) {
        const data = await response.json();
        setColors(data);
      }
    } catch (error) {
      console.error("Error fetching colors:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as cores",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingColor
        ? `/api/colors/${editingColor.id}`
        : "/api/colors";
      const method = editingColor ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: editingColor
            ? "Cor atualizada com sucesso"
            : "Cor criada com sucesso",
        });
        setDialogOpen(false);
        setEditingColor(null);
        setFormData({ name: "", hex_code: "" });
        fetchColors();
      } else {
        const error = await response.json();
        throw new Error(error.error || "Erro desconhecido");
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (color: Color) => {
    setEditingColor(color);
    setFormData({
      name: color.name,
      hex_code: color.hex_code || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir esta cor?")) return;

    try {
      const response = await fetch(`/api/colors/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Cor excluída com sucesso",
        });
        fetchColors();
      } else {
        throw new Error("Erro ao excluir cor");
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleNewColor = () => {
    setEditingColor(null);
    setFormData({ name: "", hex_code: "" });
    setSuggestedColor(null);
    setDialogOpen(true);
  };

  const handleNameChange = (name: string) => {
    setFormData({ ...formData, name });

    // Detectar cor automaticamente baseada no nome
    const detectedColor = detectColorFromName(name);
    setSuggestedColor(detectedColor);

    // Se não há cor manual definida e temos uma sugestão, aplicar automaticamente
    if (!formData.hex_code && detectedColor) {
      setFormData({ name, hex_code: detectedColor });
    }
  };

  const applySuggestedColor = () => {
    if (suggestedColor) {
      setFormData({ ...formData, hex_code: suggestedColor });
      setSuggestedColor(null);
      toast({
        title: "Cor aplicada",
        description: "Cor detectada automaticamente aplicada com sucesso!",
      });
    }
  };

  // Funções de seleção múltipla
  const isAllSelected = colors.length > 0 && selectedColors.length === colors.length;
  const isIndeterminate = selectedColors.length > 0 && selectedColors.length < colors.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedColors([]);
    } else {
      setSelectedColors(colors.map(color => color.id));
    }
  };

  const toggleColorSelection = (colorId: number) => {
    setSelectedColors(prev =>
      prev.includes(colorId)
        ? prev.filter(id => id !== colorId)
        : [...prev, colorId]
    );
  };

  const clearSelection = () => {
    setSelectedColors([]);
  };

  const handleBulkDelete = async () => {
    if (selectedColors.length === 0) return;

    const confirmMessage = `Tem certeza que deseja excluir ${selectedColors.length} cor${selectedColors.length !== 1 ? 'es' : ''}?`;

    if (!confirm(confirmMessage)) return;

    try {
      const deletePromises = selectedColors.map(id =>
        fetch(`/api/colors/${id}`, {
          method: 'DELETE'
        })
      );

      const results = await Promise.all(deletePromises);
      const failed = results.filter(r => !r.ok);

      if (failed.length === 0) {
        toast({
          title: "Sucesso",
          description: `${selectedColors.length} cor${selectedColors.length !== 1 ? 'es' : ''} excluída${selectedColors.length !== 1 ? 's' : ''} com sucesso`,
        });
        setSelectedColors([]);
        fetchColors();
      } else {
        throw new Error(`${failed.length} cor${failed.length !== 1 ? 'es' : ''} não puderam ser excluída${failed.length !== 1 ? 's' : ''}`);
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">
            Carregando cores...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cores</h1>
          <p className="text-muted-foreground">
            Gerencie a paleta de cores dos seus produtos
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewColor}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Cor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingColor ? "Editar Cor" : "Nova Cor"}
                </DialogTitle>
                <DialogDescription>
                  {editingColor
                    ? "Atualize as informações da cor"
                    : "Adicione uma nova cor para seus produtos"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome da Cor</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Ex: Azul Marinho, Vermelho, Rosa"
                    required
                  />
                  {suggestedColor && suggestedColor !== formData.hex_code && (
                    <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded">
                      <div
                        className="w-4 h-4 rounded border"
                        style={{ backgroundColor: suggestedColor }}
                      ></div>
                      <span className="text-sm text-blue-700">
                        Cor detectada: {suggestedColor}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={applySuggestedColor}
                        className="ml-auto text-xs h-6"
                      >
                        Aplicar
                      </Button>
                    </div>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="hex_code" className="flex items-center gap-2">
                    Código da Cor
                    {suggestedColor === formData.hex_code && formData.hex_code && (
                      <Badge variant="secondary" className="text-xs">
                        🤖 Detectado automaticamente
                      </Badge>
                    )}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="hex_code"
                      value={formData.hex_code}
                      onChange={(e) => {
                        setFormData({ ...formData, hex_code: e.target.value });
                        // Limpar sugestão se usuário está editando manualmente
                        if (e.target.value !== suggestedColor) {
                          setSuggestedColor(null);
                        }
                      }}
                      placeholder="#FF0000 (será detectado automaticamente)"
                      pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                    />
                    {formData.hex_code && (
                      <div
                        className="w-12 h-10 rounded border border-border flex items-center justify-center"
                        style={{ backgroundColor: formData.hex_code }}
                        title={`Cor: ${formData.hex_code}`}
                      >
                        {suggestedColor === formData.hex_code && (
                          <span className="text-xs">🤖</span>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    💡 Digite o nome da cor e o código será detectado automaticamente!
                  </p>

                  {/* Preview de cores disponíveis */}
                  {formData.name && !formData.hex_code && (
                    <div className="mt-2">
                      <p className="text-xs font-medium mb-2">Cores disponíveis para detecção:</p>
                      <div className="grid grid-cols-6 gap-1 max-h-20 overflow-y-auto">
                        {Object.entries(COLOR_MAPPINGS)
                          .filter(([name]) =>
                            name.toLowerCase().includes(formData.name.toLowerCase()) ||
                            formData.name.toLowerCase().includes(name.toLowerCase())
                          )
                          .slice(0, 12)
                          .map(([name, hex]) => (
                            <div
                              key={name}
                              className="w-6 h-6 rounded border cursor-pointer hover:scale-110 transition-transform"
                              style={{ backgroundColor: hex }}
                              title={`${name} - ${hex}`}
                              onClick={() => {
                                setFormData({ ...formData, hex_code: hex });
                                setSuggestedColor(null);
                              }}
                            />
                          ))
                        }
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingColor ? "Atualizar" : "Criar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Barra de ações para seleção múltipla */}
      {selectedColors.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">
                  {selectedColors.length} cor{selectedColors.length !== 1 ? 'es' : ''} selecionada{selectedColors.length !== 1 ? 's' : ''}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearSelection}
                >
                  Limpar seleção
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir selecionadas
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Lista de Cores
          </CardTitle>
          <CardDescription>
            {colors.length === 0
              ? "Nenhuma cor cadastrada"
              : `${colors.length} cor${colors.length !== 1 ? "es" : ""} cadastrada${colors.length !== 1 ? "s" : ""}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {colors.length === 0 ? (
            <div className="text-center py-8">
              <Palette className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-2 text-sm font-semibold">
                Nenhuma cor cadastrada
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Comece criando as cores disponíveis para seus chinelos.
              </p>
              <div className="mt-6">
                <Button onClick={handleNewColor}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Cor
                </Button>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={isAllSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = isIndeterminate;
                      }}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Selecionar todas as cores"
                      className={isIndeterminate ? "data-[state=checked]:bg-blue-600" : ""}
                    />
                  </TableHead>
                  <TableHead>Cor</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {colors.map((color) => (
                  <TableRow
                    key={color.id}
                    className={selectedColors.includes(color.id) ? "bg-blue-50" : ""}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedColors.includes(color.id)}
                        onCheckedChange={() => toggleColorSelection(color.id)}
                        aria-label={`Selecionar cor ${color.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded border border-border"
                          style={{
                            backgroundColor: color.hex_code || "#999999",
                          }}
                        ></div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{color.name}</TableCell>
                    <TableCell className="text-muted-foreground font-mono text-sm">
                      {color.hex_code || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(color.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(color)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDelete(color.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
