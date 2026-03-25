import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { ConfigProvider, Layout, Menu, theme, Button, Dropdown, Space, Avatar, message, Result } from 'antd';
import { ProLayout } from '@ant-design/pro-components';
import { 
  DashboardOutlined, 
  TableOutlined, 
  SettingOutlined, 
  UserOutlined,
  LogoutOutlined,
  WifiOutlined
} from '@ant-design/icons';
import axios from 'axios';
import Login from './pages/Login';
import Op10Table from './pages/Production';
import Op20Table from './pages/Production/Op20Table';
import Op30Table from './pages/Production/Op30Table';
import AutomationTable from './pages/Production/AutomationTable';
import TraceabilityTable from './pages/Production/TraceabilityTable';
import DashboardConfig from './pages/Config/index';
import BatzLogo from './assets/Batzlogo.jpg';

// Setup global axios interceptor to catch 403 SYSTEM_LOCKED errors
const setupAxiosInterceptors = (setSystemLocked) => {
  axios.interceptors.response.use(
    (response) => {
      setSystemLocked(false);
      return response;
    },
    (error) => {
      if (error.response && error.response.status === 403 && error.response.data && error.response.data.error === 'SYSTEM_LOCKED') {
        setSystemLocked(true);
      }
      return Promise.reject(error);
    }
  );
};

const { Header, Content, Footer, Sider } = Layout;

// Placeholder components
const ProductionData = () => <Op10Table />;
const Op20Data = () => <Op20Table />;
const Op30Data = () => <Op30Table />;
const AutomationData = () => <AutomationTable />;
const TraceabilityData = () => <TraceabilityTable />;

const App = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSystemLocked, setIsSystemLocked] = useState(false);

  // 初始化主题
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
    }
    // Set up interceptors when app mounts
    setupAxiosInterceptors(setIsSystemLocked);
  }, []);

  const toggleTheme = (checked) => {
    setIsDarkMode(checked);
    localStorage.setItem('theme', checked ? 'dark' : 'light');
  };

  if (isSystemLocked) {
    return (
      <ConfigProvider theme={{ algorithm: theme.darkAlgorithm }}>
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#141414' }}>
          <Result
            status="error"
            icon={<WifiOutlined style={{ color: '#ff4d4f' }} />}
            title={<span style={{ color: '#ff4d4f', fontSize: '32px' }}>请检查网络</span>}
            subTitle={<span style={{ color: '#999', fontSize: '18px' }}>无法连接到服务器或授权验证失败</span>}
          />
        </div>
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1677ff',
        },
      }}
    >
      <BrowserRouter>
        <AppRoutes isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
      </BrowserRouter>
    </ConfigProvider>
  );
};

const AppRoutes = ({ isDarkMode, toggleTheme }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(localStorage.getItem('isLoggedIn') === 'true');
  const navigate = useNavigate();

  const handleLogin = () => {
    localStorage.setItem('isLoggedIn', 'true');
    setIsAuthenticated(true);
    navigate('/production/op10');
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    setIsAuthenticated(false);
    navigate('/login');
  };

  return (
    <Routes>
      <Route path="/login" element={
        isAuthenticated ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
      } />
      <Route path="/*" element={
        isAuthenticated ? <AdminLayout onLogout={handleLogout} /> : <Navigate to="/login" replace />
      } />
    </Routes>
  );
};

const AdminLayout = ({ onLogout }) => {
  const location = useLocation();

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <ProLayout
        title="管理后台"
        logo={BatzLogo}
        location={{
          pathname: location.pathname,
        }}
        menu={{
          request: async () => [
            {
              path: '/production',
              name: '生产数据',
              icon: <TableOutlined />,
              children: [
                {
                  path: '/production/op10',
                  name: 'OP10 尺寸测量',
                },
                {
                  path: '/production/op20',
                  name: 'OP20 压装记录',
                },
                {
                  path: '/production/op30',
                  name: 'OP30 角度检测',
                },
                {
                  path: '/production/automation',
                  name: '自动化注塑记录',
                },
                {
                  path: '/production/traceability',
                  name: '条码追溯查询',
                },
              ],
            },
            {
              path: '/config',
              name: '大屏配置',
              icon: <SettingOutlined />,
            },
          ],
        }}
        menuItemRender={(item, dom) => (
          <Link to={item.path || '/'}>{dom}</Link>
        )}
        avatarProps={{
          src: 'https://gw.alipayobjects.com/zos/antfincdn/efFD%24IOql2/weixintupian_20170331104822.jpg',
          size: 'small',
          title: 'Admin',
          render: (props, dom) => {
            return (
              <Dropdown
                menu={{
                  items: [
                    {
                      key: 'logout',
                      icon: <LogoutOutlined />,
                      label: '退出登录',
                      onClick: onLogout,
                    },
                  ],
                }}
              >
                {dom}
              </Dropdown>
            );
          },
        }}
        layout="mix"
      splitMenus={false}
      fixSiderbar
      contentWidth="Fluid"
      token={{
        pageContainer: {
          paddingBlockPageContainerContent: 24,
          paddingInlinePageContainerContent: 24,
        },
        sider: {
          colorMenuBackground: '#fff',
        },
      }}
      contentStyle={{
        margin: 0,
        padding: 0,
        width: '100%',
        maxWidth: '100%',
        height: 'calc(100vh - 56px)', // 减去顶栏高度
        overflowY: 'auto', // 允许内容区域垂直滚动
      }}
      >
        <Routes>
          <Route path="/" element={<Navigate to="/production/op10" replace />} />
          <Route path="/production" element={<Navigate to="/production/op10" replace />} />
          <Route path="/production/op10" element={<ProductionData />} />
          <Route path="/production/op20" element={<Op20Data />} />
          <Route path="/production/op30" element={<Op30Data />} />
          <Route path="/production/automation" element={<AutomationData />} />
          <Route path="/production/traceability" element={<TraceabilityData />} />
          <Route path="/config" element={<DashboardConfig />} />
        </Routes>
      </ProLayout>
    </div>
  );
};

export default App;
