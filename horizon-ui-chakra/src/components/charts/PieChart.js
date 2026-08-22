import React from "react";
import ReactApexChart from "react-apexcharts";

class PieChart extends React.Component {
  render() {
    return (
      <ReactApexChart
        options={this.props.chartOptions}
        series={this.props.chartData}
        type='pie'
        width='100%'
        height='55%'
      />
    );
  }
}

export default PieChart;
