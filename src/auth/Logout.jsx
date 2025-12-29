// Logout.js
import React, { useEffect } from 'react';
import liff from '@line/liff';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import { apiPost } from '../utils/api';

const Logout = () => {
  const { user, setUser, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return; // รอโหลด auth เสร็จก่อน

    const role = user?.role;

    const handleLogout = async () => {
      try {
        // ✅ ยิง /api/logout เพื่อ clear accessToken จาก Cookie ฝั่ง server
        await apiPost('/api/logout');
      } catch (err) {
        console.error('Error during API logout:', err);
      } finally {
        // ✅ Clear user context ทันที ไม่ต้องรอ
        setUser(null);

        if (role === 'admin') {
          navigate('/adminlogin');
        } else if (role === 'labstaff') {
          navigate('/labstafflogin');
        } else {
          // ✅ user ธรรมดา (LIFF user)
          const LIFF_ID = import.meta.env.VITE_LIFF_ID;
          liff
            .init({ liffId: LIFF_ID })
            .then(() => {
              liff.logout();
              navigate('/');
            })
            .catch((err) => {
              console.error('Error initializing LIFF:', err);
              navigate('/');
            });
        }
      }
    };

    handleLogout();
  }, [user, isLoading, setUser, navigate]);

  return null;
};

export default Logout;
