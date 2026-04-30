
import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { getShiftRange, isInCurrentShift, parseDbTime } from '../utils/shiftUtils';

const QualityModule = () => {
  const [chartData, setChartData] = useState({
    hours: [],
    rates: []
  });
  const [target, setTarget] = useState(98); // Default target

  useEffect(() => {
    const fetchData = async () => {
      try {
        const baseUrl = process.env.NODE_ENV === 'production' 
            ? `http://${window.location.hostname}:3001` 
            : '';

        const [op10Res, op20Res, op30Res, configRes] = await Promise.all([
            fetch(`${baseUrl}/api/op10/all`),
            fetch(`${baseUrl}/api/op20/all`),
            fetch(`${baseUrl}/api/op30/all`),
            fetch(`${baseUrl}/api/config/kpi`)
        ]);
        
        if (!op10Res.ok || !op20Res.ok || !op30Res.ok || !configRes.ok) {
            return; // Stop parsing if any request fails (e.g. 403 Forbidden)
        }

        const op10Data = await op10Res.json();
        const op20Data = await op20Res.json();
        const op30Data = await op30Res.json();
        const configData = await configRes.json();
        
        if (configData?.yieldRate?.target) {
            setTarget(configData.yieldRate.target);
        }
        
        if (!Array.isArray(op10Data)) return;

        // Filter data for the current shift
        const { start: shiftStart, end: shiftEnd } = getShiftRange();
        
        const shiftOp10Data = Array.isArray(op10Data) ? op10Data.filter(d => 
            isInCurrentShift(d.CreatedTime, shiftStart, shiftEnd)
        ) : [];

        const shiftOp20Data = Array.isArray(op20Data) ? op20Data.filter(d => 
            isInCurrentShift(d.CreatedTime, shiftStart, shiftEnd)
        ) : [];

        const shiftOp30Data = Array.isArray(op30Data) ? op30Data.filter(d => 
            isInCurrentShift(d.CreatedTime, shiftStart, shiftEnd)
        ) : [];

        // Calculate Chart Data (Group by Hour) - Current Shift Hours
        const shiftHours = [];
        let iterTime = new Date(shiftStart);
        // Generate 12 hour slots for the shift
        for (let i = 0; i < 12; i++) {
            const h = iterTime.getHours().toString().padStart(2, '0') + ':00';
            shiftHours.push(h);
            iterTime.setHours(iterTime.getHours() + 1);
        }
        
        const hourlyData = {};
        shiftHours.forEach(h => {
            hourlyData[h] = { inputTotal: 0, ngTotal: 0 };
        });

        // Count Total Input (Denominator) from OP10 Data
        // And count NG from OP10
        shiftOp10Data.forEach(d => {
            const date = parseDbTime(d.CreatedTime);
            const hour = date.getHours();
            const hourStr = `${hour.toString().padStart(2, '0')}:00`;
            
            if (hourlyData[hourStr]) {
                hourlyData[hourStr].inputTotal++;
                if (d.ProductStatus !== 1 && d.ProductStatus !== '1') {
                    hourlyData[hourStr].ngTotal++;
                }
            }
        });

        // Add NG from OP20
        shiftOp20Data.forEach(d => {
            const date = parseDbTime(d.CreatedTime);
            const hour = date.getHours();
            const hourStr = `${hour.toString().padStart(2, '0')}:00`;
            
            if (hourlyData[hourStr] && d.ProductStatus !== 1 && d.ProductStatus !== '1') {
                hourlyData[hourStr].ngTotal++;
            }
        });

        // Add NG from OP30
        shiftOp30Data.forEach(d => {
            const date = parseDbTime(d.CreatedTime);
            const hour = date.getHours();
            const hourStr = `${hour.toString().padStart(2, '0')}:00`;
            
            if (hourlyData[hourStr] && d.ProductStatus !== 1 && d.ProductStatus !== '1') {
                hourlyData[hourStr].ngTotal++;
            }
        });
        
        const rates = shiftHours.map((h) => {
            const { inputTotal, ngTotal } = hourlyData[h];
            
            if (inputTotal > 0) {
                // Calculate NG Rate based on OP10 total input
                const ngRate = (ngTotal / inputTotal) * 100;
                let rate = Number((100 - ngRate).toFixed(1));
                
                // Ensure it doesn't go below 0
                if (rate < 0) rate = 0; 
                if (rate > 100) rate = 100;
                
                return rate;
            }
            // If no input data for this hour, return null so the line breaks
            return null; 
        });

        setChartData({
            hours: shiftHours,
            rates
        });

      } catch (error) {
        console.error('Error fetching quality data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const chartOption = {
    title: {
        text: '合格率趋势 (每小时)',
        textStyle: { color: '#94a3b8', fontSize: 26, fontFamily: 'Rajdhani' },
        left: 'center',
        top: 10
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(11, 17, 33, 0.9)',
      borderColor: '#22c55e',
      textStyle: { color: '#fff' },
      formatter: '{b} : {c}%'
    },
    grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: chartData.hours.length > 0 ? chartData.hours : ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'],
      axisLine: { lineStyle: { color: '#475569' } },
      axisLabel: { color: '#94a3b8', fontSize: 22, fontFamily: 'Rajdhani' }
    },
    yAxis: {
      type: 'value',
      // If target is 98, min will be 95. If target is 90, min will be 87. It ensures the target line is always visible.
      min: Math.floor(Math.min(95, target - 3)),
      max: 100,
      // Dynamic interval based on range. E.g., if range is 100-87=13, interval could be 2 or 3. If range is 5, interval is 1.
      interval: Math.max(1, Math.ceil((100 - Math.floor(Math.min(95, target - 3))) / 5)),
      axisLabel: { formatter: '{value}%', color: '#94a3b8', fontSize: 22, fontFamily: 'Rajdhani' },
      splitLine: { lineStyle: { color: '#334155', type: 'dashed', opacity: 0.3 } }
    },
    series: [
      {
        name: '合格率',
        type: 'line',
        smooth: true,
        lineStyle: { 
            width: 2,
            color: '#22c55e',
            shadowColor: 'rgba(34, 197, 94, 0.5)',
            shadowBlur: 10
        },
        showSymbol: true,
        symbol: 'circle',
        symbolSize: 6,
        connectNulls: true, // This connects the line across hours with no data
        itemStyle: { color: '#22c55e' },
        areaStyle: {
          opacity: 0.8,
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(34, 197, 94, 0.4)' },
            { offset: 1, color: 'rgba(34, 197, 94, 0.01)' }
          ])
        },
        data: chartData.rates.length > 0 ? chartData.rates : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        markLine: {
            symbol: 'none',
            label: { 
                show: true, 
                position: 'middle', 
                color: '#94a3b8',
                fontSize: 16,
                fontWeight: 'bold',
                formatter: 'Target: {c}',
                dy: -10 
            },
            lineStyle: { color: '#ef4444', type: 'dashed', width: 2 },
            data: [
                { yAxis: target, name: '目标' }
            ]
        }
      }
    ]
  };

  return (
    <div className="tech-card h-full flex flex-col p-4 tech-border-blue hover:shadow-glow-green transition-all duration-300">
        <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-2">
            <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_#06b6d4]"></div>
            <h2 className="text-[33px] font-bold text-white font-[Rajdhani] tracking-wide">质量趋势与缺陷分析</h2>
        </div>
        
        <div className="flex-1 h-full relative">
            {/* Optional decoration lines */}
            <div className="absolute top-0 right-0 w-20 h-[1px] bg-gradient-to-l from-cyan-500/50 to-transparent"></div>
            <div className="absolute bottom-0 left-0 w-20 h-[1px] bg-gradient-to-r from-cyan-500/50 to-transparent"></div>
            
            <ReactECharts option={chartOption} style={{ height: '100%', width: '100%' }} />
        </div>
    </div>
  );
};

export default QualityModule;
