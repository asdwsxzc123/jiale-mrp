/**
 * 主布局组件
 * 使用 ProLayout 提供侧边栏导航
 * 菜单项涵盖销售、采购、库存、检验、生产、溯源、客户、供应商、系统设置
 */
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { ProLayout } from '@ant-design/pro-components';
import type { MenuDataItem } from '@ant-design/pro-components';
import {
  ShoppingCartOutlined,
  ShoppingOutlined,
  DatabaseOutlined,
  SafetyCertificateOutlined,
  ToolOutlined,
  QrcodeOutlined,
  TeamOutlined,
  TruckOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { Dropdown, Button } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';
import { logout, getUser } from '../stores/auth';

/** 侧边栏菜单配置 */
const menuData: MenuDataItem[] = [
  {
    name: '销售管理',
    path: '/sales',
    icon: <ShoppingCartOutlined />,
    children: [
      { name: '销售单据', path: '/sales/documents' },
      { name: '客户付款', path: '/sales/payments' },
    ],
  },
  {
    name: '采购管理',
    path: '/purchase',
    icon: <ShoppingOutlined />,
    children: [
      { name: '采购单据', path: '/purchase/documents' },
      { name: '供应商付款', path: '/purchase/payments' },
    ],
  },
  {
    name: '库存管理',
    path: '/stock',
    icon: <DatabaseOutlined />,
    children: [
      { name: '物料', path: '/stock/items' },
      { name: '物料组', path: '/stock/groups' },
      { name: '物料分类', path: '/stock/categories' },
      { name: '仓库', path: '/stock/locations' },
      { name: '库存余额', path: '/stock/balances' },
      { name: '库存操作', path: '/stock/transactions' },
    ],
  },
  {
    name: '来料检验',
    path: '/inspection',
    icon: <SafetyCertificateOutlined />,
  },
  {
    name: '生产管理',
    path: '/production',
    icon: <ToolOutlined />,
    children: [
      { name: 'BOM', path: '/production/bom' },
      { name: '生产单', path: '/production/jobs' },
      { name: '成品管理', path: '/production/finished' },
    ],
  },
  {
    name: '溯源查询',
    path: '/trace',
    icon: <QrcodeOutlined />,
    children: [
      { name: '扫码查询', path: '/trace/scan' },
      { name: '原材料批次', path: '/trace/batches' },
    ],
  },
  {
    name: '客户管理',
    path: '/customers',
    icon: <TeamOutlined />,
  },
  {
    name: '供应商管理',
    path: '/suppliers',
    icon: <TruckOutlined />,
  },
  {
    name: '系统设置',
    path: '/settings',
    icon: <SettingOutlined />,
    children: [
      { name: '货币', path: '/settings/currency' },
      { name: '税码', path: '/settings/tax' },
      { name: '用户管理', path: '/settings/users' },
    ],
  },
];

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getUser();

  /** 处理退出登录 */
  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <ProLayout
      title="嘉乐 ERP"
      logo={false}
      layout="mix"
      fixSiderbar
      location={{ pathname: location.pathname }}
      route={{ path: '/', routes: menuData }}
      menuItemRender={(item, dom) => (
        <a onClick={() => item.path && navigate(item.path)}>{dom}</a>
      )}
      avatarProps={{
        title: user?.name || '用户',
        size: 'small',
        render: (_props, dom) => (
          <Dropdown
            menu={{
              items: [
                {
                  key: 'logout',
                  icon: <LogoutOutlined />,
                  label: '退出登录',
                  onClick: handleLogout,
                },
              ],
            }}
          >
            {dom}
          </Dropdown>
        ),
      }}
      /* 右侧额外操作区 */
      actionsRender={() => [
        <Button key="logout" type="text" icon={<LogoutOutlined />} onClick={handleLogout}>
          退出
        </Button>,
      ]}
    >
      <Outlet />
    </ProLayout>
  );
}
