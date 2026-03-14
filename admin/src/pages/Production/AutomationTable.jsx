import React, { useRef } from 'react';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Badge, Button } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

// Define table columns for Automation Data
const columns = [
  {
    title: '生产时间',
    dataIndex: 'CreatedTime',
    valueType: 'dateRange',
    sorter: true,
    width: 180,
    render: (_, record) => dayjs(record.CreatedTime).format('YYYY-MM-DD HH:mm:ss'),
  },
  {
    title: '批次组号',
    dataIndex: 'GroupId',
    width: 120,
    search: false,
  },
  {
    title: '产品条码',
    dataIndex: 'PartNumber',
    copyable: true,
    width: 200,
    search: {
        name: 'code' // Map to 'code' param in API
    }
  },
  {
    title: '状态',
    dataIndex: 'IsOk',
    width: 100,
    valueEnum: {
      true: { text: 'OK', status: 'Success' },
      false: { text: 'NG', status: 'Error' },
      
    },
    render: (_, record) => (
      <Badge 
        status={record.IsOk ? 'success' : 'error'} 
        text={record.IsOk ? 'OK' : 'NG'} 
      />
    ),
  },
  {
    title: '循环时间 (s)',
    dataIndex: 'tmCycleTime',
    valueType: 'digit',
    search: false,
    render: (_, record) => record.tmCycleTime != null ? Number(record.tmCycleTime).toFixed(2) : '-',
  },
  {
    title: '射出尖压',
    dataIndex: 'tmInjMaxPress',
    valueType: 'digit',
    search: false,
    render: (_, record) => record.tmInjMaxPress != null ? Number(record.tmInjMaxPress).toFixed(2) : '-',
  },
  {
    title: '储料尖压',
    dataIndex: 'tmChargeMaxPress',
    valueType: 'digit',
    search: false,
    render: (_, record) => record.tmChargeMaxPress != null ? Number(record.tmChargeMaxPress).toFixed(2) : '-',
  },
  {
    title: '温度1 (°C)',
    dataIndex: 'tmTemp1_Current',
    valueType: 'digit',
    search: false,
    render: (_, record) => record.tmTemp1_Current != null ? Number(record.tmTemp1_Current).toFixed(1) : '-',
  },
  {
    title: '温度2 (°C)',
    dataIndex: 'tmTemp2_Current',
    valueType: 'digit',
    search: false,
    render: (_, record) => record.tmTemp2_Current != null ? Number(record.tmTemp2_Current).toFixed(1) : '-',
  },
  {
    title: '温度3 (°C)',
    dataIndex: 'tmTemp3_Current',
    valueType: 'digit',
    search: false,
    render: (_, record) => record.tmTemp3_Current != null ? Number(record.tmTemp3_Current).toFixed(1) : '-',
  },
  {
    title: '温度4 (°C)',
    dataIndex: 'tmTemp4_Current',
    valueType: 'digit',
    search: false,
    render: (_, record) => record.tmTemp4_Current != null ? Number(record.tmTemp4_Current).toFixed(1) : '-',
  },
  // Hidden columns (available in column settings)
  {
    title: '已打印',
    dataIndex: 'IsPrinted',
    valueType: 'select',
    valueEnum: { true: { text: '是' }, false: { text: '否' } },
    search: false,
  },
  {
    title: '关模时间 (s)',
    dataIndex: 'tmClpClsTime',
    valueType: 'digit',
    search: false,
  },
  {
    title: '射出时间 (s)',
    dataIndex: 'tmInjTime',
    valueType: 'digit',
    search: false,
  },
  {
    title: '转保压时间 (s)',
    dataIndex: 'tmTurnTime',
    valueType: 'digit',
    search: false,
  },
  {
    title: '储料时间 (s)',
    dataIndex: 'tmChargeTime',
    valueType: 'digit',
    search: false,
  },
  {
    title: '开模时间 (s)',
    dataIndex: 'tmClpOpnTime',
    valueType: 'digit',
    search: false,
  },
  {
    title: '射退时间 (s)',
    dataIndex: 'tmInjBackTime',
    valueType: 'digit',
    search: false,
  },
  {
    title: '托模时间 (s)',
    dataIndex: 'tmEjectTime',
    valueType: 'digit',
    search: false,
  },
  {
    title: '取件时间 (s)',
    dataIndex: 'tmFetchTime',
    valueType: 'digit',
    search: false,
  },
  {
    title: '冷却时间 (s)',
    dataIndex: 'tmCoolingTime',
    valueType: 'digit',
    search: false,
  },
  {
    title: '开模位置',
    dataIndex: 'tmClpOpnPosi',
    valueType: 'digit',
    search: false,
  },
  {
    title: '射出起点',
    dataIndex: 'tmInjStartPosi',
    valueType: 'digit',
    search: false,
  },
  {
    title: '射出终点',
    dataIndex: 'tmInjEndPosi',
    valueType: 'digit',
    search: false,
  },
  {
    title: '转保压位置',
    dataIndex: 'tmTurnPosi',
    valueType: 'digit',
    search: false,
  },
  {
    title: '转保压压力',
    dataIndex: 'tmTurnPress',
    valueType: 'digit',
    search: false,
  },
  {
    title: '温度5 (°C)',
    dataIndex: 'tmTemp5_Current',
    valueType: 'digit',
    search: false,
  },
  {
    title: '温度6 (°C)',
    dataIndex: 'tmTemp6_Current',
    valueType: 'digit',
    search: false,
  },
  {
    title: '温度7 (°C)',
    dataIndex: 'tmTemp7_Current',
    valueType: 'digit',
    search: false,
  },
  {
    title: '温度8 (°C)',
    dataIndex: 'tmTemp8_Current',
    valueType: 'digit',
    search: false,
  },
  {
    title: '温度9 (°C)',
    dataIndex: 'tmTemp9_Current',
    valueType: 'digit',
    search: false,
  },
];

