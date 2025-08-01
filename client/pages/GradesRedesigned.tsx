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
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit2, Trash2, Grid3x3, X, Link2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GradeTemplate {
  id?: number;
  size_id: number;
  required_quantity: number;
  size?: string;
  display_order?: number;
}

interface ProductColorAssignment {
  id?: number;
  product_id: number;
  color_id: number;
  product_name?: string;
  color_name?: string;
  hex_code?: string;
  already_assigned?: boolean;
}

interface Grade {
  id: number;
  name: string;
  description?: string;
  active: boolean;
  created_at: string;
  templates?: GradeTemplate[];
  assignments?: ProductColorAssignment[];
  assignment_count: number;
}

export default function GradesRedesigned() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [sizes, setSizes] = useState<any[]>([]);
  const [availableAssignments, setAvailableAssignments] = useState<
    ProductColorAssignment[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  const [selectedGradeForAssign, setSelectedGradeForAssign] =
    useState<Grade | null>(null);
  const [selectedGrades, setSelectedGrades] = useState<number[]>([]);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    templates: GradeTemplate[];
  }>({
    name: "",
    description: "",
    templates: [],
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [gradesRes, sizesRes] = await Promise.all([
        fetch("/api/grades-redesigned"),
        fetch("/api/sizes"),
      ]);

      if (gradesRes.ok) setGrades(await gradesRes.json());
      if (sizesRes.ok) setSizes(await sizesRes.json());
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingGrade
        ? `/api/grades-redesigned/${editingGrade.id}`
        : "/api/grades-redesigned";
      const method = editingGrade ? "PUT" : "POST";

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
          description: editingGrade
            ? "Grade atualizada com sucesso"
            : "Grade criada com sucesso",
        });
        setDialogOpen(false);
        resetForm();
        fetchData();
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
    setEditingGrade(null);
    setFormData({
      name: "",
      description: "",
      templates: [],
    });
  };

  const handleEdit = async (grade: Grade) => {
    try {
      const response = await fetch(`/api/grades-redesigned/${grade.id}`);
      if (response.ok) {
        const detailedGrade = await response.json();
        setEditingGrade(detailedGrade);
        setFormData({
          name: detailedGrade.name,
          description: detailedGrade.description || "",
          templates: detailedGrade.templates || [],
        });
        setDialogOpen(true);
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os detalhes da grade",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir esta grade?")) return;

    try {
      const response = await fetch(`/api/grades-redesigned/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Grade excluída com sucesso",
        });
        fetchData();
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

  // Funções de seleção múltipla
  const isAllSelected = grades.length > 0 && selectedGrades.length === grades.length;
  const isIndeterminate = selectedGrades.length > 0 && selectedGrades.length < grades.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedGrades([]);
    } else {
      setSelectedGrades(grades.map(grade => grade.id));
    }
  };

  const toggleGradeSelection = (gradeId: number) => {
    setSelectedGrades(prev =>
      prev.includes(gradeId)
        ? prev.filter(id => id !== gradeId)
        : [...prev, gradeId]
    );
  };

  const clearSelection = () => {
    setSelectedGrades([]);
  };

  const handleBulkDelete = async () => {
    if (selectedGrades.length === 0) return;

    const confirmMessage = `Tem certeza que deseja excluir ${selectedGrades.length} grade${selectedGrades.length !== 1 ? 's' : ''}?`;

    if (!confirm(confirmMessage)) return;

    try {
      const deletePromises = selectedGrades.map(id =>
        fetch(`/api/grades-redesigned/${id}`, {
          method: 'DELETE'
        })
      );

      const results = await Promise.all(deletePromises);
      const failed = results.filter(r => !r.ok);

      if (failed.length === 0) {
        toast({
          title: "Sucesso",
          description: `${selectedGrades.length} grade${selectedGrades.length !== 1 ? 's' : ''} excluída${selectedGrades.length !== 1 ? 's' : ''} com sucesso`,
        });
        setSelectedGrades([]);
        fetchData();
      } else {
        throw new Error(`${failed.length} grade${failed.length !== 1 ? 's' : ''} não puderam ser excluída${failed.length !== 1 ? 's' : ''}`);
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
    resetForm();
    setDialogOpen(true);
  };

  const addTemplate = () => {
    setFormData({
      ...formData,
      templates: [
        ...formData.templates,
        {
          size_id: 0,
          required_quantity: 1,
        },
      ],
    });
  };

  const removeTemplate = (index: number) => {
    setFormData({
      ...formData,
      templates: formData.templates.filter((_, i) => i !== index),
    });
  };

  const updateTemplate = (
    index: number,
    field: keyof GradeTemplate,
    value: any,
  ) => {
    const newTemplates = [...formData.templates];
    newTemplates[index] = { ...newTemplates[index], [field]: value };
    setFormData({ ...formData, templates: newTemplates });
  };

  const handleManageAssignments = async (grade: Grade) => {
    setSelectedGradeForAssign(grade);
    try {
      const response = await fetch(
        `/api/grades-redesigned/${grade.id}/available-assignments`,
      );
      if (response.ok) {
        const assignments = await response.json();
        setAvailableAssignments(assignments);
        setAssignDialogOpen(true);
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar as atribuições disponíveis",
        variant: "destructive",
      });
    }
  };

  const handleAssignGrade = async (
    product_id: number,
    color_id: number,
    assign: boolean,
  ) => {
    if (!selectedGradeForAssign) return;

    try {
      const url = `/api/grades-redesigned/${selectedGradeForAssign.id}/assign`;
      const method = assign ? "POST" : "DELETE";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ product_id, color_id }),
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: assign
            ? "Grade atribuída com sucesso"
            : "Atribuição removida com sucesso",
        });

        // Refresh available assignments
        const assignmentsResponse = await fetch(
          `/api/grades-redesigned/${selectedGradeForAssign.id}/available-assignments`,
        );
        if (assignmentsResponse.ok) {
          const assignments = await assignmentsResponse.json();
          setAvailableAssignments(assignments);
        }

        fetchData(); // Refresh grades list
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar atribuição",
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
          <h1 className="text-3xl font-bold tracking-tight">
            Grade Vendida (Templates)
          </h1>
          <p className="text-muted-foreground">
            Templates de grades que podem ser atribuídos a produtos e cores
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewGrade}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Grade Template
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingGrade ? "Editar Grade" : "Nova Grade Template"}
                </DialogTitle>
                <DialogDescription>
                  Crie um template que define quantidades obrigatórias por
                  tamanho
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nome da Grade</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Ex: Grade Básica Masculina"
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
                      placeholder="Descrição da grade template"
                      rows={2}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base">Quantidades por Tamanho</Label>
                    <Button type="button" onClick={addTemplate} size="sm">
                      <Plus className="mr-1 h-3 w-3" />
                      Adicionar Tamanho
                    </Button>
                  </div>

                  {formData.templates.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg">
                      <Grid3x3 className="mx-auto h-8 w-8 text-muted-foreground/50" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        Nenhum tamanho configurado
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {formData.templates.map((template, index) => (
                        <Card key={index}>
                          <CardContent className="pt-4">
                            <div className="grid grid-cols-3 gap-4 items-end">
                              <div className="grid gap-2">
                                <Label>Tamanho</Label>
                                <Select
                                  value={template.size_id.toString()}
                                  onValueChange={(value) =>
                                    updateTemplate(
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
                                <Label>Quantidade Obrigatória</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  value={template.required_quantity}
                                  onChange={(e) =>
                                    updateTemplate(
                                      index,
                                      "required_quantity",
                                      parseInt(e.target.value) || 1,
                                    )
                                  }
                                />
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => removeTemplate(index)}
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

      {/* Assignments Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Atribuir Grade: {selectedGradeForAssign?.name}
            </DialogTitle>
            <DialogDescription>
              Selecione quais combinações produto+cor devem usar esta grade
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Cor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {availableAssignments.map((assignment, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {assignment.product_name}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded border"
                          style={{
                            backgroundColor: assignment.hex_code || "#999999",
                          }}
                        ></div>
                        {assignment.color_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          assignment.already_assigned ? "default" : "outline"
                        }
                      >
                        {assignment.already_assigned
                          ? "Atribuído"
                          : "Não atribuído"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant={
                          assignment.already_assigned
                            ? "destructive"
                            : "default"
                        }
                        onClick={() =>
                          handleAssignGrade(
                            assignment.product_id,
                            assignment.color_id,
                            !assignment.already_assigned,
                          )
                        }
                      >
                        {assignment.already_assigned ? "Remover" : "Atribuir"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAssignDialogOpen(false)}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Barra de ações para seleção múltipla */}
      {selectedGrades.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">
                  {selectedGrades.length} grade{selectedGrades.length !== 1 ? 's' : ''} selecionada{selectedGrades.length !== 1 ? 's' : ''}
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
            <Grid3x3 className="h-5 w-5" />
            Templates de Grade
          </CardTitle>
          <CardDescription>
            {grades.length === 0
              ? "Nenhuma grade template cadastrada"
              : `${grades.length} grade${grades.length !== 1 ? "s" : ""} template${grades.length !== 1 ? "s" : ""} cadastrada${grades.length !== 1 ? "s" : ""}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {grades.length === 0 ? (
            <div className="text-center py-8">
              <Grid3x3 className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-2 text-sm font-semibold">
                Nenhuma grade template cadastrada
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Crie templates de grades que podem ser reutilizados.
              </p>
              <div className="mt-6">
                <Button onClick={handleNewGrade}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Grade Template
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
                        <Badge variant="outline">
                          {grade.assignment_count} atribuições
                        </Badge>
                        <Badge variant={grade.active ? "default" : "secondary"}>
                          {grade.active ? "Ativa" : "Inativa"}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleManageAssignments(grade)}
                        >
                          <Link2 className="mr-2 h-4 w-4" />
                          Atribuir
                        </Button>
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
                    {grade.templates && grade.templates.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tamanho</TableHead>
                            <TableHead>Quantidade Obrigatória</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {grade.templates.map((template: any, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">
                                {template.size}
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">
                                  {template.required_quantity} unidades
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Nenhum template configurado nesta grade.
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
