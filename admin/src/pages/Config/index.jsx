import React, { useState, useEffect } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Card, Form, InputNumber, Button, message, Space, Row, Col, Typography } from 'antd';
import axios from 'axios';

const { Title, Text } = Typography;

const DashboardConfig = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch current config
  const fetchConfig = async () => {
    setLoading(true);
    try {
      // In production (packaged exe), admin runs on 5173 but API is on 3001
      // We need to explicitly point to the API port, or use the proxy in dev
      const apiUrl = process.env.NODE_ENV === 'production' 
        ? `http://${window.location.hostname}:3001/api/config/kpi`
        : '/api/config/kpi';
        
      const response = await axios.get(apiUrl);
      if (response.data) {
        form.setFieldsValue(response.data);
      }
    } catch (error) {
      console.error('Failed to load config:', error);
      message.error('获取配置失败，请检查网络或后端服务');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  // Save config
  const onFinish = async (values) => {
    setSaving(true);
    try {
      const apiUrl = process.env.NODE_ENV === 'production' 
        ? `http://${window.location.hostname}:3001/api/admin/config/kpi`
        : '/api/admin/config/kpi';
        
      await axios.post(apiUrl, values);
      message.success('配置保存成功！大屏数据将在下一次刷新时应用新配置。');
    } catch (error) {
      console.error('Failed to save config:', error);
      message.error('保存配置失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer title="大屏仪表盘配置">
      <Card loading={loading}>
        <div style={{ marginBottom: 24 }}>
          <Text type="secondary">
            在此处修改的配置将直接影响生产大屏（KPIGauges）中三个主表盘的目标值(Target)和表盘最大刻度(Max)。保存后，大屏端会在 3 秒内自动刷新生效。
          </Text>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            production: { target: 1404, max: 1600 },
            yieldRate: { target: 98, max: 100 },
            oee: { target: 90, max: 100 },
            injection: { target: 144, max: 250 },
            assembly: { speed: 30 },
            op10: { 
                dia1: { max: 50.55, min: 50.00 },
                dia23: { max: 50.55, min: 49.50 }
            }
          }}
        >
          <Row gutter={24}>
            {/* 产量配置 */}
            <Col span={6}>
              <Card type="inner" title={<Title level={5} style={{ margin: 0 }}>产量 (Production)</Title>}>
                <Form.Item
                  label="目标值 (Target)"
                  name={['production', 'target']}
                  rules={[{ required: true, message: '请输入目标值' }]}
                >
                  <InputNumber style={{ width: '100%' }} min={0} />
                </Form.Item>
                <Form.Item
                  label="表盘最大刻度 (Max)"
                  name={['production', 'max']}
                  rules={[{ required: true, message: '请输入最大刻度' }]}
                >
                  <InputNumber style={{ width: '100%' }} min={1} />
                </Form.Item>
              </Card>
            </Col>

            {/* 合格率配置 */}
            <Col span={6}>
              <Card type="inner" title={<Title level={5} style={{ margin: 0 }}>合格率 (Yield Rate)</Title>}>
                <Form.Item
                  label="目标值 (Target) %"
                  name={['yieldRate', 'target']}
                  rules={[{ required: true, message: '请输入目标值' }]}
                >
                  <InputNumber style={{ width: '100%' }} min={0} max={100} />
                </Form.Item>
                <Form.Item
                  label="表盘最大刻度 (Max) %"
                  name={['yieldRate', 'max']}
                  rules={[{ required: true, message: '请输入最大刻度' }]}
                >
                  <InputNumber style={{ width: '100%' }} min={1} max={100} />
                </Form.Item>
              </Card>
            </Col>

            {/* OEE配置 */}
            <Col span={6}>
              <Card type="inner" title={<Title level={5} style={{ margin: 0 }}>OEE</Title>}>
                <Form.Item
                  label="目标值 (Target) %"
                  name={['oee', 'target']}
                  rules={[{ required: true, message: '请输入目标值' }]}
                >
                  <InputNumber style={{ width: '100%' }} min={0} max={100} />
                </Form.Item>
                <Form.Item
                  label="表盘最大刻度 (Max) %"
                  name={['oee', 'max']}
                  rules={[{ required: true, message: '请输入最大刻度' }]}
                >
                  <InputNumber style={{ width: '100%' }} min={1} max={100} />
                </Form.Item>
              </Card>
            </Col>

            {/* 注塑配置 */}
            <Col span={6}>
              <Card type="inner" title={<Title level={5} style={{ margin: 0 }}>注塑 (Injection)</Title>}>
                <Form.Item
                  label="每小时目标值 (Target)"
                  name={['injection', 'target']}
                  rules={[{ required: true, message: '请输入目标值' }]}
                >
                  <InputNumber style={{ width: '100%' }} min={0} />
                </Form.Item>
                <Form.Item
                  label="折线图最大刻度 (Max)"
                  name={['injection', 'max']}
                  rules={[{ required: true, message: '请输入最大刻度' }]}
                >
                  <InputNumber style={{ width: '100%' }} min={1} />
                </Form.Item>
              </Card>
            </Col>
          </Row>

          <Row gutter={24} style={{ marginTop: 24 }}>
            {/* OP10 尺寸配置 独占第二行的一半 */}
            <Col span={12}>
              <Card type="inner" title={<Title level={5} style={{ margin: 0 }}>OP10 尺寸公差配置</Title>}>
                {/* 直径1 这一行 */}
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="直径 1 上限 (Max)"
                      name={['op10', 'dia1', 'max']}
                      rules={[{ required: true, message: '请输入上限' }]}
                    >
                      <InputNumber style={{ width: '100%' }} step={0.01} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="直径 1 下限 (Min)"
                      name={['op10', 'dia1', 'min']}
                      rules={[{ required: true, message: '请输入下限' }]}
                    >
                      <InputNumber style={{ width: '100%' }} step={0.01} />
                    </Form.Item>
                  </Col>
                </Row>

                {/* 直径2&3 这一行 */}
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="直径 2&3 上限 (Max)"
                      name={['op10', 'dia23', 'max']}
                      rules={[{ required: true, message: '请输入上限' }]}
                    >
                      <InputNumber style={{ width: '100%' }} step={0.01} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="直径 2&3 下限 (Min)"
                      name={['op10', 'dia23', 'min']}
                      rules={[{ required: true, message: '请输入下限' }]}
                    >
                      <InputNumber style={{ width: '100%' }} step={0.01} />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Col>

            {/* OP20 压力配置 独占第二行的另一半 */}
            <Col span={12}>
              <Card type="inner" title={<Title level={5} style={{ margin: 0 }}>OP20 压力公差配置</Title>}>
                {/* 左右压力 这一行 */}
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="左右压力 上限 (Max)"
                      name={['op20', 'press12', 'max']}
                      rules={[{ required: true, message: '请输入上限' }]}
                    >
                      <InputNumber style={{ width: '100%' }} step={0.1} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="左右压力 下限 (Min)"
                      name={['op20', 'press12', 'min']}
                      rules={[{ required: true, message: '请输入下限' }]}
                    >
                      <InputNumber style={{ width: '100%' }} step={0.1} />
                    </Form.Item>
                  </Col>
                </Row>

                {/* 后压力 这一行 */}
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="后压力 上限 (Max)"
                      name={['op20', 'press3', 'max']}
                      rules={[{ required: true, message: '请输入上限' }]}
                    >
                      <InputNumber style={{ width: '100%' }} step={0.1} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="后压力 下限 (Min)"
                      name={['op20', 'press3', 'min']}
                      rules={[{ required: true, message: '请输入下限' }]}
                    >
                      <InputNumber style={{ width: '100%' }} step={0.1} />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>

          <Row gutter={24} style={{ marginTop: 24 }}>
            {/* 装配配置 放到第三行 */}
            <Col span={6}>
              <Card type="inner" title={<Title level={5} style={{ margin: 0 }}>装配效率计算 (Assembly OEE)</Title>}>
                <Form.Item
                  label="生产速度 (秒/个)"
                  name={['assembly', 'speed']}
                  rules={[{ required: true, message: '请输入生产速度' }]}
                  tooltip="用于计算每分钟的理论目标产量。例如30秒/个，则每分钟目标为2个。"
                >
                  <InputNumber style={{ width: '100%' }} min={1} addonAfter="秒/个" />
                </Form.Item>
              </Card>
            </Col>

            {/* OP30 角度配置 放到第三行 */}
            <Col span={12}>
              <Card type="inner" title={<Title level={5} style={{ margin: 0 }}>OP30 角度公差配置</Title>}>
                {/* 垂直角度 这一行 */}
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="垂直角度 上限 (Max)"
                      name={['op30', 'angle1', 'max']}
                      rules={[{ required: true, message: '请输入上限' }]}
                    >
                      <InputNumber style={{ width: '100%' }} step={0.1} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="垂直角度 下限 (Min)"
                      name={['op30', 'angle1', 'min']}
                      rules={[{ required: true, message: '请输入下限' }]}
                    >
                      <InputNumber style={{ width: '100%' }} step={0.1} />
                    </Form.Item>
                  </Col>
                </Row>

                {/* 平行角度 这一行 */}
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="左右平行角度 上限 (Max)"
                      name={['op30', 'angle23', 'max']}
                      rules={[{ required: true, message: '请输入上限' }]}
                    >
                      <InputNumber style={{ width: '100%' }} step={0.1} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="左右平行角度 下限 (Min)"
                      name={['op30', 'angle23', 'min']}
                      rules={[{ required: true, message: '请输入下限' }]}
                    >
                      <InputNumber style={{ width: '100%' }} step={0.1} />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>

          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <Space size="large">
              <Button 
                onClick={async () => {
                  try {
                    const apiUrl = process.env.NODE_ENV === 'production' 
                      ? `http://${window.location.hostname}:3001/api/config/kpi/default`
                      : '/api/config/kpi/default';
                    const res = await axios.get(apiUrl);
                    form.setFieldsValue(res.data);
                    message.success('已加载系统默认配置，请点击【保存配置】以生效');
                  } catch(e) {
                    message.error('加载默认配置失败');
                  }
                }} 
                disabled={saving}
              >
                加载系统默认配置
              </Button>
              <Button onClick={() => fetchConfig()} disabled={saving}>
                取消修改 (恢复上次保存)
              </Button>
              <Button type="primary" htmlType="submit" loading={saving}>
                保存配置并应用到大屏
              </Button>
            </Space>
          </div>
        </Form>
      </Card>
    </PageContainer>
  );
};

export default DashboardConfig;