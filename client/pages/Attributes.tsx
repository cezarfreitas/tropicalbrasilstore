import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Plus, Edit2, Trash2, Tags, Users, Package, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Gender,
  Type,
  Brand,
  CreateGenderRequest,
  CreateTypeRequest,
  CreateBrandRequest,
} from "@shared/types";

export default function Attributes() {
  const [activeTab, setActiveTab] = useState("genders");
  const [genders, setGenders] = useState<Gender[]>([]);
  const [types, setTypes] = useState<Type[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Gender | Type | Brand | null>(null);
  const [selectedGenders, setSelectedGenders] = useState<number[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<number[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchGenders(), fetchTypes()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const fetchGenders = async (retryCount = 0) => {
    try {
      const response = await fetch("/api/genders", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-cache",
      });

      if (response.ok) {
        const data = await response.json();
        setGenders(data);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error fetching genders:", error);

      // Retry once if this is the first attempt
      if (retryCount === 0) {
        console.log("Retrying fetch genders...");
        setTimeout(() => fetchGenders(1), 1000);
        return;
      }

      toast({
        title: "Erro",
        description:
          "Não foi possível carregar os gêneros. Verifique sua conexão.",
        variant: "destructive",
      });
    }
  };

  const fetchTypes = async (retryCount = 0) => {
    try {
      const response = await fetch("/api/types", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-cache",
      });

      if (response.ok) {
        const data = await response.json();
        setTypes(data);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error fetching types:", error);

      // Retry once if this is the first attempt
      if (retryCount === 0) {
        console.log("Retrying fetch types...");
        setTimeout(() => fetchTypes(1), 1000);
        return;
      }

      toast({
        title: "Erro",
        description:
          "Não foi possível carregar os tipos. Verifique sua conexão.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const endpoint = activeTab === "genders" ? "/api/genders" : "/api/types";
      const url = editingItem ? `${endpoint}/${editingItem.id}` : endpoint;
      const method = editingItem ? "PUT" : "POST";

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
          description: editingItem
            ? `${activeTab === "genders" ? "Gênero" : "Tipo"} atualizado com sucesso`
            : `${activeTab === "genders" ? "Gênero" : "Tipo"} criado com sucesso`,
        });
        setDialogOpen(false);
        resetForm();
        setEditingItem(null);

        // Refresh the appropriate list
        if (activeTab === "genders") {
          fetchGenders();
        } else {
          fetchTypes();
        }
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

  const handleEdit = (item: Gender | Type) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este item?")) return;

    try {
      const endpoint = activeTab === "genders" ? "/api/genders" : "/api/types";
      const response = await fetch(`${endpoint}/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: `${activeTab === "genders" ? "Gênero" : "Tipo"} excluído com sucesso`,
        });

        // Refresh the appropriate list
        if (activeTab === "genders") {
          fetchGenders();
        } else {
          fetchTypes();
        }
      } else {
        throw new Error(
          `Erro ao excluir ${activeTab === "genders" ? "gênero" : "tipo"}`,
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

  const handleNew = () => {
    setEditingItem(null);
    resetForm();
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({ name: "", description: "" });
  };

  // Funções de seleção múltipla para Gêneros
  const isAllGendersSelected =
    genders.length > 0 && selectedGenders.length === genders.length;
  const isGendersIndeterminate =
    selectedGenders.length > 0 && selectedGenders.length < genders.length;

  const toggleSelectAllGenders = () => {
    if (isAllGendersSelected) {
      setSelectedGenders([]);
    } else {
      setSelectedGenders(genders.map((gender) => gender.id));
    }
  };

  const toggleGenderSelection = (genderId: number) => {
    setSelectedGenders((prev) =>
      prev.includes(genderId)
        ? prev.filter((id) => id !== genderId)
        : [...prev, genderId],
    );
  };

  const clearGenderSelection = () => {
    setSelectedGenders([]);
  };

  const handleBulkDeleteGenders = async () => {
    if (selectedGenders.length === 0) return;

    const confirmMessage = `Tem certeza que deseja excluir ${selectedGenders.length} gênero${selectedGenders.length !== 1 ? "s" : ""}?`;

    if (!confirm(confirmMessage)) return;

    try {
      const deletePromises = selectedGenders.map((id) =>
        fetch(`/api/genders/${id}`, {
          method: "DELETE",
        }),
      );

      const results = await Promise.all(deletePromises);
      const failed = results.filter((r) => !r.ok);

      if (failed.length === 0) {
        toast({
          title: "Sucesso",
          description: `${selectedGenders.length} gênero${selectedGenders.length !== 1 ? "s" : ""} excluído${selectedGenders.length !== 1 ? "s" : ""} com sucesso`,
        });
        setSelectedGenders([]);
        fetchGenders();
      } else {
        throw new Error(
          `${failed.length} gênero${failed.length !== 1 ? "s" : ""} não puderam ser excluído${failed.length !== 1 ? "s" : ""}`,
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

  // Funções de seleção múltipla para Tipos
  const isAllTypesSelected =
    types.length > 0 && selectedTypes.length === types.length;
  const isTypesIndeterminate =
    selectedTypes.length > 0 && selectedTypes.length < types.length;

  const toggleSelectAllTypes = () => {
    if (isAllTypesSelected) {
      setSelectedTypes([]);
    } else {
      setSelectedTypes(types.map((type) => type.id));
    }
  };

  const toggleTypeSelection = (typeId: number) => {
    setSelectedTypes((prev) =>
      prev.includes(typeId)
        ? prev.filter((id) => id !== typeId)
        : [...prev, typeId],
    );
  };

  const clearTypeSelection = () => {
    setSelectedTypes([]);
  };

  const handleBulkDeleteTypes = async () => {
    if (selectedTypes.length === 0) return;

    const confirmMessage = `Tem certeza que deseja excluir ${selectedTypes.length} tipo${selectedTypes.length !== 1 ? "s" : ""}?`;

    if (!confirm(confirmMessage)) return;

    try {
      const deletePromises = selectedTypes.map((id) =>
        fetch(`/api/types/${id}`, {
          method: "DELETE",
        }),
      );

      const results = await Promise.all(deletePromises);
      const failed = results.filter((r) => !r.ok);

      if (failed.length === 0) {
        toast({
          title: "Sucesso",
          description: `${selectedTypes.length} tipo${selectedTypes.length !== 1 ? "s" : ""} excluído${selectedTypes.length !== 1 ? "s" : ""} com sucesso`,
        });
        setSelectedTypes([]);
        fetchTypes();
      } else {
        throw new Error(
          `${failed.length} tipo${failed.length !== 1 ? "s" : ""} não puderam ser excluído${failed.length !== 1 ? "s" : ""}`,
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
            Carregando atributos...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Atributos</h1>
          <p className="text-muted-foreground">
            Gerencie os gêneros e tipos dos seus produtos
          </p>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="genders" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Gêneros
          </TabsTrigger>
          <TabsTrigger value="types" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Tipo
          </TabsTrigger>
        </TabsList>

        {/* Gêneros Tab */}
        <TabsContent value="genders" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Gêneros
                  </CardTitle>
                  <CardDescription>
                    Gerencie os gêneros dos produtos (Ex: Masculino, Feminino,
                    Unissex)
                  </CardDescription>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={handleNew}>
                      <Plus className="mr-2 h-4 w-4" />
                      Novo Gênero
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <form onSubmit={handleSubmit}>
                      <DialogHeader>
                        <DialogTitle>
                          {editingItem ? "Editar Gênero" : "Novo Gênero"}
                        </DialogTitle>
                        <DialogDescription>
                          {editingItem
                            ? "Atualize as informações do gênero"
                            : "Crie um novo gênero para categorizar seus produtos"}
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
                            placeholder="Ex: Masculino, Feminino, Unissex"
                            required
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="description">Descrição</Label>
                          <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                description: e.target.value,
                              })
                            }
                            placeholder="Descrição do gênero (opcional)"
                            rows={3}
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
                          {editingItem ? "Atualizar" : "Criar"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>

            {/* Barra de ações para seleção múltipla de gêneros */}
            {selectedGenders.length > 0 && (
              <div className="mx-6 mb-4">
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium">
                          {selectedGenders.length} gênero
                          {selectedGenders.length !== 1 ? "s" : ""} selecionado
                          {selectedGenders.length !== 1 ? "s" : ""}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearGenderSelection}
                        >
                          Limpar seleção
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleBulkDeleteGenders}
                          className="flex items-center gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          Excluir selecionados
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <CardContent>
              {genders.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-2 text-sm font-semibold">
                    Nenhum gênero cadastrado
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Comece criando seu primeiro gênero de produtos.
                  </p>
                  <div className="mt-6">
                    <Button onClick={handleNew}>
                      <Plus className="mr-2 h-4 w-4" />
                      Novo Gênero
                    </Button>
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox
                          checked={isAllGendersSelected}
                          ref={(el) => {
                            if (el) el.indeterminate = isGendersIndeterminate;
                          }}
                          onCheckedChange={toggleSelectAllGenders}
                          aria-label="Selecionar todos os gêneros"
                          className={
                            isGendersIndeterminate
                              ? "data-[state=checked]:bg-blue-600"
                              : ""
                          }
                        />
                      </TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead className="w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {genders.map((gender) => (
                      <TableRow
                        key={gender.id}
                        className={
                          selectedGenders.includes(gender.id)
                            ? "bg-blue-50"
                            : ""
                        }
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedGenders.includes(gender.id)}
                            onCheckedChange={() =>
                              toggleGenderSelection(gender.id)
                            }
                            aria-label={`Selecionar gênero ${gender.name}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {gender.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {gender.description || "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(gender.created_at).toLocaleDateString(
                            "pt-BR",
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleEdit(gender)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleDelete(gender.id)}
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
        </TabsContent>

        {/* Tipos Tab */}
        <TabsContent value="types" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Tipos
                  </CardTitle>
                  <CardDescription>
                    Gerencie os tipos dos produtos (Ex: Chinelo, Sandália,
                    Tênis)
                  </CardDescription>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={handleNew}>
                      <Plus className="mr-2 h-4 w-4" />
                      Novo Tipo
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <form onSubmit={handleSubmit}>
                      <DialogHeader>
                        <DialogTitle>
                          {editingItem ? "Editar Tipo" : "Novo Tipo"}
                        </DialogTitle>
                        <DialogDescription>
                          {editingItem
                            ? "Atualize as informa��ões do tipo"
                            : "Crie um novo tipo para categorizar seus produtos"}
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
                            placeholder="Ex: Chinelo, Sandália, Tênis"
                            required
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="description">Descrição</Label>
                          <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                description: e.target.value,
                              })
                            }
                            placeholder="Descrição do tipo (opcional)"
                            rows={3}
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
                          {editingItem ? "Atualizar" : "Criar"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>

            {/* Barra de ações para seleção múltipla de tipos */}
            {selectedTypes.length > 0 && (
              <div className="mx-6 mb-4">
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium">
                          {selectedTypes.length} tipo
                          {selectedTypes.length !== 1 ? "s" : ""} selecionado
                          {selectedTypes.length !== 1 ? "s" : ""}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearTypeSelection}
                        >
                          Limpar seleção
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleBulkDeleteTypes}
                          className="flex items-center gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          Excluir selecionados
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <CardContent>
              {types.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-2 text-sm font-semibold">
                    Nenhum tipo cadastrado
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Comece criando seu primeiro tipo de produtos.
                  </p>
                  <div className="mt-6">
                    <Button onClick={handleNew}>
                      <Plus className="mr-2 h-4 w-4" />
                      Novo Tipo
                    </Button>
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox
                          checked={isAllTypesSelected}
                          ref={(el) => {
                            if (el) el.indeterminate = isTypesIndeterminate;
                          }}
                          onCheckedChange={toggleSelectAllTypes}
                          aria-label="Selecionar todos os tipos"
                          className={
                            isTypesIndeterminate
                              ? "data-[state=checked]:bg-blue-600"
                              : ""
                          }
                        />
                      </TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead className="w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {types.map((type) => (
                      <TableRow
                        key={type.id}
                        className={
                          selectedTypes.includes(type.id) ? "bg-blue-50" : ""
                        }
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedTypes.includes(type.id)}
                            onCheckedChange={() => toggleTypeSelection(type.id)}
                            aria-label={`Selecionar tipo ${type.name}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {type.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {type.description || "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(type.created_at).toLocaleDateString(
                            "pt-BR",
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleEdit(type)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleDelete(type.id)}
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