const AutomationTable = () => {
  const actionRef = useRef();

  // Export to Excel function
  const exportToExcel = async () => {
    try {
        const response = await axios.get('http://localhost:3001/api/admin/production/automation', {
            params: {
                current: 1,
                pageSize: 1000, // Export limit
            }
        });

        if (response.data.success) {
            const data = response.data.data.map(item => ({
                '生产时间': dayjs(item.CreatedTime).format('YYYY-MM-DD HH:mm:ss'),
                '批次组号': item.GroupId,
                '产品条码': item.PartNumber,
                '状态': item.IsOk ? 'OK' : 'NG',
                '已打印': item.IsPrinted ? '是' : '否',
                '循环时间': item.tmCycleTime,
                '射出尖压': item.tmInjMaxPress,
                '储料尖压': item.tmChargeMaxPress,
                '温度1': item.tmTemp1_Current,
                '温度2': item.tmTemp2_Current,
                '温度3': item.tmTemp3_Current,
                '温度4': item.tmTemp4_Current,
                '温度5': item.tmTemp5_Current,
                '温度6': item.tmTemp6_Current,
                '温度7': item.tmTemp7_Current,
                '温度8': item.tmTemp8_Current,
                '温度9': item.tmTemp9_Current,
                '关模时间': item.tmClpClsTime,
                '射出时间': item.tmInjTime,
                '转保压时间': item.tmTurnTime,
                '储料时间': item.tmChargeTime,
                '开模时间': item.tmClpOpnTime,
                '射退时间': item.tmInjBackTime,
                '托模时间': item.tmEjectTime,
                '取件时间': item.tmFetchTime,
                '冷却时间': item.tmCoolingTime,
                '开模位置': item.tmClpOpnPosi,
                '射出起点': item.tmInjStartPosi,
                '射出终点': item.tmInjEndPosi,
                '转保压位置': item.tmTurnPosi,
                '转保压压力': item.tmTurnPress,
            }));

            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "自动化数据");
            XLSX.writeFile(wb, `自动化_生产数据_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`);
        }
    } catch (error) {
        console.error('Export failed:', error);
    }
  };

  return (
    <PageContainer
      ghost
      header={{
        title: '生产数据',
        breadcrumb: {},
      }}
      style={{
        padding: 0,
        margin: 0,
        width: '100%',
        maxWidth: '100%',
      }}
      contentWidth="Fluid"
    >
      <ProTable
        headerTitle="自动化注塑记录"
        actionRef={actionRef}
        rowKey="CreatedTime" 
        search={{
          labelWidth: 'auto',
        }}
        toolBarRender={() => [
            <Button key="export" type="primary" icon={<DownloadOutlined />} onClick={exportToExcel}>
              导出 Excel
            </Button>,
        ]}
        cardBordered
        pagination={{
          defaultPageSize: 20,
          showSizeChanger: true,
        }}
        request={async (params, sort, filter) => {
          try {
            // Check if date filter is applied. If not, default to current day
            let startTime = params.CreatedTime?.[0];
            let endTime = params.CreatedTime?.[1];

            // If no date range is selected, default to today
            if (!startTime && !endTime) {
               startTime = dayjs().startOf('day').format('YYYY-MM-DD HH:mm:ss');
               endTime = dayjs().endOf('day').format('YYYY-MM-DD HH:mm:ss');
            } else {
               // If date range is selected, format it properly
               startTime = dayjs(startTime).startOf('day').format('YYYY-MM-DD HH:mm:ss');
               endTime = dayjs(endTime).endOf('day').format('YYYY-MM-DD HH:mm:ss');
            }

            const response = await axios.get('http://localhost:3001/api/admin/production/automation', {
              params: {
                current: params.current,
                pageSize: params.pageSize,
                startTime: startTime, 
                endTime: endTime,
                status: params.IsOk, // 传递状态查询参数
                code: params.PartNumber // Pass code search
              },
            });
            
            return {
              data: response.data.data,
              success: true,
              total: response.data.total,
            };
          } catch (error) {
            console.error('Fetch error:', error);
            return {
              data: [],
              success: false,
              total: 0,
            };
          }
        }}
        form={{
          // Set initial values for the search form to show today's date by default
          initialValues: {
            CreatedTime: [dayjs().startOf('day'), dayjs().endOf('day')],
          },
        }}
        columns={columns}
        dateFormatter="string"
      />
    </PageContainer>
  );
};

export default AutomationTable;