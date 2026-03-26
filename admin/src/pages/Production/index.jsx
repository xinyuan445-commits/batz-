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
    title: '直径1 (mm)',
    dataIndex: 'Production_Circle1_Diameter',
    valueType: 'digit',
    search: false,
    render: (_, record) => record.Production_Circle1_Diameter != null ? Number(record.Production_Circle1_Diameter).toFixed(3) : '-',
  },
  {
    title: '直径2 (mm)',
    dataIndex: 'Production_Circle2_Diameter',
    valueType: 'digit',
    search: false,
    render: (_, record) => record.Production_Circle2_Diameter != null ? Number(record.Production_Circle2_Diameter).toFixed(3) : '-',
  },
  {
    title: '直径3 (mm)',
    dataIndex: 'Production_Circle3_Diameter',
    valueType: 'digit',
    search: false,
    render: (_, record) => record.Production_Circle3_Diameter != null ? Number(record.Production_Circle3_Diameter).toFixed(3) : '-',
  },
  {
    title: '圆心距1 (mm)',
    dataIndex: 'Production_CenterDist1',
    valueType: 'digit',
    search: false,
    render: (_, record) => record.Production_CenterDist1 != null ? Number(record.Production_CenterDist1).toFixed(3) : '-',
  },
  {
    title: '圆心距2 (mm)',
    dataIndex: 'Production_CenterDist2',
    valueType: 'digit',
    search: false,
    render: (_, record) => record.Production_CenterDist2 != null ? Number(record.Production_CenterDist2).toFixed(3) : '-',
  },
  {
    title: '圆心距3 (mm)',
    dataIndex: 'Production_CenterDist3',
    valueType: 'digit',
    search: false,
    render: (_, record) => record.Production_CenterDist3 != null ? Number(record.Production_CenterDist3).toFixed(3) : '-',
  },
  {
    title: '视觉结果',
    dataIndex: 'Production_PhotoResult1',
    search: false,
    width: 120,
    render: (_, record) => {
        const r1 = record.Production_PhotoResult1 === 1;
        const r2 = record.Production_PhotoResult2 === 1;
        const r3 = record.Production_PhotoResult3 === 1;
        const allOk = r1 && r2 && r3;
        
        return (
            <Tooltip title={`R1:${r1?'OK':'NG'} R2:${r2?'OK':'NG'} R3:${r3?'OK':'NG'}`}>
                <Tag color={allOk ? 'green' : 'red'}>{allOk ? '全部通过' : '存在异常'}</Tag>
            </Tooltip>
        );
    }
  },
  // Calibration OK Fields (Hidden by default)
  { title: '标定OK拍照1', dataIndex: 'CalibOK_PhotoResult1', search: false, hideInTable: true },
  { title: '标定OK拍照2', dataIndex: 'CalibOK_PhotoResult2', search: false, hideInTable: true },
  { title: '标定OK拍照3', dataIndex: 'CalibOK_PhotoResult3', search: false, hideInTable: true },
  { title: '标定OK直径1', dataIndex: 'CalibOK_Circle1_Diameter', search: false, hideInTable: true },
  { title: '标定OK直径2', dataIndex: 'CalibOK_Circle2_Diameter', search: false, hideInTable: true },
  { title: '标定OK直径3', dataIndex: 'CalibOK_Circle3_Diameter', search: false, hideInTable: true },
  { title: '标定OK圆心距1', dataIndex: 'CalibOK_CenterDist1', search: false, hideInTable: true },
  { title: '标定OK圆心距2', dataIndex: 'CalibOK_CenterDist2', search: false, hideInTable: true },
  { title: '标定OK圆心距3', dataIndex: 'CalibOK_CenterDist3', search: false, hideInTable: true },
  // Calibration NG Fields (Hidden by default)
  { title: '标定NG拍照1', dataIndex: 'CalibNG_PhotoResult1', search: false, hideInTable: true },
  { title: '标定NG拍照2', dataIndex: 'CalibNG_PhotoResult2', search: false, hideInTable: true },
  { title: '标定NG拍照3', dataIndex: 'CalibNG_PhotoResult3', search: false, hideInTable: true },
  { title: '标定NG直径1', dataIndex: 'CalibNG_Circle1_Diameter', search: false, hideInTable: true },
  { title: '标定NG直径2', dataIndex: 'CalibNG_Circle2_Diameter', search: false, hideInTable: true },
  { title: '标定NG直径3', dataIndex: 'CalibNG_Circle3_Diameter', search: false, hideInTable: true },
  { title: '标定NG圆心距1', dataIndex: 'CalibNG_CenterDist1', search: false, hideInTable: true },
  { title: '标定NG圆心距2', dataIndex: 'CalibNG_CenterDist2', search: false, hideInTable: true },
  { title: '标定NG圆心距3', dataIndex: 'CalibNG_CenterDist3', search: false, hideInTable: true },
];

const Op10Table = () => {
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

        const response = await axios.get('http://localhost:3001/api/admin/production/op10', {
            params: {
                current: 1,
                pageSize: 10000, // Export up to 10000 records that match the filter
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
                '直径1': item.Production_Circle1_Diameter,
                '直径2': item.Production_Circle2_Diameter,
                '直径3': item.Production_Circle3_Diameter,
                '圆心距1': item.Production_CenterDist1,
                '圆心距2': item.Production_CenterDist2,
                '圆心距3': item.Production_CenterDist3,
                '标定OK_拍照1': item.CalibOK_PhotoResult1,
                '标定OK_拍照2': item.CalibOK_PhotoResult2,
                '标定OK_拍照3': item.CalibOK_PhotoResult3,
                '标定OK_直径1': item.CalibOK_Circle1_Diameter,
                '标定OK_直径2': item.CalibOK_Circle2_Diameter,
                '标定OK_直径3': item.CalibOK_Circle3_Diameter,
                '标定OK_圆心距1': item.CalibOK_CenterDist1,
                '标定OK_圆心距2': item.CalibOK_CenterDist2,
                '标定OK_圆心距3': item.CalibOK_CenterDist3,
                '标定NG_拍照1': item.CalibNG_PhotoResult1,
                '标定NG_拍照2': item.CalibNG_PhotoResult2,
                '标定NG_拍照3': item.CalibNG_PhotoResult3,
                '标定NG_直径1': item.CalibNG_Circle1_Diameter,
                '标定NG_直径2': item.CalibNG_Circle2_Diameter,
                '标定NG_直径3': item.CalibNG_Circle3_Diameter,
                '标定NG_圆心距1': item.CalibNG_CenterDist1,
                '标定NG_圆心距2': item.CalibNG_CenterDist2,
                '标定NG_圆心距3': item.CalibNG_CenterDist3,
            }));

            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "OP10数据");
            XLSX.writeFile(wb, `OP10_生产数据_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`);
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
        headerTitle="OP10 尺寸测量记录"
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
               // Ensure we cover the full range from start of first day to end of last day
               startTime = dayjs(startTime).startOf('day').format('YYYY-MM-DD HH:mm:ss');
               endTime = dayjs(endTime).endOf('day').format('YYYY-MM-DD HH:mm:ss');
            }

            const response = await axios.get('http://localhost:3001/api/admin/production/op10', {
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

export default Op10Table;
