import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Clock, Flame, Users, Leaf } from 'lucide-react';

const categorias = [
  {
    id: 1,
    nombre: 'Pizzas Especiales',
    descripcion: 'Nuestras recetas únicas con sabores tradicionales jarochos',
    icono: Flame,
    items: ['Pizza Jarocha Especial', 'Pizza Veracruzana', 'Pizza Mexicana'],
    color: 'from-red-600 to-orange-600'
  },
  {
    id: 2,
    nombre: 'Pizzas Clásicas',
    descripcion: 'Los sabores tradicionales que siempre funcionan',
    icono: Users,
    items: ['Pepperoni', 'Hawaiana', 'Cuatro Quesos', 'Suprema'],
    color: 'from-orange-600 to-yellow-600'
  },
  {
    id: 3,
    nombre: 'Pizzas Vegetarianas',
    descripcion: 'Opciones frescas y saludables con vegetales del mercado',
    icono: Leaf,
    items: ['Vegetariana Especial', 'Caprese', 'Margherita', 'Champiñones'],
    color: 'from-green-600 to-emerald-600'
  }
];

const extras = [
  {
    nombre: 'Bebidas',
    items: ['Refrescos 600ml', 'Agua mineral', 'Jugos naturales', 'Cerveza artesanal'],
    precios: '$25 - $45'
  },
  {
    nombre: 'Entradas',
    items: ['Alitas BBQ', 'Pan al ajo', 'Dedos de queso', 'Papas a la francesa'],
    precios: '$89 - $129'
  },
  {
    nombre: 'Postres',
    items: ['Churros con cajeta', 'Pay de queso', 'Brownie con helado', 'Helado artesanal'],
    precios: '$59 - $89'
  }
];

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

interface CatalogPageProps {
  promociones: Promocion[];
}

export function CatalogPage({ promociones }: CatalogPageProps) {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl">Nuestro Catálogo</h1>
        <p className="text-gray-600">Descubre todas nuestras opciones y promociones</p>
      </div>

      {/* Información general */}
      <Card className="bg-gradient-to-r from-red-50 to-orange-50">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <div className="bg-white p-3 rounded-full">
                <Clock className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Tiempo de entrega</p>
                <p className="text-lg">30-45 minutos</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white p-3 rounded-full">
                <Flame className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Especialidad</p>
                <p className="text-lg">Sabor Jarocho</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white p-3 rounded-full">
                <Users className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Desde</p>
                <p className="text-lg">1996</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categorías de pizzas */}
      <div className="space-y-4">
        <h2 className="text-2xl">Categorías de Pizzas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categorias.map(cat => {
            const IconComponent = cat.icono;
            return (
              <Card key={cat.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${cat.color} flex items-center justify-center mb-3`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle>{cat.nombre}</CardTitle>
                  <CardDescription>{cat.descripcion}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {cat.items.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Tamaños y precios */}
      <Card>
        <CardHeader>
          <CardTitle>Tamaños Disponibles</CardTitle>
          <CardDescription>Todos los precios son aproximados y pueden variar según los ingredientes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4 text-center">
              <p className="text-lg mb-2">Chica</p>
              <p className="text-3xl text-red-600 mb-2">$99-$149</p>
              <p className="text-sm text-gray-600">6 rebanadas - 25cm</p>
              <Badge variant="outline" className="mt-2">1-2 personas</Badge>
            </div>
            <div className="border-2 border-orange-600 rounded-lg p-4 text-center relative">
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-orange-600">
                Más popular
              </Badge>
              <p className="text-lg mb-2 mt-2">Mediana</p>
              <p className="text-3xl text-red-600 mb-2">$149-$209</p>
              <p className="text-sm text-gray-600">8 rebanadas - 30cm</p>
              <Badge variant="outline" className="mt-2">2-3 personas</Badge>
            </div>
            <div className="border rounded-lg p-4 text-center">
              <p className="text-lg mb-2">Grande</p>
              <p className="text-3xl text-red-600 mb-2">$189-$279</p>
              <p className="text-sm text-gray-600">10 rebanadas - 35cm</p>
              <Badge variant="outline" className="mt-2">3-4 personas</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Extras */}
      <div className="space-y-4">
        <h2 className="text-2xl">Complementa tu Pedido</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {extras.map((extra, idx) => (
            <Card key={idx}>
              <CardHeader>
                <CardTitle>{extra.nombre}</CardTitle>
                <CardDescription>{extra.precios}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {extra.items.map((item, itemIdx) => (
                    <li key={itemIdx} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-600"></div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Promociones */}
      <div className="space-y-4">
        <h2 className="text-2xl">Promociones Especiales</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {promociones.map((promo, idx) => (
            <Card key={idx} className="border-2 border-orange-200 hover:border-orange-400 transition-colors">
              <CardHeader>
                <Badge className="w-fit bg-gradient-to-r from-red-600 to-orange-600">
                  Promoción
                </Badge>
                <CardTitle className="mt-2">{promo.titulo}</CardTitle>
                <CardDescription>{promo.descripcion}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {promo.precio && (
                  <p className="text-2xl text-red-600">{promo.precio}</p>
                )}
                {promo.ahorro && (
                  <Badge variant="outline" className="text-green-600">{promo.ahorro}</Badge>
                )}
                {promo.dias && (
                  <p className="text-sm text-gray-600">
                    <strong>Válido:</strong> {promo.dias}
                  </p>
                )}
                {promo.horario && (
                  <p className="text-sm text-gray-600">
                    <strong>Horario:</strong> {promo.horario}
                  </p>
                )}
                {promo.restricciones && (
                  <p className="text-xs text-gray-500">{promo.restricciones}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
