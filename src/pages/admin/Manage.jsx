import React, { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react';
import { apiGet, apiPost, apiDelete, apiFetch } from '../../utils/api';
import {
  Box,
  Flex,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogContent,
  IconButton,
  useBreakpointValue,
  useToast,
  Skeleton,
  Select,
  RadioGroup,
  Radio,
  Stack,
  Center,
  Spinner,
} from '@chakra-ui/react';
import { ArrowBackIcon, EditIcon, DeleteIcon, RepeatIcon } from '@chakra-ui/icons';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

// Lazy load MapView (which contains all Leaflet dependencies)
const MapView = lazy(() => import('../../components/ui/MapView'));

function Manage() {
  const navigate = useNavigate();
  const toast = useToast();
  const isMobile = useBreakpointValue({ base: true, md: false });
  const { user } = useAuth();
  const token = user?.token || '';

  const [locations, setLocations] = useState([]);
  const [unlinkedDevices, setUnlinkedDevices] = useState([]);
  const [currentLocation, setCurrentLocation] = useState({ id: null, name: '', coordinates: '', deviceID: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeviceLoading, setIsDeviceLoading] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [deviceInputMethod, setDeviceInputMethod] = useState('dropdown');
  const [manualDeviceID, setManualDeviceID] = useState('');

  const { isOpen: isLocationModalOpen, onOpen: onOpenLocationModal, onClose: onCloseLocationModal } = useDisclosure();
  const { isOpen: isDeleteDialogOpen, onOpen: onOpenDeleteDialog, onClose: onCloseDeleteDialog } = useDisclosure();
  const { isOpen: isCsvModalOpen, onOpen: onOpenCsvModal, onClose: onCloseCsvModal } = useDisclosure();

  const [locationToDelete, setLocationToDelete] = useState(null);
  const cancelRef = useRef();

  const fetchLocations = useCallback(async () => {
    try {
      const res = await apiGet('/api/locations?includeClientID=true');

      if (!res.ok) {
        throw new Error('ไม่สามารถดึงข้อมูลสถานที่ได้');
      }

      const data = await res.json();
      setLocations(data);
    } catch (error) {
      console.error('Fetch locations error:', error.message);
      toast({
        title: 'ข้อผิดพลาด',
        description: 'ไม่สามารถดึงข้อมูลสถานที่ได้',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
    }
  }, [toast]);

  const fetchUnlinkedDevices = useCallback(async () => {
    try {
      setIsDeviceLoading(true);

      const res = await apiGet('/api/devices/unlinked');

      if (!res.ok) {
        throw new Error('ไม่สามารถดึงข้อมูลอุปกรณ์ที่ยังไม่เชื่อมโยงได้');
      }

      const data = await res.json();
      setUnlinkedDevices(data || []);
    } catch (error) {
      console.error('Fetch unlinked devices error:', error.message);
      toast({
        title: 'ข้อผิดพลาด',
        description: 'ไม่สามารถดึงข้อมูลอุปกรณ์ที่ยังไม่เชื่อมโยงได้',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
      setUnlinkedDevices([]);
    } finally {
      setIsDeviceLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await fetchLocations();
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [fetchLocations]);

  const openAddLocationModal = useCallback(() => {
    setCurrentLocation({ id: null, name: '', coordinates: '', deviceID: '' });
    setSelectedFile(null);
    setDeviceInputMethod('dropdown');
    setManualDeviceID('');
    setUnlinkedDevices([]);
    onOpenLocationModal();
  }, [onOpenLocationModal]);

  const handleLocationEdit = useCallback((location) => {
    setCurrentLocation(location);
    setSelectedFile(null);
    if (location.deviceID) {
      setDeviceInputMethod('dropdown');
      setManualDeviceID(location.deviceID);
    } else {
      setDeviceInputMethod('dropdown');
      setManualDeviceID('');
    }
    setUnlinkedDevices([]);
    onOpenLocationModal();
  }, [onOpenLocationModal]);

  const handleDeleteClick = useCallback((location) => {
    setLocationToDelete(location);
    onOpenDeleteDialog();
  }, [onOpenDeleteDialog]);

  const handleLocationDeleteConfirm = useCallback(async () => {
    if (!locationToDelete) return;
    setIsLoading(true);

    try {
      if (locationToDelete.deviceID && user.role === 'admin') {
        const res = await apiPost('/api/device/unlink', {
          deviceID: locationToDelete.deviceID,
          locationID: locationToDelete.id,
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'ไม่สามารถยกเลิกการเชื่อมโยงอุปกรณ์ได้');
        }
      }

      const res = await apiDelete(`/api/locations/${locationToDelete.id}`);

      if (!res.ok) {
        throw new Error('ไม่สามารถลบสถานที่ได้');
      }

      setLocations((prev) => prev.filter((loc) => loc.id !== locationToDelete.id));
      await fetchUnlinkedDevices();

      toast({
        title: 'สำเร็จ',
        description: 'ลบสถานที่เรียบร้อย',
        status: 'success',
        duration: 2000,
        isClosable: true,
        position: 'top',
      });

    } catch (error) {
      console.error('Error deleting location:', error.message);
      toast({
        title: 'ข้อผิดพลาด',
        description: error.message || 'ไม่สามารถลบสถานที่ได้',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
    } finally {
      setIsLoading(false);
      onCloseDeleteDialog();
      setLocationToDelete(null);
    }
  }, [locationToDelete, user.role, toast, fetchUnlinkedDevices, onCloseDeleteDialog]);

  const handleFileChange = useCallback((e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  }, []);

  const handleCsvFileChange = useCallback((e) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0]);
    }
  }, []);

  const uploadLocationImage = useCallback(async (locationId) => {
    if (!selectedFile || !locationId) return null;

    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      const res = await apiFetch(`/api/locations/${locationId}/uploadImage`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('ไม่สามารถอัปโหลดรูปภาพได้');
      }

      const data = await res.json();
      return data.imageUrl;
    } catch (error) {
      console.error('Upload image error:', error.message);
      toast({
        title: 'ข้อผิดพลาด',
        description: 'ไม่สามารถอัปโหลดรูปภาพได้',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
      return null;
    }
  }, [selectedFile, toast]);

  const uploadCsvData = useCallback(async () => {
    if (!csvFile || !selectedLocationId) {
      toast({
        title: 'ข้อผิดพลาด',
        description: 'กรุณาเลือกสถานที่และไฟล์ CSV',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('csvFile', csvFile);

      const res = await apiFetch(`/api/locations/${selectedLocationId}/uploadCsv`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'ไม่สามารถอัปโหลด CSV ได้');
      }

      toast({
        title: 'สำเร็จ',
        description: 'อัปโหลดข้อมูล CSV สำเร็จ',
        status: 'success',
        duration: 2000,
        isClosable: true,
        position: 'top',
      });

    } catch (error) {
      console.error('CSV Upload error:', error.message);
      toast({
        title: 'ข้อผิดพลาด',
        description: error.message || 'ไม่สามารถอัปโหลด CSV ได้',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
    } finally {
      setIsLoading(false);
      onCloseCsvModal();
      setCsvFile(null);
      setSelectedLocationId('');
    }
  }, [csvFile, selectedLocationId, toast, onCloseCsvModal]);

  const isFormComplete = useCallback(() => {
    if (!currentLocation.name.trim() || !currentLocation.coordinates.trim()) {
      return false;
    }
    if (user.role === 'admin') {
      if (deviceInputMethod === 'manual' && !manualDeviceID.trim()) {
        return false;
      }
      if (deviceInputMethod === 'dropdown' && !currentLocation.deviceID.trim()) {
        return false;
      }
    }
    return true;
  }, [currentLocation.name, currentLocation.coordinates, currentLocation.deviceID, user.role, deviceInputMethod, manualDeviceID]);

  const handleLocationSave = useCallback(async () => {
    if (!isFormComplete()) {
      toast({ title: 'ข้อผิดพลาด', description: 'กรุณากรอกข้อมูลให้ครบถ้วน', status: 'error', duration: 2000 });
      return;
    }

    const finalDeviceID =
      deviceInputMethod === 'manual' && manualDeviceID ? manualDeviceID : currentLocation.deviceID;

    if (user.role === 'admin' && finalDeviceID && deviceInputMethod !== 'manual') {
      const originalLocation = locations.find((loc) => loc.id === currentLocation.id);
      const isUnlinked = Array.isArray(unlinkedDevices) && unlinkedDevices.some((device) => device.deviceID === finalDeviceID);
      const isOriginalDevice = originalLocation && originalLocation.deviceID === finalDeviceID;
      if (!isUnlinked && !isOriginalDevice) {
        toast({ title: 'ข้อผิดพลาด', description: 'DeviceID นี้ถูกเชื่อมโยงแล้วหรือไม่สามารถใช้ได้', status: 'error', duration: 2000 });
        return;
      }
    }

    const duplicate = locations.find(
      (loc) =>
        loc.id !== currentLocation.id &&
        (loc.name.trim() === currentLocation.name.trim() || (loc.deviceID && loc.deviceID === finalDeviceID))
    );
    if (duplicate) {
      const msg =
        duplicate.name.trim() === currentLocation.name.trim()
          ? 'ชื่อสถานที่นี้มีอยู่แล้ว'
          : 'DeviceID นี้ถูกใช้ไปแล้ว';
      toast({ title: 'ข้อผิดพลาด', description: msg, status: 'error', duration: 2000 });
      return;
    }

    setIsLoading(true);
    try {
      let updatedLoc;
      const url = currentLocation.id ? `/api/locations/${currentLocation.id}` : '/api/locations';
      const method = currentLocation.id ? 'PUT' : 'POST';

      if (currentLocation.id) {
        const originalLocation = locations.find((loc) => loc.id === currentLocation.id);
        if (originalLocation?.deviceID && originalLocation.deviceID !== finalDeviceID) {
          const unlinkRes = await apiPost('/api/device/unlink', {
            deviceID: originalLocation.deviceID,
            locationID: currentLocation.id,
          });

          if (!unlinkRes.ok) {
            const errorData = await unlinkRes.json();
            throw new Error(errorData.error || 'ไม่สามารถยกเลิกการเชื่อมโยงอุปกรณ์เดิมได้');
          }
        }
      }

      const locationRes = await apiFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: currentLocation.name,
          coordinates: currentLocation.coordinates,
          deviceID: finalDeviceID || null,
        }),
      });

      if (!locationRes.ok) {
        const errorData = await locationRes.json();
        throw new Error(errorData.error || 'ไม่สามารถบันทึกสถานที่ได้');
      }
      updatedLoc = await locationRes.json();

      if (selectedFile) {
        const imageUrl = await uploadLocationImage(updatedLoc.id);
        if (imageUrl) updatedLoc = { ...updatedLoc, imageUrl };
      }

      await fetchUnlinkedDevices();

      setLocations((prev) =>
        currentLocation.id
          ? prev.map((loc) => (loc.id === updatedLoc.id ? updatedLoc : loc))
          : [...prev, updatedLoc]
      );

      toast({ title: 'สำเร็จ', description: `สถานที่ ${currentLocation.id ? 'แก้ไข' : 'เพิ่ม'} เรียบร้อย`, status: 'success', duration: 1000 });
    } catch (error) {
      toast({ title: 'ข้อผิดพลาด', description: error.message || 'ไม่สามารถบันทึกสถานที่ได้', status: 'error', duration: 2000 });
    } finally {
      setIsLoading(false);
      onCloseLocationModal();
      setCurrentLocation({ id: null, name: '', coordinates: '', deviceID: '' });
      setDeviceInputMethod('dropdown');
      setManualDeviceID('');
      setSelectedFile(null);
    }
  }, [
    currentLocation,
    selectedFile,
    toast,
    onCloseLocationModal,
    uploadLocationImage,
    locations,
    unlinkedDevices,
    user.role,
    fetchUnlinkedDevices,
    manualDeviceID,
    deviceInputMethod,
    isFormComplete,
  ]);

  if (isLoading) {
    return (
      <Center height="100vh">
        <Spinner size="xl" color="blue.500" />
      </Center>
    );
  }

  return (
    <Box p={5} bg="gray.100" minH="100vh">
      {/* Header */}
      <Flex justifyContent="space-between" alignItems="center" mb={6}>
        <HStack spacing={4}>
          <IconButton
            icon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            variant="ghost"
            aria-label="Go Back"
          />
          <Text fontSize="2xl" fontWeight="bold">
            จัดการสถานที่ (Locations)
          </Text>
        </HStack>
        <HStack>
          <Button colorScheme="green" onClick={onOpenCsvModal}>
            Upload CSV
          </Button>
          <Button colorScheme="blue" onClick={openAddLocationModal}>
            เพิ่มสถานที่
          </Button>
        </HStack>
      </Flex>

      {/* Locations Table */}
      <Box overflowX="auto" bg="white" p={4} borderRadius="md" boxShadow="sm">
        <Table variant="simple" size="md">
          <Thead bg="gray.200">
            <Tr>
              <Th>ชื่อสถานที่</Th>
              <Th>พิกัด</Th>
              <Th>Device ID</Th>
              <Th>Client ID</Th>
              <Th textAlign="center">จัดการ</Th>
            </Tr>
          </Thead>
          <Tbody>
            {locations.map((loc) => (
              <Tr key={loc.id}>
                <Td>{loc.name}</Td>
                <Td>{loc.coordinates}</Td>
                <Td>
                  {loc.deviceID ? (
                    <Text color="green.500" fontWeight="bold">
                      {loc.deviceID}
                    </Text>
                  ) : (
                    <Text color="gray.400">-</Text>
                  )}
                </Td>
                <Td>
                   {loc.Device?.clientID ? (
                     <Text color="blue.500" fontWeight="bold">
                       {loc.Device.clientID}
                     </Text>
                   ) : (
                     <Text color="gray.400">-</Text>
                   )}
                </Td>
                <Td textAlign="center">
                  <HStack justifyContent="center">
                    <IconButton
                      icon={<EditIcon />}
                      colorScheme="yellow"
                      size="sm"
                      onClick={() => handleLocationEdit(loc)}
                      aria-label="Edit Location"
                    />
                    <IconButton
                      icon={<DeleteIcon />}
                      colorScheme="red"
                      size="sm"
                      onClick={() => handleDeleteClick(loc)}
                      aria-label="Delete Location"
                    />
                  </HStack>
                </Td>
              </Tr>
            ))}
            {locations.length === 0 && (
              <Tr>
                <Td colSpan={5} textAlign="center" py={4}>
                  <Text color="gray.500">ไม่มีข้อมูลสถานที่</Text>
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      </Box>

      {/* Location Modal */}
      <Modal isOpen={isLocationModalOpen} onClose={onCloseLocationModal} size="xl">
        <ModalOverlay />
        <ModalContent maxW="800px">
          <ModalHeader>{currentLocation.id ? 'แก้ไขสถานที่' : 'เพิ่มสถานที่'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Flex
              direction={{ base: 'column', md: 'row' }}
              gap={6}
            >
              {/* Left Column: Form Inputs */}
              <Stack spacing={4} flex={1}>
                {/* Image Upload */}
                <Box>
                  <FormLabel>รูปภาพสถานที่</FormLabel>
                   {(currentLocation.imageUrl || selectedFile) && (
                     <Box mb={2} borderRadius="md" overflow="hidden" maxW="200px" border="1px solid #e2e8f0">
                        <img 
                          src={selectedFile ? URL.createObjectURL(selectedFile) : currentLocation.imageUrl} 
                          alt="preview" 
                          style={{ width: '100%', height: 'auto', display: 'block' }}
                        />
                     </Box>
                   )}
                  <Input type="file" accept="image/*" onChange={handleFileChange} p={1} />
                </Box>

                <FormControl isRequired>
                  <FormLabel>ชื่อสถานที่</FormLabel>
                  <Input
                    placeholder="กรอกชื่อสถานที่"
                    value={currentLocation.name}
                    onChange={(e) => setCurrentLocation({ ...currentLocation, name: e.target.value })}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>พิกัด (ละติจูด, ลองจิจูด)</FormLabel>
                  <Input
                    placeholder="เช่น 13.7563, 100.5018"
                    value={currentLocation.coordinates}
                    onChange={(e) => setCurrentLocation({ ...currentLocation, coordinates: e.target.value })}
                  />
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    คลิกบนแผนที่เพื่อเลือกพิกัด
                  </Text>
                </FormControl>

                {/* Device ID Selection (Admin Only) */}
                {user.role === 'admin' && (
                  <FormControl>
                    <FormLabel>Device ID (อุปกรณ์ที่เชื่อมโยง)</FormLabel>
                     <RadioGroup 
                       onChange={setDeviceInputMethod} 
                       value={deviceInputMethod} 
                       mb={3}
                     >
                       <Stack direction="row">
                         <Radio value="dropdown">เลือกจากรายการ</Radio>
                         <Radio value="manual">กรอกเอง</Radio>
                       </Stack>
                     </RadioGroup>

                    {deviceInputMethod === 'dropdown' ? (
                       <HStack>
                          <Select
                            placeholder="เลือก Device ID"
                            value={currentLocation.deviceID || ''}
                            onChange={(e) => setCurrentLocation({ ...currentLocation, deviceID: e.target.value })}
                            onClick={() => {
                               // Optional: refresh unlinked devices when dropdown opens
                               if (unlinkedDevices.length === 0) fetchUnlinkedDevices();
                            }}
                          >
                            <option value="">ไม่มีอุปกรณ์</option>
                            {/* Option for current device if editing and it has one */}
                            {currentLocation.deviceID && (
                               <option value={currentLocation.deviceID}>
                                  {currentLocation.deviceID} (ปัจจุบัน)
                               </option>
                            )}
                            {/* Filter out the current device from unlinked list if present to avoid duplication */}
                            {unlinkedDevices
                               .filter(d => d.deviceID !== currentLocation.deviceID)
                               .map((device) => (
                              <option key={device.id} value={device.deviceID}>
                                {device.deviceID}
                              </option>
                            ))}
                          </Select>
                          <IconButton
                            icon={<RepeatIcon />}
                            onClick={fetchUnlinkedDevices}
                            isLoading={isDeviceLoading}
                            aria-label="Refresh Devices"
                            size="sm"
                          />
                       </HStack>
                    ) : (
                      <Input 
                        placeholder="กรอก Device ID เอง (เช่น esp32-001)" 
                        value={manualDeviceID}
                        onChange={(e) => setManualDeviceID(e.target.value)}
                      />
                    )}
                     <Text fontSize="xs" color="gray.500" mt={1}>
                       * หากเลือก "กรอกเอง" ระบบจะไม่เช็คจากรายการอุปกรณ์ที่มี (ระวังชื่อซ้ำ)
                     </Text>
                  </FormControl>
                )}
              </Stack>

              {/* Right Column: Map Preview */}
              <Box flex={1} height="300px" borderRadius="md" overflow="hidden" boxShadow="sm">
                <Text mb={2} fontWeight="bold">แผนที่:</Text>
                {/* LAZY LOADED MAP COMPONENT */}
                <Suspense fallback={
                    <Center h="100%" bg="gray.100" borderRadius="md">
                        <Spinner color="blue.500" />
                    </Center>
                }>
                     <MapView
                       currentLocation={currentLocation}
                       setCurrentLocation={setCurrentLocation}
                     />
                </Suspense>
              </Box>
            </Flex>
          </ModalBody>
          <ModalFooter>
             <Button variant="ghost" mr={3} onClick={onCloseLocationModal}>
               ยกเลิก
             </Button>
             <Button colorScheme="blue" onClick={handleLocationSave} isLoading={isLoading}>
               บันทึก
             </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Upload CSV Modal */}
      <Modal isOpen={isCsvModalOpen} onClose={onCloseCsvModal}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>อัปโหลดข้อมูล CSV</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
             <Stack spacing={4}>
               <FormControl>
                  <FormLabel>เลือกสถานที่ปลายทาง</FormLabel>
                   <Select 
                      placeholder="เกรณาเลือกสถานที่"
                      value={selectedLocationId}
                      onChange={(e) => setSelectedLocationId(e.target.value)}
                   >
                      {locations.map(loc => (
                         <option key={loc.id} value={loc.id}>{loc.name}</option>
                      ))}
                   </Select>
               </FormControl>
               <FormControl>
                  <FormLabel>ไฟล์ CSV</FormLabel>
                  <Input type="file" accept=".csv" onChange={handleCsvFileChange} p={1}/>
                  <Text fontSize="xs" color="gray.500" mt={2}>
                     รูปแบบไฟล์: pH, TDS, Temperature, Turbidity, Timestamp (yyyy-mm-dd hh:mm:ss)
                  </Text>
               </FormControl>
             </Stack>
          </ModalBody>
          <ModalFooter>
             <Button variant="ghost" mr={3} onClick={onCloseCsvModal}>ยกเลิก</Button>
             <Button colorScheme="green" onClick={uploadCsvData} isLoading={isLoading}>อัปโหลด</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteDialogOpen}
        leastDestructiveRef={cancelRef}
        onClose={onCloseDeleteDialog}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              ยืนยันการลบ
            </AlertDialogHeader>

            <AlertDialogBody>
              คุณแน่ใจหรือไม่ที่จะลบสถานที่ "{locationToDelete?.name}"?
              <br />
              การกระทำนี้ไม่สามารถเรียกคืนได้
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onCloseDeleteDialog}>
                ยกเลิก
              </Button>
              <Button colorScheme="red" onClick={handleLocationDeleteConfirm} ml={3} isLoading={isLoading}>
                ลบ
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}

export default Manage;
