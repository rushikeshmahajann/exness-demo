import React from 'react'
import { createChart } from 'lightweight-charts'

const Chart = () => {
  const chartOne : string | HTMLElement = document.getElementById("chart-container");
  const chart = createChart(chartOne);

  
  return (
    <div className='w-screen h-screen'>
      <div id='chart-container' className='w-[100%] h-[100%] border-2 border-neutral-600'>

      </div>
    </div>
  )
}

export default Chart