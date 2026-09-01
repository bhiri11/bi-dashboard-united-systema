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
    ? item?.metric_name === "Overdue Projects"
      ? `${Number(item?.overdue_count || 0)} projects`
      : item?.metric_name === "Average Project Duration"
        ? `${Number(item?.average_days || 0)} days`
      : item?.metric_name === "Overdue Tasks"
        ? `${Number(item?.overdue_count || 0)} tasks`
      : item?.metric_name === "Average Worker Rating"
        ? `${Number(item?.average_rating || 0).toFixed(1)} stars`
      : `${Number(item?.value || 0).toFixed(1)}`
    : "Unavailable";

  const details = isAvailable
    ? item?.metric_name === "Overdue Projects"
      ? `${item?.overdue_rate || 0}% of active projects overdue`
      : item?.metric_name === "Average Project Duration"
        ? `Based on ${item?.completed_projects_count || 0} completed projects`
      : item?.metric_name === "Overdue Tasks"
        ? `${item?.overdue_rate || 0}% of pending tasks overdue`
      : item?.metric_name === "Average Worker Rating"
        ? `From ${item?.total_ratings || 0} ratings across ${item?.rated_workers || 0} workers`
      : item?.details || ''
    : `Missing: ${(item?.required_fields || []).join(', ')}`;

  const trendTone = isAvailable
    ? item?.metric_name === "Overdue Projects"
      ? Number(item?.overdue_rate || 0) < 10 ? 'green.500' : Number(item?.overdue_rate || 0) < 30 ? 'orange.500' : 'red.500'
      : item?.metric_name === "Overdue Tasks"
        ? Number(item?.overdue_rate || 0) < 10 ? 'green.500' : Number(item?.overdue_rate || 0) < 30 ? 'orange.500' : 'red.500'
      : item?.metric_name === "Average Worker Rating"
        ? Number(item?.average_rating || 0) >= 4.0 ? 'green.500' : Number(item?.average_rating || 0) >= 3.0 ? 'blue.500' : 'orange.500'
      : 'green.500'
    : 'gray.500';

  const trendIcon = isAvailable
    ? item?.metric_name === "Overdue Projects"
      ? Number(item?.overdue_rate || 0) < 10 ? '↓' : Number(item?.overdue_rate || 0) < 30 ? '→' : '↑'
      : item?.metric_name === "Overdue Tasks"
        ? Number(item?.overdue_rate || 0) < 10 ? '↓' : Number(item?.overdue_rate || 0) < 30 ? '→' : '↑'
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
            Performance KPI
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

      {isAvailable && item?.metric_name === "Overdue Projects" && (
        <Box>
          <Flex justify='space-between' mb='6px'>
            <Text color={subTextColor} fontSize='xs' fontWeight='700' textTransform='uppercase'>
              Overdue Rate
            </Text>
            <Text color={trendTone} fontSize='xs' fontWeight='700'>
              {item?.overdue_rate || 0}%
            </Text>
          </Flex>
          <Progress
            value={Number(item?.overdue_rate || 0)}
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

      {isAvailable && item?.metric_name === "Overdue Tasks" && (
        <Box>
          <Flex justify='space-between' mb='6px'>
            <Text color={subTextColor} fontSize='xs' fontWeight='700' textTransform='uppercase'>
              Overdue Rate
            </Text>
            <Text color={trendTone} fontSize='xs' fontWeight='700'>
              {item?.overdue_rate || 0}%
            </Text>
          </Flex>
          <Progress
            value={Number(item?.overdue_rate || 0)}
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

      {isAvailable && item?.metric_name === "Average Worker Rating" && (
        <Box>
          <Flex justify='space-between' mb='6px'>
            <Text color={subTextColor} fontSize='xs' fontWeight='700' textTransform='uppercase'>
              Rating Score
            </Text>
            <Text color={trendTone} fontSize='xs' fontWeight='700'>
              {item?.average_rating || 0}/5
            </Text>
          </Flex>
          <Progress
            value={Number(item?.average_rating || 0) * 20}
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

export default function PerformanceProductivitySection({ dateFilter }) {
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

    const effectiveSearch = selectedCategory === 'performance' ? debouncedSearch : '';

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
        const [overdueProjectsRes, avgDurationRes, overdueTasksRes, avgRatingRes] = await Promise.all([
          fetch(buildUrl('/api/kpi/performance/overdue-projects')),
          fetch(buildUrl('/api/kpi/performance/average-project-duration')),
          fetch(buildUrl('/api/kpi/performance/overdue-tasks')),
          fetch(buildUrl('/api/kpi/performance/average-worker-rating')),
        ]);

        const [overdueProjectsData, avgDurationData, overdueTasksData, avgRatingData] = await Promise.all([
          overdueProjectsRes.json(),
          avgDurationRes.json(),
          overdueTasksRes.json(),
          avgRatingRes.json(),
        ]);

        if (isMounted) {
          setItems([
            { ...overdueProjectsData, title: 'Overdue Projects' },
            { ...avgDurationData, title: 'Average Project Duration' },
            { ...overdueTasksData, title: 'Overdue Tasks' },
            { ...avgRatingData, title: 'Average Worker Rating' },
          ]);
        }
      } catch (error) {
        console.error('Error fetching performance metrics:', error);
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
            Performance & Productivity
          </Text>
          <Text color={subTextColor} fontSize='sm' fontWeight='500' mt='6px'>
            Track project deadlines, task completion, and worker performance metrics.
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
            <KPIStatCard item={{ ...items[0], title: 'Overdue Projects' }} tone='#F56565' />
          </Box>
          <Box gridColumn={{ base: 'auto', xl: 'span 4' }}>
            <KPIStatCard item={{ ...items[1], title: 'Average Project Duration' }} tone='#6AD2FF' />
          </Box>
          <Box gridColumn={{ base: 'auto', xl: 'span 4' }}>
            <KPIStatCard item={{ ...items[2], title: 'Overdue Tasks' }} tone='#F56565' />
          </Box>
          <Box gridColumn={{ base: 'auto', xl: 'span 12' }}>
            <KPIStatCard item={{ ...items[3], title: 'Average Worker Rating' }} tone='#38B2AC' />
          </Box>
        </Grid>
      )}
    </Card>
  );
}