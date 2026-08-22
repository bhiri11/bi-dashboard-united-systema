// Chakra imports
import { Box, SimpleGrid, Text, useColorModeValue } from "@chakra-ui/react";
import React from "react";

import PieCard from "views/admin/default/components/PieCard";
import WeeklyRevenue from "views/admin/default/components/WeeklyRevenue";
import DailyTraffic from "views/admin/default/components/DailyTraffic";
import NationalityChart from "views/admin/default/components/NationalityChart";
import RecruitmentApplicationsSection from "views/admin/default/components/RecruitmentApplicationsSection";

export default function UserReports() {
  const textColor = useColorModeValue("secondaryGray.900", "white");
  const subTextColor = useColorModeValue("secondaryGray.600", "whiteAlpha.700");

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

      <Box mb='20px'>
        <RecruitmentApplicationsSection />
      </Box>

      <SimpleGrid columns={{ base: 1, xl: 2 }} gap='20px' mb='20px'>
        <PieCard />
        <WeeklyRevenue />
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, xl: 2 }} gap='20px'>
        <DailyTraffic />
        <NationalityChart />
      </SimpleGrid>
    </Box>
  );
}