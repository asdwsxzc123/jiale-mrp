/**
 * 库存操作列表页面
 */
import { useRef, useState } from 'react';
import { Button, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { getStockTransactions } from '../../services/stock';
import type { StockTransaction } from '../../services/stock';
import StockTransactionForm from './StockTransactionForm';

/** 操作类型映射 */
const typeLabels: Record<string, { text: string; color: string }> = {
  RECEIVED: { text: '入库', color: 'green' },
  ISSUE: { text: '出库', color: 'red' },
  ADJUSTMENT: { text: '调整', color: 'orange' },
  TRANSFER: { text: '调拨', color: 'blue' },
  ASSEMBLY: { text: '组装', color: 'purple' },
  DISASSEMBLY: { text: '拆卸', color: 'cyan' },
};

export default function StockTransactionList() {
  const actionRef = useRef<ActionType>(null);
  const [formOpen, setFormOpen] = useState(false);

  const columns: ProColumns<StockTransaction>[] = [
    { title: '单据号', dataIndex: 'docNo', width: 150 },
    {
      title: '类型',
      dataIndex: 'type',
      width: 100,
      render: (_, record) => {
        const label = typeLabels[record.type] || { text: record.type, color: 'default' };
        return <Tag color={label.color}>{label.text}</Tag>;
      },
      valueEnum: {
        RECEIVED: { text: '入库' },
        ISSUE: { text: '出库' },
        ADJUSTMENT: { text: '调整' },
        TRANSFER: { text: '调拨' },
      },
    },
    { title: '日期', dataIndex: 'date', width: 120, valueType: 'date', hideInSearch: true },
    { title: '创建时间', dataIndex: 'createdAt', width: 180, valueType: 'dateTime', hideInSearch: true },
    {
      title: '操作',
      valueType: 'option',
      width: 100,
      render: (_, record) => [
        <a key="view" onClick={() => console.log('view', record.id)}>查看</a>,
      ],
    },
  ];

  return (
    <>
      <ProTable<StockTransaction>
        headerTitle="库存操作"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        request={async (params) => {
          const res = await getStockTransactions({
            page: params.current,
            pageSize: params.pageSize,
            type: params.type,
          });
          return { data: res.data || res, total: res.total || 0, success: true };
        }}
        pagination={{ defaultPageSize: 20 }}
        toolBarRender={() => [
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => setFormOpen(true)}>
            新建操作
          </Button>,
        ]}
      />
      <StockTransactionForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={() => { setFormOpen(false); actionRef.current?.reload(); }}
      />
    </>
  );
}
