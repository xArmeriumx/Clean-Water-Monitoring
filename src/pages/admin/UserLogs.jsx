import React, { useState, useMemo } from 'react';
import { apiGet } from '../../utils/api';
import {
  Box,
  Heading,
  Input,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Flex,
  Center,
  Text,
  IconButton,
  Card,
  CardBody,
  Spinner,
  useToast, // Keep useToast for consistency, though React Query handles errors well
} from '@chakra-ui/react';
import { ArrowUpDownIcon, ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { useQuery } from '@tanstack/react-query'; // Import React Query
import { formatDateTime } from '../../utils/date'; // Import Date Utility

function UserLogs() {
  const toast = useToast();

  // ---------------- State for Filter / Search ----------------
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUserId, setFilterUserId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // ---------------- State for Sorting ----------------
  const [sortConfig, setSortConfig] = useState({ key: 'timestamp', direction: 'desc' });

  // ---------------- State for Pagination ----------------
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // ======================== React Query: Fetch Logs ========================
  const fetchLogs = async () => {
    const res = await apiGet('/api/userlogs');
    if (!res.ok) throw new Error('Failed to fetch logs');
    return res.json();
  };

  const { data: logs = [], isLoading, isError, error } = useQuery({
    queryKey: ['userLogs'],
    queryFn: fetchLogs,
    staleTime: 1000 * 60 * 1, // Cache for 1 minute
    refetchOnWindowFocus: false,
  });

  if (isError) {
     // Optional: You could useEffect to show toast on error, or just render error UI
     console.error("Error fetching logs:", error);
  }

  // ======================== Filter + Search ========================
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // 1) Search
      const matchesSearch =
        searchTerm.trim() === '' ||
        (log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         log.details?.toLowerCase().includes(searchTerm.toLowerCase()));

      // 2) Filter User ID
      const matchesUser =
        !filterUserId || filterUserId === '' || log.userId === filterUserId;

      // 3) Filter Date Range
      const logDate = new Date(log.timestamp).getTime();
      let matchesDate = true;
      if (startDate) {
        const start = new Date(`${startDate}T00:00:00`).getTime();
        if (logDate < start) matchesDate = false;
      }
      if (endDate) {
        const end = new Date(`${endDate}T23:59:59`).getTime();
        if (logDate > end) matchesDate = false;
      }

      return matchesSearch && matchesUser && matchesDate;
    });
  }, [logs, searchTerm, filterUserId, startDate, endDate]);

  // ======================== Sorting ========================
  const sortedLogs = useMemo(() => {
    const sortable = [...filteredLogs];
    sortable.sort((a, b) => {
      let aVal, bVal;
      switch (sortConfig.key) {
        case 'userId':
          aVal = a.userId?.toLowerCase() || '';
          bVal = b.userId?.toLowerCase() || '';
          break;
        case 'action':
          aVal = a.action?.toLowerCase() || '';
          bVal = b.action?.toLowerCase() || '';
          break;
        case 'timestamp':
          aVal = new Date(a.timestamp).getTime();
          bVal = new Date(b.timestamp).getTime();
          break;
        default:
          return 0;
      }
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sortable;
  }, [filteredLogs, sortConfig]);

  // ======================== Pagination ========================
  const totalPages = Math.ceil(sortedLogs.length / itemsPerPage);
  const currentData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedLogs.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedLogs, currentPage]);

  const goToPreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };
  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  // ======================== Handlers ========================
  const handleSort = (key) => {
    if (sortConfig.key === key) {
      setSortConfig((prev) => ({
        key,
        direction: prev.direction === 'asc' ? 'desc' : 'asc',
      }));
    } else {
      setSortConfig({ key, direction: 'asc' });
    }
    setCurrentPage(1);
  };

  const handleFilterUserId = (e) => {
    setFilterUserId(e.target.value);
    setCurrentPage(1);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleStartDateChange = (e) => {
    setStartDate(e.target.value);
    setCurrentPage(1);
  };

  const handleEndDateChange = (e) => {
    setEndDate(e.target.value);
    setCurrentPage(1);
  };

  // ======================== Render ========================
  if (isLoading) {
    return (
      <Center minH="100vh">
        <Spinner size="xl" color="blue.500" />
      </Center>
    );
  }

  if (isError) {
      return (
          <Center minH="100vh">
              <Text color="red.500">Error loading logs: {error.message}</Text>
          </Center>
      )
  }

  return (
    <Box p={4} maxW="1200px" mx="auto">
      <Heading size="lg" mb={6}>
        User Activity Logs
      </Heading>

      <Card mb={4}>
        <CardBody>
          {/* Filter & Search */}
          <Flex
            flexDirection={{ base: 'column', md: 'row' }}
            gap={4}
            align="flex-end"
          >
            <Box>
              <Text fontSize="sm" mb={1}>
                Search (Action/Details)
              </Text>
              <Input
                placeholder="Type to search..."
                value={searchTerm}
                onChange={handleSearch}
                size="sm"
                maxW="200px"
              />
            </Box>
            <Box>
              <Text fontSize="sm" mb={1}>
                Filter by User ID
              </Text>
              <Select
                placeholder="All users"
                value={filterUserId}
                onChange={handleFilterUserId}
                size="sm"
                maxW="200px"
              >
                {/* สร้างตัวเลือก User ID จาก logs */}
                {[...new Set(logs.map((l) => l.userId))].map((uid) => (
                  <option key={uid} value={uid}>
                    {uid}
                  </option>
                ))}
              </Select>
            </Box>
            <Box>
              <Text fontSize="sm" mb={1}>
                Start Date
              </Text>
              <Input
                type="date"
                value={startDate}
                onChange={handleStartDateChange}
                size="sm"
              />
            </Box>
            <Box>
              <Text fontSize="sm" mb={1}>
                End Date
              </Text>
              <Input
                type="date"
                value={endDate}
                onChange={handleEndDateChange}
                size="sm"
              />
            </Box>
          </Flex>
        </CardBody>
      </Card>

      {/* Logs Table */}
      <TableContainer>
        <Table variant="simple" size="sm">
          <Thead bg="gray.100">
            <Tr>
              <Th
                cursor="pointer"
                onClick={() => handleSort('userId')}
                whiteSpace="nowrap"
              >
                User ID
                <ArrowUpDownIcon
                  ml={1}
                  color={sortConfig.key === 'userId' ? 'blue.500' : 'gray.400'}
                />
              </Th>
              <Th
                cursor="pointer"
                onClick={() => handleSort('action')}
                whiteSpace="nowrap"
              >
                Action
                <ArrowUpDownIcon
                  ml={1}
                  color={sortConfig.key === 'action' ? 'blue.500' : 'gray.400'}
                />
              </Th>
              <Th>Details</Th>
              <Th
                cursor="pointer"
                onClick={() => handleSort('timestamp')}
                whiteSpace="nowrap"
              >
                Timestamp
                <ArrowUpDownIcon
                  ml={1}
                  color={sortConfig.key === 'timestamp' ? 'blue.500' : 'gray.400'}
                />
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {currentData.length ? (
              currentData.map((log) => {
                return (
                  <Tr key={log.id}>
                    <Td>{log.userId}</Td>
                    <Td>{log.action}</Td>
                    <Td>{log.details}</Td>
                    <Td>
                      {formatDateTime(log.timestamp)}
                    </Td>
                  </Tr>
                );
              })
            ) : (
              <Tr>
                <Td colSpan={4}>
                  <Center py={4}>
                    <Text color="gray.500">No logs found.</Text>
                  </Center>
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      </TableContainer>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <Flex justify="center" align="center" mt={4} gap={2}>
          <IconButton
            icon={<ChevronLeftIcon />}
            onClick={goToPreviousPage}
            isDisabled={currentPage === 1}
            size="sm"
            aria-label="Previous Page"
          />
          <Text fontSize="sm">
            Page {currentPage} of {totalPages}
          </Text>
          <IconButton
            icon={<ChevronRightIcon />}
            onClick={goToNextPage}
            isDisabled={currentPage === totalPages}
            size="sm"
            aria-label="Next Page"
          />
        </Flex>
      )}
    </Box>
  );
}

export default UserLogs;
