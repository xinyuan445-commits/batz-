
import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { getShiftRange, isInCurrentShift } from '../utils/shiftUtils';

const KPIGauges = () => {
  const [metrics, setMetrics] = useState({
    totalCount: 0,
    okRate: 0,
    oee: 0 // Placeholder for OEE, currently using yield rate or can be a separate calculation
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [injectionRes, op40Res] = await Promise.all([
            fetch('/api/injection'),
            fetch('/api/op40')
        ]);
        
        const injectionData = await injectionRes.json();
        const op40Data = await op40Res.json();
        
        if (!Array.isArray(injectionData)) return;

        // Filter data for the current shift
        const { start: shiftStart, end: shiftEnd } = getShiftRange();

        const shiftInjectionData = injectionData.filter(d => 
            isInCurrentShift(d.CreatedTime, shiftStart, shiftEnd)
        );
        
        const shiftOp40Data = Array.isArray(op40Data) ? op40Data.filter(d => 
            isInCurrentShift(d.CreatedTime, shiftStart, shiftEnd)
        ) : [];

        // Calculate Metrics based on Shift Data
        // Total Count: From Injection Data (shiftInjectionData)
        // OK Count: From OP40 Data (shiftOp40Data) - Represents packed/final good products
        const totalCount = shiftInjectionData.length;
        const okCount = shiftOp40Data.length;
        
        // Yield Rate = (OK Count from OP40 / Total Count from Injection) * 100
        const okRate = totalCount > 0 ? Number(((okCount / totalCount) * 100).toFixed(1)) : 0;
        
        // OEE (Currently using yield rate as a placeholder)
        const oee = okRate;

        setMetrics({
            totalCount,
            okRate,
            oee
        });

      } catch (error) {
        console.error('Error fetching KPI data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const getGaugeOption = (value, name, unit, color, target) => {
    const max = name === '产 量' ? 1600 : 100;
    const min = 0; 
    
    // Calculate position for target label
    // Angle range: 180 (min) -> 0 (max)
    const percent = (target - min) / (max - min);
    const angle = 180 - Math.min(Math.max(percent, 0), 1) * 180; // Clamp percent between 0 and 1
    const rad = angle * Math.PI / 180;
    const r = 160; // Increased radius for text position (was 125)
     const x = r * Math.cos(rad);
     const y = -r * Math.sin(rad);
 
     return {
     series: [
       {
         type: 'gauge',
         startAngle: 180,
         endAngle: 0,
         min: min,
         max: max,
         splitNumber: 5,
         radius: '165%',
         center: ['50%', '85%'],
         itemStyle: {
           color: color,
           shadowColor: color,
           shadowBlur: 10
         },
         progress: {
           show: true,
           width: 30,
           roundCap: true
         },
         pointer: { show: false },
         axisLine: {
           roundCap: true,
           lineStyle: {
             width: 30,
             color: [[1, 'rgba(255,255,255,0.05)']]
           }
         },
         axisTick: { show: false },
         splitLine: { show: false },
         axisLabel: { show: false },
         title: {
           show: false
         },
         detail: {
             valueAnimation: true,
             offsetCenter: [0, '-10%'],
             fontSize: 58,
             fontWeight: 'bold',
             formatter: name === '产 量' ? `{value}` : `{value}${unit}`,
             color: 'white',
             fontFamily: 'Rajdhani',
             textShadowColor: color,
             textShadowBlur: 5
         },
         data: [{ value: value, name: name }]
       },
       // Target Indicator Series (Using axisTick to simulate a line without pointer)
       target ? {
         type: 'gauge',
         // Create a tiny range around the target angle
         startAngle: angle,
         endAngle: angle,
         min: 0,
         max: 1,
         radius: '165%',
         center: ['50%', '85%'],
         axisLine: { show: false },
         axisLabel: { show: false },
         pointer: { show: false }, // Disable pointer completely
         splitLine: { show: false },
         
         // Use axisTick to draw the red line
          axisTick: {
              show: true,
              splitNumber: 1, // Draw ticks
              lineStyle: {
                  color: '#ef4444',
                  width: 3
              },
              length: 45, // Length of the line
              distance: -18 // Offset outwards: starts 30px outside and goes inwards
              // Main track is 30px wide. 
              // 20px length starting from -30px (outside) means it goes to 10px outside, leaving a gap from the track.
          },

         detail: {
             show: true,
             offsetCenter: [`${x}%`, `${y}%`],
             formatter: () => `Target: ${target}${name === '产 量' ? '' : '%'}`,
             color: '#94a3b8',
             fontSize: 30,
             fontWeight: 'bold',
             fontFamily: 'Rajdhani',
             backgroundColor: 'rgba(0,0,0,0.5)',
             borderRadius: 8,
             padding: [10, 36],
             borderWidth: 1,
             borderColor: '#94a3b8'
         },
         data: [{ value: 0 }] // Dummy data to trigger render
       } : null
    ].filter(Boolean)
  };
};

  const Title = ({ text }) => (
    <div className="absolute top-2 left-4 z-0">
        <span style={{ fontSize: '39px', fontFamily: 'Rajdhani', fontWeight: 'bold', color: '#94a3b8' }}>{text}</span>
    </div>
  );

  return (
    <div className="grid grid-cols-3 gap-4 h-full">
        {/* Production Volume */}
        <div className="tech-card p-2 relative flex flex-col hover:shadow-glow-blue transition-all duration-300">
            <Title text="产 量" />
            <div className="flex-1 w-full min-h-0 relative z-10">
                <ReactECharts 
                    option={getGaugeOption(metrics.totalCount, '产 量', 'pcs', '#3b82f6', 1404)} 
                    style={{ height: '100%', width: '100%' }} 
                />
            </div>
        </div>
        {/* Yield Rate */}
        <div className="tech-card p-2 relative flex flex-col hover:shadow-glow-green transition-all duration-300">
            <Title text="合 格 率" />
            <div className="flex-1 w-full min-h-0 relative z-10">
                <ReactECharts 
                    option={getGaugeOption(metrics.okRate, '合 格 率', '%', '#22c55e', 98)} 
                    style={{ height: '100%', width: '100%' }} 
                />
            </div>
        </div>
        {/* OEE */}
        <div className="tech-card p-2 relative flex flex-col hover:shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all duration-300">
            <Title text="OEE" />
            <div className="flex-1 w-full min-h-0 relative z-10">
                <ReactECharts 
                    option={getGaugeOption(metrics.oee, 'OEE', '%', '#f59e0b', 90)} 
                    style={{ height: '100%', width: '100%' }} 
                />
            </div>
        </div>
    </div>
  );
};

export default KPIGauges;
