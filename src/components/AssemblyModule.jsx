import React from 'react';
import ReactECharts from 'echarts-for-react';
import { Star, Square, CheckCircle } from 'lucide-react';

const MiniBarChart = ({ color, data }) => {
    const option = {
        grid: { top: 2, bottom: 2, left: 2, right: 2 },
        xAxis: { show: false, data: Array.from({length: data.length}, (_, i) => i) },
        yAxis: { show: false, min: Math.min(...data) * 0.9, max: Math.max(...data) * 1.1 },
        series: [{
            type: 'bar',
            data: data,
            itemStyle: { color: color },
            barWidth: '60%'
        }]
    };
    return <ReactECharts option={option} style={{ height: '32px', width: '100%' }} />;
};

const LineChart = ({ color, data, height = '100px', yAxisConfig, markLine, markPoint, grid }) => {
    // Check if yAxisConfig is an array (Dual Y-Axis mode)
    const isDualAxis = Array.isArray(yAxisConfig);
    const yAxisList = isDualAxis ? yAxisConfig : [yAxisConfig || {}];

    // Map series to yAxisIndex if dual axis
    // If dual axis, last series goes to axis 1, others to axis 0
    const seriesList = data.map((seriesData, index) => ({
        type: 'line',
        data: seriesData,
        itemStyle: { color: Array.isArray(color) ? color[index] : color },
        lineStyle: { width: 2 },
        symbol: 'none',
        smooth: true,
        yAxisIndex: isDualAxis && index >= data.length - 1 ? 1 : 0,
        // Apply markLine to the first series if provided
        markLine: index === 0 ? markLine : undefined,
        markPoint: index === 0 ? markPoint : undefined,
        // Ensure data points outside axis range are clipped (not drawn)
        clip: true 
    }));

    const option = {
        grid: { top: 10, bottom: 20, left: 35, right: isDualAxis ? 35 : 10, ...grid },
        tooltip: { trigger: 'axis' },
        xAxis: { 
            type: 'category',
            data: Array.from({length: 15}, (_, i) => i + 1),
            axisLabel: { color: '#94a3b8', fontSize: 18 },
            axisTick: { show: false },
            axisLine: { lineStyle: { color: '#475569' } }
        },
        yAxis: yAxisList.map((config, index) => ({
            type: 'value',
            min: config.min ?? ((val) => Math.floor(val.min - 1)),
            max: config.max ?? ((val) => Math.ceil(val.max + 1)),
            interval: config.interval,
            splitLine: { 
                show: index === 0, 
                lineStyle: { color: '#334155', type: 'dashed', opacity: 0.5 } 
            },
            axisLabel: { 
                color: '#94a3b8', 
                fontSize: 18,
                formatter: (value) => {
                    if (config.interval && config.interval < 0.1) {
                        return Number(value).toFixed(2);
                    }
                    return Number(value).toFixed(1);
                }
            }
        })),
        series: seriesList
    };
    return <ReactECharts option={option} style={{ height: height, width: '100%' }} />;
};

const MetricItem = ({ label, value, unit, cpk, cpkColor, barColor, data }) => (
    <div className="flex flex-col items-center gap-1 min-w-[60px]">
        <div className="font-mono text-yellow-300 whitespace-nowrap text-[21px]">
            {label}: <span className="text-white">{value}</span>
        </div>
        <div className="w-full h-8">
            <MiniBarChart color={barColor} data={data} />
        </div>
        <div className={`w-6 h-6 rounded-full border flex items-center justify-center font-bold ${
            cpkColor === 'green' ? 'border-green-500 text-green-500' : 'border-yellow-500 text-yellow-500'
        }`} style={{fontSize: '18px'}}>
            {cpk}
        </div>
    </div>
);

