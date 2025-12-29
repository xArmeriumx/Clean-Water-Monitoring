import React, { useEffect, useState } from 'react';
import liff from '@line/liff';
import { Spinner, Flex, Alert, AlertIcon } from '@chakra-ui/react';
import { useAuth } from './AuthContext';
import { apiGet, apiPost } from '../utils/api';

const LiffLogin = ({ children }) => {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeLiff = async () => {
      try {
        // ✅ ถ้ามี user แล้ว และมี userId อยู่แล้ว → ไม่ต้อง init LIFF ซ้ำ
        if (user?.profile?.userId) {
          setLoading(false);
          return;
        }

        await liff.init({ liffId: import.meta.env.VITE_LIFF_ID });

        if (!liff.isLoggedIn()) {
          liff.login({ redirectUri: window.location.href });
          return; // จะ redirect แล้ว ไม่ต้องทำอะไรต่อ
        }

        const profile = await liff.getProfile();
        const userData = {
          userId: profile.userId,
          displayName: profile.displayName,
          pictureUrl: profile.pictureUrl,
        };

        // ✅ ส่งข้อมูลไป backend เพื่อ generate token + เซ็ต HttpOnly cookie
        const tokenRes = await apiPost('/api/generate-token', userData);

        if (!tokenRes.ok) {
          throw new Error('Failed to generate token');
        }

        // ✅ ดึงข้อมูล user จาก /api/me หลังจากได้ cookie แล้ว
        const userRes = await apiGet('/api/me');

        if (!userRes.ok) {
          throw new Error('Failed to fetch user profile');
        }

        const userProfile = await userRes.json();

        // ✅ เซ็ต user ใน context
        setUser({
          profile: {
            userId: userProfile.userId,
            displayName: userProfile.displayName,
            pictureUrl: userProfile.pictureUrl || '/logo.png',
          },
          role: userProfile.role || 'user',
        });

      } catch (err) {
        console.error('LIFF Initialization error:', err);
        setError('ไม่สามารถเริ่มต้น LIFF ได้ กรุณาลองใหม่อีกครั้ง');
      } finally {
        setLoading(false);
      }
    };

    initializeLiff();
  }, [user, setUser]);

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="100vh">
        <Spinner size="xl" color="blue.500" />
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex justify="center" align="center" minH="100vh">
        <Alert status="error" maxW="400px">
          <AlertIcon />
          {error}
        </Alert>
      </Flex>
    );
  }

  return <>{children}</>;
};

export default LiffLogin;
