import React, { useRef } from 'react';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Tag, Badge, Tooltip, Button } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

// Define table columns
const columns = [
  {
    title: '生产时间',
    dataIndex: 'CreatedTime',
    valueType: 'dateRange', // Use dateRange for search
    sorter: true,
    width: 180,
    render: (_, record) => dayjs(record.CreatedTime).format('YYYY-MM-DD HH:mm:ss'),
  },
  {
    title: '产品条码',
    dataIndex: 'Code',
    copyable: true,
    width: 200,
    search: true, // Enable search by code
  },
  {
    title: '状态',
    dataIndex: 'ProductStatus',
    width: 100,
    valueEnum: {
      1: { text: 'OK', status: 'Success' },
      2: { text: 'NG', status: 'Error' },
    },
    render: (_, record) => (
      <Badge 
        status={record.ProductStatus === 1 ? 'success' : 'error'} 
        text={record.ProductStatus === 1 ? 'OK' : 'NG'} 
      />
    ),
  },
  {
    title: '压装压力 左 (kN)',
    dataIndex: 'PressPressure_Left',
    valueType: 'digit',
    search: false,
    render: (_, record) => record.PressPressure_Left != null ? Number(record.PressPressure_Left).toFixed(2) : '-',
  },
  {
    title: '压装位移 左 (mm)',
    dataIndex: 'PressDisplacement_Left',
    valueType: 'digit',
    search: false,
    render: (_, record) => record.PressDisplacement_Left != null ? Number(record.PressDisplacement_Left).toFixed(2) : '-',
  },
  {
    title: '压装结果 左',
    dataIndex: 'PressResult_Left',
    width: 100,
    search: false,
    render: (_, record) => (
      <Tag color={record.PressResult_Left === 1 ? 'green' : 'red'}>
        {record.PressResult_Left === 1 ? 'OK' : 'NG'}
      </Tag>
    ),
  },
  {
    title: '压装压力 右 (kN)',
    dataIndex: 'PressPressure_Right',
    valueType: 'digit',
    search: false,
    render: (_, record) => record.PressPressure_Right != null ? Number(record.PressPressure_Right).toFixed(2) : '-',
  },
  {
    title: '压装位移 右 (mm)',
    dataIndex: 'PressDisplacement_Right',
    valueType: 'digit',
    search: false,
    render: (_, record) => record.PressDisplacement_Right != null ? Number(record.PressDisplacement_Right).toFixed(2) : '-',
  },
  {
    title: '压装结果 右',
    dataIndex: 'PressResult_Right',
    width: 100,
    search: false,
    render: (_, record) => (
      <Tag color={record.PressResult_Right === 1 ? 'green' : 'red'}>
        {record.PressResult_Right === 1 ? 'OK' : 'NG'}
      </Tag>
    ),
  },
  {
    title: '压装压力 后 (kN)',
    dataIndex: 'PressPressure_Back',
    valueType: 'digit',
    search: false,
    render: (_, record) => record.PressPressure_Back != null ? Number(record.PressPressure_Back).toFixed(2) : '-',
  },
  {
    title: '压装位移 后 (mm)',
    dataIndex: 'PressDisplacement_Back',
    valueType: 'digit',
    search: false,
    render: (_, record) => record.PressDisplacement_Back != null ? Number(record.PressDisplacement_Back).toFixed(2) : '-',
  },
  {
    title: '压装结果 后',
    dataIndex: 'PressResult_Back',
    width: 100,
    search: false,
    render: (_, record) => (
      <Tag color={record.PressResult_Back === 1 ? 'green' : 'red'}>
        {record.PressResult_Back === 1 ? 'OK' : 'NG'}
      </Tag>
    ),
  },
];

const Op20Table = () => {
  const actionRef = useRef();

  // Export to Excel function
  const exportToExcel = async () => {
    try {
        const response = await axios.get('http://localhost:3001/api/admin/production/op20', {
            params: {
                current: 1,
                pageSize: 1000, // Export limit
            }
        });

        if (response.data.success) {
            const data = response.data.data.map(item => ({
                '生产时间': dayjs(item.CreatedTime).format('YYYY-MM-DD HH:mm:ss'),
                '产品条码': item.Code,
                '状态': item.ProductStatus === 1 ? 'OK' : 'NG',
                '左-压力(kN)': item.PressPressure_Left,
                '左-位移(mm)': item.PressDisplacement_Left,
                '左-结果': item.PressResult_Left === 1 ? 'OK' : 'NG',
                '右-压力(kN)': item.PressPressure_Right,
                '右-位移(mm)': item.PressDisplacement_Right,
                '右-结果': item.PressResult_Right === 1 ? 'OK' : 'NG',
                '后-压力(kN)': item.PressPressure_Back,
                '后-位移(mm)': item.PressDisplacement_Back,
                '后-结果': item.PressResult_Back === 1 ? 'OK' : 'NG',
            }));

            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "OP20数据");
            XLSX.writeFile(wb, `OP20_生产数据_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`);
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
        headerTitle="OP20 压装记录"
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

            const response = await axios.get('http://localhost:3001/api/admin/production/op20', {
              params: {
                current: params.current,
                pageSize: params.pageSize,
                startTime: startTime, 
                endTime: endTime,
                status: params.ProductStatus,
                code: params.Code, // 传递条码查询参数
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

export default Op20Table;
