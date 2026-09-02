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
// eslint-disable-next-line no-unused-vars -- sera utilise dans la sous-etape 2b (rendu ligne adaptatif)
import LineChart from "components/charts/LineChart";
import { RiArrowUpSFill } from "react-icons/ri";

export default function DailyTraffic({ dateFilter, ...rest }) {
  const textColor = useColorModeValue("secondaryGray.900", "white");
  const subTextColor = useColorModeValue(
    "secondaryGray.600",
    "whiteAlpha.700"
  );

  const [loading, setLoading] = useState(true);
  const [activeUsers, setActiveUsers] = useState(0);
  const [growthRate, setGrowthRate] = useState(0);
  const [categories, setCategories] = useState([]);
  const [series, setSeries] = useState([]);
  // Total d'utilisateurs inscrits (ratio "sur X inscrits").
  // Non renvoyé par weekly-active-users : récupéré via /api/kpi/profile-completion.
  const [totalUsers, setTotalUsers] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const apiBaseUrl =
      process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

    // Total d'utilisateurs inscrits (indépendant du filtre de dates)
    fetch(`${apiBaseUrl}/api/kpi/profile-completion`)
      .then((response) => response.json())
      .then((data) => {
        if (isMounted) {
          setTotalUsers(Number(data?.total_users || 0));
        }
      })
      .catch(() => {
        if (isMounted) {
          setTotalUsers(0);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Label renvoyé par le backend pour la fenêtre par défaut
  // quand aucun filtre de dates global n'est actif.
  const [defaultPeriodLabel, setDefaultPeriodLabel] =
    useState("Last 7 days");

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
      `${apiBaseUrl}/api/kpi/weekly-active-users${
        queryString ? `?${queryString}` : ""
      }`
    )
      .then((response) => response.json())
      .then((data) => {
        if (!isMounted) {
          return;
        }

        setActiveUsers(Number(data?.active_users || 0));
        setGrowthRate(Number(data?.growth_rate || 0));
        setCategories(
          Array.isArray(data?.categories) ? data.categories : []
        );
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
  const hasCustomRange = Boolean(
    dateFilter?.start_date && dateFilter?.end_date
  );

  const periodLabel = hasCustomRange
    ? dateFilter?.label ||
      `${dateFilter.start_date} to ${dateFilter.end_date}`
    : defaultPeriodLabel;


  // ---- AGREGATION ADAPTIVE (daily -> bar/line/weekly) ----

  const chartModel = useMemo(() => {
    const originalCategories = Array.isArray(categories) ? categories : [];
    const originalTimeSeries = Array.isArray(series) ? series : [];

    // Helper: formate un label de jour (ex: "1 Aug") en "Week of 1 Aug".
    const formatWeekLabel = (rawLabel) => {
      if (!rawLabel) return "Week of ?";
      const trimmed = String(rawLabel).trim();
      if (/^week of /i.test(trimmed)) return trimmed;
      return "Week of " + trimmed;
    };

    const dayCount = originalCategories.length;

    // Periode courte : <= 7 jours -> barres, un label par jour.
    if (dayCount <= 7) {
      return {
        mode: "bar",
        categories: originalCategories,
        chartSeries: originalTimeSeries,
      };
    }

    // Periode moyenne : 8-31 jours -> ligne, tous les points conserves.
    if (dayCount <= 31) {
      const step = dayCount <= 15 ? 2 : 3;
      const labels = originalCategories.map((label, index) =>
        index % step === 0 ? label : ""
      );
      return {
        mode: "line",
        categories: labels,
        chartSeries: originalTimeSeries,
      };
    }

    // Periode longue : > 31 jours -> ligne, agregation par tranches de 7 jours.
    const weeklyCategories = [];
    for (let weekStart = 0; weekStart < dayCount; weekStart += 7) {
      weeklyCategories.push(formatWeekLabel(originalCategories[weekStart]));
    }

    const weeklySeries = originalTimeSeries.map((s) => {
      const data = Array.isArray(s?.data) ? s.data : [];
      const weeklyData = [];
      for (let weekStart = 0; weekStart < dayCount; weekStart += 7) {
        const weekEnd = Math.min(weekStart + 7, dayCount);
        let weekSum = 0;
        for (let i = weekStart; i < weekEnd; i++) {
          weekSum += Number(data[i] || 0);
        }
        weeklyData.push(weekSum);
      }
      return { name: s?.name, data: weeklyData };
    });

    return {
      mode: "line",
      categories: weeklyCategories,
      chartSeries: weeklySeries,
    };
  }, [categories, series]);

  const chartData = chartModel.chartSeries;
  // eslint-disable-next-line no-unused-vars -- sera utilise dans la sous-etape 2b (rendu barres/ligne)
  const isBarMode = chartModel.mode === "bar";
  // eslint-disable-next-line no-unused-vars -- sera utilise dans la sous-etape 2b (agregation hebdo)
  const isWeeklyMode = categories.length > 31;
  const chartOptions = useMemo(
    () => ({
      chart: {
        type: isBarMode ? "bar" : "line",
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
        categories: chartModel.categories,
        labels: {
          show: true,
          style: {
            colors: "#A3AED0",
            fontSize: "12px",
            fontWeight: "500",
          },
        },
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
      },
      yaxis: {
        show: false,
        labels: {
          show: false,
        },
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
          left: isBarMode ? 0 : 20,
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
              {
                offset: 0,
                color: "#4318FF",
                opacity: 1,
              },
              {
                offset: 100,
                color: "#6AD2FF",
                opacity: 0.85,
              },
            ],
          ],
        },
      },
      dataLabels: {
        enabled: false,
      },
      ...(isBarMode
        ? {
            plotOptions: {
              bar: {
                borderRadius: 8,
                columnWidth: "75%",
                distributed: false,
              },
            },
          }
        : {
            colors: ["#4318FF"],
            stroke: {
              curve: "smooth",
              width: 4,
            },
            markers: {
              size: 3,
              colors: ["#4318FF"],
              strokeColors: "#FFFFFF",
              strokeWidth: 2,
              hover: {
                size: 5,
              },
            },
          }),
      states: {
        hover: {
          filter: {
            type: "lighten",
            value: 0.15,
          },
        },
      },
    }),
    [isBarMode, chartModel]
  );

  return (
    <Card
      p="24px"
      align="start"
      direction="column"
      w="100%"
      {...rest}
    >
      <Flex
        align="center"
        justify="space-between"
        gap="12px"
        w="100%"
        mb="16px"
        flexWrap="wrap"
      >
        <Box>
          <Text
            color={textColor}
            fontSize="lg"
            fontWeight="700"
            lineHeight="100%"
          >
            Weekly Active Users
          </Text>

          <Text
            color={subTextColor}
            fontSize="xs"
            fontWeight="500"
            mt="4px"
          >
            Unique logins over the selected period
          </Text>
        </Box>

        <Flex
          align="center"
          gap="8px"
          flexWrap="wrap"
        >
          <Tag
            size="sm"
            borderRadius="full"
            bg="brand.50"
            color="brand.500"
            fontWeight="700"
          >
            KPI 3
          </Tag>
        </Flex>
      </Flex>

      <Flex
        justify="space-between"
        align="center"
        px="2px"
        mb="12px"
      >
        <Flex
          flexDirection="column"
          align="start"
        >
          <Flex
            align="baseline"
            gap="8px"
          >
            <Text
              color={textColor}
              fontSize="38px"
              fontWeight="700"
              lineHeight="100%"
            >
              {loading ? "--" : activeUsers}
            </Text>

            <Text
              color="secondaryGray.600"
              fontSize="sm"
              fontWeight="500"
            >
              users
            </Text>
          </Flex>

          {totalUsers > 0 && (
            <Text
              color='secondaryGray.600'
              fontSize='xs'
              fontWeight='500'
              mt='2px'>
              sur {totalUsers} inscrits
            </Text>
          )}

          <Text
            color={subTextColor}
            fontSize="xs"
            fontWeight="500"
            mt="4px"
          >
            {loading
              ? "Loading weekly activity..."
              : `Active during ${periodLabel.toLowerCase()}`}
          </Text>
        </Flex>

        <Flex
          align="center"
          gap="6px"
          px="12px"
          py="6px"
          borderRadius="full"
          bg={growthRate >= 0 ? "green.50" : "red.50"}
          color={growthRate >= 0 ? "green.500" : "red.500"}
        >
          <Icon as={RiArrowUpSFill} />

          <Text
            fontSize="sm"
            fontWeight="700"
          >
            {Math.abs(growthRate)}%
          </Text>
        </Flex>
      </Flex>

      {loading ? (
        <Flex
          h="240px"
          w="100%"
          align="center"
          justify="center"
        >
          <Spinner
            thickness="3px"
            speed="0.65s"
            color="brand.500"
            size="lg"
          />
        </Flex>
      ) : (
        <Box
          h="240px"
          mt="auto"
          mb="20px"
        >
          {isBarMode ? (
            <BarChart
              chartData={chartData}
              chartOptions={chartOptions}
            />
          ) : (
            <LineChart
              chartData={chartData}
              chartOptions={chartOptions}
            />
          )}
        </Box>
      )}
    </Card>
  );
}
