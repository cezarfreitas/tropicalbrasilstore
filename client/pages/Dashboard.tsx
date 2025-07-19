import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Palette, Ruler, Grid3x3, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const stats = [
  {
    name: "Produtos",
    value: "0",
    icon: Package,
    href: "/products",
    description: "Gerencie seus produtos",
  },
  {
    name: "Categorias",
    value: "0",
    icon: ShoppingBag,
    href: "/categories",
    description: "Organize por categorias",
  },
  {
    name: "Tamanhos",
    value: "0",
    icon: Ruler,
    href: "/sizes",
    description: "Configure os tamanhos",
  },
  {
    name: "Cores",
    value: "0",
    icon: Palette,
    href: "/colors",
    description: "Paleta de cores",
  },
];

const quickActions = [
  {
    title: "Adicionar Produto",
    description: "Cadastre um novo produto no sistema",
    href: "/products",
    icon: Package,
  },
  {
    title: "Criar Grade Vendida",
    description: "Configure um novo kit de venda",
    href: "/grades",
    icon: Grid3x3,
  },
  {
    title: "Gerenciar Categorias",
    description: "Organize suas categorias",
    href: "/categories",
    icon: ShoppingBag,
  },
];

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Bem-vindo ao sistema de administração de chinelos
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.name} className="transition-colors hover:bg-accent">
              <Link to={stat.href}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.name}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </CardContent>
              </Link>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="md:col-span-2 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
              <p className="text-sm text-muted-foreground">
                Acesse rapidamente as funções mais utilizadas
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <div
                    key={action.title}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="rounded-md bg-primary/10 p-2">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{action.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {action.description}
                        </p>
                      </div>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link to={action.href}>Acessar</Link>
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Sistema Grade Vendida</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-lg bg-primary/5 p-4">
                  <h4 className="font-medium">O que é Grade Vendida?</h4>
                  <p className="text-sm text-muted-foreground mt-2">
                    Um sistema de kits obrigatórios onde você define quantidades
                    específicas para cada tamanho, como:
                  </p>
                  <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                    <li>• Tamanho 32: 4 unidades</li>
                    <li>• Tamanho 36: 5 unidades</li>
                    <li>• Tamanho 38: 6 unidades</li>
                  </ul>
                </div>
                <Button asChild className="w-full">
                  <Link to="/grades">Gerenciar Grades</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
