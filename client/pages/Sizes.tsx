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
import { Plus, Edit2, Trash2, Ruler, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Size, CreateSizeRequest } from "@shared/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useSizeGroups, SizeGroup } from "@/hooks/use-size-groups";

export default function Sizes() {
  const [sizes, setSizes] = useState<Size[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSize, setEditingSize] = useState<Size | null>(null);
  const [formData, setFormData] = useState<CreateSizeRequest>({
    size: "",
    display_order: 0,
  });

  // Hook para grupos de tamanhos integrado com banco de dados
  const {
    sizeGroups,
    loading: sizeGroupsLoading,
    error: sizeGroupsError,
    addGroup,
    updateGroup,
    deleteGroup,
    refetch: refetchSizeGroups,
  } = useSizeGroups();

  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<SizeGroup | null>(null);
  const [groupFormData, setGroupFormData] = useState<
    Omit<SizeGroup, "id" | "created_at" | "updated_at">
  >({
    name: "",
    description: "",
    icon: "",
    sizes: [],
    active: true,
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
        resetForm();
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

  const resetForm = () => {
    setEditingSize(null);
    setFormData({
      size: "",
      display_order: 0,
    });
  };

  const resetGroupForm = () => {
    setEditingGroup(null);
    setGroupFormData({
      name: "",
      description: "",
      icon: "",
      sizes: [],
      active: true,
    });
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
    resetForm();
    setDialogOpen(true);
  };

  const handleNewGroup = () => {
    resetGroupForm();
    setGroupDialogOpen(true);
  };

  const handleEditGroup = (group: SizeGroup) => {
    setEditingGroup(group);
    setGroupFormData({
      name: group.name,
      description: group.description || "",
      icon: group.icon || "",
      sizes: group.sizes,
      active: group.active,
    });
    setGroupDialogOpen(true);
  };

  const handleSaveGroup = async () => {
    if (!groupFormData.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome do grupo é obrigatório",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingGroup) {
        await updateGroup(editingGroup.id, groupFormData);
        toast({
          title: "Sucesso",
          description: "Grupo atualizado com sucesso",
        });
      } else {
        await addGroup(groupFormData);
        toast({
          title: "Sucesso",
          description: "Grupo criado com sucesso",
        });
      }

      setGroupDialogOpen(false);
      resetGroupForm();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteGroup = async (groupId: number) => {
    if (!confirm("Tem certeza que deseja excluir este grupo?")) return;

    try {
      await deleteGroup(groupId);
      toast({
        title: "Sucesso",
        description: "Grupo excluído com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleSizeInGroup = (sizeValue: string) => {
    setGroupFormData((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(sizeValue)
        ? prev.sizes.filter((s) => s !== sizeValue)
        : [...prev.sizes, sizeValue],
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tamanhos</h1>
        <p className="text-muted-foreground">
          Configure os tamanhos e grupos de tamanhos disponíveis para seus
          produtos
        </p>
      </div>

      <Tabs defaultValue="sizes" className="space-y-6">
        <TabsList>
          <TabsTrigger value="sizes">
            <Ruler className="mr-2 h-4 w-4" />
            Tamanhos
          </TabsTrigger>
          <TabsTrigger value="groups">
            <Users className="mr-2 h-4 w-4" />
            Grupos de Tamanhos
          </TabsTrigger>
        </TabsList>

        {/* Aba de Tamanhos */}
        <TabsContent value="sizes" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Lista de Tamanhos</h2>
              <p className="text-muted-foreground">
                Gerencie os tamanhos individuais disponíveis
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

          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tamanho</TableHead>
                    <TableHead>Ordem de Exibição</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sizes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8">
                        <Ruler className="mx-auto h-8 w-8 text-muted-foreground/50" />
                        <p className="mt-2 text-sm text-muted-foreground">
                          Nenhum tamanho cadastrado
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    sizes.map((size) => (
                      <TableRow key={size.id}>
                        <TableCell className="font-medium">
                          {size.size}
                        </TableCell>
                        <TableCell>{size.display_order}</TableCell>
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
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Grupos de Tamanhos */}
        <TabsContent value="groups" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Grupos de Tamanhos</h2>
              <p className="text-muted-foreground">
                Crie grupos para facilitar a seleção de tamanhos durante a
                criação de produtos
              </p>
            </div>
            <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleNewGroup}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Grupo
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingGroup ? "Editar Grupo" : "Novo Grupo de Tamanhos"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingGroup
                      ? "Atualize as informações do grupo"
                      : "Crie um novo grupo de tamanhos para facilitar a criação de produtos"}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="groupName">Nome do Grupo</Label>
                      <Input
                        id="groupName"
                        value={groupFormData.name}
                        onChange={(e) =>
                          setGroupFormData({
                            ...groupFormData,
                            name: e.target.value,
                          })
                        }
                        placeholder="Ex: Masculino, Feminino, Infantil"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="groupIcon">Ícone (Emoji)</Label>
                      <Input
                        id="groupIcon"
                        value={groupFormData.icon}
                        onChange={(e) =>
                          setGroupFormData({
                            ...groupFormData,
                            icon: e.target.value,
                          })
                        }
                        placeholder="Ex: 👨, 👩, 👶"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="groupDescription">Descrição</Label>
                    <Input
                      id="groupDescription"
                      value={groupFormData.description}
                      onChange={(e) =>
                        setGroupFormData({
                          ...groupFormData,
                          description: e.target.value,
                        })
                      }
                      placeholder="Descrição do grupo"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Tamanhos do Grupo</Label>
                    <div className="grid grid-cols-6 gap-2 p-4 border rounded-lg">
                      {sizes.map((size) => (
                        <div
                          key={size.id}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`size-${size.id}`}
                            checked={groupFormData.sizes.includes(size.size)}
                            onCheckedChange={() => toggleSizeInGroup(size.size)}
                          />
                          <Label
                            htmlFor={`size-${size.id}`}
                            className="text-sm"
                          >
                            {size.size}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {groupFormData.sizes.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        <span className="text-sm text-muted-foreground">
                          Selecionados:
                        </span>
                        {groupFormData.sizes.map((size) => (
                          <Badge
                            key={size}
                            variant="secondary"
                            className="text-xs"
                          >
                            {size}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setGroupDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveGroup}>
                    {editingGroup ? "Atualizar" : "Criar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {sizeGroupsLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Carregando grupos...
                </p>
              </div>
            </div>
          ) : sizeGroupsError ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-red-500">
                  <p>Erro ao carregar grupos: {sizeGroupsError}</p>
                  <Button
                    onClick={refetchSizeGroups}
                    variant="outline"
                    className="mt-2"
                  >
                    Tentar novamente
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {sizeGroups.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <Users className="mx-auto h-8 w-8 text-muted-foreground/50" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        Nenhum grupo de tamanhos cadastrado
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                sizeGroups.map((group) => (
                  <Card key={group.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{group.icon}</div>
                          <div>
                            <CardTitle className="text-lg">
                              {group.name}
                            </CardTitle>
                            {group.description && (
                              <CardDescription>
                                {group.description}
                              </CardDescription>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={group.active ? "default" : "secondary"}
                          >
                            {group.active ? "Ativo" : "Inativo"}
                          </Badge>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEditGroup(group)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDeleteGroup(group.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div>
                        <Label className="text-sm font-medium">
                          Tamanhos ({group.sizes.length}):
                        </Label>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {group.sizes.map((size) => (
                            <Badge
                              key={size}
                              variant="outline"
                              className="text-xs"
                            >
                              {size}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
