import React, { useState, useMemo } from 'react';
import { apiGet } from '../../utils/api';
import {
  VStack,
  HStack,
  Box,
  Select,
  Input,
  Button,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Text,
  Card,
  CardBody,
  IconButton,
  useToast,
  Skeleton,
} from '@chakra-ui/react';
import { SearchIcon, DownloadIcon, ArrowBackIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query'; // Import React Query
import { formatDateTime } from '../../utils/date'; // Import Date Utility

function Report() {
  const navigate = useNavigate();
  const toast = useToast();

  // ---------------- State for Search Params ----------------
  const [searchParams, setSearchParams] = useState({
    locationId: '',
    startTime: '',
    endTime: '',
    startDate: '',
    endDate: '',
  });

  // State to trigger search (only fetch when this changes)
  const [triggerSearch, setTriggerSearch] = useState(false);

  // ---------------- State for Pagination & Sorting ----------------
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [sortConfig, setSortConfig] = useState({
    column: 'timestamp',
    direction: 'desc',
  });

  // ======================== React Query: Fetch Locations ========================
  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const res = await apiGet('/api/locations');
      if (!res.ok) throw new Error('Failed to fetch locations');
      return res.json();
    },
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
  });

  // ======================== React Query: Fetch Reports ========================
  // Fetch only when searchParams.locationId is available and user clicked search
  const { data: reportData = [], isLoading: isLoadingReports, isFetching } = useQuery({
    queryKey: ['reportData', searchParams.locationId],
    queryFn: async () => {
        if (!searchParams.locationId) return [];
        const res = await apiGet(`/api/locations/${searchParams.locationId}/logs`);
        if (!res.ok) throw new Error('Failed to fetch history data');
        const data = await res.json();
        
        const foundLoc = locations.find((loc) => loc.id === parseInt(searchParams.locationId)) || locations.find((loc) => loc.id === searchParams.locationId);
        const locName = foundLoc?.name || '-';
  
        return data.map((item) => ({
          ...item,
          locationName: locName,
        }));
    },
    enabled: !!searchParams.locationId && triggerSearch, // Only fetch if location is selected and search triggered
    staleTime: 1000 * 60 * 2,
  });

  // Reset trigger after fetch initiated (optional pattern, or just rely on queryKey)
  // Here relying on button click to set a state that included in queryKey or enabled is tricky.
  // Better pattern: Button click sets the *query parameters* that are used in queryKey.
  // BUT the current UI has inputs. Let's make "Search" button update a "submittedSearchParams" state.

  const [submittedLocationId, setSubmittedLocationId] = useState(null);

  const fetchHistory = () => {
      if (!searchParams.locationId) {
          toast({
              title: 'Invalid Selection',
              description: 'Please select a location.',
              status: 'warning',
              duration: 3000,
              isClosable: true,
            });
            return;
      }
      // Trigger fetch by updating key/enabled
      setTriggerSearch(true);
      setSubmittedLocationId(searchParams.locationId);
      setCurrentPage(1);
  };

  const sortHandler = (columnKey) => {
    if (sortConfig.column === columnKey) {
      setSortConfig((prev) => ({
        column: columnKey,
        direction: prev.direction === 'asc' ? 'desc' : 'asc',
      }));
    } else {
      setSortConfig({ column: columnKey, direction: 'asc' });
    }
  };

  const csvColumns = [
    'locationName',
    'ph',
    'tds',
    'temperature',
    'turbidity',
    'timestamp',
  ];

  const downloadCSV = (data, filename = 'report.csv') => {
    if (!data?.length) {
      toast({
        title: 'No Data',
        description: 'No data available to download.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    const separator = ',';
    let csvContent = '';
    csvContent += csvColumns.join(separator) + '\n';

    csvContent += data
      .map((row) =>
        csvColumns
          .map((col) => {
            let cell = row[col] ?? '';
            cell = cell.toString().replace(/"/g, '""');
            return `"${cell}"`;
          })
          .join(separator)
      )
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchParams((prev) => ({ ...prev, [name]: value }));
  };

  // Filter Data Client-side (based on date inputs)
  const filteredData = useMemo(() => {
    if (!reportData.length) return [];

    const { startDate, startTime, endDate, endTime } = searchParams;
    // Note: We use searchParams here for filtering, so filtering updates immediately as user types date, even if they haven't re-fetched (which is fine for client-side filter)
    const startDateTime = startDate ? new Date(`${startDate}T${startTime || '00:00'}`) : null;
    const endDateTime = endDate ? new Date(`${endDate}T${endTime || '23:59'}`) : null;

    return reportData.filter((item) => {
      if (!item.timestamp) return false;
      const itemDate = new Date(item.timestamp);
      return (
        (!startDateTime || itemDate >= startDateTime) &&
        (!endDateTime || itemDate <= endDateTime)
      );
    });
  }, [reportData, searchParams]);

  const sortedData = useMemo(() => {
    const dataToSort = [...filteredData];

    dataToSort.sort((a, b) => {
      let aVal, bVal;

      switch (sortConfig.column) {
        case 'timestamp':
          aVal = new Date(a.timestamp);
          bVal = new Date(b.timestamp);
          break;
        case 'ph':
          aVal = parseFloat(a.ph) || -Infinity;
          bVal = parseFloat(b.ph) || -Infinity;
          break;
        case 'tds':
          aVal = parseFloat(a.tds) || -Infinity;
          bVal = parseFloat(b.tds) || -Infinity;
          break;
        case 'temperature':
          aVal = parseFloat(a.temperature) || -Infinity;
          bVal = parseFloat(b.temperature) || -Infinity;
          break;
        case 'turbidity':
          aVal = parseFloat(a.turbidity) || -Infinity;
          bVal = parseFloat(b.turbidity) || -Infinity;
          break;
        case 'locationName':
          aVal = a.locationName || '';
          bVal = b.locationName || '';
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return dataToSort;
  }, [filteredData, sortConfig]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedData, currentPage]);

  const goToPreviousPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const goToNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  return (
    <VStack spacing={6} p={{ base: 3, md: 5 }} align="stretch" maxW="container.xl" mx="auto">
      {/* Header */}
      <HStack justify="space-between" align="center">
        <HStack spacing={3}>
          <IconButton
            icon={<ArrowBackIcon />}
            variant="ghost"
            onClick={() => navigate(-1)}
            aria-label="Go Back"
          />
          <Heading size={{ base: 'md', md: 'lg' }}>Report</Heading>
        </HStack>
      </HStack>

      {/* Filter Card */}
      <Card shadow="md">
        <CardBody>
          <VStack spacing={4} align="stretch">
            <Box>
              <Text fontSize="sm" color="gray.500" mb={1}>
                Location
              </Text>
              <Select
                name="locationId"
                value={searchParams.locationId}
                onChange={handleInputChange}
                placeholder="Select Location"
                size={{ base: 'sm', md: 'md' }}
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </Select>
            </Box>

            <HStack spacing={3} flexWrap={{ base: 'wrap', md: 'nowrap' }}>
              <Box w={{ base: 'full', md: '50%' }}>
                <Text fontSize="sm" color="gray.500" mb={1}>
                  Start Time
                </Text>
                <Input
                  type="time"
                  name="startTime"
                  value={searchParams.startTime}
                  onChange={handleInputChange}
                  size={{ base: 'sm', md: 'md' }}
                />
              </Box>
              <Box w={{ base: 'full', md: '50%' }}>
                <Text fontSize="sm" color="gray.500" mb={1}>
                  End Time
                </Text>
                <Input
                  type="time"
                  name="endTime"
                  value={searchParams.endTime}
                  onChange={handleInputChange}
                  size={{ base: 'sm', md: 'md' }}
                />
              </Box>
            </HStack>

            <HStack spacing={3} flexWrap={{ base: 'wrap', md: 'nowrap' }}>
              <Box w={{ base: 'full', md: '50%' }}>
                <Text fontSize="sm" color="gray.500" mb={1}>
                  Start Date
                </Text>
                <Input
                  type="date"
                  name="startDate"
                  value={searchParams.startDate}
                  onChange={handleInputChange}
                  size={{ base: 'sm', md: 'md' }}
                />
              </Box>
              <Box w={{ base: 'full', md: '50%' }}>
                <Text fontSize="sm" color="gray.500" mb={1}>
                  End Date
                </Text>
                <Input
                  type="date"
                  name="endDate"
                  value={searchParams.endDate}
                  onChange={handleInputChange}
                  size={{ base: 'sm', md: 'md' }}
                />
              </Box>
            </HStack>

            <HStack spacing={3} flexWrap={{ base: 'wrap', md: 'nowrap' }}>
              <Button
                leftIcon={<SearchIcon />}
                colorScheme="blue"
                w={{ base: 'full', md: '50%' }}
                size={{ base: 'sm', md: 'md' }}
                onClick={fetchHistory}
                isLoading={isLoadingReports}
              >
                Search
              </Button>
              <Button
                leftIcon={<DownloadIcon />}
                colorScheme="green"
                w={{ base: 'full', md: '50%' }}
                size={{ base: 'sm', md: 'md' }}
                onClick={() => downloadCSV(filteredData)}
                isDisabled={!filteredData.length}
              >
                Download
              </Button>
            </HStack>
          </VStack>
        </CardBody>
      </Card>

      {/* Data Table or Skeleton */}
      {isLoadingReports ? (
        <VStack spacing={4} py={4}>
          {/* Table Header Skeleton */}
          <TableContainer overflowX="auto">
            <Table variant="simple" size={{ base: 'sm', md: 'md' }}>
              <Thead>
                <Tr>
                  {['Location', 'pH', 'TDS/EC', 'Temp', 'Turbidity', 'Date-Time'].map(
                    (header, index) => (
                      <Th key={index}>
                        <Skeleton height="20px" width="80px" />
                      </Th>
                    )
                  )}
                </Tr>
              </Thead>
              <Tbody>
                {Array(5)
                  .fill()
                  .map((_, rowIndex) => (
                    <Tr key={rowIndex}>
                      {Array(6)
                        .fill()
                        .map((_, colIndex) => (
                          <Td key={colIndex}>
                            <Skeleton height="20px" width="100px" />
                          </Td>
                        ))}
                    </Tr>
                  ))}
              </Tbody>
            </Table>
          </TableContainer>
          {/* Pagination Skeleton */}
          <HStack justify="center" spacing={4} py={4}>
            <Skeleton height="32px" width="80px" borderRadius="md" />
            <Skeleton height="20px" width="50px" />
            <Skeleton height="32px" width="80px" borderRadius="md" />
          </HStack>
        </VStack>
      ) : (
        <>
          <TableContainer overflowX="auto">
            <Table variant="simple" size={{ base: 'sm', md: 'md' }}>
              <Thead>
                <Tr>
                  <Th onClick={() => sortHandler('locationName')} cursor="pointer">
                    Location
                    {sortConfig.column === 'locationName' &&
                      (sortConfig.direction === 'asc' ? ' ▲' : ' ▼')}
                  </Th>
                  <Th onClick={() => sortHandler('ph')} cursor="pointer">
                    pH
                    {sortConfig.column === 'ph' &&
                      (sortConfig.direction === 'asc' ? ' ▲' : ' ▼')}
                  </Th>
                  <Th onClick={() => sortHandler('tds')} cursor="pointer">
                    TDS/EC
                    {sortConfig.column === 'tds' &&
                      (sortConfig.direction === 'asc' ? ' ▲' : ' ▼')}
                  </Th>
                  <Th onClick={() => sortHandler('temperature')} cursor="pointer">
                    Temp
                    {sortConfig.column === 'temperature' &&
                      (sortConfig.direction === 'asc' ? ' ▲' : ' ▼')}
                  </Th>
                  <Th onClick={() => sortHandler('turbidity')} cursor="pointer">
                    Turbidity
                    {sortConfig.column === 'turbidity' &&
                      (sortConfig.direction === 'asc' ? ' ▲' : ' ▼')}
                  </Th>
                  <Th onClick={() => sortHandler('timestamp')} cursor="pointer">
                    Date-Time
                    {sortConfig.column === 'timestamp' &&
                      (sortConfig.direction === 'asc' ? ' ▲' : ' ▼')}
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {paginatedData.length ? (
                  paginatedData.map((item) => {
                    return (
                      <Tr key={item.id}>
                        <Td>{item.locationName || '-'}</Td>
                        <Td>{item.ph ?? '-'}</Td>
                        <Td>{item.tds ?? '-'}</Td>
                        <Td>{item.temperature ?? '-'}</Td>
                        <Td>{item.turbidity ?? '-'}</Td>
                        <Td whiteSpace="nowrap">{formatDateTime(item.timestamp)}</Td>
                      </Tr>
                    );
                  })
                ) : (
                  <Tr>
                    <Td colSpan={6} textAlign="center">
                      No data available
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {totalPages > 1 && (
            <HStack justify="center" spacing={4} py={4}>
              <Button size="sm" onClick={goToPreviousPage} isDisabled={currentPage === 1}>
                Previous
              </Button>
              <Text fontSize="sm">
                {currentPage} / {totalPages}
              </Text>
              <Button size="sm" onClick={goToNextPage} isDisabled={currentPage === totalPages}>
                Next
              </Button>
            </HStack>
          )}
        </>
      )}
    </VStack>
  );
}

export default Report;
