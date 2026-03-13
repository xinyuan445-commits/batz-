
import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { getShiftRange, isInCurrentShift, parseDbTime } from '../utils/shiftUtils';

const QualityModule = () => {
  const [chartData, setChartData] = useState({
    hours: [],
    rates: []
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
            hourlyData[h] = { total: 0, ok: 0 };
        });

        // Count Total (Denominator) from Injection Data
        shiftInjectionData.forEach(d => {
            const date = parseDbTime(d.CreatedTime);
            const hour = date.getHours();
            const hourStr = `${hour.toString().padStart(2, '0')}:00`;
            
            if (hourlyData[hourStr]) {
                hourlyData[hourStr].total++;
            }
        });

        // Count OK (Numerator) from OP40 Data
        shiftOp40Data.forEach(d => {
            const date = parseDbTime(d.CreatedTime);
            const hour = date.getHours();
            const hourStr = `${hour.toString().padStart(2, '0')}:00`;
            
            if (hourlyData[hourStr]) {
                hourlyData[hourStr].ok++;
            }
        });
        
        const rates = shiftHours.map(h => {
            const { total, ok } = hourlyData[h];
            // Yield Rate = (OK Count from OP40 / Total Count from Injection) * 100
            return total > 0 ? Number(((ok / total) * 100).toFixed(2)) : 0;
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
      min: 95,
      max: 100,
      interval: 1,
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
                { yAxis: 98, name: '目标' }
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
