import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { ShoppingCart, Trash2, Plus, Minus, MapPin, Upload, Send } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

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

interface OrderPageProps {
  cartItems: CartItem[];
  onUpdateQuantity: (id: number, cantidad: number) => void;
  onRemoveItem: (id: number) => void;
  onClearCart: () => void;
  onSubmitOrder: (orderData: {
    deliveryData: {
      direccion: string;
      colonia: string;
      referencias: string;
    };
    paymentMethod: 'efectivo' | 'transferencia';
    transferImage?: string;
    messages: Message[];
  }) => void;
}

export function OrderPage({ cartItems, onUpdateQuantity, onRemoveItem, onClearCart, onSubmitOrder }: OrderPageProps) {
  const [deliveryData, setDeliveryData] = useState({
    direccion: '',
    colonia: '',
    referencias: ''
  });

  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'transferencia'>('efectivo');
  const [transferImage, setTransferImage] = useState<string>('');
  const [messageText, setMessageText] = useState('');

  const subtotal = cartItems.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
  const envio = subtotal > 200 ? 0 : 30;
  const total = subtotal + envio;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTransferImage(reader.result as string);
        toast.success('Comprobante cargado correctamente');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      toast.error('Tu carrito está vacío');
      return;
    }
    if (!deliveryData.direccion || !deliveryData.colonia) {
      toast.error('Por favor completa la información de entrega');
      return;
    }

    // Validar imagen de transferencia
    if (metodoPago === 'transferencia' && !transferImage) {
      toast.error('Por favor sube el comprobante de transferencia');
      return;
    }

    const messages: Message[] = [];
    if (messageText.trim()) {
      messages.push({
        id: 1,
        from: 'cliente',
        content: messageText,
        timestamp: new Date(),
        read: false
      });
    }
    
    onSubmitOrder({
      deliveryData,
      paymentMethod: metodoPago,
      transferImage: metodoPago === 'transferencia' ? transferImage : undefined,
      messages
    });
    
    toast.success('¡Pedido realizado con éxito! Tiempo estimado: 30-45 min', {
      description: `Total: $${total} MXN`
    });
    
    // Reset form
    setDeliveryData({
      direccion: '',
      colonia: '',
      referencias: ''
    });
    setMetodoPago('efectivo');
    setTransferImage('');
    setMessageText('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Tu Pedido
            </CardTitle>
            <CardDescription>
              {cartItems.length === 0 ? 'Tu carrito está vacío' : `${cartItems.length} artículo(s) en el carrito`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {cartItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p>Agrega pizzas desde el menú para comenzar tu pedido</p>
              </div>
            ) : (
              <>
                {cartItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between gap-4 p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4>{item.nombre}</h4>
                      <p className="text-sm text-gray-500">${item.precio} MXN c/u</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 border rounded-md">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onUpdateQuantity(item.id, item.cantidad - 1)}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-8 text-center">{item.cantidad}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onUpdateQuantity(item.id, item.cantidad + 1)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="w-24 text-right">
                        ${item.precio * item.cantidad}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onRemoveItem(item.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={onClearCart}
                >
                  Vaciar Carrito
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Información de Entrega
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitOrder} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  placeholder="Calle y número"
                  value={deliveryData.direccion}
                  onChange={(e) => setDeliveryData({ ...deliveryData, direccion: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="colonia">Colonia</Label>
                <Input
                  id="colonia"
                  placeholder="Nombre de la colonia"
                  value={deliveryData.colonia}
                  onChange={(e) => setDeliveryData({ ...deliveryData, colonia: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="referencias">Referencias (opcional)</Label>
                <Textarea
                  id="referencias"
                  placeholder="Casa azul, entre calle X y Y..."
                  value={deliveryData.referencias}
                  onChange={(e) => setDeliveryData({ ...deliveryData, referencias: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Método de Pago</Label>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    type="button"
                    variant={metodoPago === 'efectivo' ? 'default' : 'outline'}
                    className={metodoPago === 'efectivo' ? 'bg-gradient-to-r from-red-600 to-orange-600' : ''}
                    onClick={() => setMetodoPago('efectivo')}
                  >
                    Efectivo
                  </Button>
                  <Button
                    type="button"
                    variant={metodoPago === 'transferencia' ? 'default' : 'outline'}
                    className={metodoPago === 'transferencia' ? 'bg-gradient-to-r from-red-600 to-orange-600' : ''}
                    onClick={() => setMetodoPago('transferencia')}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Transferencia
                  </Button>
                </div>
              </div>

              {/* Subir Comprobante de Transferencia */}
              {metodoPago === 'transferencia' && (
                <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                  <h4 className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Comprobante de Transferencia
                  </h4>
                  <div className="space-y-2">
                    <Label htmlFor="transfer">Datos Bancarios:</Label>
                    <div className="text-sm space-y-1 bg-white p-3 rounded border">
                      <p><strong>Banco:</strong> BBVA Bancomer</p>
                      <p><strong>Cuenta:</strong> 0123456789</p>
                      <p><strong>CLABE:</strong> 012180001234567890</p>
                      <p><strong>Titular:</strong> Pizzas Jarochos SA de CV</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transfer">Sube tu comprobante</Label>
                    <Input
                      id="transfer"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      required
                    />
                    {transferImage && (
                      <div className="mt-2">
                        <p className="text-sm text-green-600 mb-2">✓ Comprobante cargado</p>
                        <img src={transferImage} alt="Comprobante" className="max-w-xs rounded border" />
                      </div>
                    )}
                  </div>
                  
                  {/* Mensaje para Transferencia */}
                  <div className="space-y-2">
                    <Label htmlFor="message">Mensaje para el administrador (opcional)</Label>
                    <Textarea
                      id="message"
                      placeholder="Escribe un mensaje o pregunta..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      rows={3}
                    />
                    <p className="text-xs text-gray-500">
                      El administrador podrá responder tus mensajes
                    </p>
                  </div>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-1">
        <Card className="sticky top-4">
          <CardHeader>
            <CardTitle>Resumen del Pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${subtotal} MXN</span>
            </div>
            <div className="flex justify-between">
              <span>Envío</span>
              <span className="flex items-center gap-2">
                {envio === 0 && <Badge variant="outline" className="text-green-600">¡Gratis!</Badge>}
                ${envio} MXN
              </span>
            </div>
            {subtotal > 0 && subtotal <= 200 && (
              <p className="text-xs text-gray-500">
                Agrega ${200 - subtotal} MXN más para envío gratis
              </p>
            )}
            <Separator />
            <div className="flex justify-between text-lg">
              <span>Total</span>
              <span className="text-red-600">${total} MXN</span>
            </div>
            {metodoPago === 'transferencia' && (
              <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
                <p className="flex items-center gap-1">
                  <Send className="w-3 h-3" />
                  Podrás comunicarte con el administrador después de confirmar
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button
              className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
              onClick={handleSubmitOrder}
              disabled={cartItems.length === 0}
            >
              Confirmar Pedido
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