const AssemblyModule = () => {
  const [op10Data, setOp10Data] = React.useState([]);
  const [op20Data, setOp20Data] = React.useState([]);
  const [op30Data, setOp30Data] = React.useState([]);
  const [op10Calibrated, setOp10Calibrated] = React.useState(false);
  const [op30Calibrated, setOp30Calibrated] = React.useState(false);
  const [config, setConfig] = React.useState({
    op10: { 
        dia1: { max: 50.5, min: 50.0 },
        dia23: { max: 50.5, min: 49.5 }
    },
    op20: {
        press12: { max: 6.5, min: 1.3 },
        press3: { max: 3.5, min: 1.0 }
    },
    op30: {
        angle1: { max: 94.0, min: 86.0 },
        angle23: { max: 4.0, min: -4.0 }
    }
  });

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const baseUrl = process.env.NODE_ENV === 'production' 
            ? `http://${window.location.hostname}:3001` 
            : '';

        const [resOp10, resOp20, resOp30, resOp10Calib, resOp30Calib, resConfig] = await Promise.all([
          fetch(`${baseUrl}/api/op10`),
          fetch(`${baseUrl}/api/op20`),
          fetch(`${baseUrl}/api/op30`),
          fetch(`${baseUrl}/api/op10/calibration-status`),
          fetch(`${baseUrl}/api/op30/calibration-status`),
          fetch(`${baseUrl}/api/config/kpi`)
        ]);
        
        if (!resOp10.ok || !resOp20.ok || !resOp30.ok) {
            return; // Stop parsing if locked (403)
        }

        const dataOp10 = await resOp10.json();
        const dataOp20 = await resOp20.json();
        const dataOp30 = await resOp30.json();
        const calibOp10 = await resOp10Calib.json();
        const calibOp30 = await resOp30Calib.json();
        const configData = resConfig.ok ? await resConfig.json() : null;

        if (Array.isArray(dataOp10)) setOp10Data(dataOp10);
        if (Array.isArray(dataOp20)) setOp20Data(dataOp20);
        if (Array.isArray(dataOp30)) setOp30Data(dataOp30);
        setOp10Calibrated(calibOp10.isCalibrated);
        setOp30Calibrated(calibOp30.isCalibrated);
        if (configData?.op10) {
            setConfig(prev => ({ ...prev, op10: configData.op10 }));
        }
        if (configData?.op20) {
            setConfig(prev => ({ ...prev, op20: configData.op20 }));
        }
        if (configData?.op30) {
            setConfig(prev => ({ ...prev, op30: configData.op30 }));
        }

      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, []);

  // Helper function to calculate CPK
  const calculateCPK = (data, upperLimit, lowerLimit) => {
    if (!data || data.length === 0) return { cpk: '-', color: 'gray' };
    
    // Filter out invalid data (null, undefined, or 0 if 0 is considered invalid)
    const validData = data.filter(v => v !== null && v !== undefined && !isNaN(v));
    if (validData.length < 5) return { cpk: '-', color: 'gray' }; // Need enough data points

    const n = validData.length;
    const mean = validData.reduce((a, b) => a + b, 0) / n;
    const stdDev = Math.sqrt(validData.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (n - 1));

    if (stdDev === 0) return { cpk: '9.99', color: 'green' }; // Perfect consistency

    const cpu = (upperLimit - mean) / (3 * stdDev);
    const cpl = (mean - lowerLimit) / (3 * stdDev);
    const cpkVal = Math.min(cpu, cpl);

    let color = 'green';
    if (cpkVal < 1.33) color = 'yellow';
    if (cpkVal < 1.0) color = 'red';

    return { cpk: cpkVal.toFixed(2), color };
  };

  // OP10 Logic
  const latestOp10 = op10Data[0] || {};
  const isOp10Ok = latestOp10.ProductStatus === 1;
  const op10StatusText = isOp10Ok ? 'OK' : 'NG';

  // OP20 Logic
  const latestOp20 = op20Data[0] || {};
  const isOp20Ok = latestOp20.ProductStatus === 1;
  const op20StatusText = isOp20Ok ? 'OK' : 'NG';

  // OP30 Logic
  const latestOp30 = op30Data[0] || {};
  const isOp30Ok = latestOp30.ProductStatus === 1;
  const op30StatusText = isOp30Ok ? 'OK' : 'NG';

  // OP10 Charts
  // Extract real data directly from the database
  const rawDia1Data = op10Data.slice(0, 30).map(d => d.Production_Circle1_Diameter);
  const rawDia2Data = op10Data.slice(0, 30).map(d => d.Production_Circle2_Diameter);
  const rawDia3Data = op10Data.slice(0, 30).map(d => d.Production_Circle3_Diameter);

  // Reverse the first 15 for chronological display on the chart (100% Real Data)
  const chartOp10Dia1 = rawDia1Data.slice(0, 15).reverse();
  const chartOp10Dia2 = rawDia2Data.slice(0, 15).reverse();
  const chartOp10Dia3 = rawDia3Data.slice(0, 15).reverse();

  // OP10 CPK Calculations using dynamic configuration
  // Use wider baseline for CPK calculation as requested
  const cpkOp10Dia1 = calculateCPK(rawDia1Data, 50.35, 50.15);
  const cpkOp10Dia2 = calculateCPK(rawDia2Data, 50.5, 49.5);
  const cpkOp10Dia3 = calculateCPK(rawDia3Data, 51.0, 49.5);

  // OP30 Charts
  // Extract real data directly from the database (100% Real Data)
  const rawAngle1Data = op30Data.slice(0, 30).map(d => d.Production_Angle_Vertical);
  const rawAngle2Data = op30Data.slice(0, 30).map(d => d.Production_Angle_LeftParallel);
  const rawAngle3Data = op30Data.slice(0, 30).map(d => d.Production_Angle_RightParallel);

  // Reverse the first 15 for chronological display on the chart (100% Real Data)
  const op30Angle1 = rawAngle1Data.slice(0, 15).reverse();
  const op30Angle2 = rawAngle2Data.slice(0, 15).reverse();
  const op30Angle3 = rawAngle3Data.slice(0, 15).reverse();

  // OP30 CPK Calculations using dynamic configuration
  // Use wider baseline for CPK calculation as requested (Plan B)
  // Angle 1 CPK base: [83, 97]
  const cpkOp30Angle1 = calculateCPK(rawAngle1Data, 97, 83);
  // Angle 2&3 CPK base: [-7, 7]
  const cpkOp30Angle2 = calculateCPK(rawAngle2Data, 7, -7);
  const cpkOp30Angle3 = calculateCPK(rawAngle3Data, 7, -7);

  // OP20 Charts
  // Extract real data directly from the database (100% Real Data)
  const op20Press1 = op20Data.slice(0, 15).map(d => d.PressPressure_Left).reverse();
  const op20Press2 = op20Data.slice(0, 15).map(d => d.PressPressure_Right).reverse();
  const op20Press3 = op20Data.slice(0, 15).map(d => d.PressPressure_Back).reverse();

  // Helper to determine overall status color based on CPK values
  const getOverallStatusColor = (cpkResults) => {
      // Check for Red (< 1.0)
      if (cpkResults.some(res => res.color === 'red')) return 'red';
      // Check for Yellow (< 1.33)
      if (cpkResults.some(res => res.color === 'yellow')) return 'yellow';
      // Otherwise Green
      return 'green';
  };

  const op10StatusColor = getOverallStatusColor([cpkOp10Dia1, cpkOp10Dia2, cpkOp10Dia3]);
  const op30StatusColor = getOverallStatusColor([cpkOp30Angle1, cpkOp30Angle2, cpkOp30Angle3]);

  // Color map for dynamic styles
  const statusStyles = {
      green: {
          bg: 'bg-green-900/40',
          border: 'border-green-500/30',
          shadow: 'shadow-[inset_0_0_20px_rgba(0,0,0,0.2)]', // Default shadow
          scanline: 'rgba(34,197,94,0.1)'
      },
      yellow: {
          bg: 'bg-yellow-900/40',
          border: 'border-yellow-500/50',
          shadow: 'shadow-[inset_0_0_20px_rgba(234,179,8,0.2)]', // Yellow glow
          scanline: 'rgba(234,179,8,0.1)'
      },
      red: {
          bg: 'bg-red-900/40',
          border: 'border-red-500/50',
          shadow: 'shadow-[inset_0_0_20px_rgba(239,68,68,0.2)]', // Red glow
          scanline: 'rgba(239,68,68,0.1)'
      }
  };

  const op10Style = statusStyles[op10StatusColor];
  const op30Style = statusStyles[op30StatusColor];

  return (
    <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 mb-2 border-b border-white/10 pb-1">
            <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
            <h2 className="text-[27px] font-bold text-white">组装模块</h2>
        </div>

        <div className="flex flex-col gap-4 flex-1 h-full overflow-hidden">
            {/* OP10 - Top Section */}
            <div className={`flex-[0.8] ${op10Style.bg} ${op10Style.border} rounded-lg p-3 flex flex-col relative overflow-hidden border ${op10Style.shadow} transition-all duration-300`}>
                {/* Scanline Effect */}
                <div className="absolute inset-0 pointer-events-none" style={{
                    backgroundImage: `linear-gradient(transparent 50%, ${op10Style.scanline} 50%)`,
                    backgroundSize: '100% 4px'
                }}></div>
                
                <div className="flex justify-between items-center mb-2 z-10">
                    <div className="flex items-center gap-2">
                        <Star size={25} className="text-cyan-400 fill-cyan-400 drop-shadow-[0_0_5px_#22d3ee]" />
                        <span className="font-bold text-[27px] text-white font-[Rajdhani] tracking-wider">OP10 尺寸检测</span>
                        <div className="text-[21px] text-gray-300 font-[Rajdhani] ml-4">直径趋势</div>
                    </div>
                    {/* Shift Status Indicator */}
                    <div className="flex items-center gap-2 bg-black/20 px-2 py-1 rounded border border-white/10">
                        <span className="text-[17px] text-gray-300 font-mono">标定检测状态</span>
                        <div className={`w-3 h-3 rounded-full ${op10Calibrated ? 'bg-green-500 shadow-[0_0_8px_#22c55e] animate-pulse' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`}></div>
                    </div>
                </div>
                
                <div className="flex flex-col flex-1 gap-2 z-10">
                     {/* Diameter Trend */}
                     <div className="flex-1 flex flex-col">
                        <div className="flex-1 min-h-0 flex flex-col gap-1">
                            {/* Chart 1: Dia 1 */}
                            <div className="flex-1 min-h-0">
                                <LineChart 
                                    color={['#22c55e']} 
                                    data={[chartOp10Dia1]} 
                                    height="100%" 
                                    grid={{ right: 180, left: 10 }}
                                    yAxisConfig={{ min: Number((config.op10.dia1.min - 0.2).toFixed(2)), max: Number((config.op10.dia1.max + 0.2).toFixed(2)), interval: 0.20 }}
                                    markPoint={{
                                        symbol: 'circle',
                                        symbolSize: 0,
                                        label: {
                                            show: true,
                                            position: 'right',
                                            distance: 130,
                                            formatter: 'CPK:{c}',
                                            color: '#fff',
                                            fontWeight: 'bold',
                                            fontSize: 15,
                                            padding: [6, 12],
                                            borderRadius: 100
                                        },
                                        data: [
                                            { coord: [14, config.op10.dia1.min + ((config.op10.dia1.max - config.op10.dia1.min) / 2)], value: cpkOp10Dia1.cpk, label: { backgroundColor: '#22c55e' } }
                                        ]
                                    }}
                                    markLine={{
                                        symbol: 'none',
                                        label: { 
                                            show: true, 
                                            position: 'end', 
                                            color: '#d1d5db',
                                            fontSize: 14,
                                            formatter: '{b} {c}' 
                                        },
                                        lineStyle: { color: 'red', type: 'dashed', width: 2 },
                                        data: [
                                            { yAxis: config.op10.dia1.max, name: '上限' },
                                            { yAxis: config.op10.dia1.min, name: '下限' }
                                        ]
                                    }}
                                />
                            </div>

                            {/* Chart 2: Dia 2 & 3 */}
                            <div className="flex-1 min-h-0">
                                <LineChart 
                                    color={['#facc15', '#3b82f6']} 
                                    data={[chartOp10Dia2, chartOp10Dia3]} 
                                    height="100%" 
                                    grid={{ right: 180, left: 10 }}
                                    yAxisConfig={{ min: Number((config.op10.dia23.min - 0.2).toFixed(2)), max: Number((config.op10.dia23.max + 0.2).toFixed(2)), interval: 0.30 }}
                                    markPoint={{
                                        symbol: 'circle',
                                        symbolSize: 0,
                                        label: {
                                            show: true,
                                            position: 'right',
                                            distance: 130,
                                            formatter: 'CPK:{c}',
                                            color: '#fff',
                                            fontWeight: 'bold',
                                            fontSize: 15,
                                            padding: [6, 12],
                                            borderRadius: 100
                                        },
                                        data: [
                                            { coord: [14, config.op10.dia23.max - 0.15], value: cpkOp10Dia2.cpk, label: { backgroundColor: '#facc15' } },
                                            { coord: [14, config.op10.dia23.min + 0.15], value: cpkOp10Dia3.cpk, label: { backgroundColor: '#3b82f6' } }
                                        ]
                                    }}
                                    markLine={{
                                        symbol: 'none',
                                        label: { 
                                            show: true, 
                                            position: 'end', 
                                            color: '#d1d5db',
                                            fontSize: 14,
                                            formatter: '{b} {c}' 
                                        },
                                        lineStyle: { color: 'red', type: 'dashed', width: 2 },
                                        data: [
                                            { yAxis: config.op10.dia23.max, name: '上限' },
                                            { yAxis: config.op10.dia23.min, name: '下限' }
                                        ]
                                    }}
                                />
                            </div>
                        </div>
                     </div>
                </div>


            </div>

            {/* OP20 - Middle Section */}
            <div className={`flex-[0.8] ${statusStyles.green.bg} ${statusStyles.green.border} rounded-lg p-3 flex flex-col relative overflow-hidden border ${statusStyles.green.shadow} transition-all duration-300`}>
                {/* Scanline Effect */}
                <div className="absolute inset-0 pointer-events-none" style={{
                    backgroundImage: `linear-gradient(transparent 50%, ${statusStyles.green.scanline} 50%)`,
                    backgroundSize: '100% 4px'
                }}></div>

                <div className="flex justify-between items-center mb-2 z-10">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-400 rounded-sm shadow-[0_0_5px_#facc15]"></div>
                        <span className="font-bold text-[27px] text-white font-[Rajdhani] tracking-wider">OP20 压装检测</span>
                        <div className="text-[21px] text-gray-300 px-1 font-[Rajdhani] ml-4">压力趋势</div>
                    </div>

                </div>
                
                {/* Metrics */}
                <div className="flex flex-col gap-1 text-[21px] font-mono text-yellow-300 mb-1 px-1 z-10 hidden">
                    <div className="grid grid-cols-3 gap-2 border-b border-white/5 pb-1">
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full opacity-0"></div>
                            <span>位移1: {latestOp20.PressDisplacement_Left?.toFixed(2) || '-'}</span>
                        </div>
                        <div className="flex items-center gap-1 justify-center">
                            <span>位移2: {latestOp20.PressDisplacement_Right?.toFixed(2) || '-'}</span>
                        </div>
                        <div className="flex items-center gap-1 justify-end">
                            <span>位移3: {latestOp20.PressDisplacement_Back?.toFixed(2) || '-'}</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-[#22c55e]"></div>
                            <span>压力1: {latestOp20.PressPressure_Left?.toFixed(2) || '-'}</span>
                        </div>
                        <div className="flex items-center gap-1 justify-center">
                            <div className="w-2 h-2 rounded-full bg-[#facc15]"></div>
                            <span>压力2: {latestOp20.PressPressure_Right?.toFixed(2) || '-'}</span>
                        </div>
                        <div className="flex items-center gap-1 justify-end">
                            <div className="w-2 h-2 rounded-full bg-[#3b82f6]"></div>
                            <span>压力3: {latestOp20.PressPressure_Back?.toFixed(2) || '-'}</span>
                        </div>
                    </div>
                </div>
                
                {/* Charts */}
                <div className="flex-1 flex flex-col gap-1 min-h-0 z-10">
                    <div className="flex-1 min-h-0 flex flex-col">
                         <div className="flex-1 min-h-0 flex flex-col gap-1">
                            <div className="flex-1 min-h-0">
                                <LineChart 
                                    color={['#22c55e', '#facc15']} 
                                    data={[op20Press1, op20Press2]} 
                                    height="100%" 
                                    grid={{ right: 180, left: 10 }}
                                    yAxisConfig={{ 
                                        min: Math.max(0, Math.floor(config.op20.press12.min - 1)), 
                                        max: Math.ceil(config.op20.press12.max + 1) 
                                    }}
                                    markLine={{
                                        symbol: 'none',
                                        label: { 
                                            show: true, 
                                            position: 'end', 
                                            color: '#d1d5db',
                                            fontSize: 14,
                                            formatter: '{b} {c}' 
                                        },
                                        lineStyle: { color: 'red', type: 'dashed', width: 2 },
                                        data: [
                                            { yAxis: config.op20.press12.max, name: '上限' },
                                            { yAxis: config.op20.press12.min, name: '下限' }
                                        ]
                                    }}
                                />
                            </div>
                            <div className="flex-1 min-h-0">
                                <LineChart 
                                    color={['#3b82f6']} 
                                    data={[op20Press3]} 
                                    height="100%" 
                                    grid={{ right: 180, left: 10 }}
                                    yAxisConfig={{ 
                                        min: Math.max(0, Math.floor(config.op20.press3.min - 1)), 
                                        max: Math.ceil(config.op20.press3.max + 1) 
                                    }}
                                    markLine={{
                                        symbol: 'none',
                                        label: { 
                                            show: true, 
                                            position: 'end', 
                                            color: '#d1d5db',
                                            fontSize: 14,
                                            formatter: '{b} {c}' 
                                        },
                                        lineStyle: { color: 'red', type: 'dashed', width: 2 },
                                        data: [
                                            { yAxis: config.op20.press3.max, name: '上限' },
                                            { yAxis: config.op20.press3.min, name: '下限' }
                                        ]
                                    }}
                                />
                            </div>
                         </div>
                    </div>
                </div>
                

            </div>

            {/* OP30 - Bottom Section */}
            <div className={`flex-[0.8] ${op30Style.bg} ${op30Style.border} rounded-lg p-3 flex flex-col relative overflow-hidden border ${op30Style.shadow} transition-all duration-300`}>
                {/* Scanline Effect */}
                <div className="absolute inset-0 pointer-events-none" style={{
                    backgroundImage: `linear-gradient(transparent 50%, ${op30Style.scanline} 50%)`,
                    backgroundSize: '100% 4px'
                }}></div>

                <div className="flex justify-between items-start mb-2 z-10">
                    <div className="flex items-center gap-2">
                        <CheckCircle size={25} className="text-green-400 drop-shadow-[0_0_5px_#22c55e]" />
                        <span className="font-bold text-[27px] text-white font-[Rajdhani] tracking-wider">OP30 角度检测</span>
                        <div className="text-[21px] text-gray-300 font-[Rajdhani] ml-4">角度趋势</div>
                    </div>
                    {/* Shift Status Indicator */}
                    <div className="flex items-center gap-2 bg-black/20 px-2 py-1 rounded border border-white/10">
                        <span className="text-[17px] text-gray-300 font-mono">标定检测状态</span>
                        <div className={`w-3 h-3 rounded-full ${op30Calibrated ? 'bg-green-500 shadow-[0_0_8px_#22c55e] animate-pulse' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`}></div>
                    </div>
                </div>
                
                {/* Metrics */}
                <div className="flex flex-col gap-2 flex-1 z-10">
                    <div className="flex-1 min-h-0 flex flex-col">
                         <div className="flex-1 min-h-0 flex flex-col gap-1">
                             <div className="flex-[1] min-h-0">
                                 <LineChart 
                                     color={['#22c55e']} 
                                     data={[op30Angle1]} 
                                     height="100%" 
                                     grid={{ right: 180, left: 10 }}
                                    yAxisConfig={{ 
                                        min: Math.floor(config.op30.angle1.min - 1), 
                                        max: Math.ceil(config.op30.angle1.max + 1)
                                    }}
                                     markPoint={{
                                         symbol: 'circle',
                                         symbolSize: 0,
                                         label: {
                                             show: true,
                                       position: 'right',
                                       distance: 130,
                                       formatter: 'CPK:{c}',
                                             color: '#fff',
                                             fontWeight: 'bold',
                                             fontSize: 15,
                                             padding: [6, 12],
                                             borderRadius: 100
                                         },
                                         data: [
                                             { coord: [14, config.op30.angle1.max - 1.0], value: cpkOp30Angle1.cpk, label: { backgroundColor: '#22c55e' } }
                                         ]
                                     }}
                                     markLine={{
                                         symbol: 'none',
                                         label: { 
                                             show: true, 
                                             position: 'end', 
                                             color: '#d1d5db',
                                             fontSize: 14,
                                             formatter: '{b} {c}' 
                                         },
                                         lineStyle: { color: 'red', type: 'dashed', width: 2 },
                                         data: [
                                             { yAxis: config.op30.angle1.max, name: '上限' },
                                             { yAxis: config.op30.angle1.min, name: '下限' }
                                         ]
                                     }}
                                 />
                             </div>
                             <div className="flex-[1] min-h-0">
                                 <LineChart 
                                     color={['#facc15', '#3b82f6']} 
                                     data={[op30Angle2, op30Angle3]} 
                                     height="100%" 
                                     grid={{ right: 180, left: 10 }}
                                     yAxisConfig={{ 
                                         min: Math.floor(config.op30.angle23.min - 1), 
                                         max: Math.ceil(config.op30.angle23.max + 1)
                                     }}
                                     markPoint={{
                                         symbol: 'circle',
                                         symbolSize: 0,
                                         label: {
                                             show: true,
                                             position: 'right',
                                             distance: 130,
                                             formatter: 'CPK:{c}',
                                             color: '#fff',
                                             fontWeight: 'bold',
                                             fontSize: 15,
                                             padding: [6, 12],
                                             borderRadius: 100
                                         },
                                         data: [
                                             { coord: [14, config.op30.angle23.max - 0.5], value: cpkOp30Angle2.cpk, label: { backgroundColor: '#facc15' } },
                                             { coord: [14, config.op30.angle23.min + 0.5], value: cpkOp30Angle3.cpk, label: { backgroundColor: '#3b82f6' } }
                                         ]
                                     }}
                                     markLine={{
                                         symbol: 'none',
                                         label: { 
                                             show: true, 
                                             position: 'end', 
                                             color: '#d1d5db',
                                             fontSize: 14,
                                             formatter: '{b} {c}' 
                                         },
                                         lineStyle: { color: 'red', type: 'dashed', width: 2 },
                                         data: [
                                             { yAxis: config.op30.angle23.max, name: '上限' },
                                             { yAxis: config.op30.angle23.min, name: '下限' }
                                         ]
                                     }}
                                 />
                             </div>
                          </div>
                     </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default AssemblyModule;
