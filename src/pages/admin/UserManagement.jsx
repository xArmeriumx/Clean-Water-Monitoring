import React, { useState, useEffect, useMemo, useRef } from 'react';
import { apiGet, apiFetch, apiDelete } from '../../utils/api';
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Avatar,
  Center,
  Spinner,
  useToast,
  Text,
  HStack,
  Input,
  Select,
  IconButton,
  Button,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  FormControl,
  FormLabel,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  useBreakpointValue,
  Flex,
  Skeleton,
  InputGroup,
  InputRightElement,
} from '@chakra-ui/react';
import { DeleteIcon, EditIcon, AddIcon, ArrowBackIcon, ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { useAuth } from '../../auth/AuthContext';
import { useNavigate } from 'react-router-dom';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [sortConfig, setSortConfig] = useState({ column: 'username', direction: 'asc' });

  const { isOpen: isUserModalOpen, onOpen: onOpenUserModal, onClose: onCloseUserModal } = useDisclosure();
  const [editingUser, setEditingUser] = useState(null);
  const { isOpen: isDeleteOpen, onOpen: onOpenDelete, onClose: onCloseDelete } = useDisclosure();
  const cancelRef = useRef();

  const toast = useToast();
  const { user } = useAuth();
  const token = user?.token || '';
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to access user management.',
        status: 'error',
        duration: 4000,
        isClosable: true,
        position: 'top-right',
      });
      setLoading(false);
      return;
    }

    // ตรวจสอบว่าเป็น admin หรือไม่
    if (user?.role !== 'admin') {
      toast({
        title: 'Access Denied',
        description: 'Only admins can access user management.',
        status: 'error',
        duration: 4000,
        isClosable: true,
        position: 'top-right',
      });
      navigate('/'); // เปลี่ยนเส้นทางไปหน้าอื่น เช่น หน้าแรก
      setLoading(false);
      return;
    }

    fetchUsers();
  }, [token, toast, user, navigate]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await apiGet('/api/users');
  
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
  
      const data = await res.json();
      const cleanedData = data.map(user => ({
        ...user,
        username: user.username?.trim() || 'Unknown User',
        displayName: user.displayName?.trim() || user.username?.trim() || 'Unknown User',
        role: user.role?.trim() || 'user',
      }));
  
      console.log('Fetched users:', cleanedData);
      setUsers(cleanedData);
    } catch (error) {
      toast({
        title: 'Failed to Load Users',
        description: error.message,
        status: 'error',
        duration: 4000,
        isClosable: true,
        position: 'top-right',
      });
    } finally {
      setLoading(false);
    }
  };
  

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const nameToSearch = u.role === 'user' ? u.displayName : u.username;
      const matchName = nameToSearch?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
      const matchRole = roleFilter ? u.role === roleFilter : true;
      return matchName && matchRole;
    });
  }, [users, searchTerm, roleFilter]);

  const sortedUsers = useMemo(() => {
    const arr = [...filteredUsers];
    arr.sort((a, b) => {
      let aVal, bVal;
      if (sortConfig.column === 'username') {
        aVal = a.role === 'user' ? a.displayName : a.username;
        bVal = b.role === 'user' ? b.displayName : b.username;
      } else {
        aVal = a[sortConfig.column] || a.username || '';
        bVal = b[sortConfig.column] || b.username || '';
      }
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      return sortConfig.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
    return arr;
  }, [filteredUsers, sortConfig]);

  const handleSort = (column) => {
    setSortConfig((prev) => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    onOpenUserModal();
  };

  const handleDeleteUser = (user) => {
    setUserToDelete(user);
    onOpenDelete();
  };

  const [userToDelete, setUserToDelete] = useState(null);

  const tableSize = useBreakpointValue({ base: 'sm', md: 'md' });
  const modalSize = useBreakpointValue({ base: 'xs', md: 'md' });

  if (loading) {
    return (
      <Box p={{ base: 4, md: 6 }} bg="gray.50" minH="100vh" w="100%">
        <Flex alignItems="center" mb={6}>
          <Skeleton height="40px" width="40px" borderRadius="md" mr={3} />
          <Skeleton height="32px" width="200px" />
        </Flex>
        <HStack
          spacing={3}
          mb={6}
          bg="white"
          p={4}
          borderRadius="lg"
          boxShadow="sm"
          flexDirection={{ base: 'column', md: 'row' }}
          alignItems={{ base: 'stretch', md: 'center' }}
        >
          <Skeleton height="40px" maxW={{ base: '100%', md: '300px' }} width="100%" borderRadius="md" mb={{ base: 3, md: 0 }} />
          <Skeleton height="40px" maxW={{ base: '100%', md: '200px' }} width="100%" borderRadius="md" mb={{ base: 3, md: 0 }} />
          <Skeleton height="40px" width={{ base: '100%', md: '150px' }} borderRadius="md" />
        </HStack>
        <Box bg="white" borderRadius="lg" boxShadow="sm" overflowX="auto">
          <Table variant="simple" size={tableSize}>
            <Thead bg="gray.50">
              <Tr>
                {['Profile', 'Name', 'Role', 'ID', 'Actions'].map((header, index) => (
                  <Th key={index}>
                    <Skeleton height="20px" width="80px" />
                  </Th>
                ))}
              </Tr>
            </Thead>
            <Tbody>
              {Array(5).fill().map((_, rowIndex) => (
                <Tr key={rowIndex}>
                  <Td>
                    <Skeleton height="32px" width="32px" borderRadius="full" />
                  </Td>
                  <Td>
                    <Skeleton height="20px" width="120px" />
                  </Td>
                  <Td>
                    <Skeleton height="20px" width="80px" borderRadius="md" />
                  </Td>
                  <Td>
                    <Skeleton height="20px" width="100px" />
                  </Td>
                  <Td>
                    <HStack spacing={2}>
                      <Skeleton height="32px" width="32px" borderRadius="md" />
                      <Skeleton height="32px" width="32px" borderRadius="md" />
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </Box>
    );
  }

  return (
    <Box p={{ base: 4, md: 6 }} bg="gray.50" minH="100vh" w="100%">
      <Flex alignItems="center" mb={6}>
        <IconButton
          icon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          variant="ghost"
          size="lg"
          color="gray.700"
          mr={3}
          _hover={{ bg: 'gray.200' }}
          aria-label="Back"
        />
        <Heading as="h1" size={{ base: 'lg', md: 'xl' }} color="gray.800">
          User Management
        </Heading>
      </Flex>

      <HStack
        spacing={3}
        mb={6}
        bg="white"
        p={4}
        borderRadius="lg"
        boxShadow="sm"
        flexDirection={{ base: 'column', md: 'row' }}
        alignItems={{ base: 'stretch', md: 'center' }}
      >
        <Input
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          maxW={{ base: '100%', md: '300px' }}
          bg="white"
          borderRadius="md"
          borderColor="gray.200"
          focusBorderColor="blue.500"
          mb={{ base: 3, md: 0 }}
        />
        <Select
          placeholder="Filter by role"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          maxW={{ base: '100%', md: '200px' }}
          bg="white"
          borderRadius="md"
          borderColor="gray.200"
          focusBorderColor="blue.500"
          mb={{ base: 3, md: 0 }}
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
          <option value="labstaff">Lab Staff</option>
        </Select>
        <Button
          leftIcon={<AddIcon />}
          colorScheme="blue"
          onClick={() => {
            setEditingUser(null);
            onOpenUserModal();
          }}
          w={{ base: '100%', md: 'auto' }}
          px={6}
        >
          Add User
        </Button>
      </HStack>

      <Box bg="white" borderRadius="lg" boxShadow="sm" overflowX="auto">
        {sortedUsers.length === 0 ? (
          <Text p={6} color="gray.600" textAlign="center" fontSize="lg">
            No users found
          </Text>
        ) : (
          <Table variant="simple" size={tableSize}>
            <Thead bg="gray.50">
              <Tr>
                <Th color="gray.800">Profile</Th>
                <Th onClick={() => handleSort('username')} cursor="pointer" color="gray.800">
                  Name {sortConfig.column === 'username' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </Th>
                <Th onClick={() => handleSort('role')} cursor="pointer" color="gray.800">
                  Role {sortConfig.column === 'role' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </Th>
                <Th onClick={() => handleSort('id')} cursor="pointer" color="gray.800">
                  ID {sortConfig.column === 'id' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </Th>
                <Th color="gray.800">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {sortedUsers.map((u) => (
                <Tr key={u.id} _hover={{ bg: 'gray.100' }}>
                  <Td>
                    <Avatar
                      src={u.pictureUrl}
                      size="sm"
                      name={u.role === 'user' ? u.displayName || 'N/A' : u.username || 'N/A'}
                    />
                  </Td>
                  <Td color="gray.800">
                    {u.role === 'user' ? u.displayName || 'N/A' : u.username || 'N/A'}
                  </Td>
                  <Td>
                    <Text
                      px={2}
                      py={1}
                      borderRadius="md"
                      bg={
                        u.role === 'admin' ? 'blue.100' :
                        u.role === 'labstaff' ? 'green.100' : 'gray.100'
                      }
                      color={
                        u.role === 'admin' ? 'blue.800' :
                        u.role === 'labstaff' ? 'green.800' : 'gray.800'
                      }
                      display="inline-block"
                      fontSize="sm"
                    >
                      {u.role || 'user'}
                    </Text>
                  </Td>
                  <Td color="gray.800">{u.id}</Td>
                  <Td>
                    <HStack spacing={2}>
                      <IconButton
                        icon={<EditIcon />}
                        aria-label="Edit user"
                        size="sm"
                        colorScheme="blue"
                        variant="ghost"
                        onClick={() => handleEditUser(u)}
                      />
                      <IconButton
                        icon={<DeleteIcon />}
                        aria-label="Delete user"
                        size="sm"
                        colorScheme="red"
                        variant="ghost"
                        onClick={() => handleDeleteUser(u)}
                      />
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Box>

      <UserModal
        isOpen={isUserModalOpen}
        onClose={onCloseUserModal}
        userData={editingUser}
        onSubmit={async (userData) => {
          const isEdit = !!editingUser?.id;
          const url = isEdit ? `/api/users/${editingUser.id}` : '/api/users';
          const method = isEdit ? 'PUT' : 'POST';
          try {
            const res = await apiFetch(url, {
              method,
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(userData),
            });

            if (!res.ok) throw new Error(`HTTP Error ${res.status}`);

            toast({
              title: isEdit ? 'User Updated' : 'User Created',
              status: 'success',
              duration: 4000,
              isClosable: true,
              position: 'top-right', // ➡️ เพิ่มตำแหน่งให้ toast ดูสวยขึ้น
            });

            onCloseUserModal();
            fetchUsers(); // ✅ รีโหลด users list หลังสำเร็จ
          } catch (error) {
            toast({
              title: 'Error',
              description: error.message,
              status: 'error',
              duration: 4000,
              isClosable: true,
              position: 'top-right',
            });
          }
        }}
      />


      <AlertDialog isOpen={isDeleteOpen} leastDestructiveRef={cancelRef} onClose={onCloseDelete}>
        <AlertDialogOverlay>
          <AlertDialogContent borderRadius="lg" bg="white" w={{ base: '90%', md: 'auto' }}>
            <AlertDialogHeader fontSize="lg" color="gray.800">
              Confirm Deletion
            </AlertDialogHeader>
            <AlertDialogBody color="gray.600">
              Are you sure you want to delete "{userToDelete?.role === 'user' ? userToDelete?.displayName : userToDelete?.username || 'User'}"?
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onCloseDelete} variant="outline" colorScheme="gray">
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={async () => {
                  try {
                    const res = await apiDelete(`/api/users/${userToDelete.id}`);
                  
                    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
                  
                    toast({
                      title: 'User Deleted',
                      status: 'success',
                      duration: 4000,
                      isClosable: true,
                      position: 'top-right', // ➡️ เสริมตำแหน่ง Toast ให้ด้วย (สวยกว่า)
                    });
                  
                    onCloseDelete();
                    fetchUsers(); // รีโหลด Users list
                  } catch (error) {
                    toast({
                      title: 'Error',
                      description: error.message,
                      status: 'error',
                      duration: 4000,
                      isClosable: true,
                      position: 'top-right',
                    });
                  }
                  
                }}
                ml={3}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}

function UserModal({ isOpen, onClose, userData, onSubmit }) {
  const initialRef = useRef();
  const toast = useToast();
  const [formData, setFormData] = useState({
    role: 'admin',
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (userData) {
      setFormData({
        role: userData.role || 'admin',
        username: userData.username || '',
        password: '',
      });
      setUsernameError('');
      setPasswordError('');
    } else {
      setFormData({
        role: 'admin',
        username: '',
        password: '',
      });
      setUsernameError('');
      setPasswordError('');
    }
  }, [userData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === 'username') {
      const usernameRegex = /^[-a-zA-Z0-9_@]+$/;
      if (!value.trim()) {
        setUsernameError('Username is required');
      } else if (value.length < 4) {
        setUsernameError('Username must be at least 4 characters long');
      } else if (!usernameRegex.test(value)) {
        setUsernameError('Username must contain only English letters, numbers, or symbols (_, -, @)');
      } else {
        setUsernameError('');
      }
    }

    if (name === 'password') {
      const passwordRegex = /^[-a-zA-Z0-9_@]+$/;
      if (!value.trim()) {
        setPasswordError('Password is required');
      } else if (value.length < 6) {
        setPasswordError('Password must be at least 6 characters long');
      } else if (!passwordRegex.test(value)) {
        setPasswordError('Password must contain only English letters, numbers, or symbols (_, -, @)');
      } else {
        setPasswordError('');
      }
    }
  };

  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSubmit = () => {
    // ตรวจสอบว่า username ไม่ว่าง
    if (!formData.username.trim()) {
      toast({
        title: 'Error',
        description: 'Username is required',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    // ตรวจสอบว่า username เป็นภาษาอังกฤษเท่านั้น (a-z, A-Z, 0-9, _, -, @)
    const usernameRegex = /^[-a-zA-Z0-9_@]+$/;
    if (!usernameRegex.test(formData.username)) {
      toast({
        title: 'Error',
        description: 'Username must contain only English letters, numbers, or symbols (_, -, @)',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    // ตรวจสอบความยาวของ username
    if (formData.username.length < 4) {
      toast({
        title: 'Error',
        description: 'Username must be at least 4 characters long',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    // ตรวจสอบว่า password ไม่ว่าง (บังคับให้กรอกทุกครั้ง)
    if (!formData.password.trim()) {
      toast({
        title: 'Error',
        description: 'Password is required',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    // ตรวจสอบว่า password เป็นภาษาอังกฤษเท่านั้น (a-z, A-Z, 0-9, _, -, @)
    const passwordRegex = /^[-a-zA-Z0-9_@]+$/;
    if (!passwordRegex.test(formData.password)) {
      toast({
        title: 'Error',
        description: 'Password must contain only English letters, numbers, or symbols (_, -, @)',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    // ตรวจสอบความยาวของ password
    if (formData.password.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters long',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    const dataToSubmit = {
      role: formData.role,
      username: formData.username,
      password: formData.password,
    };
    onSubmit(dataToSubmit);
  };

  const modalSize = useBreakpointValue({ base: 'xs', md: 'md' });

  return (
    <Modal isOpen={isOpen} onClose={onClose} initialFocusRef={initialRef} isCentered size={modalSize}>
      <ModalOverlay bg="rgba(0, 0, 0, 0.1)" />
      <ModalContent borderRadius="lg" bg="white" p={2}>
        <ModalHeader fontSize="lg" color="blue.600">
          {userData ? 'Edit User' : 'Create New User'}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody p={{ base: 4, md: 6 }}>
          <FormControl mb={4}>
            <FormLabel color="gray.700">Role</FormLabel>
            <Select
              name="role"
              value={formData.role}
              onChange={handleChange}
              focusBorderColor="blue.500"
              borderColor="gray.200"
            >
              <option value="admin">Admin</option>
              <option value="labstaff">Lab Staff</option>
              <option value="user">User</option>
            </Select>
          </FormControl>
          <FormControl mb={4} isInvalid={!!usernameError}>
            <FormLabel color="gray.700">Username</FormLabel>
            <Input
              ref={initialRef}
              name="username"
              value={formData.username}
              onChange={handleChange}
              focusBorderColor="blue.500"
              borderColor="gray.200"
              isDisabled={userData && userData.role === 'user'}
            />
            {usernameError && <Text color="red.500" fontSize="sm">{usernameError}</Text>}
          </FormControl>
          <FormControl mb={4} isInvalid={!!passwordError}>
            <FormLabel color="gray.700">Password</FormLabel>
            <InputGroup>
              <Input
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                focusBorderColor="blue.500"
                borderColor="gray.200"
                placeholder="Enter password"
              />
              <InputRightElement>
                <IconButton
                  variant="ghost"
                  icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                  onClick={handleTogglePassword}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                />
              </InputRightElement>
            </InputGroup>
            {passwordError && <Text color="red.500" fontSize="sm">{passwordError}</Text>}
          </FormControl>
        </ModalBody>
        <ModalFooter borderTop="1px solid" borderColor="gray.200">
          <Button variant="outline" colorScheme="gray" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="blue" onClick={handleSubmit} px={6}>
            {userData ? 'Update' : 'Create'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default UserManagement;
