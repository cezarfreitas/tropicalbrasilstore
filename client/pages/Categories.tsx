import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Edit2, Trash2, ShoppingBag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Category, CreateCategoryRequest } from "@shared/types";

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [formData, setFormData] = useState<CreateCategoryRequest>({
    name: "",
    description: "",
    show_in_menu: true,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
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
      toast({
        title: "Erro",
        description: "Não foi possível carregar as categorias",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingCategory
        ? `/api/categories/${editingCategory.id}`
        : "/api/categories";
      const method = editingCategory ? "PUT" : "POST";

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
          description: editingCategory
            ? "Categoria atualizada com sucesso"
            : "Categoria criada com sucesso",
        });
        setDialogOpen(false);
        setEditingCategory(null);
        setFormData({ name: "", description: "", show_in_menu: true });
        fetchCategories();
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

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      show_in_menu: category.show_in_menu ?? true,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir esta categoria?")) return;

    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Categoria excluída com sucesso",
        });
        fetchCategories();
      } else {
        throw new Error("Erro ao excluir categoria");
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleNewCategory = () => {
    setEditingCategory(null);
    setFormData({ name: "", description: "", show_in_menu: true });
    setDialogOpen(true);
  };

  const toggleShowInMenu = async (category: Category) => {
    try {
      const newStatus = !category.show_in_menu;

      const response = await fetch(`/api/categories/${category.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: category.name,
          description: category.description,
          show_in_menu: newStatus,
        }),
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: `Categoria ${newStatus ? "adicionada ao" : "removida do"} menu`,
        });
        fetchCategories();
      } else {
        throw new Error("Erro ao atualizar categoria");
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Funções de seleção múltipla
  const isAllSelected =
    categories.length > 0 && selectedCategories.length === categories.length;
  const isIndeterminate =
    selectedCategories.length > 0 &&
    selectedCategories.length < categories.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(categories.map((category) => category.id));
    }
  };

  const toggleCategorySelection = (categoryId: number) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId],
    );
  };

  const clearSelection = () => {
    setSelectedCategories([]);
  };

  const handleBulkDelete = async () => {
    if (selectedCategories.length === 0) return;

    const confirmMessage = `Tem certeza que deseja excluir ${selectedCategories.length} categoria${selectedCategories.length !== 1 ? "s" : ""}?`;

    if (!confirm(confirmMessage)) return;

    try {
      const deletePromises = selectedCategories.map((id) =>
        fetch(`/api/categories/${id}`, {
          method: "DELETE",
        }),
      );

      const results = await Promise.all(deletePromises);
      const failed = results.filter((r) => !r.ok);

      if (failed.length === 0) {
        toast({
          title: "Sucesso",
          description: `${selectedCategories.length} categoria${selectedCategories.length !== 1 ? "s" : ""} excluída${selectedCategories.length !== 1 ? "s" : ""} com sucesso`,
        });
        setSelectedCategories([]);
        fetchCategories();
      } else {
        throw new Error(
          `${failed.length} categoria${failed.length !== 1 ? "s" : ""} não puderam ser excluída${failed.length !== 1 ? "s" : ""}`,
        );
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
            Carregando categorias...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categorias</h1>
          <p className="text-muted-foreground">
            Gerencie as categorias dos seus produtos
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewCategory}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Categoria
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? "Editar Categoria" : "Nova Categoria"}
                </DialogTitle>
                <DialogDescription>
                  {editingCategory
                    ? "Atualize as informações da categoria"
                    : "Crie uma nova categoria para organizar seus produtos"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Ex: Chinelos Masculinos"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Descrição da categoria (opcional)"
                    rows={3}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show_in_menu"
                    checked={formData.show_in_menu}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        show_in_menu: checked as boolean,
                      })
                    }
                  />
                  <Label htmlFor="show_in_menu" className="text-sm font-normal">
                    Mostrar no menu da loja
                  </Label>
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
                  {editingCategory ? "Atualizar" : "Criar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Barra de ações para seleção múltipla */}
      {selectedCategories.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">
                  {selectedCategories.length} categoria
                  {selectedCategories.length !== 1 ? "s" : ""} selecionada
                  {selectedCategories.length !== 1 ? "s" : ""}
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
            <ShoppingBag className="h-5 w-5" />
            Lista de Categorias
          </CardTitle>
          <CardDescription>
            {categories.length === 0
              ? "Nenhuma categoria cadastrada"
              : `${categories.length} categoria${categories.length !== 1 ? "s" : ""} cadastrada${categories.length !== 1 ? "s" : ""}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-2 text-sm font-semibold">
                Nenhuma categoria cadastrada
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Comece criando sua primeira categoria de produtos.
              </p>
              <div className="mt-6">
                <Button onClick={handleNewCategory}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Categoria
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
                        if (el) (el as any).indeterminate = isIndeterminate;
                      }}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Selecionar todas as categorias"
                      className={
                        isIndeterminate
                          ? "data-[state=checked]:bg-blue-600"
                          : ""
                      }
                    />
                  </TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Menu</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow
                    key={category.id}
                    className={
                      selectedCategories.includes(category.id)
                        ? "bg-blue-50"
                        : ""
                    }
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedCategories.includes(category.id)}
                        onCheckedChange={() =>
                          toggleCategorySelection(category.id)
                        }
                        aria-label={`Selecionar categoria ${category.name}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {category.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {category.description || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          category.show_in_menu ? "default" : "secondary"
                        }
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => toggleShowInMenu(category)}
                        title={`Clique para ${category.show_in_menu ? "remover do" : "adicionar ao"} menu`}
                      >
                        {category.show_in_menu ? "Sim" : "Não"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(category.created_at).toLocaleDateString(
                        "pt-BR",
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(category)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDelete(category.id)}
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
