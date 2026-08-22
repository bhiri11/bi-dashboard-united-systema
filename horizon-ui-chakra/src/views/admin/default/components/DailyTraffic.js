import React, { useEffect, useMemo, useState } from "react";

import {
  Box,
  Flex,
  Icon,
  Spinner,
  Tag,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import Card from "components/card/Card.js";
import BarChart from "components/charts/BarChart";
import { RiArrowUpSFill } from "react-icons/ri";

export default function DailyTraffic({ dateFilter, ...rest }) {

  const textColor = useColorModeValue("secondaryGray.900", "white");
  const subTextColor = useColorModeValue("secondaryGray.600", "whiteAlpha.700");

  const [loading, setLoading] = useState(true);
  const [activeUsers, setActiveUsers] = useState(0);
  const [growthRate, setGrowthRate] = useState(0);
  const [categories, setCategories] = useState([]);
  const [series, setSeries] = useState([]);
  // Label renvoyé par le backend pour la fenêtre par défaut (ex: "Last 7 days")
  // quand aucun filtre de dates global n'est actif.
  const [defaultPeriodLabel, setDefaultPeriodLabel] = useState("Last 7 days");

  useEffect(() => {
    let isMounted = true;
    const apiBaseUrl =
      process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

    const params = new URLSearchParams();
    if (dateFilter?.start_date && dateFilter?.end_date) {
      params.append("start_date", dateFilter.start_date);
      params.append("end_date", dateFilter.end_date);
    }
    const queryString = params.toString();

    setLoading(true);

    fetch(
      `${apiBaseUrl}/api/kpi/weekly-active-users${queryString ? `?${queryString}` : ""}`
    )
      .then((response) => response.json())
      .then((data) => {
        if (!isMounted) {
          return;
        }

        setActiveUsers(Number(data?.active_users || 0));
        setGrowthRate(Number(data?.growth_rate || 0));
        setCategories(Array.isArray(data?.categories) ? data.categories : []);
        setSeries(Array.isArray(data?.series) ? data.series : []);
        setDefaultPeriodLabel(data?.period_label || "Last 7 days");
      })
      .catch(() => {
        if (isMounted) {
          setActiveUsers(0);
          setGrowthRate(0);
          setCategories([]);
          setSeries([]);
          setDefaultPeriodLabel("Last 7 days");
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
  }, [dateFilter?.start_date, dateFilter?.end_date]);

  // Sous-titre dynamique : plage réelle sélectionnée via le filtre global,
  // sinon le label de la fenêtre par défaut renvoyé par le backend.
  const hasCustomRange = Boolean(dateFilter?.start_date && dateFilter?.end_date);
  const periodLabel = hasCustomRange
    ? dateFilter?.label ||
      `${dateFilter.start_date} to ${dateFilter.end_date}`
    : defaultPeriodLabel;

  const chartData = useMemo(() => series, [series]);

  const chartOptions = useMemo(
    () => ({
      chart: {
        type: "bar",
        toolbar: {
          show: false,
        },
        animations: {
          enabled: true,
          easing: "easeinout",
          speed: 800,
          animateGradually: {
            enabled: true,
            delay: 150,
          },
          dynamicAnimation: {
            enabled: true,
            speed: 350,
          },
        },
      },
      tooltip: {
        enabled: true,
        theme: "dark",
        style: {
          fontSize: "12px",
          fontFamily: undefined,
        },
        x: {
          formatter: function (val) {
            return val;
          },
        },
        y: {
          formatter: function (val) {
            return val + " users";
          },
        },
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
        borderColor: "rgba(163, 174, 208, 0.18)",
        show: true,
        strokeDashArray: 5,
        xaxis: {
          lines: {
            show: false,
          },
        },
        yaxis: {
          lines: {
            show: true,
          },
        },
        padding: {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
        },
      },
      fill: {
        type: "gradient",
        gradient: {
          type: "vertical",
          shadeIntensity: 1,
          opacityFrom: 0.85,
          opacityTo: 0.55,
          colorStops: [
            [
              { offset: 0, color: "#4318FF", opacity: 1 },
              { offset: 100, color: "#6AD2FF", opacity: 0.85 },
            ],
          ],
        },
      },
      dataLabels: { enabled: false },
      plotOptions: {
        bar: {
          borderRadius: 8,
          columnWidth: "55%",
          distributed: false,
        },
      },
      states: {
        hover: {
          filter: {
            type: "lighten",
            value: 0.15,
          },
        },
      },
    }),
    [categories]
  );

  return (
    <Card p='24px' align='start' direction='column' w='100%' {...rest}>
      <Flex align='center' justify='space-between' gap='12px' w='100%' mb='16px' flexWrap='wrap'>
        <Box>
          <Text color={textColor} fontSize='lg' fontWeight='700' lineHeight='100%'>
            Weekly Active Users
          </Text>
          <Text color={subTextColor} fontSize='xs' fontWeight='500' mt='4px'>
            Unique logins over the selected period
          </Text>
        </Box>
        <Flex align='center' gap='8px' flexWrap='wrap'>
          <Tag size='sm' borderRadius='full' bg='brand.50' color='brand.500' fontWeight='700'>
            KPI 3
          </Tag>
        </Flex>
      </Flex>

      <Flex justify='space-between' align='center' px='2px' mb='12px'>
        <Flex flexDirection='column' align='start'>
          <Flex align='baseline' gap='8px'>
            <Text color={textColor} fontSize='38px' fontWeight='700' lineHeight='100%'>
              {loading ? "--" : activeUsers}
            </Text>
            <Text color='secondaryGray.600' fontSize='sm' fontWeight='500'>
              users
            </Text>
          </Flex>
          <Text color={subTextColor} fontSize='xs' fontWeight='500' mt='4px'>
            {loading ? "Loading weekly activity..." : `Active during ${periodLabel.toLowerCase()}`}
          </Text>
        </Flex>
        <Flex
          align='center'
          gap='6px'
          px='12px'
          py='6px'
          borderRadius='full'
          bg={growthRate >= 0 ? 'green.50' : 'red.50'}
          color={growthRate >= 0 ? 'green.500' : 'red.500'}>
          <Icon as={RiArrowUpSFill} />
          <Text fontSize='sm' fontWeight='700'>
            {Math.abs(growthRate)}%
          </Text>
        </Flex>
      </Flex>

      {loading ? (
        <Flex h='240px' w='100%' align='center' justify='center'>
          <Spinner thickness='3px' speed='0.65s' color='brand.500' size='lg' />
        </Flex>
      ) : (
        <Box h='240px' mt='auto' mb='20px'>
          <BarChart chartData={chartData} chartOptions={chartOptions} />
        </Box>
      )}

    </Card>
  );
}
