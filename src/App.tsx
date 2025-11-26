import { useState } from 'react';
import { LoginPage } from './components/LoginPage';
import { MenuPage } from './components/MenuPage';
import { OrderPage } from './components/OrderPage';
import { ReviewsPage } from './components/ReviewsPage';
import { CatalogPage } from './components/CatalogPage';
import { AdminPanel } from './components/AdminPanel';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Toaster } from './components/ui/sonner';
import { Pizza, ShoppingCart, Book, Star, Menu, LogOut, User, Settings } from 'lucide-react';

interface UserData {
  nombre: string;
  email: string;
  telefono: string;
  isAdmin: boolean;
}

interface PizzaData {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  imagen: string;
  categoria: string;
  rating: number;
  ingredientes: string[];
}

interface Promocion {
  id: number;
  titulo: string;
  descripcion: string;
  dias?: string;
  horario?: string;
  precio?: string;
  ahorro?: string;
  restricciones?: string;
}

interface CartItem {
  id: number;
  nombre: string;
  precio: number;
  cantidad: number;
}

interface Message {
  id: number;
  from: 'cliente' | 'admin';
  content: string;
  timestamp: Date;
  read: boolean;
}

interface Order {
  id: number;
  userId: string;
  userName: string;
  userPhone: string;
  items: CartItem[];
  deliveryData: {
    direccion: string;
    colonia: string;
    referencias: string;
  };
  paymentMethod: 'efectivo' | 'transferencia';
  transferImage?: string;
  messages: Message[];
  total: number;
  status: 'pendiente' | 'en-proceso' | 'entregado';
  timestamp: Date;
}

type Page = 'menu' | 'order' | 'reviews' | 'catalog' | 'admin' | 'mis-pedidos';

const initialPizzas: PizzaData[] = [
  {
    id: 1,
    nombre: 'Pizza Jarocha Especial',
    descripcion: 'Nuestra receta tradicional con queso manchego, jalapeños y salsa secreta',
    precio: 189,
    imagen: 'https://images.unsplash.com/photo-1681495511907-fb445d988128?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaXp6YSUyMG1leGljYW5hfGVufDF8fHx8MTc2MjcwNzk3OHww&ixlib=rb-4.1.0&q=80&w=1080',
    categoria: 'Especiales',
    rating: 4.8,
    ingredientes: ['Queso manchego', 'Jalapeños', 'Tomate', 'Cebolla']
  },
  {
    id: 2,
    nombre: 'Pizza Veracruzana',
    descripcion: 'Con mariscos frescos del puerto, camarones y pulpo',
    precio: 249,
    imagen: 'https://images.unsplash.com/photo-1681495511907-fb445d988128?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaXp6YSUyMG1leGljYW5hfGVufDF8fHx8MTc2MjcwNzk3OHww&ixlib=rb-4.1.0&q=80&w=1080',
    categoria: 'Especiales',
    rating: 4.9,
    ingredientes: ['Camarones', 'Pulpo', 'Queso', 'Ajo']
  },
  {
    id: 3,
    nombre: 'Pizza Hawaiana Tropical',
    descripcion: 'Piña, jamón y queso oaxaca derretido',
    precio: 169,
    imagen: 'https://images.unsplash.com/photo-1681495511907-fb445d988128?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaXp6YSUyMG1leGljYW5hfGVufDF8fHx8MTc2MjcwNzk3OHww&ixlib=rb-4.1.0&q=80&w=1080',
    categoria: 'Clásicas',
    rating: 4.5,
    ingredientes: ['Piña', 'Jamón', 'Queso oaxaca', 'Orégano']
  },
  {
    id: 4,
    nombre: 'Pizza Mexicana',
    descripcion: 'Chorizo, jalapeños, frijoles refritos y aguacate',
    precio: 179,
    imagen: 'https://images.unsplash.com/photo-1681495511907-fb445d988128?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaXp6YSUyMG1leGljYW5hfGVufDF8fHx8MTc2MjcwNzk3OHww&ixlib=rb-4.1.0&q=80&w=1080',
    categoria: 'Especiales',
    rating: 4.7,
    ingredientes: ['Chorizo', 'Jalapeños', 'Frijoles', 'Aguacate']
  },
  {
    id: 5,
    nombre: 'Pizza Pepperoni',
    descripcion: 'Clásica pizza con abundante pepperoni y queso',
    precio: 159,
    imagen: 'https://images.unsplash.com/photo-1681495511907-fb445d988128?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaXp6YSUyMG1leGljYW5hfGVufDF8fHx8MTc2MjcwNzk3OHww&ixlib=rb-4.1.0&q=80&w=1080',
    categoria: 'Clásicas',
    rating: 4.6,
    ingredientes: ['Pepperoni', 'Queso mozzarella', 'Orégano']
  },
  {
    id: 6,
    nombre: 'Pizza Vegetariana',
    descripcion: 'Vegetales frescos del mercado, champiñones y pimientos',
    precio: 149,
    imagen: 'https://images.unsplash.com/photo-1681495511907-fb445d988128?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaXp6YSUyMG1leGljYW5hfGVufDF8fHx8MTc2MjcwNzk3OHww&ixlib=rb-4.1.0&q=80&w=1080',
    categoria: 'Vegetarianas',
    rating: 4.4,
    ingredientes: ['Champiñones', 'Pimientos', 'Cebolla', 'Aceitunas']
  }
];

