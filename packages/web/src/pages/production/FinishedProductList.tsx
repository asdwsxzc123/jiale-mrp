/**
 * 成品管理列表页面
 */
import { useRef } from 'react';
import { Tag } from 'antd';
import { ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { useNavigate } from 'react-router-dom';
import { getFinishedProducts } from '../../services/production';
import type { FinishedProduct } from '../../services/production';

/** 成品状态标签 */
const statusMap: Record<string, { text: string; color: string }> = {
  IN_STOCK: { text: '在库', color: 'green' },
  SHIPPED: { text: '已发货', color: 'blue' },
  RESERVED: { text: '已预留', color: 'orange' },
};

export default function FinishedProductList() {
  const navigate = useNavigate();
  const actionRef = useRef<ActionType>(null);

  const columns: ProColumns<FinishedProduct>[] = [
    { title: '溯源码', dataIndex: 'traceabilityCode', width: 180 },
    { title: '物料编码', dataIndex: ['item', 'code'], width: 120, hideInSearch: true },
    { title: '物料描述', dataIndex: ['item', 'description'], ellipsis: true, hideInSearch: true },
    { title: '重量', dataIndex: 'weight', width: 100, hideInSearch: true },
    { title: '单位', dataIndex: 'weightUnit', width: 60, hideInSearch: true },
    { title: '颜色', dataIndex: 'color', width: 80, hideInSearch: true },
    { title: '生产日期', dataIndex: 'productionDate', width: 120, valueType: 'date', hideInSearch: true },
    { title: '仓库', dataIndex: ['warehouseLocation', 'name'], width: 120, hideInSearch: true },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (_, record) => {
        const s = statusMap[record.status] || { text: record.status, color: 'default' };
        return <Tag color={s.color}>{s.text}</Tag>;
      },
      valueEnum: {
        IN_STOCK: { text: '在库' },
        SHIPPED: { text: '已发货' },
        RESERVED: { text: '已预留' },
      },
    },
    {
      title: '操作',
      valueType: 'option',
      width: 100,
      render: (_, record) => [
        <a key="detail" onClick={() => navigate(`/production/finished/${record.id}`)}>详情</a>,
      ],
    },
  ];

  return (
    <ProTable<FinishedProduct>
      headerTitle="成品管理"
      actionRef={actionRef}
      rowKey="id"
      columns={columns}
      request={async (params) => {
        const res = await getFinishedProducts({
          page: params.current,
          pageSize: params.pageSize,
          status: params.status,
        });
        return { data: res.data || res, total: res.total || 0, success: true };
      }}
      pagination={{ defaultPageSize: 20 }}
    />
  );
}
