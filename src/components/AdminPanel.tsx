import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Plus, Edit, Trash2, Settings, DollarSign, Tag, ShoppingBag, MessageCircle, Send, Eye, CreditCard, Upload } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface Pizza {
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

interface AdminPanelProps {
  pizzas: Pizza[];
  onUpdatePizzas: (pizzas: Pizza[]) => void;
  promociones: Promocion[];
  onUpdatePromociones: (promociones: Promocion[]) => void;
  orders: Order[];
  onAddMessage: (orderId: number, message: string) => void;
  onMarkMessagesAsRead: (orderId: number) => void;
  onUpdateOrderStatus: (orderId: number, status: Order['status']) => void;
}

export function AdminPanel({ 
  pizzas, 
  onUpdatePizzas, 
  promociones, 
  onUpdatePromociones,
  orders,
  onAddMessage,
  onMarkMessagesAsRead,
  onUpdateOrderStatus
}: AdminPanelProps) {
  const [editingPizza, setEditingPizza] = useState<Pizza | null>(null);
  const [isAddingPizza, setIsAddingPizza] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promocion | null>(null);
  const [isAddingPromo, setIsAddingPromo] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [replyMessage, setReplyMessage] = useState('');

  const [pizzaForm, setPizzaForm] = useState({
    nombre: '',
    descripcion: '',
    precio: 0,
    imagen: '',
    categoria: 'Especiales',
    ingredientes: ''
  });

  const [promoForm, setPromoForm] = useState({
    titulo: '',
    descripcion: '',
    dias: '',
    horario: '',
    precio: '',
    ahorro: '',
    restricciones: ''
  });

  const handleAddPizza = () => {
    setIsAddingPizza(true);
    setPizzaForm({
      nombre: '',
      descripcion: '',
      precio: 0,
      imagen: '',
      categoria: 'Especiales',
      ingredientes: ''
    });
  };

  const handleEditPizza = (pizza: Pizza) => {
    setEditingPizza(pizza);
    setPizzaForm({
      nombre: pizza.nombre,
      descripcion: pizza.descripcion,
      precio: pizza.precio,
      imagen: pizza.imagen,
      categoria: pizza.categoria,
      ingredientes: pizza.ingredientes.join(', ')
    });
  };

  const handleSavePizza = () => {
    if (!pizzaForm.nombre || !pizzaForm.descripcion || pizzaForm.precio <= 0) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    const ingredientesArray = pizzaForm.ingredientes
      .split(',')
      .map(i => i.trim())
      .filter(i => i.length > 0);

    if (editingPizza) {
      // Editar pizza existente
      const updatedPizzas = pizzas.map(p =>
        p.id === editingPizza.id
          ? {
              ...p,
              nombre: pizzaForm.nombre,
              descripcion: pizzaForm.descripcion,
              precio: pizzaForm.precio,
              imagen: pizzaForm.imagen || p.imagen,
              categoria: pizzaForm.categoria,
              ingredientes: ingredientesArray
            }
          : p
      );
      onUpdatePizzas(updatedPizzas);
      toast.success('Pizza actualizada correctamente');
      setEditingPizza(null);
    } else {
      // Agregar nueva pizza
      const newPizza: Pizza = {
        id: Math.max(...pizzas.map(p => p.id), 0) + 1,
        nombre: pizzaForm.nombre,
        descripcion: pizzaForm.descripcion,
        precio: pizzaForm.precio,
        imagen: pizzaForm.imagen || 'https://images.unsplash.com/photo-1681495511907-fb445d988128?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaXp6YSUyMG1leGljYW5hfGVufDF8fHx8MTc2MjcwNzk3OHww&ixlib=rb-4.1.0&q=80&w=1080',
        categoria: pizzaForm.categoria,
        rating: 4.5,
        ingredientes: ingredientesArray
      };
      onUpdatePizzas([...pizzas, newPizza]);
      toast.success('Pizza agregada correctamente');
      setIsAddingPizza(false);
    }
  };

  const handleDeletePizza = (id: number) => {
    if (confirm('¿Estás seguro de eliminar esta pizza?')) {
      onUpdatePizzas(pizzas.filter(p => p.id !== id));
      toast.success('Pizza eliminada correctamente');
    }
  };

  const handleAddPromo = () => {
    setIsAddingPromo(true);
    setPromoForm({
      titulo: '',
      descripcion: '',
      dias: '',
      horario: '',
      precio: '',
      ahorro: '',
      restricciones: ''
    });
  };

  const handleEditPromo = (promo: Promocion) => {
    setEditingPromo(promo);
    setPromoForm({
      titulo: promo.titulo,
      descripcion: promo.descripcion,
      dias: promo.dias || '',
      horario: promo.horario || '',
      precio: promo.precio || '',
      ahorro: promo.ahorro || '',
      restricciones: promo.restricciones || ''
    });
  };

  const handleSavePromo = () => {
    if (!promoForm.titulo || !promoForm.descripcion) {
      toast.error('Por favor completa título y descripción');
      return;
    }

    if (editingPromo) {
      const updatedPromos = promociones.map(p =>
        p.id === editingPromo.id
          ? {
              id: p.id,
              titulo: promoForm.titulo,
              descripcion: promoForm.descripcion,
              dias: promoForm.dias || undefined,
              horario: promoForm.horario || undefined,
              precio: promoForm.precio || undefined,
              ahorro: promoForm.ahorro || undefined,
              restricciones: promoForm.restricciones || undefined
            }
          : p
      );
      onUpdatePromociones(updatedPromos);
      toast.success('Promoción actualizada correctamente');
      setEditingPromo(null);
    } else {
      const newPromo: Promocion = {
        id: Math.max(...promociones.map(p => p.id), 0) + 1,
        titulo: promoForm.titulo,
        descripcion: promoForm.descripcion,
        dias: promoForm.dias || undefined,
        horario: promoForm.horario || undefined,
        precio: promoForm.precio || undefined,
        ahorro: promoForm.ahorro || undefined,
        restricciones: promoForm.restricciones || undefined
      };
      onUpdatePromociones([...promociones, newPromo]);
      toast.success('Promoción agregada correctamente');
      setIsAddingPromo(false);
    }
  };

  const handleDeletePromo = (id: number) => {
    if (confirm('¿Estás seguro de eliminar esta promoción?')) {
      onUpdatePromociones(promociones.filter(p => p.id !== id));
      toast.success('Promoción eliminada correctamente');
    }
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    onMarkMessagesAsRead(order.id);
  };

  const handleSendMessage = () => {
    if (!selectedOrder || !replyMessage.trim()) return;
    
    onAddMessage(selectedOrder.id, replyMessage);
    setReplyMessage('');
    toast.success('Mensaje enviado');
  };

  const getUnreadMessagesCount = (order: Order) => {
    return order.messages.filter(msg => !msg.read && msg.from === 'cliente').length;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">Panel de Administración</h1>
          <p className="text-gray-600">Gestiona tu menú, precios y promociones</p>
        </div>
        <Badge className="bg-gradient-to-r from-red-600 to-orange-600">
          Administrador
        </Badge>
      </div>

      <Tabs defaultValue="pizzas" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pizzas">
            <Tag className="w-4 h-4 mr-2" />
            Menú de Pizzas
          </TabsTrigger>
          <TabsTrigger value="promociones">
            <DollarSign className="w-4 h-4 mr-2" />
            Promociones
          </TabsTrigger>
          <TabsTrigger value="pedidos">
            <ShoppingBag className="w-4 h-4 mr-2" />
            Pedidos
            {orders.filter(o => o.messages.some(m => !m.read && m.from === 'cliente')).length > 0 && (
              <Badge className="ml-2 bg-red-600">
                {orders.filter(o => o.messages.some(m => !m.read && m.from === 'cliente')).length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="estadisticas">
            <Settings className="w-4 h-4 mr-2" />
            Estadísticas
          </TabsTrigger>
        </TabsList>

        {/* Gestión de Pizzas */}
        <TabsContent value="pizzas" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">Total de pizzas: {pizzas.length}</p>
            <Button
              onClick={handleAddPizza}
              className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Pizza
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Imagen</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pizzas.map(pizza => (
                    <TableRow key={pizza.id}>
                      <TableCell>
                        <div className="w-16 h-16 rounded overflow-hidden">
                          <ImageWithFallback
                            src={pizza.imagen}
                            alt={pizza.nombre}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p>{pizza.nombre}</p>
                          <p className="text-xs text-gray-500 truncate max-w-xs">{pizza.descripcion}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{pizza.categoria}</Badge>
                      </TableCell>
                      <TableCell>${pizza.precio} MXN</TableCell>
                      <TableCell>{pizza.rating} ⭐</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditPizza(pizza)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeletePizza(pizza.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gestión de Promociones */}
        <TabsContent value="promociones" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">Total de promociones: {promociones.length}</p>
            <Button
              onClick={handleAddPromo}
              className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Promoción
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {promociones.map(promo => (
              <Card key={promo.id} className="border-2 border-orange-200">
                <CardHeader>
                  <CardTitle className="text-lg">{promo.titulo}</CardTitle>
                  <CardDescription>{promo.descripcion}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {promo.precio && <p><strong>Precio:</strong> {promo.precio}</p>}
                  {promo.ahorro && <p className="text-green-600">{promo.ahorro}</p>}
                  {promo.dias && <p><strong>Días:</strong> {promo.dias}</p>}
                  {promo.horario && <p><strong>Horario:</strong> {promo.horario}</p>}
                  {promo.restricciones && <p className="text-xs text-gray-500">{promo.restricciones}</p>}
                </CardContent>
                <CardFooter className="gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleEditPromo(promo)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeletePromo(promo.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Gestión de Pedidos */}
        <TabsContent value="pedidos" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">Total de pedidos: {orders.length}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {orders.length === 0 ? (
              <Card className="lg:col-span-2">
                <CardContent className="py-12 text-center text-gray-500">
                  <ShoppingBag className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>No hay pedidos aún</p>
                </CardContent>
              </Card>
            ) : (
              orders.map(order => {
                const unreadCount = getUnreadMessagesCount(order);
                return (
                  <Card key={order.id} className={`${unreadCount > 0 ? 'border-2 border-blue-500' : ''}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          Pedido #{order.id}
                          {unreadCount > 0 && (
                            <Badge className="ml-2 bg-blue-600">{unreadCount} nuevo(s)</Badge>
                          )}
                        </CardTitle>
                        <Badge 
                          className={
                            order.status === 'pendiente' ? 'bg-yellow-600' :
                            order.status === 'en-proceso' ? 'bg-blue-600' :
                            'bg-green-600'
                          }
                        >
                          {order.status}
                        </Badge>
                      </div>
                      <CardDescription>{formatDate(order.timestamp)}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p><strong>Cliente:</strong> {order.userName}</p>
                        <p className="text-sm text-gray-600">{order.userPhone}</p>
                      </div>
                      <div>
                        <p><strong>Dirección:</strong></p>
                        <p className="text-sm text-gray-600">{order.deliveryData.direccion}, {order.deliveryData.colonia}</p>
                        {order.deliveryData.referencias && (
                          <p className="text-xs text-gray-500">Ref: {order.deliveryData.referencias}</p>
                        )}
                      </div>
                      <div>
                        <p><strong>Método de pago:</strong> {order.paymentMethod === 'efectivo' ? 'Efectivo' : 'Transferencia'}</p>
                      </div>
                      <div>
                        <p><strong>Items:</strong></p>
                        <ul className="text-sm text-gray-600 list-disc list-inside">
                          {order.items.map(item => (
                            <li key={item.id}>{item.cantidad}x {item.nombre}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="pt-2 border-t">
                        <p className="text-lg"><strong>Total: ${order.total} MXN</strong></p>
                      </div>
                      {order.messages.length > 0 && (
                        <div className="flex items-center gap-2 text-sm text-blue-600">
                          <MessageCircle className="w-4 h-4" />
                          {order.messages.length} mensaje(s)
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="gap-2 flex-wrap">
                      <Select
                        value={order.status}
                        onValueChange={(value) => onUpdateOrderStatus(order.id, value as Order['status'])}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendiente">Pendiente</SelectItem>
                          <SelectItem value="en-proceso">En Proceso</SelectItem>
                          <SelectItem value="entregado">Entregado</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={() => handleViewOrder(order)}
                        className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Detalles
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* Estadísticas */}
        <TabsContent value="estadisticas" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total de Pizzas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl">{pizzas.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Precio Promedio</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl">
                  ${Math.round(pizzas.reduce((sum, p) => sum + p.precio, 0) / pizzas.length)} MXN
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Promociones Activas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl">{promociones.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Pedidos Totales</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl">{orders.length}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Pizzas por Categoría</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {['Especiales', 'Clásicas', 'Vegetarianas'].map(cat => {
                  const count = pizzas.filter(p => p.categoria === cat).length;
                  return (
                    <div key={cat} className="flex items-center justify-between">
                      <span>{cat}</span>
                      <Badge>{count}</Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog para Agregar/Editar Pizza */}
      <Dialog open={isAddingPizza || editingPizza !== null} onOpenChange={(open) => {
        if (!open) {
          setIsAddingPizza(false);
          setEditingPizza(null);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPizza ? 'Editar Pizza' : 'Agregar Nueva Pizza'}
            </DialogTitle>
            <DialogDescription>
              Completa la información de la pizza
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={pizzaForm.nombre}
                onChange={(e) => setPizzaForm({ ...pizzaForm, nombre: e.target.value })}
                placeholder="Pizza Jarocha Especial"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción *</Label>
              <Textarea
                id="descripcion"
                value={pizzaForm.descripcion}
                onChange={(e) => setPizzaForm({ ...pizzaForm, descripcion: e.target.value })}
                placeholder="Descripción deliciosa de la pizza..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="precio">Precio (MXN) *</Label>
                <Input
                  id="precio"
                  type="number"
                  value={pizzaForm.precio}
                  onChange={(e) => setPizzaForm({ ...pizzaForm, precio: parseFloat(e.target.value) || 0 })}
                  placeholder="189"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoria">Categoría *</Label>
                <Select
                  value={pizzaForm.categoria}
                  onValueChange={(value) => setPizzaForm({ ...pizzaForm, categoria: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Especiales">Especiales</SelectItem>
                    <SelectItem value="Clásicas">Clásicas</SelectItem>
                    <SelectItem value="Vegetarianas">Vegetarianas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ingredientes">Ingredientes (separados por comas) *</Label>
              <Input
                id="ingredientes"
                value={pizzaForm.ingredientes}
                onChange={(e) => setPizzaForm({ ...pizzaForm, ingredientes: e.target.value })}
                placeholder="Queso manchego, Jalapeños, Tomate, Cebolla"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imagen">URL de Imagen (opcional)</Label>
              <Input
                id="imagen"
                value={pizzaForm.imagen}
                onChange={(e) => setPizzaForm({ ...pizzaForm, imagen: e.target.value })}
                placeholder="https://..."
              />
              <p className="text-xs text-gray-500">
                Deja en blanco para usar imagen por defecto
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddingPizza(false);
                setEditingPizza(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSavePizza}
              className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
            >
              {editingPizza ? 'Actualizar' : 'Agregar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para Agregar/Editar Promoción */}
      <Dialog open={isAddingPromo || editingPromo !== null} onOpenChange={(open) => {
        if (!open) {
          setIsAddingPromo(false);
          setEditingPromo(null);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPromo ? 'Editar Promoción' : 'Agregar Nueva Promoción'}
            </DialogTitle>
            <DialogDescription>
              Completa la información de la promoción
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                value={promoForm.titulo}
                onChange={(e) => setPromoForm({ ...promoForm, titulo: e.target.value })}
                placeholder="Martes de 2x1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcionPromo">Descripción *</Label>
              <Textarea
                id="descripcionPromo"
                value={promoForm.descripcion}
                onChange={(e) => setPromoForm({ ...promoForm, descripcion: e.target.value })}
                placeholder="Descripción de la promoción..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="precio">Precio (opcional)</Label>
                <Input
                  id="precio"
                  value={promoForm.precio}
                  onChange={(e) => setPromoForm({ ...promoForm, precio: e.target.value })}
                  placeholder="$499"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ahorro">Ahorro (opcional)</Label>
                <Input
                  id="ahorro"
                  value={promoForm.ahorro}
                  onChange={(e) => setPromoForm({ ...promoForm, ahorro: e.target.value })}
                  placeholder="Ahorra $150"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dias">Días (opcional)</Label>
                <Input
                  id="dias"
                  value={promoForm.dias}
                  onChange={(e) => setPromoForm({ ...promoForm, dias: e.target.value })}
                  placeholder="Lunes a Viernes"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="horario">Horario (opcional)</Label>
                <Input
                  id="horario"
                  value={promoForm.horario}
                  onChange={(e) => setPromoForm({ ...promoForm, horario: e.target.value })}
                  placeholder="5:00 PM - 7:00 PM"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="restricciones">Restricciones (opcional)</Label>
              <Input
                id="restricciones"
                value={promoForm.restricciones}
                onChange={(e) => setPromoForm({ ...promoForm, restricciones: e.target.value })}
                placeholder="Aplica en pizzas seleccionadas"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddingPromo(false);
                setEditingPromo(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSavePromo}
              className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
            >
              {editingPromo ? 'Actualizar' : 'Agregar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para Ver Detalles del Pedido */}
      <Dialog open={selectedOrder !== null} onOpenChange={(open) => {
        if (!open) setSelectedOrder(null);
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del Pedido #{selectedOrder?.id}</DialogTitle>
            <DialogDescription>
              {selectedOrder && formatDate(selectedOrder.timestamp)}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              {/* Información del Cliente */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Información del Cliente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p><strong>Nombre:</strong> {selectedOrder.userName}</p>
                  <p><strong>Teléfono:</strong> {selectedOrder.userPhone}</p>
                  <p><strong>Email:</strong> {selectedOrder.userId}</p>
                  <Separator />
                  <p><strong>Dirección:</strong> {selectedOrder.deliveryData.direccion}</p>
                  <p><strong>Colonia:</strong> {selectedOrder.deliveryData.colonia}</p>
                  {selectedOrder.deliveryData.referencias && (
                    <p><strong>Referencias:</strong> {selectedOrder.deliveryData.referencias}</p>
                  )}
                </CardContent>
              </Card>

              {/* Método de Pago */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {selectedOrder.paymentMethod === 'transferencia' ? <Upload className="w-5 h-5" /> : 
                     <DollarSign className="w-5 h-5" />}
                    Método de Pago: {selectedOrder.paymentMethod === 'efectivo' ? 'Efectivo' : 
                                      'Transferencia'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedOrder.transferImage && (
                    <div className="space-y-2">
                      <p><strong>Comprobante de Transferencia:</strong></p>
                      <img 
                        src={selectedOrder.transferImage} 
                        alt="Comprobante" 
                        className="max-w-md rounded border"
                      />
                    </div>
                  )}
                  {selectedOrder.paymentMethod === 'efectivo' && (
                    <p className="text-gray-600">El cliente pagará en efectivo al recibir el pedido</p>
                  )}
                </CardContent>
              </Card>

              {/* Items del Pedido */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Items del Pedido</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Precio</TableHead>
                        <TableHead>Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items.map(item => (
                        <TableRow key={item.id}>
                          <TableCell>{item.nombre}</TableCell>
                          <TableCell>{item.cantidad}</TableCell>
                          <TableCell>${item.precio}</TableCell>
                          <TableCell>${item.precio * item.cantidad}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="mt-4 text-right">
                    <p className="text-xl"><strong>Total: ${selectedOrder.total} MXN</strong></p>
                  </div>
                </CardContent>
              </Card>

              {/* Chat de Mensajes */}
              {(selectedOrder.paymentMethod === 'transferencia') && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MessageCircle className="w-5 h-5" />
                      Mensajes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-96 overflow-y-auto mb-4">
                      {selectedOrder.messages.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No hay mensajes aún</p>
                      ) : (
                        selectedOrder.messages.map(msg => (
                          <div 
                            key={msg.id} 
                            className={`p-3 rounded-lg ${
                              msg.from === 'cliente' 
                                ? 'bg-gray-100 ml-0 mr-12' 
                                : 'bg-blue-100 ml-12 mr-0'
                            } ${msg.read ? 'border-l-4 border-blue-500' : ''}`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs">
                                {msg.from === 'cliente' ? selectedOrder.userName : 'Admin'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatDate(msg.timestamp)}
                              </span>
                            </div>
                            <p className="text-sm">{msg.content}</p>
                            {msg.read && msg.from === 'cliente' && (
                              <p className="text-xs text-blue-600 mt-1">✓ Leído</p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Escribe tu respuesta..."
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                      <Button 
                        onClick={handleSendMessage}
                        className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedOrder(null)}
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}