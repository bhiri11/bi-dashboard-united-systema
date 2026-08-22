// Chakra imports
import { Box, SimpleGrid, Text, useColorModeValue } from "@chakra-ui/react";
import React, { useState, useCallback } from "react";

import PieCard from "views/admin/default/components/PieCard";
import WeeklyRevenue from "views/admin/default/components/WeeklyRevenue";
import DailyTraffic from "views/admin/default/components/DailyTraffic";
import NationalityChart from "views/admin/default/components/NationalityChart";
import RecruitmentApplicationsSection from "views/admin/default/components/RecruitmentApplicationsSection";
import WorkforceShiftsSection from "views/admin/default/components/WorkforceShiftsSection";
import FinancialSection from "views/admin/default/components/FinancialSection";
import PerformanceProductivitySection from "views/admin/default/components/PerformanceProductivitySection";
import TrendsSection from "views/admin/default/components/TrendsSection";
import DateRangeFilter from "views/admin/default/components/DateRangeFilter";
import { useSearch } from "contexts/SearchContext";

export default function UserReports() {
  const textColor = useColorModeValue("secondaryGray.900", "white");
  const subTextColor = useColorModeValue("secondaryGray.600", "whiteAlpha.700");
  const { searchTerm, selectedCategory } = useSearch();
  const [dateFilter, setDateFilter] = useState({
    start_date: "",
    end_date: "",
    period: "7d",
    label: "Last 7 days"
  });

  const handleFilterChange = useCallback((filterData) => {
    setDateFilter(filterData);
  }, []);

  return (
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
      <Box mb='24px'>
        <Text color={textColor} fontSize='2xl' fontWeight='700'>
          KPI Dashboard
        </Text>
        <Text color={subTextColor} fontSize='sm' mt='6px'>
          A focused view of the main operational indicators.
        </Text>
      </Box>

      <DateRangeFilter onFilterChange={handleFilterChange} defaultPeriod="7d" />

      {(selectedCategory === "" || selectedCategory === "recruitment") && (
        <Box mb='20px'>
          <RecruitmentApplicationsSection dateFilter={dateFilter} searchTerm={searchTerm} />
        </Box>
      )}

      {(selectedCategory === "" || selectedCategory === "workforce") && (
        <Box mb='20px'>
          <WorkforceShiftsSection dateFilter={dateFilter} searchTerm={searchTerm} />
        </Box>
      )}

      {(selectedCategory === "" || selectedCategory === "financial") && (
        <Box mb='20px'>
          <FinancialSection dateFilter={dateFilter} searchTerm={searchTerm} />
        </Box>
      )}

      {(selectedCategory === "" || selectedCategory === "performance") && (
        <Box mb='20px'>
          <PerformanceProductivitySection dateFilter={dateFilter} searchTerm={searchTerm} />
        </Box>
      )}

      {(selectedCategory === "" || selectedCategory === "trends") && (
        <Box mb='20px'>
          <TrendsSection dateFilter={dateFilter} searchTerm={searchTerm} />
        </Box>
      )}

      <SimpleGrid columns={{ base: 1, xl: 2 }} gap='20px' mb='20px'>
        <PieCard />
        <WeeklyRevenue />
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, xl: 2 }} gap='20px'>
        <DailyTraffic dateFilter={dateFilter} />
        <NationalityChart />
      </SimpleGrid>
    </Box>
  );
}