/**
 * React Router 路由配置
 * - 路由守卫：未登录时重定向到 /login
 * - 主布局内嵌套各模块页面路由
 */
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { isAuthenticated } from '../stores/auth';
import MainLayout from '../layouts/MainLayout';
import Login from '../pages/auth/Login';
/* ---- 客户管理 ---- */
import CustomerList from '../pages/customer/CustomerList';
/* ---- 供应商管理 ---- */
import SupplierList from '../pages/supplier/SupplierList';
/* ---- 库存管理 ---- */
import StockItemList from '../pages/stock/StockItemList';
import StockGroupList from '../pages/stock/StockGroupList';
import StockCategoryList from '../pages/stock/StockCategoryList';
import StockLocationList from '../pages/stock/StockLocationList';
import StockBalanceList from '../pages/stock/StockBalanceList';
import StockTransactionList from '../pages/stock/StockTransactionList';
/* ---- 销售管理 ---- */
import SalesDocumentList from '../pages/sales/SalesDocumentList';
import SalesDocumentForm from '../pages/sales/SalesDocumentForm';
import CustomerPaymentList from '../pages/sales/CustomerPaymentList';
/* ---- 采购管理 ---- */
import PurchaseDocumentList from '../pages/purchase/PurchaseDocumentList';
import PurchaseDocumentForm from '../pages/purchase/PurchaseDocumentForm';
import SupplierPaymentList from '../pages/purchase/SupplierPaymentList';
/* ---- 来料检验 ---- */
import InspectionList from '../pages/inspection/InspectionList';
/* ---- 生产管理 ---- */
import BOMList from '../pages/production/BOMList';
import BOMForm from '../pages/production/BOMForm';
import JobOrderList from '../pages/production/JobOrderList';
import JobOrderDetail from '../pages/production/JobOrderDetail';
import FinishedProductList from '../pages/production/FinishedProductList';
import FinishedProductDetail from '../pages/production/FinishedProductDetail';
/* ---- 溯源查询 ---- */
import TraceScan from '../pages/trace/TraceScan';
import TraceResult from '../pages/trace/TraceResult';
import RawMaterialBatchList from '../pages/trace/RawMaterialBatchList';
/* ---- 系统设置 ---- */
import CurrencySettings from '../pages/settings/CurrencySettings';
import TaxCodeSettings from '../pages/settings/TaxCodeSettings';
import UserManagement from '../pages/settings/UserManagement';

/** 路由守卫组件：未登录则跳转 /login */
function AuthGuard({ children }: { children: React.ReactNode }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

/** 路由配置 */
const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: (
      <AuthGuard>
        <MainLayout />
      </AuthGuard>
    ),
    children: [
      /* 默认重定向到销售管理 */
      { index: true, element: <Navigate to="/sales/documents" replace /> },
      /* 销售管理 */
      { path: 'sales/documents', element: <SalesDocumentList /> },
      { path: 'sales/documents/new', element: <SalesDocumentForm /> },
      { path: 'sales/documents/:id/edit', element: <SalesDocumentForm /> },
      { path: 'sales/payments', element: <CustomerPaymentList /> },
      /* 采购管理 */
      { path: 'purchase/documents', element: <PurchaseDocumentList /> },
      { path: 'purchase/documents/new', element: <PurchaseDocumentForm /> },
      { path: 'purchase/documents/:id/edit', element: <PurchaseDocumentForm /> },
      { path: 'purchase/payments', element: <SupplierPaymentList /> },
      /* 库存管理 */
      { path: 'stock/items', element: <StockItemList /> },
      { path: 'stock/groups', element: <StockGroupList /> },
      { path: 'stock/categories', element: <StockCategoryList /> },
      { path: 'stock/locations', element: <StockLocationList /> },
      { path: 'stock/balances', element: <StockBalanceList /> },
      { path: 'stock/transactions', element: <StockTransactionList /> },
      /* 来料检验 */
      { path: 'inspection', element: <InspectionList /> },
      /* 生产管理 */
      { path: 'production/bom', element: <BOMList /> },
      { path: 'production/bom/new', element: <BOMForm /> },
      { path: 'production/bom/:id/edit', element: <BOMForm /> },
      { path: 'production/jobs', element: <JobOrderList /> },
      { path: 'production/jobs/:id', element: <JobOrderDetail /> },
      { path: 'production/finished', element: <FinishedProductList /> },
      { path: 'production/finished/:id', element: <FinishedProductDetail /> },
      /* 溯源查询 */
      { path: 'trace/scan', element: <TraceScan /> },
      { path: 'trace/result/:code', element: <TraceResult /> },
      { path: 'trace/batches', element: <RawMaterialBatchList /> },
      /* 客户管理 */
      { path: 'customers', element: <CustomerList /> },
      /* 供应商管理 */
      { path: 'suppliers', element: <SupplierList /> },
      /* 系统设置 */
      { path: 'settings/currency', element: <CurrencySettings /> },
      { path: 'settings/tax', element: <TaxCodeSettings /> },
      { path: 'settings/users', element: <UserManagement /> },
    ],
  },
]);

export default router;
