import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useAuth } from '../auth/AuthProvider';
import { fetchIsAdmin } from './isAdmin';

/**
 * True when the signed-in user has profiles.role = 'admin' (web only).
 */
export function useAdminAccess() {
  const { user, configured } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || !configured || !user?.id) {
      setIsAdmin(false);
      return undefined;
    }

    let active = true;
    fetchIsAdmin().then((admin) => {
      if (active) setIsAdmin(admin);
    });

    return () => {
      active = false;
    };
  }, [configured, user?.id]);

  return isAdmin;
}
