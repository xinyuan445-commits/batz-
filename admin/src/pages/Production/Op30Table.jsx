import React, { useRef } from 'react';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Badge, Button } from 'antd';
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
    search: {
      transform: (value) => {
        return {
          startTime: value[0],
          endTime: value[1],
        };
      },
    },
  },
  {
    title: '产品条码',
    dataIndex: 'Code',
    copyable: true,
    width: 200,
    search: false, // Disable search by code for now
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
    title: '垂直角度 (°)',
    dataIndex: 'Production_Angle_Vertical',
    valueType: 'digit',
    search: false,
    render: (val) => val ? Number(val).toFixed(2) : '-',
  },
  {
    title: '左平行角度 (°)',
    dataIndex: 'Production_Angle_LeftParallel',
    valueType: 'digit',
    search: false,
    render: (val) => val ? Number(val).toFixed(2) : '-',
  },
  {
    title: '右平行角度 (°)',
    dataIndex: 'Production_Angle_RightParallel',
    valueType: 'digit',
    search: false,
    render: (val) => val ? Number(val).toFixed(2) : '-',
  },
  {
    title: '垂直结果',
    dataIndex: 'Production_AngleResult_Vertical',
    width: 100,
    search: false,
    render: (val) => <Badge status={val === 1 ? 'success' : 'error'} text={val === 1 ? 'OK' : 'NG'} />,
  },
  {
    title: '左平行结果',
    dataIndex: 'Production_AngleResult_LeftParallel',
    width: 100,
    search: false,
    render: (val) => <Badge status={val === 1 ? 'success' : 'error'} text={val === 1 ? 'OK' : 'NG'} />,
  },
  {
    title: '右平行结果',
    dataIndex: 'Production_AngleResult_RightParallel',
    width: 100,
    search: false,
    render: (val) => <Badge status={val === 1 ? 'success' : 'error'} text={val === 1 ? 'OK' : 'NG'} />,
  },
];

const Op30Table = () => {
  const actionRef = useRef();

  // Export to Excel function
  const exportToExcel = async () => {
    try {
        const response = await axios.get('http://localhost:3001/api/admin/production/op30', {
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
                '垂直角度': item.Production_Angle_Vertical,
                '左平行角度': item.Production_Angle_LeftParallel,
                '右平行角度': item.Production_Angle_RightParallel,
                '垂直结果': item.Production_AngleResult_Vertical === 1 ? 'OK' : 'NG',
                '左平行结果': item.Production_AngleResult_LeftParallel === 1 ? 'OK' : 'NG',
                '右平行结果': item.Production_AngleResult_RightParallel === 1 ? 'OK' : 'NG',
            }));

            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "OP30数据");
            XLSX.writeFile(wb, `OP30_生产数据_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`);
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
        headerTitle="OP30 角度检测记录"
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
            const response = await axios.get('http://localhost:3001/api/admin/production/op30', {
              params: {
                current: params.current,
                pageSize: params.pageSize,
                startTime: params.CreatedTime?.[0], // Antd ProTable passes date range array
                endTime: params.CreatedTime?.[1],
                status: params.ProductStatus, // 传递状态查询参数
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
        columns={columns}
        dateFormatter="string"
      />
    </PageContainer>
  );
};

export default Op30Table;