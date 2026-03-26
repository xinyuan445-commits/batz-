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
    title: '垂直角度 (°)',
    dataIndex: 'Production_Angle_Vertical',
    valueType: 'digit',
    search: false,
    render: (_, record) => record.Production_Angle_Vertical != null ? Number(record.Production_Angle_Vertical).toFixed(2) : '-',
  },
  {
    title: '左平行角度 (°)',
    dataIndex: 'Production_Angle_LeftParallel',
    valueType: 'digit',
    search: false,
    render: (_, record) => record.Production_Angle_LeftParallel != null ? Number(record.Production_Angle_LeftParallel).toFixed(2) : '-',
  },
  {
    title: '右平行角度 (°)',
    dataIndex: 'Production_Angle_RightParallel',
    valueType: 'digit',
    search: false,
    render: (_, record) => record.Production_Angle_RightParallel != null ? Number(record.Production_Angle_RightParallel).toFixed(2) : '-',
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
  // Calibration OK Fields (Hidden by default)
  { title: '标定OK拍照1', dataIndex: 'CalibOK_PhotoResult1', search: false, hideInTable: true },
  { title: '标定OK拍照2', dataIndex: 'CalibOK_PhotoResult2', search: false, hideInTable: true },
  { title: '标定OK拍照3', dataIndex: 'CalibOK_PhotoResult3', search: false, hideInTable: true },
  { title: '标定OK拍照4', dataIndex: 'CalibOK_PhotoResult4', search: false, hideInTable: true },
  { title: '标定OK垂直结果', dataIndex: 'CalibOK_AngleResult_Vertical', search: false, hideInTable: true },
  { title: '标定OK左平行结果', dataIndex: 'CalibOK_AngleResult_LeftParallel', search: false, hideInTable: true },
  { title: '标定OK右平行结果', dataIndex: 'CalibOK_AngleResult_RightParallel', search: false, hideInTable: true },
  { title: '标定OK垂直角度', dataIndex: 'CalibOK_Angle_Vertical', search: false, hideInTable: true },
  { title: '标定OK左平行角度', dataIndex: 'CalibOK_Angle_LeftParallel', search: false, hideInTable: true },
  { title: '标定OK右平行角度', dataIndex: 'CalibOK_Angle_RightParallel', search: false, hideInTable: true },
  // Calibration NG Fields (Hidden by default)
  { title: '标定NG拍照1', dataIndex: 'CalibNG_PhotoResult1', search: false, hideInTable: true },
  { title: '标定NG拍照2', dataIndex: 'CalibNG_PhotoResult2', search: false, hideInTable: true },
  { title: '标定NG拍照3', dataIndex: 'CalibNG_PhotoResult3', search: false, hideInTable: true },
  { title: '标定NG拍照4', dataIndex: 'CalibNG_PhotoResult4', search: false, hideInTable: true },
  { title: '标定NG垂直结果', dataIndex: 'CalibNG_AngleResult_Vertical', search: false, hideInTable: true },
  { title: '标定NG左平行结果', dataIndex: 'CalibNG_AngleResult_LeftParallel', search: false, hideInTable: true },
  { title: '标定NG右平行结果', dataIndex: 'CalibNG_AngleResult_RightParallel', search: false, hideInTable: true },
  { title: '标定NG垂直角度', dataIndex: 'CalibNG_Angle_Vertical', search: false, hideInTable: true },
  { title: '标定NG左平行角度', dataIndex: 'CalibNG_Angle_LeftParallel', search: false, hideInTable: true },
  { title: '标定NG右平行角度', dataIndex: 'CalibNG_Angle_RightParallel', search: false, hideInTable: true },
];

const Op30Table = () => {
  const actionRef = useRef();
  const formRef = useRef();

  // Export to Excel function
  const exportToExcel = async () => {
    try {
        const formValues = formRef.current?.getFieldsValue() || {};
        
        let startTime = formValues.CreatedTime?.[0];
        let endTime = formValues.CreatedTime?.[1];

        if (!startTime && !endTime) {
           startTime = dayjs().startOf('day').format('YYYY-MM-DD HH:mm:ss');
           endTime = dayjs().endOf('day').format('YYYY-MM-DD HH:mm:ss');
        } else {
           startTime = dayjs(startTime).startOf('day').format('YYYY-MM-DD HH:mm:ss');
           endTime = dayjs(endTime).endOf('day').format('YYYY-MM-DD HH:mm:ss');
        }

        const response = await axios.get('http://localhost:3001/api/admin/production/op30', {
            params: {
                current: 1,
                pageSize: 10000, // Export limit
                startTime: startTime,
                endTime: endTime,
                status: formValues.ProductStatus,
                code: formValues.Code,
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
                '标定OK_拍照1': item.CalibOK_PhotoResult1,
                '标定OK_拍照2': item.CalibOK_PhotoResult2,
                '标定OK_拍照3': item.CalibOK_PhotoResult3,
                '标定OK_拍照4': item.CalibOK_PhotoResult4,
                '标定OK_垂直结果': item.CalibOK_AngleResult_Vertical,
                '标定OK_左平行结果': item.CalibOK_AngleResult_LeftParallel,
                '标定OK_右平行结果': item.CalibOK_AngleResult_RightParallel,
                '标定OK_垂直角度': item.CalibOK_Angle_Vertical,
                '标定OK_左平行角度': item.CalibOK_Angle_LeftParallel,
                '标定OK_右平行角度': item.CalibOK_Angle_RightParallel,
                '标定NG_拍照1': item.CalibNG_PhotoResult1,
                '标定NG_拍照2': item.CalibNG_PhotoResult2,
                '标定NG_拍照3': item.CalibNG_PhotoResult3,
                '标定NG_拍照4': item.CalibNG_PhotoResult4,
                '标定NG_垂直结果': item.CalibNG_AngleResult_Vertical,
                '标定NG_左平行结果': item.CalibNG_AngleResult_LeftParallel,
                '标定NG_右平行结果': item.CalibNG_AngleResult_RightParallel,
                '标定NG_垂直角度': item.CalibNG_Angle_Vertical,
                '标定NG_左平行角度': item.CalibNG_Angle_LeftParallel,
                '标定NG_右平行角度': item.CalibNG_Angle_RightParallel,
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
        formRef={formRef}
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

            const response = await axios.get('http://localhost:3001/api/admin/production/op30', {
              params: {
                current: params.current,
                pageSize: params.pageSize,
                startTime: startTime, 
                endTime: endTime,
                status: params.ProductStatus, // 传递状态查询参数
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

export default Op30Table;