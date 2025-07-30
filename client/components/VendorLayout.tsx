import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  BarChart3, 
  Users, 
  ShoppingBag, 
  DollarSign, 
  Settings, 
  LogOut, 
  Menu,
  Store,
  User
} from 'lucide-react';
import { useVendorAuth } from '@/hooks/use-vendor-auth';

interface VendorLayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  {
    title: 'Dashboard',
    href: '/vendor',
    icon: BarChart3,
  },
  {
    title: 'Pedidos',
    href: '/vendor/orders',
    icon: ShoppingBag,
  },
  {
    title: 'Clientes',
    href: '/vendor/customers',
    icon: Users,
  },
  {
    title: 'Perfil',
    href: '/vendor/profile',
    icon: Settings,
  },
];

export function VendorLayout({ children }: VendorLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { vendor, logout } = useVendorAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/vendor/login');
  };

  const isActive = (href: string) => {
    if (href === '/vendor') {
      return location.pathname === '/vendor';
    }
    return location.pathname.startsWith(href);
  };

  const NavItems = () => (
    <>
      {menuItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            to={item.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:text-primary ${
              isActive(item.href)
                ? 'bg-muted text-primary'
                : 'text-muted-foreground'
            }`}
            onClick={() => setSidebarOpen(false)}
          >
            <Icon className="h-4 w-4" />
            {item.title}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      {/* Sidebar Desktop */}
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link to="/vendor" className="flex items-center gap-2 font-semibold">
              <Store className="h-6 w-6" />
              <span>Portal Vendedor</span>
            </Link>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              <NavItems />
            </nav>
          </div>
        </div>
      </div>

      <div className="flex flex-col">
        {/* Header */}
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          {/* Mobile menu */}
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <div className="flex items-center gap-2 font-semibold mb-6">
                <Store className="h-6 w-6" />
                <span>Portal Vendedor</span>
              </div>
              <nav className="grid gap-2 text-lg font-medium">
                <NavItems />
              </nav>
            </SheetContent>
          </Sheet>

          <div className="w-full flex-1">
            <div className="text-sm text-muted-foreground">
              Bem-vindo, {vendor?.name}
            </div>
          </div>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={vendor?.avatar_url} />
                  <AvatarFallback>
                    {vendor?.name?.charAt(0).toUpperCase() || 'V'}
                  </AvatarFallback>
                </Avatar>
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="flex items-center space-x-2 p-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={vendor?.avatar_url} />
                  <AvatarFallback>
                    {vendor?.name?.charAt(0).toUpperCase() || 'V'}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <p className="text-sm font-medium">{vendor?.name}</p>
                  <p className="text-xs text-muted-foreground">{vendor?.email}</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/vendor/profile" className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  Perfil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Main content */}
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
