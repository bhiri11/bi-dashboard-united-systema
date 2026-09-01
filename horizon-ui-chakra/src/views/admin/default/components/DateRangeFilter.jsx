// Chakra imports
import {
  Box,
  Flex,
  Text,
  useColorModeValue,
  Input,
  Button,
  HStack,
  Icon,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
} from "@chakra-ui/react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
// Horizon UI theme overrides – must be loaded AFTER the base Calendar.css
import "./DateRangeFilter.css";
import { FiCalendar } from "react-icons/fi";
import React, { useState, useEffect } from "react";

// Helper: format a Date to YYYY-MM-DD in LOCAL timezone (avoids UTC off-by-one shift)
const toLocalDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Helper: parse an "YYYY-MM-DD" string as a LOCAL date to avoid timezone shift
const parseLocalDate = (dateString) => {
  if (!dateString) return null;
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
};

export default function DateRangeFilter({ onFilterChange }) {
  const textColor = useColorModeValue("secondaryGray.900", "white");
  const subTextColor = useColorModeValue("secondaryGray.600", "whiteAlpha.700");
  const inputBg = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isStartCalendarOpen, setIsStartCalendarOpen] = useState(false);
  const [isEndCalendarOpen, setIsEndCalendarOpen] = useState(false);

  // On mount, notify the parent with empty dates so the dashboard starts in
  // "All time" mode (no start_date/end_date query params sent).
  useEffect(() => {
    if (onFilterChange) {
      onFilterChange({
        start_date: "",
        end_date: "",
        period: "all",
        label: "All time",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = (start, end, period, label) => {
    if (onFilterChange) {
      onFilterChange({
        start_date: start,
        end_date: end,
        period: period,
        label: label,
      });
    }
  };

  const handleCustomDateChange = () => {
    if (startDate && endDate) {
      handleFilterChange(
        startDate,
        endDate,
        "custom",
        `${formatDate(startDate)} - ${formatDate(endDate)}`
      );
    }
  };

  const resetFilter = () => {
    setStartDate("");
    setEndDate("");
    handleFilterChange("", "", "all", "All time");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = parseLocalDate(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleStartDateSelect = (date) => {
    const formattedDate = toLocalDateString(date);
    setStartDate(formattedDate);
    setIsStartCalendarOpen(false);
    if (endDate && formattedDate > endDate) {
      setEndDate(formattedDate);
    }
  };

  const handleEndDateSelect = (date) => {
    const formattedDate = toLocalDateString(date);
    setEndDate(formattedDate);
    setIsEndCalendarOpen(false);
  };

  return (
    <Box
      bg={useColorModeValue("white", "gray.800")}
      p={5}
      borderRadius="xl"
      border="1px solid"
      borderColor={borderColor}
      mb="20px"
      boxShadow="sm"
    >
      <Flex
        direction={{ base: "column", md: "row" }}
        align={{ base: "stretch", md: "center" }}
        justify="space-between"
        gap={4}
      >
        <Box>
          <Text color={textColor} fontSize="lg" fontWeight="700" mb={1}>
            Date Range Filter
          </Text>
          <Text color={subTextColor} fontSize="sm">
            Select a start and end date to filter dashboard data
          </Text>
        </Box>

        <HStack spacing={3}>
          <Popover
            placement="bottom-start"
            isOpen={isStartCalendarOpen}
            onClose={() => setIsStartCalendarOpen(false)}
          >
            <PopoverTrigger>
              <Box position="relative" onClick={() => setIsStartCalendarOpen(true)}>
                <Input
                  size="md"
                  bg={inputBg}
                  border="1px solid"
                  borderColor={borderColor}
                  value={formatDate(startDate)}
                  placeholder="Start date"
                  cursor="pointer"
                  readOnly
                  _hover={{ borderColor: "blue.400" }}
                  _focus={{
                    borderColor: "blue.500",
                    boxShadow: "0 0 0 1px #3182CE",
                  }}
                  width="180px"
                />
                <Icon
                  as={FiCalendar}
                  position="absolute"
                  right="3"
                  top="50%"
                  transform="translateY(-50%)"
                  color="gray.400"
                  pointerEvents="none"
                />
              </Box>
            </PopoverTrigger>
            <PopoverContent
              p={0}
              bg={useColorModeValue("white", "navy.800")}
              border="1px solid"
              borderColor={borderColor}
              boxShadow="lg"
              borderRadius="xl"
              overflow="hidden"
              w="332px"
              maxW={{ base: "calc(100vw - 32px)", sm: "332px" }}
            >
              <PopoverBody p={4}>
                <Calendar
                  className="drf-calendar"
                  value={startDate ? parseLocalDate(startDate) : undefined}
                  onChange={handleStartDateSelect}
                />
              </PopoverBody>
            </PopoverContent>
          </Popover>

          <Text color={subTextColor} fontWeight="500">
            to
          </Text>

          <Popover
            placement="bottom-start"
            isOpen={isEndCalendarOpen}
            onClose={() => setIsEndCalendarOpen(false)}
          >
            <PopoverTrigger>
              <Box position="relative" onClick={() => setIsEndCalendarOpen(true)}>
                <Input
                  size="md"
                  bg={inputBg}
                  border="1px solid"
                  borderColor={borderColor}
                  value={formatDate(endDate)}
                  placeholder="End date"
                  cursor="pointer"
                  readOnly
                  _hover={{ borderColor: "blue.400" }}
                  _focus={{
                    borderColor: "blue.500",
                    boxShadow: "0 0 0 1px #3182CE",
                  }}
                  width="180px"
                />
                <Icon
                  as={FiCalendar}
                  position="absolute"
                  right="3"
                  top="50%"
                  transform="translateY(-50%)"
                  color="gray.400"
                  pointerEvents="none"
                />
              </Box>
            </PopoverTrigger>
            <PopoverContent
              p={0}
              bg={useColorModeValue("white", "navy.800")}
              border="1px solid"
              borderColor={borderColor}
              boxShadow="lg"
              borderRadius="xl"
              overflow="hidden"
              w="332px"
              maxW={{ base: "calc(100vw - 32px)", sm: "332px" }}
            >
              <PopoverBody p={4}>
                <Calendar
                  className="drf-calendar"
                  value={endDate ? parseLocalDate(endDate) : undefined}
                  onChange={handleEndDateSelect}
                />
              </PopoverBody>
            </PopoverContent>
          </Popover>

          <Button
            size="md"
            colorScheme="blue"
            onClick={handleCustomDateChange}
            isDisabled={!startDate || !endDate}
            borderRadius="md"
            fontWeight="600"
            px={6}
          >
            Apply
          </Button>
          <Button
            size="md"
            variant="ghost"
            onClick={resetFilter}
            borderRadius="md"
            fontWeight="600"
          >
            Reset
          </Button>
        </HStack>
      </Flex>
    </Box>
  );
}
