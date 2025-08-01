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

export default function Colors() {
  const [colors, setColors] = useState<Color[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingColor, setEditingColor] = useState<Color | null>(null);
  const [selectedColors, setSelectedColors] = useState<number[]>([]);
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
    setDialogOpen(true);
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
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Ex: Azul Marinho, Vermelho, Rosa"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="hex_code">Código da Cor (Opcional)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="hex_code"
                      value={formData.hex_code}
                      onChange={(e) =>
                        setFormData({ ...formData, hex_code: e.target.value })
                      }
                      placeholder="#FF0000"
                      pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                    />
                    {formData.hex_code && (
                      <div
                        className="w-12 h-10 rounded border border-border"
                        style={{ backgroundColor: formData.hex_code }}
                      ></div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Formato: #FFFFFF ou #FFF
                  </p>
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
                  <TableHead>Cor</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {colors.map((color) => (
                  <TableRow key={color.id}>
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
