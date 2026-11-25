import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Trees,
  TestTube2,
  Cpu,
  TrendingUp,
  FlaskConical,
  Bug,
  CloudSun,
  Store,
  ShoppingBag,
  CalendarCheck,
  BookOpen,
  Users,
  Settings,
  HelpCircle,
  BarChart3,
  ShieldAlert,
  X
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const role = user?.role || 'farmer';

  const farmerLinks = [
    { to: '/farmer/dashboard', label: 'Farmer Dashboard', icon: LayoutDashboard },
    { to: '/farmer/farms', label: 'My Farms & Land', icon: Trees },
    { to: '/farmer/crops', label: 'Crops & History', icon: BookOpen },
    { to: '/farmer/recommendation', label: 'Crop Recommendation', icon: Cpu, badge: 'AI' },
    { to: '/farmer/yield', label: 'Yield Prediction', icon: TrendingUp, badge: 'AI' },
    { to: '/farmer/fertilizer', label: 'Fertilizer Advice', icon: FlaskConical, badge: 'AI' },
    { to: '/farmer/disease', label: 'Disease Detection', icon: Bug, badge: 'Vision' },
    { to: '/farmer/weather', label: 'Agri-Weather Forecast', icon: CloudSun },
    { to: '/farmer/market-prices', label: 'Mandi Market Prices', icon: TrendingUp },
    { to: '/farmer/marketplace', label: 'Produce Marketplace', icon: Store },
    { to: '/farmer/procurement', label: 'Procurement Slots', icon: CalendarCheck },
    { to: '/farmer/support', label: 'Help & Grievances', icon: HelpCircle },
  ];

  const buyerLinks = [
    { to: '/buyer/dashboard', label: 'Buyer Dashboard', icon: LayoutDashboard },
    { to: '/buyer/marketplace', label: 'Browse Produce', icon: Store },
    { to: '/buyer/orders', label: 'Purchase Orders', icon: ShoppingBag },
    { to: '/buyer/market-prices', label: 'Mandi Market Prices', icon: CloudSun },
    { to: '/buyer/support', label: 'Support & Disputes', icon: HelpCircle },
    { to: '/buyer/profile', label: 'Business Profile', icon: Settings },
  ];

  const adminLinks = [
    { to: '/admin/dashboard', label: 'Admin Overview', icon: LayoutDashboard },
    { to: '/admin/crops', label: 'Master Crops Catalog', icon: BookOpen },
    { to: '/admin/users', label: 'User Directory', icon: Users },
    { to: '/admin/reports', label: 'Reports & Analytics', icon: BarChart3 },
    { to: '/admin/complaints', label: 'Grievance Redressal', icon: ShieldAlert },
  ];

  const links = role === 'admin' ? adminLinks : role === 'buyer' ? buyerLinks : farmerLinks;

  const content = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 w-64">
      {/* Mobile close button */}
      <div className="lg:hidden p-4 border-b border-slate-100 flex items-center justify-between">
        <span className="font-bold text-xs uppercase tracking-wider text-slate-500">Navigation</span>
        <button onClick={onClose} className="p-1 rounded text-slate-500 hover:bg-slate-100">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav Links */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <p className="px-3 pb-2 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
          {role} Workspace
        </p>
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 shadow-sm shadow-emerald-50 border border-emerald-100'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <div className="flex items-center space-x-2.5">
                <Icon className="w-4 h-4 text-emerald-600" />
                <span>{link.label}</span>
              </div>
              {link.badge && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  {link.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Role Footer */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/60 m-2 rounded-xl text-[11px] text-slate-500">
        <span className="font-semibold text-slate-700 block">Smart Agriculture v1.0</span>
        <span className="text-slate-600">Connected to MongoDB Atlas</span>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block fixed left-0 top-16 bottom-0 z-30">
        {content}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
          <div className="relative z-10">{content}</div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
