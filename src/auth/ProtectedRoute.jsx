import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Center, Spinner, useToast } from '@chakra-ui/react';

// ฟังก์ชันช่วยรวม logic loading และ redirect
function RenderLoadingOrRedirect({ isLoading, user, allowedRoles, redirectPath = "/", toastMessage }) {
  const toast = useToast();

  useEffect(() => {
    if (!isLoading && (!user || (allowedRoles && !allowedRoles.includes(user.role)))) {
      toast({
        title: 'Access Denied',
        description: toastMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
    }
  }, [isLoading, user, allowedRoles, toastMessage, toast]);

  if (isLoading) {
    return (
      <Center minH="100vh">
        <Spinner size="xl" color="blue.500" />
      </Center>
    );
  }

  if (!user || (allowedRoles && !allowedRoles.includes(user.role))) {
    return <Navigate to={redirectPath} replace />;
  }

  return null; // ผ่าน ตรวจ role แล้ว
}

// Admin เท่านั้น
export function AdminRoute({ children }) {
  const { user, isLoading } = useAuth();
  const guard = RenderLoadingOrRedirect({
    isLoading,
    user,
    allowedRoles: ['admin'],
    redirectPath: '/mapping', // ถ้าไม่ใช่ admin เด้งไป mapping
    toastMessage: 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้ กรุณาล็อกอินด้วยบัญชีผู้ดูแลระบบ',
  });

  return guard || children;
}

// LabStaff หรือ Admin
export function LabStaffOrAdminRoute({ children }) {
  const { user, isLoading } = useAuth();
  const guard = RenderLoadingOrRedirect({
    isLoading,
    user,
    allowedRoles: ['labstaff', 'admin'],
    redirectPath: '/', // ถ้าไม่ใช่ labstaff/admin เด้งไปหน้าหลัก
    toastMessage: 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้ กรุณาล็อกอินด้วยบัญชี Lab Staff หรือ Admin',
  });

  return guard || children;
}

// User / Labstaff / Admin
export function UserOrAdminRoute({ children }) {
  const { user, isLoading } = useAuth();
  const guard = RenderLoadingOrRedirect({
    isLoading,
    user,
    allowedRoles: ['user', 'labstaff', 'admin'],
    redirectPath: '/',
    toastMessage: 'คุณต้องล็อกอินก่อนจึงจะสามารถเข้าถึงหน้าเว็บนี้ได้',
  });

  return guard || children;
}

// ผู้ใช้ที่ login แล้วทุกคน (ไม่จำกัด role)
export function AuthenticatedRoute({ children }) {
  const { user, isLoading } = useAuth();
  const guard = RenderLoadingOrRedirect({
    isLoading,
    user,
    toastMessage: 'กรุณาล็อกอินเพื่อเข้าถึงหน้าเว็บนี้',
  });

  return guard || children;
}
