
import React, { useState, useEffect, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import { getShiftRange, isInCurrentShift, checkIsRestTime, getValidElapsedMinutes } from '../utils/shiftUtils';

const KPIGauges = () => {
  const [metrics, setMetrics] = useState({
    totalCount: 0,
    okRate: 0,
    oee: 0
  });

  // Keep track of the last calculated OEE during rest times
  const lastOeeRef = useRef(0);

  const [config, setConfig] = useState({
    production: { target: 1200, max: 1300 },
    yieldRate: { target: 98, max: 100 },
    oee: { target: 90, max: 100 }
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const baseUrl = process.env.NODE_ENV === 'production' 
            ? `http://${window.location.hostname}:3001` 
            : '';

        const [injectionRes, op10Res, op20Res, op30Res, op40Res, configRes] = await Promise.all([
            fetch(`${baseUrl}/api/injection`),
            fetch(`${baseUrl}/api/op10/all`),
            fetch(`${baseUrl}/api/op20/all`),
            fetch(`${baseUrl}/api/op30/all`),
            fetch(`${baseUrl}/api/op40`),
            fetch(`${baseUrl}/api/config/kpi`)
        ]);
        
        if (!injectionRes.ok || !configRes.ok) {
            return; // Stop parsing if locked (403)
        }

        const injectionData = await injectionRes.json();
        const configData = await configRes.json();
        
        if (configData) {
            setConfig(configData);
        }
        
        const op10Data = op10Res.ok ? await op10Res.json() : [];
        const op20Data = op20Res.ok ? await op20Res.json() : [];
        const op30Data = op30Res.ok ? await op30Res.json() : [];
        const op40Data = op40Res.ok ? await op40Res.json() : [];
        
        if (!Array.isArray(injectionData)) return;

        // Filter data for the current shift
        const { start: shiftStart, end: shiftEnd } = getShiftRange();

        const shiftInjectionData = injectionData.filter(d => 
            isInCurrentShift(d.CreatedTime, shiftStart, shiftEnd)
        );
        
        const shiftOp10Data = Array.isArray(op10Data) ? op10Data.filter(d => 
            isInCurrentShift(d.CreatedTime, shiftStart, shiftEnd)
        ) : [];

        const shiftOp20Data = Array.isArray(op20Data) ? op20Data.filter(d => 
            isInCurrentShift(d.CreatedTime, shiftStart, shiftEnd)
        ) : [];

        const shiftOp30Data = Array.isArray(op30Data) ? op30Data.filter(d => 
            isInCurrentShift(d.CreatedTime, shiftStart, shiftEnd)
        ) : [];

        const shiftOp40Data = Array.isArray(op40Data) ? op40Data.filter(d => 
            isInCurrentShift(d.CreatedTime, shiftStart, shiftEnd)
        ) : [];

        // OP40 Total Count
        const op40Count = shiftOp40Data.length;

        // Total Count: From OP40 Data (Current Shift)
        const totalCount = op40Count;
        
        // OP10 Total Input Count
        const op10InputCount = shiftOp10Data.length;
        
        // Calculate Total NG Count from OP10, OP20, OP30
        const op10NgCount = shiftOp10Data.filter(d => d.ProductStatus !== 1 && d.ProductStatus !== '1').length;
        const op20NgCount = shiftOp20Data.filter(d => d.ProductStatus !== 1 && d.ProductStatus !== '1').length;
        const op30NgCount = shiftOp30Data.filter(d => d.ProductStatus !== 1 && d.ProductStatus !== '1').length;
        const realTotalNgCount = op10NgCount + op20NgCount + op30NgCount;
        
        // Calculate Yield Rate (okRate) based on NG Rates:
        // 1. Calculate each station's NG rate
        // 2. Total NG Rate = sum of all station NG rates
        // 3. OK Rate = 100% - Total NG Rate
        let okRate = 0;
        if (op10InputCount > 0) {
            const op10NgRate = (op10NgCount / op10InputCount) * 100;
            const op20NgRate = (op20NgCount / op10InputCount) * 100;
            const op30NgRate = (op30NgCount / op10InputCount) * 100;
            
            const totalNgRate = op10NgRate + op20NgRate + op30NgRate;
            okRate = Number((100 - totalNgRate).toFixed(1));
            
            // Clamp just in case
            if (okRate > 100) okRate = 100;
            if (okRate < 0) okRate = 0;
        } else if (totalCount > 0) {
            okRate = 100; // If OP40 has output but no OP10 input is recorded yet
        }
        
        // Calculate Minute-by-Minute OEE
        let oee = lastOeeRef.current; // Default to last OEE (frozen during rest)
        const now = new Date();
        
        // Only update OEE if we are not in a rest period
        if (!checkIsRestTime(now)) {
            // Get assembly speed in seconds/piece (default 30)
            const assemblySpeed = configData?.assembly?.speed || 30;
            
            // Calculate standard target per minute
            // 60 seconds / speed = pieces per minute
            const targetPerMinute = 60 / assemblySpeed;
            
            // Calculate how many valid working minutes have elapsed since the shift started
            let validElapsedMinutes = getValidElapsedMinutes(shiftStart, now);
            // Minimum elapsed time set to 1 minute to avoid division by zero
            if (validElapsedMinutes < 1) validElapsedMinutes = 1;
            
            // Dynamic Target = pieces per minute * valid minutes
            const dynamicTarget = targetPerMinute * validElapsedMinutes;
            
            if (dynamicTarget > 0) {
                oee = Number(((op40Count / dynamicTarget) * 100).toFixed(1));
                // Clamp to 100% max
                if (oee > 100) oee = 100;
                
                // Update the ref so we remember it during the next rest period
                lastOeeRef.current = oee;
            }
        }

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

  const getGaugeOption = (value, name, unit, color, target, max) => {
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
             show: false // We will hide the built-in detail and use a custom Title component instead
         },
         data: [{ value: 0 }] // Dummy data to trigger render
       } : null
    ].filter(Boolean)
  };
};

  const Title = ({ text, target }) => (
    <>
      <div className="absolute top-2 left-4 z-0">
          <span style={{ fontSize: '39px', fontFamily: 'Rajdhani', fontWeight: 'bold', color: '#94a3b8' }}>{text}</span>
      </div>
      {target && (
        <div className="absolute top-4 right-4 z-10">
            <div style={{
                color: '#94a3b8',
                fontSize: '30px',
                fontWeight: 'bold',
                fontFamily: 'Rajdhani',
                backgroundColor: 'rgba(0,0,0,0.5)',
                borderRadius: '8px',
                padding: '10px 36px',
                border: '1px solid #94a3b8'
            }}>
                Target: {target}{text === '产 量' ? '' : '%'}
            </div>
        </div>
      )}
    </>
  );

  return (
    <div className="grid grid-cols-3 gap-4 h-full">
        {/* Production Volume */}
        <div className="tech-card p-2 relative flex flex-col hover:shadow-glow-blue transition-all duration-300">
            <Title text="产 量" target={config.production.target} />
            <div className="flex-1 w-full min-h-0 relative z-10">
                <ReactECharts 
                    option={getGaugeOption(metrics.totalCount, '产 量', 'pcs', '#3b82f6', config.production.target, config.production.max)} 
                    style={{ height: '100%', width: '100%' }} 
                />
            </div>
        </div>
        {/* Yield Rate */}
        <div className="tech-card p-2 relative flex flex-col hover:shadow-glow-green transition-all duration-300">
            <Title text="合 格 率" target={config.yieldRate.target} />
            <div className="flex-1 w-full min-h-0 relative z-10">
                <ReactECharts 
                    option={getGaugeOption(metrics.okRate, '合 格 率', '%', '#22c55e', config.yieldRate.target, config.yieldRate.max)} 
                    style={{ height: '100%', width: '100%' }} 
                />
            </div>
        </div>
        {/* OEE */}
        <div className="tech-card p-2 relative flex flex-col hover:shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all duration-300">
            <Title text="OEE" target={config.oee.target} />
            <div className="flex-1 w-full min-h-0 relative z-10">
                <ReactECharts 
                    option={getGaugeOption(metrics.oee, 'OEE', '%', '#f59e0b', config.oee.target, config.oee.max)} 
                    style={{ height: '100%', width: '100%' }} 
                />
            </div>
        </div>
    </div>
  );
};

export default KPIGauges;
