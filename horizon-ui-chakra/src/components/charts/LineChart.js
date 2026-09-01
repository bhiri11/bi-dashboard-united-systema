import React from "react";
import ReactApexChart from "react-apexcharts";

export default function LineChart(props) {
  return (
    <ReactApexChart
      options={props.chartOptions}
      series={props.chartData}
      type="line"
      width="100%"
      height="100%"
    />
  );
}