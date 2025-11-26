import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { ShoppingCart, Plus, Minus, Star } from 'lucide-react';

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

interface MenuPageProps {
  pizzas: Pizza[];
  onAddToCart: (pizza: Pizza, cantidad: number) => void;
}

export function MenuPage({ pizzas, onAddToCart }: MenuPageProps) {
  const [filter, setFilter] = useState<string>('Todas');
  const [quantities, setQuantities] = useState<{ [key: number]: number }>({});

  const categorias = ['Todas', 'Especiales', 'Clásicas', 'Vegetarianas'];

  const pizzasFiltradas = filter === 'Todas' 
    ? pizzas 
    : pizzas.filter(p => p.categoria === filter);

  const updateQuantity = (id: number, delta: number) => {
    setQuantities(prev => ({
      ...prev,
      [id]: Math.max(0, (prev[id] || 0) + delta)
    }));
  };

  const handleAddToCart = (pizza: Pizza) => {
    const cantidad = quantities[pizza.id] || 1;
    onAddToCart(pizza, cantidad);
    setQuantities(prev => ({ ...prev, [pizza.id]: 0 }));
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 flex-wrap">
        {categorias.map(cat => (
          <Button
            key={cat}
            variant={filter === cat ? 'default' : 'outline'}
            onClick={() => setFilter(cat)}
            className={filter === cat ? 'bg-gradient-to-r from-red-600 to-orange-600' : ''}
          >
            {cat}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pizzasFiltradas.map(pizza => (
          <Card key={pizza.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative h-48 overflow-hidden">
              <ImageWithFallback
                src={pizza.imagen}
                alt={pizza.nombre}
                className="w-full h-full object-cover"
              />
              <Badge className="absolute top-2 right-2 bg-orange-600">
                {pizza.categoria}
              </Badge>
            </div>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {pizza.nombre}
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm">{pizza.rating}</span>
                </div>
              </CardTitle>
              <CardDescription>{pizza.descripcion}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1 mb-3">
                {pizza.ingredientes.map((ing, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {ing}
                  </Badge>
                ))}
              </div>
              <p className="text-2xl text-red-600">${pizza.precio} MXN</p>
            </CardContent>
            <CardFooter className="flex gap-2">
              <div className="flex items-center gap-2 border rounded-md">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => updateQuantity(pizza.id, -1)}
                  disabled={!quantities[pizza.id]}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="w-8 text-center">{quantities[pizza.id] || 1}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => updateQuantity(pizza.id, 1)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <Button
                className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
                onClick={() => handleAddToCart(pizza)}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Agregar
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
