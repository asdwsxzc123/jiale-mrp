/**
 * 库存余额查询页面
 * 只读列表（支持按物料/仓库筛选）
 */
import { ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { getStockBalances } from '../../services/stock';
import type { StockBalance } from '../../services/stock';

export default function StockBalanceList() {
  const columns: ProColumns<StockBalance>[] = [
    {
      title: '物料编码',
      dataIndex: ['item', 'code'],
      width: 120,
    },
    {
      title: '物料描述',
      dataIndex: ['item', 'description'],
      ellipsis: true,
      hideInSearch: true,
    },
    {
      title: '仓库',
      dataIndex: ['location', 'name'],
      width: 150,
    },
    {
      title: '库存数量',
      dataIndex: 'quantity',
      width: 120,
      hideInSearch: true,
      valueType: 'digit',
    },
    {
      title: '预留数量',
      dataIndex: 'reservedQty',
      width: 120,
      hideInSearch: true,
      valueType: 'digit',
    },
    {
      title: '可用数量',
      hideInSearch: true,
      width: 120,
      render: (_, record) => {
        const available = Number(record.quantity) - Number(record.reservedQty);
        return available.toFixed(2);
      },
    },
  ];

  return (
    <ProTable<StockBalance>
      headerTitle="库存余额"
      rowKey="id"
      columns={columns}
      request={async (params) => {
        const res = await getStockBalances({
          page: params.current,
          pageSize: params.pageSize,
        });
        return { data: res.data || res, total: res.total || 0, success: true };
      }}
      pagination={{ defaultPageSize: 20 }}
    />
  );
}
