import React from 'react';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import MaintenancePage from '../pages/MaintenancePage';

const MaintenanceGuard = ({ children }) => {
  const { settings, loading: settingsLoading } = useSettings();
  const { user, initialized } = useAuth();

  // Wait for both settings and auth to be ready
  if (settingsLoading || !initialized) return null;

  // Check if maintenance mode is ON
  // EXCEPT for admin users - they should see the site to test/manage it
  if (settings?.isMaintenanceMode && user?.role !== 'admin') {
    return <MaintenancePage />;
  }

  return children;
};

export default MaintenanceGuard;
