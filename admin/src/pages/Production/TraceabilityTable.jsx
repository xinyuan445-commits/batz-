import React, { useRef } from 'react';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Badge, Tag, Button } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

// Define table columns
const columns = [
  {
    title: '来源',
    dataIndex: 'Source',
    valueType: 'select',
    width: 100,
    valueEnum: {
      'OP10': { text: 'OP10', status: 'Processing' },
      'OP20': { text: 'OP20', status: 'Processing' },
      'OP30': { text: 'OP30', status: 'Processing' },
      'Automation': { text: '自动化', status: 'Processing' },
    },
  },
  {
    title: '生产时间',
    dataIndex: 'CreatedTime',
    valueType: 'dateTime',
    sorter: true,
    width: 180,
    render: (_, record) => dayjs(record.CreatedTime).format('YYYY-MM-DD HH:mm:ss'),
  },
  {
    title: '产品条码',
    dataIndex: 'Code',
    copyable: true,
    width: 200,
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
    title: '详细信息',
    key: 'details',
    search: false,
    render: (_, record) => {
        if (record.Source === 'OP10') {
            const r1 = record.Production_PhotoResult1 === 1;
            const r2 = record.Production_PhotoResult2 === 1;
            const r3 = record.Production_PhotoResult3 === 1;
            
            const formatNum = (val) => val != null ? Number(val).toFixed(3) : '-';
            
            return (
                <div style={{ fontSize: 12, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                   <div>视觉结果: <Tag color={r1&&r2&&r3 ? 'green' : 'red'}>{r1&&r2&&r3 ? 'OK' : 'NG'}</Tag></div>
                   <div style={{ color: '#666' }}>
                     直径: {formatNum(record.Production_Circle1_Diameter)} / {formatNum(record.Production_Circle2_Diameter)} / {formatNum(record.Production_Circle3_Diameter)} mm
                   </div>
                   <div style={{ color: '#666' }}>
                     圆心距: {formatNum(record.Production_CenterDist1)} / {formatNum(record.Production_CenterDist2)} / {formatNum(record.Production_CenterDist3)} mm
                   </div>
                </div>
            );
        } else if (record.Source === 'OP20') {
            const r1 = record.PressResult_Left === 1;
            const r2 = record.PressResult_Right === 1;
            const r3 = record.PressResult_Back === 1;
            
            const formatNum = (val) => val != null ? Number(val).toFixed(2) : '-';
            
            return (
                <div style={{ fontSize: 12, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                   <div>
                     压装结果: 左<Tag color={r1 ? 'green' : 'red'}>{r1 ? 'OK' : 'NG'}</Tag> 
                     右<Tag color={r2 ? 'green' : 'red'}>{r2 ? 'OK' : 'NG'}</Tag> 
                     后<Tag color={r3 ? 'green' : 'red'}>{r3 ? 'OK' : 'NG'}</Tag>
                   </div>
                   <div style={{ color: '#666', display: 'grid', gridTemplateColumns: 'auto auto', gap: '2px 8px' }}>
                     <span>左压力: {formatNum(record.PressPressure_Left)} kN</span>
                     <span>左位移: {formatNum(record.PressDisplacement_Left)} mm</span>
                     <span>右压力: {formatNum(record.PressPressure_Right)} kN</span>
                     <span>右位移: {formatNum(record.PressDisplacement_Right)} mm</span>
                     <span>后压力: {formatNum(record.PressPressure_Back)} kN</span>
                     <span>后位移: {formatNum(record.PressDisplacement_Back)} mm</span>
                   </div>
                </div>
            );
        } else if (record.Source === 'OP30') {
            const r1 = record.Production_AngleResult_Vertical === 1;
            const r2 = record.Production_AngleResult_LeftParallel === 1;
            const r3 = record.Production_AngleResult_RightParallel === 1;
            
            const formatNum = (val) => val != null ? Number(val).toFixed(2) : '-';
            
            return (
                <div style={{ fontSize: 12, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                   <div>
                     角度结果: 垂<Tag color={r1 ? 'green' : 'red'}>{r1 ? 'OK' : 'NG'}</Tag> 
                     左<Tag color={r2 ? 'green' : 'red'}>{r2 ? 'OK' : 'NG'}</Tag> 
                     右<Tag color={r3 ? 'green' : 'red'}>{r3 ? 'OK' : 'NG'}</Tag>
                   </div>
                   <div style={{ color: '#666' }}>
                     垂直: {formatNum(record.Production_Angle_Vertical)}° | 
                     左平行: {formatNum(record.Production_Angle_LeftParallel)}° | 
                     右平行: {formatNum(record.Production_Angle_RightParallel)}°
                   </div>
                </div>
            );
        } else if (record.Source === 'Automation') {
             return (
                <div style={{ fontSize: 12 }}>
                   批次: {record.GroupId || '-'}
                </div>
            );
        }
        return '-';
    }
  }
];

const TraceabilityTable = () => {
  const actionRef = useRef();

  // Export to Excel function
  const exportToExcel = async () => {
     // Not implemented for this view yet as it depends on search results
     message.info('请先搜索条码后导出');
  };

  return (
    <PageContainer
      ghost
      header={{
        title: '条码追溯查询',
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
        headerTitle="追溯记录"
        actionRef={actionRef}
        rowKey={(record) => record.Source + record.CreatedTime} 
        search={{
          labelWidth: 'auto',
          filterType: 'light',
        }}
        toolBarRender={() => [
        //    <Button key="export" type="primary" icon={<DownloadOutlined />} onClick={exportToExcel}>
        //      导出 Excel
        //    </Button>,
        ]}
        cardBordered
        pagination={false} // Disable pagination for timeline view, or enable client-side pagination
        request={async (params, sort, filter) => {
          // If no code is provided, return empty
          if (!params.Code) {
              return {
                  data: [],
                  success: true,
                  total: 0
              };
          }

          try {
            const response = await axios.get('http://localhost:3001/api/admin/traceability', {
              params: {
                code: params.Code, 
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

export default TraceabilityTable;
