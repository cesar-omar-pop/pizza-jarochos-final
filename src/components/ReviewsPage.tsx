import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Star, ThumbsUp } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface Review {
  id: number;
  usuario: string;
  fecha: string;
  rating: number;
  comentario: string;
  likes: number;
  pizza: string;
}

const reviewsIniciales: Review[] = [
  {
    id: 1,
    usuario: 'María González',
    fecha: '2025-11-05',
    rating: 5,
    comentario: '¡La Pizza Jarocha Especial es deliciosa! Los jalapeños le dan un toque perfecto. Excelente servicio y entrega rápida.',
    likes: 12,
    pizza: 'Pizza Jarocha Especial'
  },
  {
    id: 2,
    usuario: 'Carlos Ramírez',
    fecha: '2025-11-04',
    rating: 5,
    comentario: 'La mejor pizza de Veracruz sin duda. La Veracruzana con mariscos está increíble, muy fresca y con buen sabor. Totalmente recomendada.',
    likes: 8,
    pizza: 'Pizza Veracruzana'
  },
  {
    id: 3,
    usuario: 'Ana Martínez',
    fecha: '2025-11-03',
    rating: 4,
    comentario: 'Muy buena pizza, la masa está perfecta. Solo me gustaría que agregaran más opciones vegetarianas.',
    likes: 5,
    pizza: 'Pizza Vegetariana'
  },
  {
    id: 4,
    usuario: 'Roberto Sánchez',
    fecha: '2025-11-02',
    rating: 5,
    comentario: 'Pedimos la Pizza Mexicana para una reunión familiar y todos quedaron encantados. El sabor es auténtico y las porciones son generosas.',
    likes: 15,
    pizza: 'Pizza Mexicana'
  },
  {
    id: 5,
    usuario: 'Laura Pérez',
    fecha: '2025-11-01',
    rating: 5,
    comentario: 'Servicio excelente y pizza deliciosa. La Hawaiana tiene el equilibrio perfecto entre dulce y salado. ¡Volveré a ordenar!',
    likes: 6,
    pizza: 'Pizza Hawaiana Tropical'
  },
  {
    id: 6,
    usuario: 'Diego Torres',
    fecha: '2025-10-30',
    rating: 4,
    comentario: 'Buena calidad-precio. La pizza llegó caliente y bien empacada. El queso manchego le da un sabor único.',
    likes: 9,
    pizza: 'Pizza Pepperoni'
  }
];

export function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>(reviewsIniciales);
  const [newReview, setNewReview] = useState({
    rating: 5,
    comentario: '',
    pizza: ''
  });
  const [showForm, setShowForm] = useState(false);

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newReview.comentario.trim()) {
      toast.error('Por favor escribe un comentario');
      return;
    }

    const review: Review = {
      id: reviews.length + 1,
      usuario: 'Usuario Actual',
      fecha: new Date().toISOString().split('T')[0],
      rating: newReview.rating,
      comentario: newReview.comentario,
      likes: 0,
      pizza: newReview.pizza || 'Pedido general'
    };

    setReviews([review, ...reviews]);
    setNewReview({ rating: 5, comentario: '', pizza: '' });
    setShowForm(false);
    toast.success('¡Gracias por tu reseña!');
  };

  const promedioRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-red-50 to-orange-50">
        <CardHeader>
          <CardTitle>Calificación General</CardTitle>
          <div className="flex items-center gap-4 mt-4">
            <div className="text-5xl">{promedioRating.toFixed(1)}</div>
            <div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star
                    key={star}
                    className={`w-6 h-6 ${star <= Math.round(promedioRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                  />
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Basado en {reviews.length} reseñas
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl">Reseñas de Clientes</h2>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
        >
          {showForm ? 'Cancelar' : 'Escribir Reseña'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Comparte tu experiencia</CardTitle>
            <CardDescription>Tu opinión nos ayuda a mejorar</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div className="space-y-2">
                <Label>Calificación</Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewReview({ ...newReview, rating: star })}
                    >
                      <Star
                        className={`w-8 h-8 cursor-pointer transition-colors ${
                          star <= newReview.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300 hover:text-yellow-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="comentario">Tu Comentario</Label>
                <Textarea
                  id="comentario"
                  placeholder="Cuéntanos sobre tu experiencia..."
                  value={newReview.comentario}
                  onChange={(e) => setNewReview({ ...newReview, comentario: e.target.value })}
                  rows={4}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
              >
                Publicar Reseña
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {reviews.map(review => (
          <Card key={review.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-gradient-to-r from-red-600 to-orange-600 text-white">
                      {review.usuario.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">{review.usuario}</CardTitle>
                    <CardDescription>{new Date(review.fecha).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</CardDescription>
                  </div>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Badge variant="outline">{review.pizza}</Badge>
              <p className="text-gray-700">{review.comentario}</p>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Button variant="ghost" size="sm" className="gap-1">
                  <ThumbsUp className="w-4 h-4" />
                  <span>{review.likes}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
