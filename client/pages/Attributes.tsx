import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Edit2, Trash2, Tags, Users, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Gender {
  id: number;
  name: string;
  description?: string;
  created_at: string;
}

interface Type {
  id: number;
  name: string;
  description?: string;
  created_at: string;
}

export default function Attributes() {
  const [activeTab, setActiveTab] = useState("genders");
  const [genders, setGenders] = useState<Gender[]>([]);
  const [types, setTypes] = useState<Type[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Gender | Type | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement API calls when backend is ready
    toast({
      title: "Em desenvolvimento",
      description: "Funcionalidade será implementada em breve",
    });
    setDialogOpen(false);
    resetForm();
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
    
    // TODO: Implement API calls when backend is ready
    toast({
      title: "Em desenvolvimento",
      description: "Funcionalidade será implementada em breve",
    });
  };

  const handleNew = () => {
    setEditingItem(null);
    resetForm();
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({ name: "", description: "" });
  };

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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
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
                    Gerencie os gêneros dos produtos (Ex: Masculino, Feminino, Unissex)
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
                              setFormData({ ...formData, description: e.target.value })
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
            <CardContent>
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
                    Gerencie os tipos dos produtos (Ex: Chinelo, Sandália, Tênis)
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
                            ? "Atualize as informações do tipo"
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
                              setFormData({ ...formData, description: e.target.value })
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
            <CardContent>
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
