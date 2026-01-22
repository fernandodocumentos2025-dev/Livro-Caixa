import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, ArrowDownCircle, CheckCircle, History, FileText, Menu, X, LogOut, User } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();

  const links = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/vendas', icon: ShoppingCart, label: 'Vendas' },
    { to: '/retiradas', icon: ArrowDownCircle, label: 'Retiradas' },
    { to: '/fechamento', icon: CheckCircle, label: 'Fechamento' },
    { to: '/historico', icon: History, label: 'Histórico' },

  ];

  const handleLogout = async () => {
    if (window.confirm('Tem certeza que deseja sair?')) {
      await signOut();
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 right-4 z-50 p-3 bg-white rounded-lg shadow-lg touch-manipulation"
        aria-label={isOpen ? 'Fechar menu' : 'Abrir menu'}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <aside
        className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 shadow-lg transition-transform duration-300 z-40 ${isOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 w-64 flex flex-col`}
      >
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-blue-600">Livro Caixa</h1>
          <p className="text-sm text-gray-600 mt-1">Gestão Financeira</p>
        </div>

        <nav className="p-4 flex-1">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors touch-manipulation ${isActive
                  ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600 font-semibold'
                  : 'text-gray-700 hover:bg-gray-50'
                }`
              }
            >
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg mb-2">
            <User size={20} className="text-gray-600" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500">Conectado como</p>
              <p className="text-sm font-medium text-gray-900 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg w-full text-red-600 hover:bg-red-50 transition-colors touch-manipulation"
          >
            <LogOut size={20} />
            <span className="font-semibold">Sair</span>
          </button>
        </div>
      </aside>

      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
