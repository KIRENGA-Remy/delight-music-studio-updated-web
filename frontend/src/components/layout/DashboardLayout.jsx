import React from 'react';
import DashboardSidebar from './DashboardSidebar';
import NotificationBell from '../common/NotificationBell';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';

const DashboardLayout = ({ children, title, subtitle }) => {
  const { user } = useAuth();
  return (
    <div className="flex min-h-screen bg-dark-950">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-dark-950/80 backdrop-blur-md border-b border-purple-900/30 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <div>
            <h1 className="font-display font-bold text-xl text-white">{title}</h1>
            {subtitle && <p className="text-md text-purple-300 mt-0.5">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-900/20 border border-purple-800/30">
              <div className="w-6 h-6 rounded-full bg-purple-gradient flex items-center justify-center font-display font-bold text-white text-md">
                {user?.fullname?.[0]}
              </div>
              <span className="text-white text-md font-display font-semibold hidden sm:block">{user?.fullname}</span>
            </div>
          </div>
        </header>
        <motion.main
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex-1 p-6 overflow-auto">
          {children}
        </motion.main>
      </div>
    </div>
  );
};

export default DashboardLayout;
