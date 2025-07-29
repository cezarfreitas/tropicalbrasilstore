import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Layers, Package, ArrowRight, Settings } from "lucide-react";

export function StockConfigurationGuide() {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Como Configurar Estoque por Grade
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Estoque por Grade */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-blue-600">Estoque por Grade</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="min-w-fit">1</Badge>
                <span>Ao criar/editar produto, selecione <strong>"Estoque por Grade"</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="min-w-fit">2</Badge>
                <span>Na aba <strong>"Variantes"</strong>, adicione cores</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="min-w-fit">3</Badge>
                <span>Selecione as <strong>grades vendidas</strong> para cada cor</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="min-w-fit">4</Badge>
                <span>Defina a <strong>quantidade por grade</strong> (ex: 25 unidades)</span>
              </div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Exemplo:</strong> Chinelo Havaianas - Grade Unissex Preto = 25 pares
                <br />
                Isso significa 25 pares no total, independente dos tamanhos
              </p>
            </div>
          </div>

          {/* Estoque por Tamanho */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-green-600">Estoque por Tamanho</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="min-w-fit">1</Badge>
                <span>Ao criar/editar produto, selecione <strong>"Estoque por Tamanho"</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="min-w-fit">2</Badge>
                <span>Na aba <strong>"Variantes"</strong>, adicione cores</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="min-w-fit">3</Badge>
                <span>Selecione grades para definir <strong>quais tamanhos</strong> usar</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="min-w-fit">4</Badge>
                <span>Defina <strong>estoque individual</strong> para cada tamanho/cor</span>
              </div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-800">
                <strong>Exemplo:</strong> Tênis Nike - Tam 38 Azul = 5 pares, Tam 39 Azul = 3 pares
                <br />
                Cada combinação tamanho/cor tem estoque específico
              </p>
            </div>
          </div>
        </div>

        {/* Diferenças Principais */}
        <div className="border-t pt-4">
          <h4 className="font-semibold mb-3">Principais Diferenças:</h4>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <Layers className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong className="text-blue-600">Grade:</strong> Quantidade fixa por grade/cor (ex: 25 pares total)
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Package className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <strong className="text-green-600">Tamanho:</strong> Quantidade específica por tamanho/cor (ex: 5 tam 38, 3 tam 39)
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