const initialPromociones: Promocion[] = [
  {
    id: 1,
    titulo: 'Martes de 2x1',
    descripcion: 'Compra una pizza grande y lleva otra del mismo tamaño gratis',
    dias: 'Martes',
    restricciones: 'Aplica en pizzas seleccionadas'
  },
  {
    id: 2,
    titulo: 'Combo Familiar',
    descripcion: '2 pizzas grandes + 2 litros de refresco + orden de alitas',
    precio: '$499',
    ahorro: 'Ahorra $150'
  },
  {
    id: 3,
    titulo: 'Happy Hour',
    descripcion: '20% de descuento en pizzas medianas',
    horario: '5:00 PM - 7:00 PM',
    dias: 'Lunes a Viernes'
  }
];

export default function App() {
  const [user, setUser] = useState<UserData | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('menu');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pizzas, setPizzas] = useState<PizzaData[]>(initialPizzas);
  const [promociones, setPromociones] = useState<Promocion[]>(initialPromociones);
  const [orders, setOrders] = useState<Order[]>([]);

  const handleLogin = (userData: UserData) => {
    setUser(userData);
    // Si es admin, ir directo al panel de admin
    if (userData.isAdmin) {
      setCurrentPage('admin');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCartItems([]);
    setCurrentPage('menu');
  };

  const handleAddToCart = (pizza: any, cantidad: number) => {
    const existingItem = cartItems.find(item => item.id === pizza.id);
    
    if (existingItem) {
      setCartItems(cartItems.map(item =>
        item.id === pizza.id
          ? { ...item, cantidad: item.cantidad + cantidad }
          : item
      ));
    } else {
      setCartItems([...cartItems, {
        id: pizza.id,
        nombre: pizza.nombre,
        precio: pizza.precio,
        cantidad
      }]);
    }
  };

  const handleUpdateQuantity = (id: number, cantidad: number) => {
    if (cantidad <= 0) {
      handleRemoveItem(id);
    } else {
      setCartItems(cartItems.map(item =>
        item.id === id ? { ...item, cantidad } : item
      ));
    }
  };

  const handleRemoveItem = (id: number) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleSubmitOrder = (orderData: Omit<Order, 'id' | 'userId' | 'userName' | 'userPhone' | 'items' | 'total' | 'timestamp' | 'status'>) => {
    if (!user) return;

    const subtotal = cartItems.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    const envio = subtotal > 200 ? 0 : 30;
    const total = subtotal + envio;

    const newOrder: Order = {
      id: orders.length + 1,
      userId: user.email,
      userName: user.nombre,
      userPhone: user.telefono,
      items: [...cartItems],
      deliveryData: orderData.deliveryData,
      paymentMethod: orderData.paymentMethod,
      transferImage: orderData.transferImage,
      messages: orderData.messages,
      total,
      status: 'pendiente',
      timestamp: new Date()
    };

    setOrders([...orders, newOrder]);
    setCartItems([]);
  };

  const handleAddMessage = (orderId: number, message: string) => {
    setOrders(orders.map(order => {
      if (order.id === orderId) {
        const newMessage: Message = {
          id: order.messages.length + 1,
          from: user?.isAdmin ? 'admin' : 'cliente',
          content: message,
          timestamp: new Date(),
          read: false
        };
        return {
          ...order,
          messages: [...order.messages, newMessage]
        };
      }
      return order;
    }));
  };

  const handleMarkMessagesAsRead = (orderId: number) => {
    setOrders(orders.map(order => {
      if (order.id === orderId) {
        return {
          ...order,
          messages: order.messages.map(msg => ({ ...msg, read: true }))
        };
      }
      return order;
    }));
  };

  const handleUpdateOrderStatus = (orderId: number, status: Order['status']) => {
    setOrders(orders.map(order => 
      order.id === orderId ? { ...order, status } : order
    ));
  };

  const totalItems = cartItems.reduce((sum, item) => sum + item.cantidad, 0);

  if (!user) {
    return (
      <>
        <LoginPage onLogin={handleLogin} />
        <Toaster />
      </>
    );
  }

  const navItems = user.isAdmin
    ? [
        { id: 'admin' as Page, label: 'Panel Admin', icon: Settings },
        { id: 'menu' as Page, label: 'Menú', icon: Pizza },
        { id: 'catalog' as Page, label: 'Catálogo', icon: Book },
        { id: 'reviews' as Page, label: 'Reseñas', icon: Star }
      ]
    : [
        { id: 'menu' as Page, label: 'Menú', icon: Pizza },
        { id: 'catalog' as Page, label: 'Catálogo', icon: Book },
        { id: 'order' as Page, label: 'Mi Pedido', icon: ShoppingCart },
        { id: 'reviews' as Page, label: 'Reseñas', icon: Star }
      ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Pizza className="w-8 h-8" />
              <div>
                <h1 className="text-2xl">Pizzas Jarochos</h1>
                <p className="text-sm opacity-90">
                  {user.isAdmin ? 'Panel de Administración' : 'Sabor tradicional veracruzano'}
                </p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-2">
              {navItems.map(item => {
                const IconComponent = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant={currentPage === item.id ? 'secondary' : 'ghost'}
                    className={currentPage === item.id ? 'bg-white text-red-600 hover:bg-white/90' : 'text-white hover:bg-white/20'}
                    onClick={() => {
                      setCurrentPage(item.id);
                      setMobileMenuOpen(false);
                    }}
                  >
                    <IconComponent className="w-4 h-4 mr-2" />
                    {item.label}
                    {item.id === 'order' && totalItems > 0 && (
                      <Badge className="ml-2 bg-red-600">{totalItems}</Badge>
                    )}
                  </Button>
                );
              })}
            </nav>

            {/* User Info & Logout */}
            <div className="hidden md:flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm opacity-90">Hola,</p>
                <p>{user.nombre}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={handleLogout}
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-white hover:bg-white/20"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="w-6 h-6" />
            </Button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="md:hidden mt-4 space-y-2">
              {navItems.map(item => {
                const IconComponent = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant={currentPage === item.id ? 'secondary' : 'ghost'}
                    className={`w-full justify-start ${currentPage === item.id ? 'bg-white text-red-600 hover:bg-white/90' : 'text-white hover:bg-white/20'}`}
                    onClick={() => {
                      setCurrentPage(item.id);
                      setMobileMenuOpen(false);
                    }}
                  >
                    <IconComponent className="w-4 h-4 mr-2" />
                    {item.label}
                    {item.id === 'order' && totalItems > 0 && (
                      <Badge className="ml-2 bg-red-600">{totalItems}</Badge>
                    )}
                  </Button>
                );
              })}
              <div className="border-t border-white/20 pt-2 mt-2">
                <div className="flex items-center gap-2 px-4 py-2 text-sm">
                  <User className="w-4 h-4" />
                  <span>{user.nombre}</span>
                  {user.isAdmin && (
                    <Badge className="bg-white text-red-600">Admin</Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-white hover:bg-white/20"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Cerrar Sesión
                </Button>
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {currentPage === 'admin' && user.isAdmin && (
          <AdminPanel
            pizzas={pizzas}
            onUpdatePizzas={setPizzas}
            promociones={promociones}
            onUpdatePromociones={setPromociones}
            orders={orders}
            onAddMessage={handleAddMessage}
            onMarkMessagesAsRead={handleMarkMessagesAsRead}
            onUpdateOrderStatus={handleUpdateOrderStatus}
          />
        )}
        {currentPage === 'menu' && (
          <MenuPage pizzas={pizzas} onAddToCart={handleAddToCart} />
        )}
        {currentPage === 'catalog' && (
          <CatalogPage promociones={promociones} />
        )}
        {currentPage === 'order' && !user.isAdmin && (
          <OrderPage
            cartItems={cartItems}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
            onSubmitOrder={handleSubmitOrder}
          />
        )}
        {currentPage === 'reviews' && (
          <ReviewsPage />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="mb-4 flex items-center gap-2">
                <Pizza className="w-5 h-5" />
                Pizzas Jarochos
              </h3>
              <p className="text-sm text-gray-400">
                La mejor pizza estilo jarocho desde 1996. Sabor tradicional de Veracruz en cada rebanada.
              </p>
            </div>
            <div>
              <h3 className="mb-4">Contacto</h3>
              <div className="space-y-2 text-sm text-gray-400">
                <p>📞 229-123-4567</p>
                <p>📧 pedidos@pizzasjarochos.com</p>
                <p>📍 Veracruz, Ver. México</p>
              </div>
            </div>
            <div>
              <h3 className="mb-4">Horario</h3>
              <div className="space-y-2 text-sm text-gray-400">
                <p>Lunes a Jueves: 12:00 PM - 11:00 PM</p>
                <p>Viernes a Domingo: 12:00 PM - 12:00 AM</p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2025 Pizzas Jarochos. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>

      <Toaster />
    </div>
  );
}