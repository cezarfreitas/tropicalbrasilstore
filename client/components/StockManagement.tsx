import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Layers } from "lucide-react";

interface Product {
  id: number;
  name: string;
  stock_type: 'size' | 'grade';
}

interface GradeStock {
  grade_id: number;
  grade_name: string;
  color_id: number;
  color_name: string;
  hex_code: string;
  stock_quantity: number;
}

interface SizeStock {
  variant_id: number;
  size: string;
  color_name: string;
  hex_code: string;
  stock: number;
}

export function StockManagement({ product }: { product: Product }) {
  const [stockType, setStockType] = useState<'size' | 'grade'>(product.stock_type);
  const [gradeStocks, setGradeStocks] = useState<GradeStock[]>([]);
  const [sizeStocks, setSizeStocks] = useState<SizeStock[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStockData();
  }, [product.id, stockType]);

  const loadStockData = async () => {
    try {
      setLoading(true);
      
      if (stockType === 'grade') {
        const response = await fetch(`/api/products/${product.id}/grade-stock`);
        const data = await response.json();
        setGradeStocks(data);
      } else {
        const response = await fetch(`/api/products/${product.id}/size-stock`);
        const data = await response.json();
        setSizeStocks(data);
      }
    } catch (error) {
      console.error('Erro ao carregar dados de estoque:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStockType = async (newType: 'size' | 'grade') => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/products/${product.id}/stock-type`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock_type: newType })
      });
      
      if (response.ok) {
        setStockType(newType);
        await loadStockData();
      }
    } catch (error) {
      console.error('Erro ao atualizar tipo de estoque:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateGradeStock = async (gradeId: number, colorId: number, quantity: number) => {
    try {
      const response = await fetch(`/api/products/${product.id}/grade-stock`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          grade_id: gradeId, 
          color_id: colorId, 
          stock_quantity: quantity 
        })
      });
      
      if (response.ok) {
        await loadStockData();
      }
    } catch (error) {
      console.error('Erro ao atualizar estoque da grade:', error);
    }
  };

  const updateSizeStock = async (variantId: number, quantity: number) => {
    try {
      const response = await fetch(`/api/products/${product.id}/size-stock`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          variant_id: variantId, 
          stock: quantity 
        })
      });
      
      if (response.ok) {
        await loadStockData();
      }
    } catch (error) {
      console.error('Erro ao atualizar estoque do tamanho:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Gerenciar Estoque - {product.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Seletor de Tipo de Estoque */}
        <div className="space-y-2">
          <Label htmlFor="stock-type">Tipo de Controle de Estoque</Label>
          <Select 
            value={stockType} 
            onValueChange={(value: 'size' | 'grade') => updateStockType(value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="grade">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  Estoque por Grade
                </div>
              </SelectItem>
              <SelectItem value="size">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Estoque por Tamanho
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            {stockType === 'grade' 
              ? 'Controle de estoque por grade/cor - cada grade tem uma quantidade específica'
              : 'Controle de estoque por tamanho individual - cada tamanho/cor tem estoque separado'
            }
          </p>
        </div>

        {loading ? (
          <div className="text-center py-8">Carregando...</div>
        ) : (
          <Tabs value={stockType} className="w-full">
            <TabsContent value="grade" className="space-y-4">
              <h3 className="text-lg font-semibold">Estoque por Grade</h3>
              {gradeStocks.length === 0 ? (
                <p className="text-muted-foreground">Nenhuma grade configurada</p>
              ) : (
                <div className="grid gap-4">
                  {gradeStocks.map((gradeStock) => (
                    <Card key={`${gradeStock.grade_id}-${gradeStock.color_id}`}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-6 h-6 rounded border"
                              style={{ backgroundColor: gradeStock.hex_code }}
                            />
                            <div>
                              <span className="font-medium">{gradeStock.grade_name}</span>
                              <span className="text-muted-foreground ml-2">• {gradeStock.color_name}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`grade-${gradeStock.grade_id}-${gradeStock.color_id}`}>
                              Quantidade:
                            </Label>
                            <Input
                              id={`grade-${gradeStock.grade_id}-${gradeStock.color_id}`}
                              type="number"
                              min="0"
                              value={gradeStock.stock_quantity}
                              onChange={(e) => updateGradeStock(
                                gradeStock.grade_id, 
                                gradeStock.color_id, 
                                parseInt(e.target.value) || 0
                              )}
                              className="w-20"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="size" className="space-y-4">
              <h3 className="text-lg font-semibold">Estoque por Tamanho</h3>
              {sizeStocks.length === 0 ? (
                <p className="text-muted-foreground">Nenhuma variante de tamanho configurada</p>
              ) : (
                <div className="grid gap-4">
                  {sizeStocks.map((sizeStock) => (
                    <Card key={sizeStock.variant_id}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-6 h-6 rounded border"
                              style={{ backgroundColor: sizeStock.hex_code }}
                            />
                            <div>
                              <Badge variant="outline">{sizeStock.size}</Badge>
                              <span className="text-muted-foreground ml-2">• {sizeStock.color_name}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`size-${sizeStock.variant_id}`}>
                              Estoque:
                            </Label>
                            <Input
                              id={`size-${sizeStock.variant_id}`}
                              type="number"
                              min="0"
                              value={sizeStock.stock}
                              onChange={(e) => updateSizeStock(
                                sizeStock.variant_id, 
                                parseInt(e.target.value) || 0
                              )}
                              className="w-20"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
