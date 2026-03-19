
import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { getShiftRange, isInCurrentShift, parseDbTime } from '../utils/shiftUtils';

const InjectionModule = () => {
  const [metrics, setMetrics] = useState({
    totalCount: 0,
    okCount: 0,
    ngCount: 0,
    runTime: '00:00:00',
    speed: 0
  });
  
  const [chartData, setChartData] = useState({
    hours: [],
    yields: []
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/injection');
        const data = await response.json();
        
        if (!Array.isArray(data)) return;

        // Filter data for the current shift
        const { start: shiftStart, end: shiftEnd } = getShiftRange();

        const shiftData = data.filter(d => 
            isInCurrentShift(d.CreatedTime, shiftStart, shiftEnd)
        );

        // Calculate Metrics based on Shift Data
        const totalCount = shiftData.length;
        const okCount = shiftData.filter(d => d.IsOk).length;
        const ngCount = totalCount - okCount;
        
        // Calculate Speed (Rolling Average - Last 10 minutes)
        // Use shiftData for calculation to be consistent
        let speed = 0;
        const nowMs = Date.now();
        const tenMinutesAgo = nowMs - 10 * 60 * 1000;
        
        const recentData = shiftData.filter(d => {
            return parseDbTime(d.CreatedTime).getTime() > tenMinutesAgo;
        });
        
        if (recentData.length > 0) {
            speed = recentData.length * 6;
        } else {
             speed = 0;
        }

        // Run Time (Total for the shift)
        let runTime = '00:00:00';
        if (shiftData.length > 0) {
            // Find earliest record in current shift
            // Sort by time just in case
            const sortedShiftData = [...shiftData].sort((a, b) => {
                const tA = parseDbTime(a.CreatedTime).getTime();
                const tB = parseDbTime(b.CreatedTime).getTime();
                return tA - tB;
            });
            
            const firstTime = parseDbTime(sortedShiftData[0].CreatedTime).getTime();
            const diff = nowMs - firstTime;
            
            const hours = Math.floor(diff / 3600000);
            const minutes = Math.floor((diff % 3600000) / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);
            
            runTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }

        setMetrics({
            totalCount,
            okCount,
            ngCount,
            runTime,
            speed
        });

        // Calculate Chart Data (Group by Hour) - Current Shift Hours
        // Generate hours for the current shift up to current time
        const shiftHours = [];
        let iterTime = new Date(shiftStart);
        // We want to show all hours of the shift, or just up to now?
        // Usually charts show the whole shift timeline or up to current.
        // Let's show the whole shift range (12 hours) but data only up to now.
        
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

        shiftData.forEach(d => {
            const date = parseDbTime(d.CreatedTime);
            const hour = date.getHours();
            const hourStr = `${hour.toString().padStart(2, '0')}:00`;
            
            if (hourlyData[hourStr]) {
                hourlyData[hourStr].total++;
                if (d.IsOk) hourlyData[hourStr].ok++;
            }
        });
        
        const yields = shiftHours.map(h => hourlyData[h].total);

        setChartData({
            hours: shiftHours,
            yields
        });

      } catch (error) {
        console.error('Error fetching injection data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const chartOption = {
    title: {
        text: '每小时产量',
        textStyle: { color: '#94a3b8', fontSize: 26, fontFamily: 'Rajdhani' },
        left: 'center',
        top: 10
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(11, 17, 33, 0.9)',
      borderColor: '#3b82f6',
      textStyle: { color: '#fff' }
    },
    grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
    },
    xAxis: [
      {
        type: 'category',
        data: chartData.hours.length > 0 ? chartData.hours : ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'],
        axisPointer: { type: 'shadow' },
        axisLine: { lineStyle: { color: '#475569' } },
        axisLabel: { color: '#94a3b8', fontSize: 22, fontFamily: 'Rajdhani' }
      }
    ],
    yAxis: [
      {
        type: 'value',
        name: '产量',
        min: 0,
        // Dynamic max based on data or fixed
        max: (value) => Math.max(250, value.max + 50),
        interval: 50,
        axisLabel: { formatter: '{value}', color: '#94a3b8', fontSize: 22, fontFamily: 'Rajdhani' },
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#334155', type: 'dashed', opacity: 0.3 } }
      }
    ],
    series: [
      {
        name: '产量',
        type: 'bar',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#3b82f6' },
            { offset: 1, color: 'rgba(59, 130, 246, 0.1)' }
          ]),
          borderRadius: [4, 4, 0, 0]
        },
        data: chartData.yields.length > 0 ? chartData.yields : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        markLine: {
            symbol: 'none',
            label: { 
                show: true, 
                position: 'end', 
                color: '#94a3b8',
                fontSize: 16,
                fontWeight: 'bold',
                formatter: '{c}' 
            },
            lineStyle: { color: '#ef4444', type: 'dashed', width: 2 },
            data: [
                { 
                    yAxis: 144, 
                    name: '目标', 
                    label: { 
                        position: 'middle', 
                        formatter: 'Target: {c}',
                        dy: -10 // Shift label upwards by 10px
                    }
                }
            ]
        }
      }
    ]
  };

  return (
    <div className="tech-card h-full flex flex-col p-4 tech-border-blue hover:shadow-glow-blue transition-all duration-300">
        <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]"></div>
            <h2 className="text-[33px] font-bold text-white font-[Rajdhani] tracking-wide">注塑模块</h2>
        </div>
        
        <div className="flex flex-1 gap-4 overflow-hidden">
            {/* Metrics */}
            <div className="w-1/3 flex flex-col gap-3 text-[23px] pt-4">
                <div className="flex justify-between items-center bg-white/5 p-2 rounded border border-white/5">
                    <span className="text-gray-400">运行时长</span>
                    <span className="text-yellow-400 font-mono text-[33px] font-bold">{metrics.runTime}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-gray-400">生产速度</span>
                    <span className="text-cyan-400 font-mono text-[33px]">{metrics.speed} <span className="text-[21px] text-gray-500">件/h</span></span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-gray-400">合格数量</span>
                    <span className="text-green-400 font-mono text-[33px]">{metrics.okCount}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-gray-400">不合格数量</span>
                    <span className="text-red-400 font-mono text-[33px]">{metrics.ngCount}</span>
                </div>
                <div className="flex justify-between items-center mt-2 border-t border-white/10 pt-2">
                    <span className="text-gray-300 text-[27px] font-bold">生产数量</span>
                    <span className="text-white font-mono text-[39px] font-bold">{metrics.totalCount}</span>
                </div>
                
                <div className="mt-auto mb-2">
                     {/* Auto Mode Removed */}
                </div>
            </div>
            
            {/* Chart */}
            <div className="flex-1 h-full">
                <ReactECharts option={chartOption} style={{ height: '100%', width: '100%' }} />
            </div>
        </div>
    </div>
  );
};

export default InjectionModule;
