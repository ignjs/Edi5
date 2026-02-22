import { AuthProvider } from './AuthContext';
import './globals.css';

export const metadata = {
  title: 'Edi5 | Control de Acceso',
  description: 'Gestión inteligente de espacios comunes',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="selection:bg-[#2D4F3E] selection:text-white">
      <body className="bg-[#0A0A0A] overflow-x-hidden antialiased">
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}