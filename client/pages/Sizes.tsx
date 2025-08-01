import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit2, Trash2, Ruler, PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Size, CreateSizeRequest } from "@shared/types";

export default function Sizes() {
  const [sizes, setSizes] = useState<Size[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSize, setEditingSize] = useState<Size | null>(null);
  const [formData, setFormData] = useState<CreateSizeRequest>({
    size: "",
    display_order: 0,
  });

  // Selection state
  const [selectedSizes, setSelectedSizes] = useState<number[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Bulk add state
  const [bulkAddDialogOpen, setBulkAddDialogOpen] = useState(false);
  const [bulkSizesText, setBulkSizesText] = useState("");
  const [bulkStartOrder, setBulkStartOrder] = useState(1);
  const [bulkAddLoading, setBulkAddLoading] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    fetchSizes();
  }, []);

  const fetchSizes = async (retryCount = 0) => {
    try {
      const response = await fetch("/api/sizes", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        // Add cache control to avoid browser caching issues
        cache: "no-cache",
      });

      if (response.ok) {
        const data = await response.json();
        setSizes(data);
        setLoading(false);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error fetching sizes:", error);

      // Retry once if this is the first attempt
      if (retryCount === 0) {
        console.log("Retrying fetch sizes...");
        setTimeout(() => fetchSizes(1), 1000);
        return;
      }

      toast({
        title: "Erro",
        description:
          "Não foi possível carregar os tamanhos. Verifique sua conexão.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingSize ? `/api/sizes/${editingSize.id}` : "/api/sizes";
      const method = editingSize ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
        cache: "no-cache",
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: editingSize
            ? "Tamanho atualizado com sucesso"
            : "Tamanho criado com sucesso",
        });
        setDialogOpen(false);
        setEditingSize(null);
        setFormData({ size: "", display_order: 0 });
        fetchSizes();
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

  const handleEdit = (size: Size) => {
    setEditingSize(size);
    setFormData({
      size: size.size,
      display_order: size.display_order,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este tamanho?")) return;

    try {
      const response = await fetch(`/api/sizes/${id}`, {
        method: "DELETE",
        cache: "no-cache",
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Tamanho excluído com sucesso",
        });
        fetchSizes();
      } else {
        throw new Error("Erro ao excluir tamanho");
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleNewSize = () => {
    setEditingSize(null);
    setFormData({ size: "", display_order: 0 });
    setDialogOpen(true);
  };

  // Selection functions
  const isAllSelected =
    sizes.length > 0 && selectedSizes.length === sizes.length;
  const isIndeterminate =
    selectedSizes.length > 0 && selectedSizes.length < sizes.length;

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedSizes([]);
    } else {
      setSelectedSizes(sizes.map((size) => size.id));
    }
  };

  const handleSelectSize = (sizeId: number) => {
    setSelectedSizes((prev) =>
      prev.includes(sizeId)
        ? prev.filter((id) => id !== sizeId)
        : [...prev, sizeId],
    );
  };

  const handleBulkDelete = async () => {
    if (selectedSizes.length === 0) return;

    const confirmMessage = `Tem certeza que deseja excluir ${selectedSizes.length} tamanho${selectedSizes.length !== 1 ? "s" : ""}?`;
    if (!confirm(confirmMessage)) return;

    setBulkActionLoading(true);
    try {
      const deletePromises = selectedSizes.map((id) =>
        fetch(`/api/sizes/${id}`, {
          method: "DELETE",
          cache: "no-cache",
        }),
      );

      const results = await Promise.all(deletePromises);
      const failed = results.filter((r) => !r.ok);

      if (failed.length === 0) {
        toast({
          title: "Sucesso",
          description: `${selectedSizes.length} tamanho${selectedSizes.length !== 1 ? "s" : ""} excluído${selectedSizes.length !== 1 ? "s" : ""} com sucesso`,
        });
        setSelectedSizes([]);
        fetchSizes();
      } else {
        throw new Error(`${failed.length} tamanhos não puderam ser excluídos`);
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir tamanhos selecionados",
        variant: "destructive",
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const clearSelection = () => {
    setSelectedSizes([]);
  };

  // Bulk add functions
  const handleBulkAdd = async () => {
    if (!bulkSizesText.trim()) {
      toast({
        title: "Erro",
        description: "Digite os tamanhos que deseja adicionar",
        variant: "destructive",
      });
      return;
    }

    setBulkAddLoading(true);
    try {
      // Parse sizes from text (split by comma, newline, or space)
      const sizesArray = bulkSizesText
        .split(/[,\n\s]+/)
        .map((size) => size.trim())
        .filter((size) => size.length > 0);

      if (sizesArray.length === 0) {
        throw new Error("Nenhum tamanho válido encontrado");
      }

      // Check for duplicates in existing sizes
      const existingSizes = sizes.map((s) => s.size.toLowerCase());
      const duplicates = sizesArray.filter((size) =>
        existingSizes.includes(size.toLowerCase()),
      );

      if (duplicates.length > 0) {
        toast({
          title: "Aviso",
          description: `Tamanhos já existentes serão ignorados: ${duplicates.join(", ")}`,
        });
      }

      // Filter out duplicates
      const newSizes = sizesArray.filter(
        (size) => !existingSizes.includes(size.toLowerCase()),
      );

      if (newSizes.length === 0) {
        throw new Error("Todos os tamanhos já existem no sistema");
      }

      // Create requests for each size
      const createPromises = newSizes.map((size, index) =>
        fetch("/api/sizes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            size: size,
            display_order: bulkStartOrder + index,
          }),
          cache: "no-cache",
        }),
      );

      const results = await Promise.all(createPromises);
      const failed = results.filter((r) => !r.ok);

      if (failed.length === 0) {
        toast({
          title: "Sucesso",
          description: `${newSizes.length} tamanho${newSizes.length !== 1 ? "s" : ""} adicionado${newSizes.length !== 1 ? "s" : ""} com sucesso`,
        });
        setBulkAddDialogOpen(false);
        setBulkSizesText("");
        setBulkStartOrder(1);
        fetchSizes();
      } else {
        throw new Error(`${failed.length} tamanhos não puderam ser criados`);
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao adicionar tamanhos em lote",
        variant: "destructive",
      });
    } finally {
      setBulkAddLoading(false);
    }
  };

  const handleBulkAddDialog = () => {
    // Calculate next order based on existing sizes
    const maxOrder =
      sizes.length > 0 ? Math.max(...sizes.map((s) => s.display_order)) : 0;
    setBulkStartOrder(maxOrder + 1);
    setBulkAddDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">
            Carregando tamanhos...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tamanhos</h1>
        <p className="text-muted-foreground">
          Gerencie os tamanhos disponíveis para seus produtos
        </p>
      </div>

      <div className="space-y-6">
        {/* Bulk Actions Bar */}
        {selectedSizes.length > 0 && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">
                    {selectedSizes.length} tamanho
                    {selectedSizes.length !== 1 ? "s" : ""} selecionado
                    {selectedSizes.length !== 1 ? "s" : ""}
                  </span>
                  <Button variant="outline" size="sm" onClick={clearSelection}>
                    Limpar seleção
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    disabled={bulkActionLoading}
                  >
                    {bulkActionLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Excluir Selecionados
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Lista de Tamanhos</h2>
            <p className="text-muted-foreground">
              Gerencie os tamanhos individuais disponíveis
            </p>
          </div>
          <div className="flex gap-2">
            {/* Bulk Add Dialog */}
            <Dialog
              open={bulkAddDialogOpen}
              onOpenChange={setBulkAddDialogOpen}
            >
              <DialogTrigger asChild>
                <Button variant="outline" onClick={handleBulkAddDialog}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Adicionar em Lote
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Adicionar Tamanhos em Lote</DialogTitle>
                  <DialogDescription>
                    Digite os tamanhos separados por vírgula, espaço ou quebra
                    de linha
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="bulk-sizes">Tamanhos</Label>
                    <Textarea
                      id="bulk-sizes"
                      placeholder="Ex: 32, 34, 36, 38, 40&#10;ou&#10;32&#10;34&#10;36&#10;38&#10;40"
                      value={bulkSizesText}
                      onChange={(e) => setBulkSizesText(e.target.value)}
                      rows={6}
                      className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                      Separe os tamanhos por vírgula, espaço ou quebra de linha
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="bulk-start-order">Ordem Inicial</Label>
                    <Input
                      id="bulk-start-order"
                      type="number"
                      value={bulkStartOrder}
                      onChange={(e) =>
                        setBulkStartOrder(parseInt(e.target.value) || 1)
                      }
                      min="1"
                    />
                    <p className="text-xs text-muted-foreground">
                      A ordem será incrementada automaticamente para cada
                      tamanho
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setBulkAddDialogOpen(false)}
                    disabled={bulkAddLoading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    onClick={handleBulkAdd}
                    disabled={bulkAddLoading || !bulkSizesText.trim()}
                  >
                    {bulkAddLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Adicionando...
                      </>
                    ) : (
                      <>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Adicionar Tamanhos
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Single Add Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleNewSize}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Tamanho
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>
                      {editingSize ? "Editar Tamanho" : "Novo Tamanho"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingSize
                        ? "Atualize as informações do tamanho"
                        : "Adicione um novo tamanho para seus produtos"}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="size">Tamanho</Label>
                      <Input
                        id="size"
                        value={formData.size}
                        onChange={(e) =>
                          setFormData({ ...formData, size: e.target.value })
                        }
                        placeholder="Ex: 32, 34, 36, 38, 40"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="display_order">Ordem de Exibição</Label>
                      <Input
                        id="display_order"
                        type="number"
                        value={formData.display_order}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            display_order: parseInt(e.target.value) || 0,
                          })
                        }
                        placeholder="Ex: 1, 2, 3..."
                      />
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
                      {editingSize ? "Atualizar" : "Criar"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ruler className="h-5 w-5" />
              Tamanhos Cadastrados
            </CardTitle>
            <CardDescription>
              {sizes.length === 0
                ? "Nenhum tamanho cadastrado"
                : `${sizes.length} tamanho${sizes.length !== 1 ? "s" : ""} cadastrado${sizes.length !== 1 ? "s" : ""}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sizes.length === 0 ? (
              <div className="text-center py-8">
                <Ruler className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-2 text-sm font-semibold">
                  Nenhum tamanho cadastrado
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Comece adicionando os tamanhos para seus produtos.
                </p>
                <div className="mt-6 flex gap-2 justify-center">
                  <Button onClick={handleBulkAddDialog} variant="outline">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar em Lote
                  </Button>
                  <Button onClick={handleNewSize}>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Tamanho
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
                        onCheckedChange={handleSelectAll}
                        className={
                          isIndeterminate
                            ? "data-[state=checked]:bg-blue-600"
                            : ""
                        }
                      />
                    </TableHead>
                    <TableHead>Tamanho</TableHead>
                    <TableHead>Ordem</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sizes
                    .sort((a, b) => a.display_order - b.display_order)
                    .map((size) => (
                      <TableRow
                        key={size.id}
                        className={
                          selectedSizes.includes(size.id) ? "bg-blue-50" : ""
                        }
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedSizes.includes(size.id)}
                            onCheckedChange={() => handleSelectSize(size.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {size.size}
                        </TableCell>
                        <TableCell>{size.display_order}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(size.created_at).toLocaleDateString(
                            "pt-BR",
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleEdit(size)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleDelete(size.id)}
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
    </div>
  );
}
