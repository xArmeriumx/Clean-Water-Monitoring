import React, { useState, useEffect, useRef } from 'react';
import { apiGet, apiFetch } from '../../utils/api';
import {
  Box,
  Text as CText,
  Heading,
  FormControl,
  FormLabel,
  Select,
  Input,
  Button,
  useToast,
  VStack,
  HStack,
  Flex,
  Icon,
  useBreakpointValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalCloseButton,
  ModalBody,
  ModalHeader,
  ModalFooter,
  Image as CImage,
  IconButton,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { FiUploadCloud, FiDownload, FiArrowLeft } from 'react-icons/fi';
import { useAuth } from '../../auth/AuthContext';
import { motion } from 'framer-motion';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';

// กำหนด worker ของ pdfjs-dist
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.js`;

const MotionBox = motion(Box);

/** 
 * เปลี่ยนเป็น PDFViewerAllPages เพื่อดู PDF ได้ครบทุกหน้า 
 */
function PDFViewerAllPages({ pdfUrl }) {
  const [pages, setPages] = useState([]);

  useEffect(() => {
    const renderAllPages = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;
        const renderedPages = [];
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const scale = 1.5;
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const context = canvas.getContext('2d');
          const renderContext = { canvasContext: context, viewport };
          await page.render(renderContext).promise;
          renderedPages.push(canvas.toDataURL());
        }
        setPages(renderedPages);
      } catch (err) {
        console.error('Error rendering PDF:', err);
      }
    };
    renderAllPages();
  }, [pdfUrl]);

  return (
    <div>
      {pages.map((dataUrl, index) => (
        <img
          key={index}
          src={dataUrl}
          alt={`Page ${index + 1}`}
          style={{ width: '100%', marginBottom: '10px' }}
        />
      ))}
    </div>
  );
}

function isPdfFile(fileUrl) {
  if (!fileUrl) return false;
  return fileUrl.toLowerCase().endsWith('.pdf');
}

async function openPdfBlob(pdfUrl, setDocModalUrl, setDocModalType, setIsDocModalOpen, toast) {
  try {
    const res = await fetch(pdfUrl);
    if (!res.ok) throw new Error('Failed to fetch PDF');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    setDocModalUrl(url);
    setDocModalType('pdf');      // ระบุว่าเป็น PDF
    setIsDocModalOpen(true);     // เปิด Modal เดียว
    return blob;
  } catch (err) {
    console.error('openPdfBlob error:', err);
    toast({
      title: 'Error',
      description: 'ไม่สามารถเปิดไฟล์ PDF ได้',
      status: 'error',
      duration: 3000,
      isClosable: true,
    });
    return null;
  }
}

async function downloadPdf(pdfUrl, toast) {
  try {
    const res = await fetch(pdfUrl);
    if (!res.ok) throw new Error('Failed to fetch PDF');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'lab_document.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error('downloadPdf error:', err);
    toast({
      title: 'Error',
      description: 'ไม่สามารถดาวน์โหลดไฟล์ PDF ได้',
      status: 'error',
      duration: 3000,
      isClosable: true,
    });
  }
}

function Labupload() {
  const toast = useToast();
  const navigate = useNavigate();
  const isMobile = useBreakpointValue({ base: true, md: false });
  const { user } = useAuth();

  const [locations, setLocations] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [labStatus, setLabStatus] = useState('ไม่เหมาะสม');
  const [labFile, setLabFile] = useState(null);
  const [labDocument, setLabDocument] = useState(null);
  const [uploadHistory, setUploadHistory] = useState([]);
  
  // state เดิม pdfEmbedUrl / isZoomOpen ถูกแทนที่ด้วย Modal เดียว
  const [docModalUrl, setDocModalUrl] = useState(null);   // URL ของไฟล์ PDF หรือ Image
  const [docModalType, setDocModalType] = useState(null); // "pdf" หรือ "image"
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const cancelRef = useRef();

  // เปิด Modal สำหรับรูปภาพ
  const handleOpenImageModal = (imgUrl) => {
    setDocModalUrl(imgUrl);
    setDocModalType('image');
    setIsDocModalOpen(true);
  };

  // ปิด Modal
  const closeDocModal = () => {
    setIsDocModalOpen(false);
    setDocModalUrl(null);
    setDocModalType(null);
  };

  // Confirm dialog
  const handleOpenConfirm = () => setIsConfirmOpen(true);
  const handleCloseConfirm = () => setIsConfirmOpen(false);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await apiGet('/api/locations');
        if (!res.ok) throw new Error('Failed to fetch locations');
        const data = await res.json();
        setLocations(data);
      } catch (err) {
        console.error('Error fetching locations:', err);
        toast({
          title: 'Error',
          description: 'ไม่สามารถโหลดสถานที่ได้',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    };
    fetchLocations();
  }, [toast, user?.token]);

  const handleSelectLocation = async (locationId) => {
    setSelectedLocationId(locationId);
    setLabFile(null);
    setLabDocument(null);
    setUploadHistory([]);
    setDocModalUrl(null);
    setDocModalType(null);
    setPreviewUrl(null);

    if (!locationId) return;
    try {
      const res = await apiGet(`/api/locations/${locationId}`);
      if (!res.ok) throw new Error('Failed to fetch location data');
      const data = await res.json();
      setLabDocument(data.labDocument || null);

      const historyRes = await apiGet(`/api/locations/${locationId}/labhistory`);
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setUploadHistory(historyData || []);
      }
    } catch (err) {
      console.error('Error fetching location detail:', err);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLabFile(file);
      if (!file.type.includes('pdf')) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } else {
        setPreviewUrl(null);
      }
    } else {
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLocationId || !labFile) {
      toast({
        title: 'Error',
        description: 'กรุณาเลือกสถานที่และอัปโหลดไฟล์',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    handleOpenConfirm();
  };

  const confirmUpload = async () => {
    try {
      const formData = new FormData();
      formData.append('labFile', labFile);
      formData.append('status', labStatus);

      const res = await apiFetch(`/api/locations/${selectedLocationId}/labupload`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const result = await res.json();

      toast({
        title: 'สำเร็จ',
        description: 'อัปโหลดผลแลปเรียบร้อยแล้ว',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      setLabDocument(result.labDocument);
      setLabFile(null);
      setPreviewUrl(null);

      // อัปเดตประวัติการอัปโหลด
      const historyRes = await apiGet(`/api/locations/${selectedLocationId}/labhistory`);
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setUploadHistory(historyData || []);
      }
    } catch (err) {
      console.error('Error uploading lab doc:', err);
      toast({
        title: 'Error',
        description: 'ไม่สามารถอัปโหลดผลแลปได้',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      handleCloseConfirm();
    }
  };

  return (
    <Flex
      minH="100vh"
      bg="gray.50"
      align="center"
      justify="center"
      p={{ base: 4, md: 6 }}
    >
      <MotionBox
        w={{ base: '100%', md: 'md' }}
        maxW="480px"
        p={{ base: 6, md: 8 }}
        bg="white"
        borderRadius="xl"
        boxShadow="lg"
        border="1px solid"
        borderColor="gray.200"
        transition="all 0.3s ease"
        _hover={{ boxShadow: 'xl' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
      >
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <Flex justify="space-between" align="center">
            <IconButton
              icon={<FiArrowLeft />}
              variant="ghost"
              aria-label="Go Back"
              onClick={() => navigate(-1)}
              colorScheme="blue"
            />
            <VStack spacing={1}>
              <Heading
                as="h2"
                size={{ base: 'lg', md: 'xl' }}
                textAlign="center"
                color="blue.600"
                fontWeight="bold"
              >
                อัปโหลดผลแลป
              </Heading>
              <CText
                fontSize="sm"
                color="gray.500"
                textAlign="center"
              >
                Upload or View Lab Documents for Water Quality
              </CText>
            </VStack>
            <Box w="40px" /> {/* Placeholder to balance the Flex */}
          </Flex>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <VStack spacing={5} align="stretch">
              <FormControl isRequired>
                <FormLabel
                  fontSize="sm"
                  color="gray.600"
                  fontWeight="medium"
                >
                  เลือกสถานที่
                </FormLabel>
                <Select
                  placeholder="เลือกสถานที่"
                  value={selectedLocationId}
                  onChange={(e) => handleSelectLocation(e.target.value)}
                  size="md"
                  borderRadius="md"
                  focusBorderColor="blue.500"
                  bg="gray.50"
                  _hover={{ bg: 'gray.100' }}
                  transition="all 0.2s ease"
                  color="gray.800"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </Select>
              </FormControl>

              {/* Lab Document Preview */}
              {labDocument && (
                <Box
                  p={4}
                  bg="gray.100"
                  borderRadius="md"
                  border="1px solid"
                  borderColor="gray.200"
                  transition="all 0.2s ease"
                  _hover={{ bg: 'gray.200' }}
                >
                  <CText
                    fontSize="sm"
                    color="blue.700"
                    fontWeight="bold"
                    mb={2}
                  >
                    ข้อมูลผลแลปที่มีอยู่:
                  </CText>
                  <CText fontSize="sm" mb={1}>
                    สถานะน้ำ:{' '}
                    <strong
                      style={{
                        color:
                          labDocument.status === 'เหมาะสม'
                            ? 'green'
                            : 'red',
                      }}
                    >
                      {labDocument.status}
                    </strong>
                  </CText>
                  <CText
                    fontSize="xs"
                    color="gray.600"
                    mb={2}
                  >
                    อัปเดตล่าสุด:{' '}
                    {new Date(labDocument.updatedAt).toLocaleString('th-TH')}
                  </CText>

                  {isPdfFile(labDocument.docUrl) ? (
                    <HStack spacing={2}>
                      <Button
                        colorScheme="blue"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          openPdfBlob(
                            labDocument.docUrl,
                            setDocModalUrl,
                            setDocModalType,
                            setIsDocModalOpen,
                            toast
                          )
                        }
                        _hover={{ bg: 'blue.500', color: 'white' }}
                      >
                        ดู PDF
                      </Button>
                      <Button
                        colorScheme="blue"
                        size="sm"
                        variant="outline"
                        leftIcon={<Icon as={FiDownload} />}
                        onClick={() => downloadPdf(labDocument.docUrl, toast)}
                        _hover={{ bg: 'blue.500', color: 'white' }}
                      >
                        ดาวน์โหลด
                      </Button>
                    </HStack>
                  ) : labDocument.docUrl ? (
                    <CImage
                      src={labDocument.docUrl}
                      alt="Lab Document"
                      maxW="full"
                      maxH="300px"
                      objectFit="contain"
                      borderRadius="md"
                      border="1px solid"
                      borderColor="gray.200"
                      mt={2}
                      cursor="pointer"
                      onClick={() => handleOpenImageModal(labDocument.docUrl)}
                      transition="transform 0.2s ease"
                      _hover={{ transform: 'scale(1.02)' }}
                    />
                  ) : null}
                </Box>
              )}

              {/* Upload History */}
              {uploadHistory.length > 0 && (
                <Box mt={4}>
                  <CText
                    fontSize="sm"
                    fontWeight="bold"
                    color="gray.700"
                    mb={2}
                  >
                    ประวัติการอัปโหลด:
                  </CText>
                  <Accordion allowToggle>
                    {uploadHistory.map((history, index) => (
                      <AccordionItem key={index}>
                        <AccordionButton>
                          <Box flex="1" textAlign="left">
                            อัปโหลดเมื่อ:{' '}
                            {new Date(history.uploadedAt).toLocaleString(
                              'th-TH'
                            )}
                          </Box>
                          <AccordionIcon />
                        </AccordionButton>
                        <AccordionPanel pb={4}>
                          <CText fontSize="sm">
                            สถานะน้ำ:{' '}
                            <strong
                              style={{
                                color:
                                  history.status === 'เหมาะสม'
                                    ? 'green'
                                    : 'red',
                              }}
                            >
                              {history.status}
                            </strong>
                          </CText>
                          {isPdfFile(history.docUrl) ? (
                            <HStack spacing={2} mt={2}>
                              <Button
                                colorScheme="blue"
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  openPdfBlob(
                                    history.docUrl,
                                    setDocModalUrl,
                                    setDocModalType,
                                    setIsDocModalOpen,
                                    toast
                                  )
                                }
                                _hover={{ bg: 'blue.500', color: 'white' }}
                              >
                                ดู PDF
                              </Button>
                              <Button
                                colorScheme="blue"
                                size="sm"
                                variant="outline"
                                leftIcon={<Icon as={FiDownload} />}
                                onClick={() =>
                                  downloadPdf(history.docUrl, toast)
                                }
                                _hover={{ bg: 'blue.500', color: 'white' }}
                              >
                                ดาวน์โหลด
                              </Button>
                            </HStack>
                          ) : (
                            <CImage
                              src={history.docUrl}
                              alt="History Lab Document"
                              maxW="full"
                              maxH="200px"
                              objectFit="contain"
                              borderRadius="md"
                              border="1px solid"
                              borderColor="gray.200"
                              mt={2}
                              cursor="pointer"
                              onClick={() => {
                                setLabDocument({ ...history });
                                handleOpenImageModal(history.docUrl);
                              }}
                            />
                          )}
                        </AccordionPanel>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </Box>
              )}

              <FormControl>
                <FormLabel
                  fontSize="sm"
                  color="gray.600"
                  fontWeight="medium"
                >
                  สถานะน้ำ
                </FormLabel>
                <Select
                  value={labStatus}
                  onChange={(e) => setLabStatus(e.target.value)}
                  size="md"
                  borderRadius="md"
                  focusBorderColor="blue.500"
                  bg="gray.50"
                  _hover={{ bg: 'gray.100' }}
                  transition="all 0.2s ease"
                  color="gray.800"
                >
                  <option value="เหมาะสม">เหมาะสม</option>
                  <option value="ไม่เหมาะสม">ไม่เหมาะสม</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel
                  fontSize="sm"
                  color="gray.600"
                  fontWeight="medium"
                >
                  ไฟล์ผลแลป (PDF หรือรูปภาพ)
                </FormLabel>
                <Box position="relative">
                  <Input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={handleFileChange}
                    size="md"
                    height="48px"
                    p={1}
                    border="1px dashed"
                    borderColor="gray.300"
                    borderRadius="md"
                    bg="gray.50"
                    _hover={{
                      borderColor: 'blue.300',
                      bg: 'gray.100',
                    }}
                    transition="all 0.2s ease"
                    css={{
                      '&::file-selector-button': {
                        height: '36px',
                        border: 'none',
                        outline: 'none',
                        background: 'blue.500',
                        color: 'white',
                        borderRadius: 'md',
                        padding: '0 1rem',
                        cursor: 'pointer',
                        margin: '4px',
                        fontSize: 'sm',
                        display: 'inline-flex',
                        alignItems: 'center',
                      },
                      '&::file-selector-button:hover': {
                        background: 'blue.600',
                      },
                    }}
                  />
                </Box>
                {labFile && (
                  <CText
                    fontSize="xs"
                    color="gray.500"
                    mt={1}
                  >
                    เลือกไฟล์แล้ว: {labFile.name}
                  </CText>
                )}
              </FormControl>

              {/* File Preview */}
              {previewUrl && (
                <Box mt={2}>
                  <CText
                    fontSize="sm"
                    color="gray.600"
                    mb={1}
                  >
                    ตัวอย่างไฟล์:
                  </CText>
                  <CImage
                    src={previewUrl}
                    alt="File Preview"
                    maxW="full"
                    maxH="200px"
                    objectFit="contain"
                    borderRadius="md"
                    border="1px solid"
                    borderColor="gray.200"
                    cursor="pointer"
                    onClick={() => handleOpenImageModal(previewUrl)}
                  />
                </Box>
              )}

              <HStack justify="flex-end" spacing={3} mt={4}>
                <Button
                  variant="outline"
                  size={{ base: 'sm', md: 'md' }}
                  onClick={() => navigate(-1)}
                  colorScheme="gray"
                  borderRadius="md"
                  _hover={{
                    bg: 'gray.100',
                  }}
                  transition="all 0.2s ease"
                >
                  ยกเลิก
                </Button>
                <Button
                  colorScheme="blue"
                  type="submit"
                  size={{ base: 'sm', md: 'md' }}
                  leftIcon={<Icon as={FiUploadCloud} />}
                  borderRadius="md"
                  _hover={{ bg: 'blue.600' }}
                  transition="all 0.2s ease"
                >
                  อัปโหลด
                </Button>
              </HStack>
            </VStack>
          </form>
        </VStack>
      </MotionBox>

      {/* Modal เดียวสำหรับแสดง PDF หรือ รูปภาพ พร้อมปุ่ม "ดาวน์โหลด / เปิดในเบราว์เซอร์" */}
      <Modal
        isOpen={isDocModalOpen}
        onClose={closeDocModal}
        size={{ base: 'full', md: 'xl' }}
        isCentered
        scrollBehavior="inside"
      >
        <ModalOverlay bg="rgba(0,0,0,0.6)" />
        <ModalContent borderRadius="md" overflow="hidden">
          <ModalCloseButton />
          <ModalBody p={4}>
            {docModalType === 'pdf' && docModalUrl ? (
              <PDFViewerAllPages pdfUrl={docModalUrl} />
            ) : docModalType === 'image' && docModalUrl ? (
              <CImage
                src={docModalUrl}
                alt="Preview"
                maxW="100%"
                maxH="80vh"
                objectFit="contain"
                borderRadius="md"
                border="1px solid"
                borderColor="gray.200"
              />
            ) : null}
          </ModalBody>
          <ModalFooter>
            <Button
              w="full"
              colorScheme="blue"
              leftIcon={<Icon as={FiDownload} />}
              onClick={() => {
                // เปิดในแท็บใหม่ (open in new tab) หรือ download
                // ถ้าเป็น PDF -> เปิด docModalUrl (blob) ในแท็บใหม่
                // ถ้าเป็นรูป -> เปิด docModalUrl (blob) หรือ original URL
                if (!docModalUrl) return;
                window.open(docModalUrl, '_blank');
              }}
            >
              ดาวน์โหลด / เปิดในเบราว์เซอร์
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Alert Dialog for Confirmation */}
      <AlertDialog
        isOpen={isConfirmOpen}
        leastDestructiveRef={cancelRef}
        onClose={handleCloseConfirm}
      >
        <ModalOverlay />
        <AlertDialogOverlay>
          <AlertDialogContent bg="white">
            <AlertDialogHeader fontSize="lg" fontWeight="bold" color="gray.800">
              ยืนยันการอัปโหลด
            </AlertDialogHeader>
            <AlertDialogBody color="gray.800">
              คุณต้องการอัปโหลดไฟล์ "{labFile?.name}" หรือไม่? การดำเนินการนี้จะแทนที่ไฟล์ที่มีอยู่ (ถ้ามี).
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={handleCloseConfirm}>
                ยกเลิก
              </Button>
              <Button colorScheme="blue" onClick={confirmUpload} ml={3}>
                อัปโหลด
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Flex>
  );
}

export default Labupload;
