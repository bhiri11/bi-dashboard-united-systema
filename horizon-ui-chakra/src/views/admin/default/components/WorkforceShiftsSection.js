import React, { useEffect, useState } from "react";

import {
  Box,
  Flex,
  Grid,
  Progress,
  Spinner,
  Tag,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import Card from "components/card/Card.js";
import { useSearch } from "contexts/SearchContext";

const apiBaseUrl = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

function KPIStatCard({ item, tone }) {
  const textColor = useColorModeValue("secondaryGray.900", "white");
  const subTextColor = useColorModeValue("secondaryGray.600", "whiteAlpha.700");
  const cardBg = useColorModeValue("white", "navy.700");
  const borderColor = useColorModeValue("secondaryGray.100", "whiteAlpha.100");

  const isAvailable = item?.status === "ok" || item?.status === "normal" || 
                      item?.status === "low" || item?.status === "high" || 
                      item?.status === "critical" || item?.status === "excellent" ||
                      item?.status === "good" || item?.status === "poor";

  const value = isAvailable
    ? item?.metric_name === "Absenteeism / Late Arrival Rate"
      ? `${Number(item?.late_rate || 0).toFixed(1)}%`
      : item?.metric_name === "Worker Retention Rate"
        ? `${Number(item?.retention_rate || 0).toFixed(1)}%`
        : item?.metric_name === "Active Workers"
          ? `${Number(item?.active_workers || 0)} workers`
          : item?.metric_name === "Total Hours Worked"
            ? `${Number(item?.total_hours || 0).toFixed(2)} h`
            : `${Number(item?.value || 0).toFixed(1)}${item?.unit === '%' ? '%' : item?.unit === 'hours' ? ' h' : ''}`
    : "Unavailable";

  const details = isAvailable
    ? item?.metric_name === "Active Workers"
      ? `Unique workers with at least 1 attendance in period`
      : item?.metric_name === "Total Hours Worked"
        ? `${item?.completed_shifts || 0} completed shifts by ${item?.unique_workers_contributed || 0} workers`
        : item?.metric_name === "Absenteeism / Late Arrival Rate"
          ? `${item?.late_arrivals || 0} late out of ${item?.total_attendance_records || 0} attendances`
          : item?.metric_name === "Worker Retention Rate"
            ? `${item?.retained_workers || 0} workers with 2+ shifts out of ${item?.total_unique_workers || 0}`
            : item?.details || ''
    : `Missing: ${(item?.required_fields || []).join(', ')}`;

  const trendTone = isAvailable
    ? item?.metric_name === "Absenteeism / Late Arrival Rate"
      ? Number(item?.late_rate || 0) < 30 ? 'green.500' : Number(item?.late_rate || 0) < 50 ? 'orange.500' : 'red.500'
      : item?.metric_name === "Worker Retention Rate"
        ? Number(item?.retention_rate || 0) > 85 ? 'green.500' : Number(item?.retention_rate || 0) > 70 ? 'blue.500' : 'orange.500'
        : 'green.500'
    : 'gray.500';

  const trendIcon = isAvailable
    ? item?.metric_name === "Absenteeism / Late Arrival Rate"
      ? Number(item?.late_rate || 0) < 30 ? '↓' : Number(item?.late_rate || 0) < 50 ? '→' : '↑'
      : '↑'
    : '';

  return (
    <Box
      p='18px'
      borderRadius='22px'
      border='1px solid'
      borderColor={borderColor}
      bg={cardBg}
      boxShadow='0px 16px 36px rgba(112, 144, 176, 0.12)'
      position='relative'
      overflow='hidden'>
      <Box position='absolute' top='0' left='0' right='0' h='4px' bg={tone} />

      <Flex justify='space-between' align='start' gap='12px' mb='14px'>
        <Box>
          <Text color={subTextColor} fontSize='xs' fontWeight='700' textTransform='uppercase' letterSpacing='0.08em'>
            Workforce KPI
          </Text>
          <Text color={textColor} fontSize='lg' fontWeight='800' lineHeight='1.15' mt='6px'>
            {item?.metric_name}
          </Text>
          <Text color={subTextColor} fontSize='sm' mt='6px'>
            {item?.period || 'All time'}
          </Text>
        </Box>
        <Tag size='sm' borderRadius='full' bg='brand.50' color='brand.500' fontWeight='700'>
          KPI
        </Tag>
      </Flex>

      <Flex align='baseline' gap='8px' mb='8px'>
        <Text color={textColor} fontSize='34px' fontWeight='800' lineHeight='1'>
          {value}
        </Text>
        {trendIcon && (
          <Text color={trendTone} fontSize='lg' fontWeight='700'>
            {trendIcon}
          </Text>
        )}
      </Flex>

      <Text color={subTextColor} fontSize='sm' mb='12px'>
        {details}
      </Text>

      {isAvailable && item?.metric_name === "Absenteeism / Late Arrival Rate" && (
        <Box>
          <Flex justify='space-between' mb='6px'>
            <Text color={subTextColor} fontSize='xs' fontWeight='700' textTransform='uppercase'>
              Late Arrival Rate
            </Text>
            <Text color={trendTone} fontSize='xs' fontWeight='700'>
              {item?.status}
            </Text>
          </Flex>
          <Progress
            value={Number(item?.late_rate || 0)}
            size='sm'
            borderRadius='full'
            bg='secondaryGray.100'
            sx={{
              '& > div': {
                background: `linear-gradient(90deg, ${tone} 0%, #6AD2FF 100%)`,
              },
            }}
          />
        </Box>
      )}

      {isAvailable && item?.metric_name === "Worker Retention Rate" && (
        <Box>
          <Flex justify='space-between' mb='6px'>
            <Text color={subTextColor} fontSize='xs' fontWeight='700' textTransform='uppercase'>
              Retention Rate
            </Text>
            <Text color={trendTone} fontSize='xs' fontWeight='700'>
              {item?.status}
            </Text>
          </Flex>
          <Progress
            value={Number(item?.retention_rate || 0)}
            size='sm'
            borderRadius='full'
            bg='secondaryGray.100'
            sx={{
              '& > div': {
                background: `linear-gradient(90deg, ${tone} 0%, #6AD2FF 100%)`,
              },
            }}
          />
        </Box>
      )}

      {isAvailable && item?.metric_name === "Total Hours Worked" && (
        <Box>
          <Flex justify='space-between' mb='6px'>
            <Text color={subTextColor} fontSize='xs' fontWeight='700' textTransform='uppercase'>
              Average per Worker
            </Text>
            <Text color={trendTone} fontSize='xs' fontWeight='700'>
              {item?.average_per_worker || 0} h
            </Text>
          </Flex>
          <Progress
            value={Math.min(100, Number(item?.average_per_worker || 0) * 5)}
            size='sm'
            borderRadius='full'
            bg='secondaryGray.100'
            sx={{
              '& > div': {
                background: `linear-gradient(90deg, ${tone} 0%, #6AD2FF 100%)`,
              },
            }}
          />
        </Box>
      )}
    </Box>
  );
}

export default function WorkforceShiftsSection({ dateFilter }) {
  const textColor = useColorModeValue("secondaryGray.900", "white");
  const subTextColor = useColorModeValue("secondaryGray.600", "whiteAlpha.700");
  const { searchTerm, selectedCategory } = useSearch();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);

  // Debounce 400ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const effectiveSearch = selectedCategory === 'workforce' ? debouncedSearch : '';

    const buildUrl = (endpoint) => {
      const params = new URLSearchParams();
      if (dateFilter?.start_date) params.append('start_date', dateFilter.start_date);
      if (dateFilter?.end_date) params.append('end_date', dateFilter.end_date);
      if (effectiveSearch) params.append('search', effectiveSearch);
      const queryString = params.toString();
      return `${apiBaseUrl}${endpoint}${queryString ? '?' + queryString : ''}`;
    };

    const fetchMetrics = async () => {
      try {
        const [activeWorkersRes, totalHoursRes, absenteeismRes, retentionRes] = await Promise.all([
          fetch(buildUrl('/api/kpi/workforce/active-workers')),
          fetch(buildUrl('/api/kpi/workforce/total-hours-worked')),
          fetch(buildUrl('/api/kpi/workforce/absenteeism-rate')),
          fetch(buildUrl('/api/kpi/workforce/retention-rate')),
        ]);

        const [activeWorkersData, totalHoursData, absenteeismData, retentionData] = await Promise.all([
          activeWorkersRes.json(),
          totalHoursRes.json(),
          absenteeismRes.json(),
          retentionRes.json(),
        ]);

        if (isMounted) {
          setItems([
            { ...activeWorkersData, title: 'Active Workers' },
            { ...totalHoursData, title: 'Total Hours Worked' },
            { ...absenteeismData, title: 'Absenteeism / Late Arrival Rate' },
            { ...retentionData, title: 'Worker Retention Rate' },
          ]);
        }
      } catch (error) {
        console.error('Error fetching workforce metrics:', error);
        if (isMounted) {
          setItems([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchMetrics();

    return () => {
      isMounted = false;
    };
  }, [dateFilter?.start_date, dateFilter?.end_date, debouncedSearch, selectedCategory]);

  return (
    <Card p='24px' align='start' direction='column' w='100%' overflow='hidden'>
      <Flex align='center' justify='space-between' gap='12px' w='100%' mb='18px' flexWrap='wrap'>
        <Box>
          <Text color={textColor} fontSize='2xl' fontWeight='800' lineHeight='100%'>
            Workforce & Shifts
          </Text>
          <Text color={subTextColor} fontSize='sm' fontWeight='500' mt='6px'>
            Monitor workforce attendance, hours worked, and worker retention metrics.
          </Text>
        </Box>
        <Tag size='sm' borderRadius='full' bg='brand.50' color='brand.500' fontWeight='700'>
          KPI Section
        </Tag>
      </Flex>

      {loading ? (
        <Flex h='340px' w='100%' align='center' justify='center'>
          <Spinner thickness='3px' speed='0.65s' color='brand.500' size='lg' />
        </Flex>
      ) : (
        <Grid templateColumns={{ base: '1fr', xl: 'repeat(12, 1fr)' }} gap='20px' w='100%'>
          <Box gridColumn={{ base: 'auto', xl: 'span 4' }}>
            <KPIStatCard item={{ ...items[0], title: 'Active Workers' }} tone='#4318FF' />
          </Box>
          <Box gridColumn={{ base: 'auto', xl: 'span 4' }}>
            <KPIStatCard item={{ ...items[1], title: 'Total Hours Worked' }} tone='#6AD2FF' />
          </Box>
          <Box gridColumn={{ base: 'auto', xl: 'span 4' }}>
            <KPIStatCard item={{ ...items[2], title: 'Absenteeism / Late Arrival Rate' }} tone='#F56565' />
          </Box>
          <Box gridColumn={{ base: 'auto', xl: 'span 12' }}>
            <KPIStatCard item={{ ...items[3], title: 'Worker Retention Rate' }} tone='#38B2AC' />
          </Box>
        </Grid>
      )}
    </Card>
  );
}