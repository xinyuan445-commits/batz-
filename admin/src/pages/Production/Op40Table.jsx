import React, { useRef } from 'react';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Button } from 'antd';
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
    title: '包装工站',
    dataIndex: 'Station',
    width: 150,
    search: false,
  }
];

const Op40Table = () => {
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

        const response = await axios.get('http://localhost:3001/api/admin/production/op40', {
            params: {
                current: 1,
                pageSize: 10000, // Export up to 10000 records that match the filter
                startTime: startTime,
                endTime: endTime,
                code: formValues.Code,
            }
        });

        if (response.data.success) {
            const data = response.data.data.map(item => ({
                '生产时间': dayjs(item.CreatedTime).format('YYYY-MM-DD HH:mm:ss'),
                '产品条码': item.Code,
                '包装工站': item.Station
            }));

            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "OP40包装数据");
            XLSX.writeFile(wb, `OP40_包装数据_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`);
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
        headerTitle="OP40 包装记录"
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

            const response = await axios.get('http://localhost:3001/api/admin/production/op40', {
              params: {
                current: params.current,
                pageSize: params.pageSize,
                startTime: startTime, 
                endTime: endTime,
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

export default Op40Table;
