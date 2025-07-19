import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, Grid3x3, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  GradeVendida,
  CreateGradeRequest,
  Product,
  Size,
  Color,
} from "@shared/types";

interface GradeItemForm {
  product_id: number;
  size_id: number;
  color_id: number;
  quantity: number;
}

export default function Grades() {
  const [grades, setGrades] = useState<GradeVendida[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<GradeVendida | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    total_price?: number;
    items: GradeItemForm[];
  }>({
    name: "",
    description: "",
    total_price: undefined,
    items: [],
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchGrades();
    fetchProducts();
    fetchSizes();
    fetchColors();
  }, []);

  const fetchGrades = async () => {
    try {
      const response = await fetch("/api/grades");
      if (response.ok) {
        const data = await response.json();
        setGrades(data);
      }
    } catch (error) {
      console.error("Error fetching grades:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as grades",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products");
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchSizes = async () => {
    try {
      const response = await fetch("/api/sizes");
      if (response.ok) {
        const data = await response.json();
        setSizes(data);
      }
    } catch (error) {
      console.error("Error fetching sizes:", error);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.items.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um item à grade",
        variant: "destructive",
      });
      return;
    }

    try {
      const url = editingGrade
        ? `/api/grades/${editingGrade.id}`
        : "/api/grades";
      const method = editingGrade ? "PUT" : "POST";

      const submitData: CreateGradeRequest = {
        name: formData.name,
        description: formData.description,
        total_price: formData.total_price,
        items: formData.items,
      };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: editingGrade
            ? "Grade atualizada com sucesso"
            : "Grade criada com sucesso",
        });
        setDialogOpen(false);
        setEditingGrade(null);
        setFormData({
          name: "",
          description: "",
          total_price: undefined,
          items: [],
        });
        fetchGrades();
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

  const handleEdit = (grade: GradeVendida) => {
    setEditingGrade(grade);
    setFormData({
      name: grade.name,
      description: grade.description || "",
      total_price: grade.total_price,
      items:
        grade.items?.map((item: any) => ({
          product_id: item.product_id,
          size_id: item.size_id,
          color_id: item.color_id,
          quantity: item.quantity,
        })) || [],
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir esta grade?")) return;

    try {
      const response = await fetch(`/api/grades/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Grade excluída com sucesso",
        });
        fetchGrades();
      } else {
        throw new Error("Erro ao excluir grade");
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleNewGrade = () => {
    setEditingGrade(null);
    setFormData({
      name: "",
      description: "",
      total_price: undefined,
      items: [],
    });
    setDialogOpen(true);
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          product_id: 0,
          size_id: 0,
          color_id: 0,
          quantity: 1,
        },
      ],
    });
  };

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const updateItem = (
    index: number,
    field: keyof GradeItemForm,
    value: any,
  ) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">
            Carregando grades...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Grade Vendida</h1>
          <p className="text-muted-foreground">
            Configure kits de venda com quantidades obrigatórias
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewGrade}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Grade
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingGrade ? "Editar Grade" : "Nova Grade"}
                </DialogTitle>
                <DialogDescription>
                  {editingGrade
                    ? "Atualize as informações da grade"
                    : "Crie um novo kit de venda com quantidades obrigatórias"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nome da Grade</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Ex: Grade Chinelo Básico"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="total_price">Preço Total (R$)</Label>
                    <Input
                      id="total_price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.total_price || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          total_price: e.target.value
                            ? parseFloat(e.target.value)
                            : undefined,
                        })
                      }
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Descrição da grade de vendas"
                    rows={2}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base">Itens da Grade</Label>
                    <Button type="button" onClick={addItem} size="sm">
                      <Plus className="mr-1 h-3 w-3" />
                      Adicionar Item
                    </Button>
                  </div>

                  {formData.items.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg">
                      <Grid3x3 className="mx-auto h-8 w-8 text-muted-foreground/50" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        Nenhum item adicionado
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Clique em "Adicionar Item" para começar
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {formData.items.map((item, index) => (
                        <Card key={index}>
                          <CardContent className="pt-4">
                            <div className="grid grid-cols-5 gap-4 items-end">
                              <div className="grid gap-2">
                                <Label>Produto</Label>
                                <Select
                                  value={item.product_id.toString()}
                                  onValueChange={(value) =>
                                    updateItem(
                                      index,
                                      "product_id",
                                      parseInt(value),
                                    )
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Produto" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {products.map((product) => (
                                      <SelectItem
                                        key={product.id}
                                        value={product.id.toString()}
                                      >
                                        {product.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="grid gap-2">
                                <Label>Tamanho</Label>
                                <Select
                                  value={item.size_id.toString()}
                                  onValueChange={(value) =>
                                    updateItem(
                                      index,
                                      "size_id",
                                      parseInt(value),
                                    )
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Tamanho" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {sizes.map((size) => (
                                      <SelectItem
                                        key={size.id}
                                        value={size.id.toString()}
                                      >
                                        {size.size}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="grid gap-2">
                                <Label>Cor</Label>
                                <Select
                                  value={item.color_id.toString()}
                                  onValueChange={(value) =>
                                    updateItem(
                                      index,
                                      "color_id",
                                      parseInt(value),
                                    )
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Cor" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {colors.map((color) => (
                                      <SelectItem
                                        key={color.id}
                                        value={color.id.toString()}
                                      >
                                        <div className="flex items-center gap-2">
                                          <div
                                            className="w-4 h-4 rounded border"
                                            style={{
                                              backgroundColor:
                                                color.hex_code || "#999999",
                                            }}
                                          ></div>
                                          {color.name}
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="grid gap-2">
                                <Label>Quantidade</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) =>
                                    updateItem(
                                      index,
                                      "quantity",
                                      parseInt(e.target.value) || 1,
                                    )
                                  }
                                />
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => removeItem(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
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
                  {editingGrade ? "Atualizar" : "Criar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid3x3 className="h-5 w-5" />
            Lista de Grades
          </CardTitle>
          <CardDescription>
            {grades.length === 0
              ? "Nenhuma grade cadastrada"
              : `${grades.length} grade${grades.length !== 1 ? "s" : ""} cadastrada${grades.length !== 1 ? "s" : ""}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {grades.length === 0 ? (
            <div className="text-center py-8">
              <Grid3x3 className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-2 text-sm font-semibold">
                Nenhuma grade cadastrada
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Crie sua primeira grade de vendas com quantidades obrigatórias.
              </p>
              <div className="mt-6">
                <Button onClick={handleNewGrade}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Grade
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {grades.map((grade) => (
                <Card key={grade.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{grade.name}</CardTitle>
                        {grade.description && (
                          <CardDescription>{grade.description}</CardDescription>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {grade.total_price && (
                          <Badge variant="outline">
                            R$ {grade.total_price.toFixed(2)}
                          </Badge>
                        )}
                        <Badge variant={grade.active ? "default" : "secondary"}>
                          {grade.active ? "Ativa" : "Inativa"}
                        </Badge>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(grade)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDelete(grade.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {grade.items && grade.items.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Produto</TableHead>
                            <TableHead>Tamanho</TableHead>
                            <TableHead>Cor</TableHead>
                            <TableHead>Quantidade</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {grade.items.map((item: any, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">
                                {item.product_name || "—"}
                              </TableCell>
                              <TableCell>{item.size || "—"}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {item.hex_code && (
                                    <div
                                      className="w-4 h-4 rounded border"
                                      style={{
                                        backgroundColor: item.hex_code,
                                      }}
                                    ></div>
                                  )}
                                  {item.color_name || "—"}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">
                                  {item.quantity} unidades
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Nenhum item configurado nesta grade.
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
