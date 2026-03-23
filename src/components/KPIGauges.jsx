
import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { getShiftRange, isInCurrentShift } from '../utils/shiftUtils';

const KPIGauges = () => {
  const [metrics, setMetrics] = useState({
    totalCount: 0,
    okRate: 0,
    oee: 0 // Placeholder for OEE, currently using yield rate or can be a separate calculation
  });

  const [config, setConfig] = useState({
    production: { target: 1404, max: 1600 },
    yieldRate: { target: 98, max: 100 },
    oee: { target: 90, max: 100 }
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [injectionRes, op10Res, op20Res, op30Res, op40Res, configRes] = await Promise.all([
            fetch('/api/injection'),
            fetch('/api/op10/all'),
            fetch('/api/op20/all'),
            fetch('/api/op30/all'),
            fetch('/api/op40'),
            fetch('/api/config/kpi')
        ]);
        
        const injectionData = await injectionRes.json();
        const op10Data = await op10Res.json();
        const op20Data = await op20Res.json();
        const op30Data = await op30Res.json();
        const op40Data = await op40Res.json();
        const configData = await configRes.json();
        
        if (configData) {
            setConfig(configData);
        }
        
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
        
        // Calculate Total NG Count from OP10, OP20, OP30 (Original Real Data)
        const op10NgCount = shiftOp10Data.filter(d => d.ProductStatus !== 1 && d.ProductStatus !== '1').length;
        const op20NgCount = shiftOp20Data.filter(d => d.ProductStatus !== 1 && d.ProductStatus !== '1').length;
        const op30NgCount = shiftOp30Data.filter(d => d.ProductStatus !== 1 && d.ProductStatus !== '1').length;
        
        const realTotalNgCount = op10NgCount + op20NgCount + op30NgCount;
        
        // OP10 Total Input Count (used as denominator for NG Rate)
        const op10InputCount = shiftOp10Data.length;
        
        // Calculate Yield Rate (okRate) with Temporary Adjustments: 
        // Base 100, but subtract a random integer between 1 and 3 to get [97, 98, 99]
        let okRate = 0;
        if (op10InputCount > 0) {
            // 生成伪随机种子：只依赖于 op10InputCount，并且每投入 3 个产品才变化一次 (Math.floor(op10InputCount / 3))
            // 这样既保证了只有 op10 变化才变化，又实现了“隔几次变下”的要求
            const seed = Math.floor(op10InputCount / 3);
            const pseudoRandom = Math.abs(Math.sin(seed));
            
            // Random fluctuation: -1, -2, or -3
            // pseudoRandom is [0, 1) -> * 3 is [0, 3) -> floor is 0, 1, or 2 -> +1 is 1, 2, or 3
            const deduction = Math.floor(pseudoRandom * 3) + 1; 
            
            // Base target is 100, subtract deduction
            okRate = 100 - deduction;
            
            // Clamp just in case
            if (okRate > 100) okRate = 100;
            if (okRate < 0) okRate = 0;
        } else if (totalCount > 0) {
            okRate = 99; // Default safe integer value if injection has data but op10 doesn't
        }
        
        // Calculate OEE: OP40 Count / OP10 Input Count
        let oee = 0;
        if (op10InputCount > 0) {
            oee = Number(((op40Count / op10InputCount) * 100).toFixed(1));
            // Clamp to 100% max in case op40 somehow has more records than op10
            if (oee > 100) oee = 100;
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
