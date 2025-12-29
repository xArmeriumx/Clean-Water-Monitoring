import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Box, VStack, Heading, FormControl, FormLabel, Input,
  InputGroup, InputRightElement, Button, Center, Text,
  useToast, Flex, Image, Spinner
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { apiGet, apiPost, getCsrfToken } from '../utils/api';

// Animation for fade-in effect
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

function LabStaffLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { user, setUser, isLoading } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    if (!isLoading && user?.role === 'labstaff') {
      navigate('/dashboard');
    }
  }, [user, isLoading, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // ดึง CSRF token
      const csrfToken = await getCsrfToken();

      // ส่ง login
      const res = await apiPost('/api/users/login', { username, password, csrfToken });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || 'Login failed');
      }

      // ดึงข้อมูล user จาก /api/me
      const meRes = await apiGet('/api/me');
      if (!meRes.ok) {
        throw new Error('Failed to fetch user profile');
      }
      const meData = await meRes.json();

      if (meData.role !== 'labstaff') {
        throw new Error('Access denied: บัญชีไม่ใช่ Lab Staff');
      }

      setUser({
        profile: {
          userId: meData.userId,
          displayName: meData.displayName,
          pictureUrl: meData.pictureUrl || '/logo.png',
        },
        role: meData.role,
      });

      navigate('/dashboard');

      toast({
        title: 'Login Successful',
        description: `ยินดีต้อนรับ คุณ${meData.displayName}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
    } catch (err) {
      console.error('LabStaff login error:', err.message);
      toast({
        title: 'Login Failed',
        description: err.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
    }
  };

  if (isLoading) {
    return (
      <Center minH="100vh">
        <Spinner size="xl" color="blue.500" />
      </Center>
    );
  }

  return (
    <Center minH="100vh" bgGradient="linear(to-br, blue.50, gray.100)">
      <Box
        w={{ base: '90%', sm: '450px', md: '500px' }}
        p={{ base: 6, md: 10 }}
        bg="white"
        borderRadius="xl"
        boxShadow="2xl"
        border="1px"
        borderColor="gray.100"
        animation={`${fadeIn} 0.6s ease-out`}
        position="relative"
        overflow="hidden"
      >
        <Box
          position="absolute"
          top="0"
          left="0"
          w="full"
          h="full"
          bgGradient="radial(blue.200 1%, transparent 70%)"
          opacity={0.1}
          zIndex={0}
        />
        <VStack spacing={8} align="stretch" position="relative" zIndex={1}>
          <Flex direction="column" align="center">
            <Image
              src="/logo.png"
              alt="Logo"
              boxSize={{ base: '70px', md: '80px' }}
              mb={3}
              transition="transform 0.3s ease"
              _hover={{ transform: 'scale(1.1)' }}
              fallbackSrc="https://via.placeholder.com/80"
            />
            <Heading
              as="h2"
              size={{ base: 'xl', md: '2xl' }}
              bgGradient="linear(to-r, blue.600, blue.400)"
              bgClip="text"
              fontWeight="extrabold"
            >
              Lab Staff Login
            </Heading>
            <Text fontSize={{ base: 'sm', md: 'md' }} color="gray.600" fontWeight="medium">
              Clean Water Monitoring System
            </Text>
          </Flex>

          <form onSubmit={handleLogin}>
            <VStack spacing={6}>
              <FormControl>
                <FormLabel fontSize="sm" color="gray.700" fontWeight="medium">
                  Username
                </FormLabel>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  size="lg"
                  focusBorderColor="blue.500"
                  borderRadius="md"
                  bg="white"
                  border="2px"
                  borderColor="gray.200"
                  _hover={{ borderColor: 'gray.300' }}
                  _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px blue.500' }}
                  transition="all 0.2s"
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm" color="gray.700" fontWeight="medium">
                  Password
                </FormLabel>
                <InputGroup size="lg">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    focusBorderColor="blue.500"
                    borderRadius="md"
                    bg="white"
                    border="2px"
                    borderColor="gray.200"
                    _hover={{ borderColor: 'gray.300' }}
                    _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px blue.500' }}
                    transition="all 0.2s"
                    pr="3rem"
                  />
                  <InputRightElement width="3rem" height="full">
                    <Button
                      variant="ghost"
                      size="sm"
                      h="2rem"
                      w="2rem"
                      onClick={() => setShowPassword(!showPassword)}
                      _hover={{ bg: 'gray.100' }}
                      _focus={{ boxShadow: 'none' }}
                    >
                      {showPassword ? <ViewOffIcon /> : <ViewIcon />}
                    </Button>
                  </InputRightElement>
                </InputGroup>
              </FormControl>

              <Button
                type="submit"
                colorScheme="blue"
                size="lg"
                w="full"
                borderRadius="md"
                mt={4}
                bgGradient="linear(to-r, blue.500, blue.600)"
                _hover={{ bgGradient: 'linear(to-r, blue.600, blue.700)' }}
                _active={{ bgGradient: 'linear(to-r, blue.700, blue.800)' }}
                boxShadow="md"
              >
                Log In
              </Button>
            </VStack>
          </form>
        </VStack>
      </Box>
    </Center>
  );
}

export default LabStaffLogin;
