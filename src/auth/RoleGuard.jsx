import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useToast, Center, Spinner } from '@chakra-ui/react';

const RoleGuard = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const toast = useToast();
  const [redirectPath, setRedirectPath] = useState(null);
  const [delayedRedirect, setDelayedRedirect] = useState(false);

  const getRedirectForRole = () => {
    if (!user || !user.role) return '/';
    switch (user.role) {
      case 'admin':
        return '/adminlogin';
      case 'labstaff':
        return '/labstafflogin';
      case 'user':
        return '/appforuser';
      default:
        return '/';
    }
  };

  useEffect(() => {
    if (!isLoading) {
      if (!user || !['admin', 'labstaff', 'user'].includes(user.role)) {
        toast({
          title: 'Session Expired',
          description: 'เซสชันของคุณหมดอายุ กรุณาล็อกอินใหม่อีกครั้ง',
          status: 'warning',
          duration: 3000,
          isClosable: true,
          position: 'top',
        });

        // ✅ Delay 2 วินาทีก่อนตั้ง redirect
        setTimeout(() => {
          if (!user) {
            setRedirectPath(getRedirectForRole());
          } else {
            setRedirectPath('/');
          }
          setDelayedRedirect(true);
        }, 2000); // 2 วินาที
      }
    }
  }, [user, isLoading, toast]);

  if (isLoading) {
    return (
      <Center minH="100vh">
        <Spinner size="xl" color="blue.500" />
      </Center>
    );
  }

  if (delayedRedirect && redirectPath && redirectPath !== location.pathname) {
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};

export default RoleGuard;
