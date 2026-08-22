import React, { useEffect, useMemo, useState } from "react";

import {
  Box,
  Flex,
  Icon,
  Progress,
  Spinner,
  Select,
  Tag,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import Card from "components/card/Card.js";
import BarChart from "components/charts/BarChart";
import { RiArrowUpSFill } from "react-icons/ri";

export default function DailyTraffic(props) {
  const { ...rest } = props;

  const textColor = useColorModeValue("secondaryGray.900", "white");
  const subTextColor = useColorModeValue("secondaryGray.600", "whiteAlpha.700");
  const cardBg = useColorModeValue("white", "navy.700");
  const borderColor = useColorModeValue("secondaryGray.100", "whiteAlpha.100");
  const rowShadow = useColorModeValue(
    "0px 10px 25px rgba(112, 144, 176, 0.08)",
    "unset"
  );

  const [loading, setLoading] = useState(true);
  const [activeUsers, setActiveUsers] = useState(0);
  const [growthRate, setGrowthRate] = useState(0);
  const [categories, setCategories] = useState([]);
  const [series, setSeries] = useState([]);
  const [periodDays, setPeriodDays] = useState(7);
  const [periodLabel, setPeriodLabel] = useState("Last 7 days");

  const periodOptions = [7, 14, 28, 56];

  useEffect(() => {
    let isMounted = true;
    const apiBaseUrl =
      process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

    setLoading(true);

    fetch(`${apiBaseUrl}/api/kpi/weekly-active-users?days=${periodDays}`)
      .then((response) => response.json())
      .then((data) => {
        if (!isMounted) {
          return;
        }

        setActiveUsers(Number(data?.active_users || 0));
        setGrowthRate(Number(data?.growth_rate || 0));
        setCategories(Array.isArray(data?.categories) ? data.categories : []);
        setSeries(Array.isArray(data?.series) ? data.series : []);
        setPeriodDays(Number(data?.period_days || periodDays));
        setPeriodLabel(data?.period_label || `Last ${periodDays} days`);
      })
      .catch(() => {
        if (isMounted) {
          setActiveUsers(0);
          setGrowthRate(0);
          setCategories([]);
          setSeries([]);
          setPeriodLabel(`Last ${periodDays} days`);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [periodDays]);

  const chartData = useMemo(() => series, [series]);

  const chartOptions = useMemo(
    () => ({
      chart: {
        toolbar: {
          show: false,
        },
      },
      tooltip: {
        style: {
          fontSize: "12px",
          fontFamily: undefined,
        },
        theme: "dark",
      },
      xaxis: {
        categories,
        labels: {
          show: true,
          style: {
            colors: "#A3AED0",
            fontSize: "12px",
            fontWeight: "500",
          },
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        show: false,
        labels: { show: false },
      },
      grid: {
        borderColor: "rgba(163, 174, 208, 0.3)",
        show: true,
        strokeDashArray: 5,
      },
      fill: {
        type: "gradient",
        gradient: {
          type: "vertical",
          shadeIntensity: 1,
          opacityFrom: 0.7,
          opacityTo: 0.9,
          colorStops: [
            [
              { offset: 0, color: "#4318FF", opacity: 1 },
              { offset: 100, color: "rgba(67, 24, 255, 1)", opacity: 0.28 },
            ],
          ],
        },
      },
      dataLabels: { enabled: false },
      plotOptions: {
        bar: {
          borderRadius: 10,
          columnWidth: "40px",
        },
      },
    }),
    [categories]
  );

  const maxApplications = useMemo(() => {
    if (!series.length || !series[0]?.data?.length) {
      return 0;
    }

    return Math.max(...series[0].data.map((value) => Number(value || 0)));
  }, [series]);

  const bars = series[0]?.data || [];

  return (
    <Card p='20px' align='start' direction='column' w='100%' {...rest}>
      <Flex align='center' justify='space-between' gap='12px' w='100%' mb='14px' flexWrap='wrap'>
        <Box>
          <Text color={textColor} fontSize='xl' fontWeight='700' lineHeight='100%'>
            Weekly Active Users
          </Text>
          <Text color={subTextColor} fontSize='sm' fontWeight='500' mt='6px'>
            Based on users.last_login over the selected period
          </Text>
        </Box>
        <Flex align='center' gap='8px' flexWrap='wrap'>
          <Select
            size='sm'
            w='fit-content'
            minW='150px'
            variant='filled'
            bg='secondaryGray.50'
            border='0'
            value={periodDays}
            onChange={(event) => setPeriodDays(Number(event.target.value))}>
            {periodOptions.map((value) => (
              <option key={value} value={value}>
                Last {value} days
              </option>
            ))}
          </Select>
          <Tag size='sm' borderRadius='full' bg='brand.50' color='brand.500' fontWeight='700'>
            KPI 3
          </Tag>
        </Flex>
      </Flex>

      <Flex justify='space-between' align='start' px='2px' mb='8px'>
        <Flex flexDirection='column' align='start' me='20px'>
          <Flex align='end'>
            <Text color={textColor} fontSize='34px' fontWeight='700' lineHeight='100%'>
              {loading ? "--" : activeUsers}
            </Text>
            <Text ms='6px' color='secondaryGray.600' fontSize='sm' fontWeight='500'>
              active this week
            </Text>
          </Flex>
          <Text color={subTextColor} fontSize='xs' fontWeight='500' mt='4px'>
            {loading ? "Loading weekly activity..." : `Unique users active during ${periodLabel.toLowerCase()}`}
          </Text>
        </Flex>
        <Flex align='center'>
          <Icon as={RiArrowUpSFill} color='green.500' />
          <Text color='green.500' fontSize='sm' fontWeight='700'>
            {growthRate >= 0 ? `+${growthRate}%` : `${growthRate}%`}
          </Text>
        </Flex>
      </Flex>

      {loading ? (
        <Flex h='240px' w='100%' align='center' justify='center'>
          <Spinner thickness='3px' speed='0.65s' color='brand.500' size='lg' />
        </Flex>
      ) : (
        <Box h='240px' mt='auto'>
          <BarChart chartData={chartData} chartOptions={chartOptions} />
        </Box>
      )}

      <Flex
        w='100%'
        mt='16px'
        pt='14px'
        borderTop='1px solid'
        borderColor={borderColor}
        justify='space-between'
        align='center'>
        <Box>
          <Text color={subTextColor} fontSize='xs' fontWeight='700' textTransform='uppercase' letterSpacing='0.08em'>
            Selected period
          </Text>
          <Text color={textColor} fontSize='sm' fontWeight='700' mt='3px'>
            Daily activity distribution for {periodLabel.toLowerCase()}
          </Text>
        </Box>
        <Text color={textColor} fontSize='lg' fontWeight='700'>
          {maxApplications}
        </Text>
      </Flex>

      <Flex direction='column' w='100%' gap='12px' mt='16px'>
        {categories.map((day, index) => {
          const dayValue = Number(bars[index] || 0);
          const progressValue = maxApplications ? (dayValue / maxApplications) * 100 : 0;

          return (
            <Box
              key={`${day}-${index}`}
              p='12px'
              borderRadius='18px'
              border='1px solid'
              borderColor={borderColor}
              bg={cardBg}
              boxShadow={rowShadow}>
              <Flex justify='space-between' align='center' mb='8px'>
                <Text color={textColor} fontSize='sm' fontWeight='700'>
                  {day}
                </Text>
                <Text color={textColor} fontSize='sm' fontWeight='700'>
                  {dayValue}
                </Text>
              </Flex>
              <Progress
                value={progressValue}
                size='sm'
                borderRadius='full'
                bg='secondaryGray.100'
                sx={{
                  '& > div': {
                    background: 'linear-gradient(90deg, #4318FF 0%, #6AD2FF 100%)',
                  },
                }}
              />
            </Box>
          );
        })}
      </Flex>
    </Card>
  );
}
