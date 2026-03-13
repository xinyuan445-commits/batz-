import React, { useState } from 'react';
import { LoginForm, ProFormText } from '@ant-design/pro-components';
import { 
  UserOutlined, 
  LockOutlined, 
  EyeTwoTone, 
  EyeInvisibleOutlined 
} from '@ant-design/icons';
import { message, ConfigProvider, theme, Space, Switch } from 'antd';
import { css } from '@emotion/css';
import BatzLogo from '../../assets/Batzlogo.jpg';

// 登录页面样式
const containerStyle = (isDarkMode) => css`
  display: flex;
  flex-direction: column;
  justify-content: center; /* 垂直居中 */
  align-items: center;     /* 水平居中 */
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background-image: url('https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/V-_oS6r-i7wAAAAAAAAAAAAAFl94AQBr');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  
  ${isDarkMode && `
    background-image: none;
    background-color: #000;
  `}
`;

const loginCardStyle = (isDarkMode) => css`
  min-width: 320px;
  max-width: 400px;
  width: 100%;
  padding: 32px 0;
  border-radius: 8px;
  background: ${isDarkMode ? 'rgba(0, 0, 0, 0.65)' : 'rgba(255, 255, 255, 0.85)'};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(4px);
  transition: all 0.3s;

  .ant-pro-form-login-title {
    color: ${isDarkMode ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)'} !important;
  }
  .ant-pro-form-login-desc {
    color: ${isDarkMode ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.45)'} !important;
  }
  .ant-pro-form-login-header {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }
  .ant-pro-form-login-logo {
    margin-right: 16px !important;
    position: relative;
    top: 10px;
    left: 10px;
    img {
      width: 32px !important;
      height: 32px !important;
    }
  }
  .ant-pro-form-login-title {
    margin-bottom: 0 !important;
  }
`;

const Login = ({ onLogin, isDarkMode, toggleTheme }) => {
  const { token } = theme.useToken();
  const [loading, setLoading] = useState(false);

  return (
    <div className={containerStyle(isDarkMode)}>
      <div
        style={{
          position: 'absolute',
          top: 24,
          right: 24,
          zIndex: 10,
        }}
      >
        <Space>
          <span style={{ color: isDarkMode ? '#fff' : '#000' }}>{isDarkMode ? '🌙 Dark' : '☀️ Light'}</span>
          <Switch checked={isDarkMode} onChange={toggleTheme} />
        </Space>
      </div>

      <div className={loginCardStyle(isDarkMode)}>
        <LoginForm
          contentStyle={{
            minWidth: 280,
            maxWidth: '75vw',
            margin: '0 auto',
          }}
            title="管理后台"
            logo={BatzLogo}
            subTitle="BATZ生产数据可视化与管理系统"
            initialValues={{
              autoLogin: true,
            }}
            onFinish={async (values) => {
              setLoading(true);
              // 模拟登录延迟
              await new Promise((resolve) => setTimeout(resolve, 1000));
              
              if (values.username === 'admin' && values.password === 'admin') {
                message.success('登录成功！');
                onLogin();
                setLoading(false);
                return true;
              }
              message.error('账号或密码错误（默认 admin/admin）');
              setLoading(false);
              return false;
            }}
            submitter={{
              searchConfig: {
                submitText: loading ? '登录中...' : '登 录',
              },
              submitButtonProps: {
                size: 'large',
                style: { 
                  width: '100%',
                  background: 'linear-gradient(90deg, #1677ff 0%, #00b96b 100%)',
                  border: 'none',
                  boxShadow: '0 4px 14px 0 rgba(22, 119, 255, 0.3)',
                  height: '48px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                },
                loading: loading,
              },
            }}
          >
            <div style={{ marginTop: 24 }}>
              <ProFormText
                name="username"
                fieldProps={{
                  size: 'large',
                  prefix: <UserOutlined className={'prefixIcon'} />,
                }}
                placeholder={'用户名: admin'}
                rules={[
                  {
                    required: true,
                    message: '请输入用户名!',
                  },
                ]}
              />
              <ProFormText.Password
                name="password"
                fieldProps={{
                  size: 'large',
                  prefix: <LockOutlined className={'prefixIcon'} />,
                }}
                placeholder={'密码: admin'}
                rules={[
                  {
                    required: true,
                    message: '请输入密码！',
                  },
                ]}
              />
            </div>
            
            <div style={{ marginTop: 24 }}>
            </div>
          </LoginForm>
        </div>
      <div style={{ position: 'absolute', bottom: 24, textAlign: 'center', color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
        Batz Production Data System ©2026 Created by Batz Team
      </div>
    </div>
  );
};

export default Login;
