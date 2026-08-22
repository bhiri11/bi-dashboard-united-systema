import React, { Component } from "react";
import Chart from "react-apexcharts";

class ColumnChart extends Component {
  render() {
    return (
      <Chart
        options={this.props.chartOptions}
        series={this.props.chartData}
        type='bar'
        width='100%'
        height='100%'
      />
    );
  }
}

export default ColumnChart;
