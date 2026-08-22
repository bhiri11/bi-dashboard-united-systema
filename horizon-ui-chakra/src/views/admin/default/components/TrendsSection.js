import React, { useEffect, useMemo, useState } from "react";

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
    ? item?.metric_name === "New Applications Trend"
      ? `${Number(item?.growth_rate || 0) > 0 ? '+' : ''}${Number(item?.growth_rate || 0).toFixed(1)}%`
      : item?.metric_name === "Projects Created Trend"
        ? `${Number(item?.growth_rate || 0) > 0 ? '+' : ''}${Number(item?.growth_rate || 0).toFixed(1)}%`
      : item?.metric_name === "Penalties Issued"
        ? `${Number(item?.total_penalties || 0)} penalties`
      : `${Number(item?.value || 0).toFixed(1)}`
    : "Unavailable";

  const details = isAvailable
    ? item?.metric_name === "New Applications Trend"
      ? `This week: ${item?.this_week_count || 0} vs Last week: ${item?.last_week_count || 0}`
      : item?.metric_name === "Projects Created Trend"
        ? `This month: ${item?.this_month_count || 0} vs Last month: ${item?.last_month_count || 0}`
      : item?.metric_name === "Penalties Issued"
        ? `${item?.this_month_penalties || 0} this month, Total: ${item?.total_amount || 0}`
      : item?.details || ''
    : `Missing: ${(item?.required_fields || []).join(', ')}`;

  const trendTone = isAvailable
    ? item?.metric_name === "New Applications Trend"
      ? Number(item?.growth_rate || 0) >= 0 ? 'green.500' : 'red.500'
      : item?.metric_name === "Projects Created Trend"
        ? Number(item?.growth_rate || 0) >= 0 ? 'green.500' : 'red.500'
      : item?.metric_name === "Penalties Issued"
        ? Number(item?.total_penalties || 0) === 0 ? 'green.500' : Number(item?.total_penalties || 0) < 5 ? 'blue.500' : 'orange.500'
      : 'green.500'
    : 'gray.500';

  const trendIcon = isAvailable
    ? item?.metric_name === "New Applications Trend"
      ? Number(item?.growth_rate || 0) >= 0 ? '↑' : '↓'
      : item?.metric_name === "Projects Created Trend"
        ? Number(item?.growth_rate || 0) >= 0 ? '↑' : '↓'
      : '→'
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
            Trend KPI
          </Text>
          <Text color={textColor} fontSize='lg' fontWeight='800' lineHeight='1.15' mt='6px'>
            {item?.metric_name}
          </Text>
          <Text color={subTextColor} fontSize='sm' mt='6px'>
            {item?.period || 'All time'}
          </Text>
        </Box>
        <Tag size='sm' borderRadius='full' bg='brand.50' color='brand.500' fontWeight='700'>
          Trend
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

      {isAvailable && item?.metric_name === "New Applications Trend" && (
        <Box>
          <Flex justify='space-between' mb='6px'>
            <Text color={subTextColor} fontSize='xs' fontWeight='700' textTransform='uppercase'>
              Growth Rate
            </Text>
            <Text color={trendTone} fontSize='xs' fontWeight='700'>
              {item?.growth_rate || 0}%
            </Text>
          </Flex>
          <Progress
            value={Math.min(100, Math.abs(Number(item?.growth_rate || 0)))}
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

      {isAvailable && item?.metric_name === "Projects Created Trend" && (
        <Box>
          <Flex justify='space-between' mb='6px'>
            <Text color={subTextColor} fontSize='xs' fontWeight='700' textTransform='uppercase'>
              Growth Rate
            </Text>
            <Text color={trendTone} fontSize='xs' fontWeight='700'>
              {item?.growth_rate || 0}%
            </Text>
          </Flex>
          <Progress
            value={Math.min(100, Math.abs(Number(item?.growth_rate || 0)))}
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

      {isAvailable && item?.metric_name === "Penalties Issued" && (
        <Box>
          <Flex justify='space-between' mb='6px'>
            <Text color={subTextColor} fontSize='xs' fontWeight='700' textTransform='uppercase'>
              This Month
            </Text>
            <Text color={trendTone} fontSize='xs' fontWeight='700'>
              {item?.this_month_penalties || 0} penalties
            </Text>
          </Flex>
          <Progress
            value={Math.min(100, Number(item?.this_month_penalties || 0) * 5)}
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

export default function TrendsSection({ dateFilter }) {
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

    const effectiveSearch = selectedCategory === 'trends' ? debouncedSearch : '';

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
        const [newAppsRes, projectsCreatedRes, penaltiesRes] = await Promise.all([
          fetch(buildUrl('/api/kpi/trends/new-applications')),
          fetch(buildUrl('/api/kpi/trends/projects-created')),
          fetch(buildUrl('/api/kpi/trends/penalties-issued')),
        ]);

        const [newAppsData, projectsCreatedData, penaltiesData] = await Promise.all([
          newAppsRes.json(),
          projectsCreatedRes.json(),
          penaltiesRes.json(),
        ]);

        if (isMounted) {
          setItems([
            { ...newAppsData, title: 'New Applications Trend' },
            { ...projectsCreatedData, title: 'Projects Created Trend' },
            { ...penaltiesData, title: 'Penalties Issued' },
          ]);
        }
      } catch (error) {
        console.error('Error fetching trends metrics:', error);
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
            Trends
          </Text>
          <Text color={subTextColor} fontSize='sm' fontWeight='500' mt='6px'>
            Track growth trends and key performance indicators over time.
          </Text>
        </Box>
        <Tag size='sm' borderRadius='full' bg='brand.50' color='brand.500' fontWeight='700'>
          Trend Section
        </Tag>
      </Flex>

      {loading ? (
        <Flex h='340px' w='100%' align='center' justify='center'>
          <Spinner thickness='3px' speed='0.65s' color='brand.500' size='lg' />
        </Flex>
      ) : (
        <Grid templateColumns={{ base: '1fr', xl: 'repeat(12, 1fr)' }} gap='20px' w='100%'>
          <Box gridColumn={{ base: 'auto', xl: 'span 4' }}>
            <KPIStatCard item={{ ...items[0], title: 'New Applications Trend' }} tone='#4318FF' />
          </Box>
          <Box gridColumn={{ base: 'auto', xl: 'span 4' }}>
            <KPIStatCard item={{ ...items[1], title: 'Projects Created Trend' }} tone='#6AD2FF' />
          </Box>
          <Box gridColumn={{ base: 'auto', xl: 'span 4' }}>
            <KPIStatCard item={{ ...items[2], title: 'Penalties Issued' }} tone='#F56565' />
          </Box>
        </Grid>
      )}
    </Card>
  );
}