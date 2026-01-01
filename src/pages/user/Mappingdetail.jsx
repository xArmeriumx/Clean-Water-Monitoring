import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Heading,
  Image,
  Text,
  Center,
  VStack,
  HStack,
  IconButton,
  Button,
  useColorModeValue,
  Badge,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useToast,
  useBreakpointValue,
  Flex,
  Skeleton,
  SkeletonText,
  Link,
  Spinner,
} from '@chakra-ui/react';
import { ArrowBackIcon, WarningIcon, InfoIcon } from '@chakra-ui/icons';
import { useAuth } from '../../auth/AuthContext';
import { apiGet } from '../../utils/api';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import waterQualityStandards from '../../data/waterQualityStandards.json';
import { useQuery } from '@tanstack/react-query';

// Lazy Load Map
const UserMapView = lazy(() => import('../../components/ui/UserMapView'));

// Set the worker for pdfjs
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.js`;

// Utility function: parse coordinate string to an array [lat, lng]
function parseCoordinates(coordStr) {
  if (!coordStr) return [0, 0];
  let fixed = coordStr.replace(/\//g, ',').replace(/\s+/g, '');
  const parts = fixed.split(',');
  if (parts.length < 2) return [0, 0];
  const lat = parseFloat(parts[0]);
  const lng = parseFloat(parts[1]);
  if (isNaN(lat) || isNaN(lng)) return [0, 0];
  return [lat, lng];
}

// Component: PDFViewerAllPages
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
          const renderContext = { canvasContext: context, viewport: viewport };
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
        <img key={index} src={dataUrl} alt={`Page ${index + 1}`} style={{ width: '100%', marginBottom: '10px' }} />
      ))}
    </div>
  );
}

// ฟังก์ชันเพื่อตรวจสอบว่าเป็นไฟล์ PDF หรือไม่
const isPdfFileFunc = (docUrl) => {
  if (!docUrl) return false;
  return docUrl.toLowerCase().endsWith('.pdf');
};

// ฟังก์ชันเพื่อตรวจสอบสถานะคุณภาพน้ำ
const getWaterQualityStatus = (label, value) => {
  if (value === undefined || value === null) return "ไม่ทราบ";

  const standard = waterQualityStandards[label];
  if (!standard) return "ไม่ทราบ";

  if (value >= standard.suitable.min && value <= standard.suitable.max) {
    return "เหมาะสม";
  } else {
    return "ไม่เหมาะสม";
  }
};

// Main Component: MappingDetail
function MappingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [labDoc, setLabDoc] = useState(null);
  const [pdfEmbedUrl, setPdfEmbedUrl] = useState(null);
  const [isPdfOpen, setIsPdfOpen] = useState(false);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [isStandardsOpen, setIsStandardsOpen] = useState(false);
  const [isLabHistoryOpen, setIsLabHistoryOpen] = useState(false);

  const bgColor = useColorModeValue('white', 'gray.900');
  const cardBg = useColorModeValue('#f0f9ff', 'blue.900');
  const textColor = useColorModeValue('gray.700', 'gray.100');
  const sidebarWidth = useBreakpointValue({ base: '100%', md: '400px' });
  const isDesktop = useBreakpointValue({ base: false, md: true });

  // ================= React Query: Location Data =================
  const { data: locationData, isLoading: loadingLocation, error } = useQuery({
    queryKey: ['location', id],
    queryFn: async () => {
      const res = await apiGet(`/api/locations/${id}`);
      if (!res.ok) throw new Error('Failed to fetch location data');
      return res.json();
    },
    enabled: !!id,
  });

  // ================= React Query: Lab History =================
  const { data: labHistory = [] } = useQuery({
    queryKey: ['labHistory', id],
    queryFn: async () => {
        // Assuming user token is handled by apiFetch or not needed if public
        // If it requires auth, apiGet should handle it via cookies now
        const res = await apiGet(`/api/locations/${id}/labhistory`);
        if (!res.ok) throw new Error('Failed to fetch lab history');
        return res.json();
    },
    enabled: !!id,
    retry: false, // Don't retry if it fails (e.g. 401 unauth)
    onError: (err) => {
        console.error('Error fetching lab history:', err);
    }
  });

  // Update labDoc when locationData changes
  useEffect(() => {
    if (locationData) {
      setLabDoc(locationData.labDocument || null);
    }
  }, [locationData]);

  if (error) {
    return (
      <Center h="100vh" color="blue.500">
        <Text>{error.message}</Text>
      </Center>
    );
  }

  const position = locationData ? parseCoordinates(locationData.coordinates) : [0, 0];

  const openPdfBlob = async (pdfUrl) => {
    try {
      const response = await fetch(pdfUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch PDF file');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setPdfEmbedUrl(url);
      setIsPdfOpen(true);
    } catch (err) {
      console.error(err);
      if (pdfUrl) {
        toast({
          title: 'ไม่สามารถเปิดไฟล์ PDF ได้',
          description: 'กรุณาเปิดไฟล์นี้ในแอป PDF Viewer บน Android โดยคลิกที่ลิงก์: ' + pdfUrl,
          status: 'warning',
          duration: 5000,
          isClosable: true,
          position: 'top',
          action: (
            <Button colorScheme="blue" size="sm" onClick={() => window.open(pdfUrl, '_blank')} mt={2}>
              Open in Browser
            </Button>
          ),
        });
      } else {
        toast({
          title: 'เกิดข้อผิดพลาด',
          description: 'ไม่สามารถเปิดไฟล์ PDF ได้ กรุณาติดต่อผู้ดูแลระบบ',
          status: 'error',
          duration: 5000,
          isClosable: true,
          position: 'top',
        });
      }
    }
  };

  const SensorReading = ({ label, value, unit }) => {
    const status = getWaterQualityStatus(label, value);
    const statusColor = {
      เหมาะสม: "green.500",
      ไม่เหมาะสม: "red.500",
      ไม่ทราบ: "gray.500",
    }[status];

    return (
      <HStack justify="space-between" w="full" py={2}>
        <Text fontSize="sm" color={textColor}>{label}</Text>
        <Text fontSize="sm" color={statusColor} fontWeight="medium">
          {value !== undefined ? `${value}${unit} (${status})` : '-'}
        </Text>
      </HStack>
    );
  };

  const handleOpenImageZoom = () => setIsZoomOpen(true);
  const handleCloseImageZoom = () => {
    setIsZoomOpen(false);
    setLabDoc(locationData ? locationData.labDocument || null : null); // รีเซ็ต labDoc กลับไปเป็นผลล่าสุด
  };
  const closePdfModal = () => {
    setIsPdfOpen(false);
    setPdfEmbedUrl(null);
  };

  const handleOpenStandards = () => setIsStandardsOpen(true);
  const handleCloseStandards = () => setIsStandardsOpen(false);

  const handleOpenLabHistory = () => setIsLabHistoryOpen(true);
  const handleCloseLabHistory = () => setIsLabHistoryOpen(false);

  return (
    <Box h="100vh" w="100%" display="flex" flexDirection="column" bg={bgColor}>
      {/* Header Section */}
      <Box
        position="fixed"
        top="0"
        left="0"
        right="0"
        zIndex="1000"
        bgGradient="linear(to-r, #f7fcff, #ebf8ff)"
        boxShadow="md"
      >
        <HStack p={4} justify="space-between">
          <HStack>
            <IconButton icon={<ArrowBackIcon />} onClick={() => navigate(-1)} aria-label="Go Back" colorScheme="blue" variant="ghost" />
            <Heading size="md" color={textColor}>
              {locationData ? locationData.name : 'Loading...'}
            </Heading>
          </HStack>
        </HStack>
      </Box>

      {/* Main Content Section */}
      <Box flex="1" mt="60px" overflow="hidden">
        <Flex h="100%" direction={{ base: 'column', md: 'row' }}>
          {/* Sidebar for Location Details */}
          <Box
            w={sidebarWidth}
            h={isDesktop ? '100%' : 'auto'}
            overflowY="auto"
            borderRight={isDesktop ? '1px solid' : 'none'}
            borderColor="gray.200"
            p={4}
            bg={isDesktop ? 'white' : 'transparent'}
          >
            {loadingLocation ? (
              <VStack spacing={4} align="stretch">
                <Skeleton height="200px" borderRadius="lg" />
                <Box bg={cardBg} borderRadius="lg" p={6}>
                  <SkeletonText noOfLines={4} spacing="4" />
                </Box>
                <Box bg={cardBg} borderRadius="lg" p={6}>
                  <SkeletonText noOfLines={3} spacing="4" />
                </Box>
                <Skeleton height="40px" />
              </VStack>
            ) : (
              <VStack spacing={6} align="stretch">
                <Image
                  src={locationData.imageUrl || '/uploads/placeholder.jpg'}
                  alt={locationData.name}
                  w="full"
                  h="200px"
                  objectFit="cover"
                  borderRadius="lg"
                />
                <Box bg={cardBg} borderRadius="lg" p={6}>
                  <VStack spacing={1} align="stretch">
                    <Text fontSize="sm" fontWeight="medium" color="blue.700" mb={2}>
                      สถานะคุณภาพน้ำ
                    </Text>
                    <SensorReading label="pH" value={locationData.sensors?.ph} unit="" />
                    <SensorReading label="TDS/EC" value={locationData.sensors?.tds} unit=" ppm" />
                    <SensorReading label="Turbidity" value={locationData.sensors?.turbidity} unit=" NTU" />
                    <SensorReading label="Temperature" value={locationData.sensors?.temperature} unit="°C" />
                    <HStack justify="space-between" mt={3}>
                      <Text fontSize="xs" color="blue.600">
                        อัปเดทล่าสุด:{' '}
                        {locationData.sensors?.timestamp ? new Date(locationData.sensors.timestamp).toLocaleString('th-TH') : '-'}
                      </Text>
                      <Link fontSize="xs" color="blue.500" onClick={handleOpenStandards}>
                        เกณฑ์มาตรฐาน <InfoIcon w={3} h={3} ml={1} />
                      </Link>
                    </HStack>
                  </VStack>
                </Box>
                <Box bg={cardBg} borderRadius="lg" p={6}>
                  <VStack spacing={1} align="stretch">
                    <Text fontSize="sm" fontWeight="medium" color="blue.700" mb={2}>
                      ผลการตรวจวิเคราะห์ทางห้องปฏิบัติการ
                    </Text>
                    {labDoc ? (
                      <>
                        <HStack>
                          <Text fontSize="sm" color={textColor}>สถานะน้ำ:</Text>
                          <Badge colorScheme={labDoc.status === 'เหมาะสม' ? 'green' : 'red'}>
                            {labDoc.status}
                          </Badge>
                        </HStack>
                        {isPdfFileFunc(labDoc.docUrl) ? (
                          <Button colorScheme="blue" mt={2} onClick={() => openPdfBlob(labDoc.docUrl)}>
                            ดูไฟล์ PDF
                          </Button>
                        ) : labDoc.docUrl ? (
                          <Button colorScheme="blue" mt={2} onClick={handleOpenImageZoom}>
                            ดูผลการตรวจทางห้องปฏิบัติการ
                          </Button>
                        ) : (
                          <Text fontSize="sm" color="gray.500">ไม่มีเอกสารผลแลป</Text>
                        )}
                        <HStack justify="space-between" mt={2}>
                          <Text fontSize="xs" color="blue.600">
                            อัปเดทเมื่อ:{' '}
                            {labDoc.updatedAt ? new Date(labDoc.updatedAt).toLocaleString('th-TH') : '-'}
                          </Text>
                          <Link fontSize="xs" color="blue.500" onClick={handleOpenLabHistory}>
                            ประวัติผลตรวจ <InfoIcon w={3} h={3} ml={1} />
                          </Link>
                        </HStack>
                      </>
                    ) : (
                      <Text fontSize="sm" color="gray.500">ยังไม่มีข้อมูลผลแลป</Text>
                    )}
                  </VStack>
                </Box>
                <VStack spacing={2} align="stretch">
                  <Button
                    colorScheme="red"
                    size="sm"
                    width="full"
                    onClick={() => navigate(`/reportissue?locationId=${id}`)}
                    leftIcon={<WarningIcon />}
                    variant="outline"
                  >
                    แจ้งปัญหา
                  </Button>
                </VStack>
              </VStack>
            )}
          </Box>

          {/* Map Section (Desktop Only) */}
          {isDesktop && (
            <Box flex="1" h="100%">
               <Suspense
                    fallback={
                        <Center h="100%" bg="gray.100">
                            <Spinner size="xl" color="blue.500" />
                        </Center>
                    }
                >
                  <UserMapView 
                    singleLocation={position}
                    singleLocationName={locationData ? locationData.name : ''}
                  />
                </Suspense>
            </Box>
          )}
        </Flex>
      </Box>

      {/* PDF Modal */}
      <Modal isOpen={isPdfOpen} onClose={closePdfModal} size="xl" isCentered scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalBody p={4}>
            {pdfEmbedUrl && <PDFViewerAllPages pdfUrl={pdfEmbedUrl} />}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={() => window.open(pdfEmbedUrl, '_blank')} w="full">
              Download / Open in Browser
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Image Zoom Modal */}
      <Modal isOpen={isZoomOpen} onClose={handleCloseImageZoom} size="xl" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalBody p={0}>
            {labDoc && labDoc.docUrl ? (
              <Image src={labDoc.docUrl} alt="Zoomed Lab Document" w="100%" h="auto" objectFit="contain" />
            ) : (
              <Text>ไม่มีรูปภาพให้แสดง</Text>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Standards Modal */}
      <Modal isOpen={isStandardsOpen} onClose={handleCloseStandards} size="md" isCentered>
        <ModalOverlay />
        <ModalContent bg={cardBg} borderRadius="lg">
          <ModalHeader>
            <Text fontSize="lg" fontWeight="medium" color="blue.700">
              เกณฑ์มาตรฐานคุณภาพน้ำ
            </Text>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              {Object.keys(waterQualityStandards).map((key) => {
                const standard = waterQualityStandards[key];
                let displayText = '';
                if (key === 'E.coli') {
                  displayText = 'ไม่พบ';
                } else {
                  displayText = `${standard.suitable.min} - ${standard.suitable.max}`;
                }
                return (
                  <VStack key={key} align="stretch" spacing={1}>
                    <HStack justify="space-between">
                      <Text fontSize="sm" color={textColor}>
                        {key === 'TDS/EC' ? 'TDS/EC' : key === 'E.coli' ? 'E.coli' : key}
                      </Text>
                      <Text fontSize="sm" color="blue.600" fontWeight="medium">
                        {displayText}{' '}
                        {key === 'TDS/EC' ? 'ppm' : key === 'Turbidity' ? 'NTU' : key === 'Temperature' ? '°C' : key === 'E.coli' ? 'ตัวอย่าง 100 ml' : ''}
                      </Text>
                    </HStack>
                    <Text fontSize="xs" color="gray.500">
                      อ้างอิง: {' '}
                      <Link
                        href={standard.reference.url}
                        isExternal
                        color="blue.500"
                        textDecoration="underline"
                      >
                        {standard.reference.source}
                      </Link>
                    </Text>
                  </VStack>
                );
              })}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={handleCloseStandards}>
              ปิด
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Lab History Modal */}
      <Modal isOpen={isLabHistoryOpen} onClose={handleCloseLabHistory} size="md" isCentered>
        <ModalOverlay />
        <ModalContent bg={cardBg} borderRadius="lg">
          <ModalHeader>
            <Text fontSize="lg" fontWeight="medium" color="blue.700">
              ประวัติผลตรวจ
            </Text>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {labHistory.length > 0 ? (
              <VStack spacing={4} align="stretch">
                {labHistory.map((history, index) => (
                  <VStack key={index} align="stretch" spacing={1} borderBottom="1px solid" borderColor="gray.200" pb={2}>
                    <HStack justify="space-between">
                      <Text fontSize="sm" color={textColor}>
                        สถานะน้ำ: <Badge colorScheme={history.status === 'เหมาะสม' ? 'green' : 'red'}>{history.status}</Badge>
                      </Text>
                      {isPdfFileFunc(history.docUrl) ? (
                        <Button size="xs" colorScheme="blue" onClick={() => openPdfBlob(history.docUrl)}>
                          ดูไฟล์ PDF
                        </Button>
                      ) : history.docUrl ? (
                        <Button
                          size="xs"
                          colorScheme="blue"
                          onClick={() => {
                            setLabDoc({ docUrl: history.docUrl });
                            handleOpenImageZoom();
                          }}
                        >
                          ดูรูปภาพ
                        </Button>
                      ) : (
                        <Text fontSize="xs" color="gray.500">ไม่มีไฟล์</Text>
                      )}
                    </HStack>
                    <Text fontSize="xs" color="blue.600">
                      อัปโหลดเมื่อ: {new Date(history.uploadedAt).toLocaleString('th-TH')}
                    </Text>
                  </VStack>
                ))}
              </VStack>
            ) : (
              <Text fontSize="sm" color="gray.500">ไม่มีประวัติผลตรวจ</Text>
            )}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={handleCloseLabHistory}>
              ปิด
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

export default MappingDetail;