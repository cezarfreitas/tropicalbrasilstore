import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Edit2, Trash2, Ruler, Users, Palette } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Size, CreateSizeRequest } from "@shared/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

interface SizeGroup {
  id: string;
  name: string;
  description: string;
  icon: string;
  sizes: string[];
}

export default function Sizes() {
  const [sizes, setSizes] = useState<Size[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSize, setEditingSize] = useState<Size | null>(null);
  const [formData, setFormData] = useState<CreateSizeRequest>({
    size: "",
    display_order: 0,
  });

  // Estados para grupos de tamanhos
  const [sizeGroups, setSizeGroups] = useState<SizeGroup[]>([
    {
      id: "masculino",
      name: "Masculino",
      description: "Tamanhos masculinos adultos",
      icon: "👨",
      sizes: ["38", "39", "40", "41", "42", "43", "44"]
    },
    {
      id: "feminino",
      name: "Feminino",
      description: "Tamanhos femininos adultos",
      icon: "👩",
      sizes: ["33", "34", "35", "36", "37", "38", "39"]
    },
    {
      id: "infantil",
      name: "Infantil",
      description: "Tamanhos infantis",
      icon: "👶",
      sizes: ["32", "33", "34", "35", "36"]
    }
  ]);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<SizeGroup | null>(null);
  const [groupFormData, setGroupFormData] = useState<Omit<SizeGroup, 'id'>>({
    name: "",
    description: "",
    icon: "",
    sizes: []
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchSizes();
  }, []);

  const fetchSizes = async () => {
    try {
      const response = await fetch("/api/sizes");
      if (response.ok) {
        const data = await response.json();
        setSizes(data);
      }
    } catch (error) {
      console.error("Error fetching sizes:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os tamanhos",
        variant: "destructive",
      });
    } finally {
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
    setFormData({ size: "", display_order: sizes.length });
    setDialogOpen(true);
  };

  // Funções para grupos de tamanhos
  const handleNewGroup = () => {
    setEditingGroup(null);
    setGroupFormData({
      name: "",
      description: "",
      icon: "",
      sizes: []
    });
    setGroupDialogOpen(true);
  };

  const handleEditGroup = (group: SizeGroup) => {
    setEditingGroup(group);
    setGroupFormData({
      name: group.name,
      description: group.description,
      icon: group.icon,
      sizes: [...group.sizes]
    });
    setGroupDialogOpen(true);
  };

  const handleSaveGroup = () => {
    if (!groupFormData.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome do grupo é obrigatório",
        variant: "destructive",
      });
      return;
    }

    const groupId = editingGroup?.id || groupFormData.name.toLowerCase().replace(/\s+/g, '_');
    const newGroup: SizeGroup = {
      id: groupId,
      ...groupFormData
    };

    if (editingGroup) {
      setSizeGroups(prev => prev.map(g => g.id === editingGroup.id ? newGroup : g));
      toast({
        title: "Sucesso",
        description: "Grupo atualizado com sucesso",
      });
    } else {
      setSizeGroups(prev => [...prev, newGroup]);
      toast({
        title: "Sucesso",
        description: "Grupo criado com sucesso",
      });
    }

    setGroupDialogOpen(false);
    setEditingGroup(null);
  };

  const handleDeleteGroup = (groupId: string) => {
    if (!confirm("Tem certeza que deseja excluir este grupo?")) return;

    setSizeGroups(prev => prev.filter(g => g.id !== groupId));
    toast({
      title: "Sucesso",
      description: "Grupo excluído com sucesso",
    });
  };

  const toggleSizeInGroup = (sizeValue: string) => {
    setGroupFormData(prev => ({
      ...prev,
      sizes: prev.sizes.includes(sizeValue)
        ? prev.sizes.filter(s => s !== sizeValue)
        : [...prev.sizes, sizeValue]
    }));
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tamanhos</h1>
          <p className="text-muted-foreground">
            Configure os tamanhos disponíveis para seus produtos
          </p>
        </div>
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
                    placeholder="0"
                    min="0"
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ruler className="h-5 w-5" />
            Lista de Tamanhos
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
                Comece criando os tamanhos disponíveis para seus chinelos.
              </p>
              <div className="mt-6">
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
                  <TableHead>Tamanho</TableHead>
                  <TableHead>Ordem</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sizes.map((size) => (
                  <TableRow key={size.id}>
                    <TableCell className="font-medium">{size.size}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {size.display_order}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(size.created_at).toLocaleDateString("pt-BR")}
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
  );
}
