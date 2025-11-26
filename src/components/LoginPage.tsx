import { useState } from 'react';
// Importamos las funciones de Firebase necesarias
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
// Importamos la instancia 'auth' que inicializamos en firebase.js
import { auth } from './firebase'; 

import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Pizza } from 'lucide-react';

interface LoginPageProps {
  onLogin: (userData: { nombre: string; email: string; telefono: string; isAdmin: boolean }) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(''); // Estado para mostrar errores
  
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const { email, password, nombre, telefono } = formData;

    try {
      let userCredential;

      if (isRegistering) {
        // 1. REGISTRO (CREAR NUEVO USUARIO EN FIREBASE)
        userCredential = await createUserWithEmailAndPassword(auth, email, password);

        // Aquí puedes guardar el nombre y teléfono en Firestore (opcional, pero recomendado)
        // Para fines de esta solución, asumimos que solo pasamos los datos a onLogin
      } else {
        // 2. INICIO DE SESIÓN (VERIFICAR CREDENCIALES EN FIREBASE)
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      }

      // 3. AUTENTICACIÓN EXITOSA (Verificar si es admin después de Auth)
      const isAdmin = email === 'admin@pizzasjarochos.com'; 
      
      onLogin({
        // El nombre no se obtiene de Firebase por defecto, usamos el del formulario
        nombre: nombre || (isAdmin ? 'Administrador' : 'Usuario'), 
        email: userCredential.user.email || email,
        telefono: telefono,
        isAdmin: isAdmin,
      });

    } catch (err) {
      console.error("Firebase Auth Error:", err);
      
      // Manejo de errores de Firebase
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Correo o contraseña incorrectos.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Este correo ya está registrado.');
      } else if (err.code === 'auth/weak-password') {
        setError('La contraseña debe tener al menos 6 caracteres.');
      } else {
        setError('Ocurrió un error. Inténtalo de nuevo.');
      }

    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-r from-red-600 to-orange-600 p-4 rounded-full">
              <Pizza className="w-12 h-12 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl">Pizzas Jarochos</CardTitle>
          <CardDescription>
            {isRegistering ? 'Crear nueva cuenta' : 'Inicia sesión para ordenar'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre completo</Label>
                  <Input
                    id="nombre"
                    type="text"
                    placeholder="Juan Pérez"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required={isRegistering}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    type="tel"
                    placeholder="229-123-4567"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    required={isRegistering}
                  />
                </div>
              </>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>
            
            {/* Mostrar mensaje de error si existe */}
            {error && (
                <div className="text-red-600 text-sm p-2 bg-red-50 border border-red-200 rounded-md">
                    {error}
                </div>
            )}

<Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
              disabled={isLoading} // Deshabilitar mientras carga
            >
              {isLoading ? 'Cargando...' : (isRegistering ? 'Registrarse' : 'Iniciar Sesión')}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setIsRegistering(!isRegistering)}
            >
              {isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}