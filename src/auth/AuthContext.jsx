import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiGet } from '../utils/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); 
  const [isLoading, setIsLoading] = useState(true); 

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const res = await apiGet('/api/me');

        if (res.ok) {
          const data = await res.json();
          setUser({
            profile: {
              userId: data.userId,
              displayName: data.displayName,
              pictureUrl: data.pictureUrl || '/logo.png',
            },
            role: data.role,
          });
        } else {
          // ❌ ถ้า token หมดอายุ / ไม่ valid
          setUser(null);
        }
      } catch (err) {
        console.error('Error fetching /api/me:', err.message);
        setUser(null);
      } finally {
        setIsLoading(false); // ✅ โหลดเสร็จไม่ว่าจะ success หรือ error
      }
    };

    fetchUserProfile();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook สำหรับเรียกใช้งาน Context ได้ง่าย
export function useAuth() {
  return useContext(AuthContext);
}
