/**
 * 物料列表页面
 * ProTable 列表 + 新增/编辑/删除
 */
import { useRef, useState } from 'react';
import { Button, Popconfirm, message, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { getStockItems, deleteStockItem } from '../../services/stock';
import type { StockItem } from '../../services/stock';
import StockItemForm from './StockItemForm';

export default function StockItemList() {
  const actionRef = useRef<ActionType>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>();

  /** 打开新增/编辑抽屉 */
  const openForm = (id?: string) => {
    setEditingId(id);
    setFormOpen(true);
  };

  /** 删除物料 */
  const handleDelete = async (id: string) => {
    try {
      await deleteStockItem(id);
      message.success('删除成功');
      actionRef.current?.reload();
    } catch {
      message.error('删除失败');
    }
  };

  /** 表格列定义 */
  const columns: ProColumns<StockItem>[] = [
    { title: '物料编码', dataIndex: 'code', width: 120 },
    { title: '描述', dataIndex: 'description', ellipsis: true },
    { title: '物料组', dataIndex: ['group', 'name'], width: 100, hideInSearch: true },
    { title: '分类', dataIndex: ['category', 'name'], width: 100, hideInSearch: true },
    { title: '基本单位', dataIndex: 'baseUom', width: 80, hideInSearch: true },
    { title: '参考成本', dataIndex: 'refCost', width: 100, hideInSearch: true, valueType: 'money' },
    { title: '参考售价', dataIndex: 'refPrice', width: 100, hideInSearch: true, valueType: 'money' },
    {
      title: '状态',
      dataIndex: 'isActive',
      width: 80,
      hideInSearch: true,
      render: (_, record) => (
        <Tag color={record.isActive ? 'green' : 'default'}>
          {record.isActive ? '启用' : '停用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      valueType: 'option',
      width: 150,
      render: (_, record) => [
        <a key="edit" onClick={() => openForm(record.id)}>编辑</a>,
        <Popconfirm key="delete" title="确认删除该物料？" onConfirm={() => handleDelete(record.id)}>
          <a style={{ color: '#ff4d4f' }}>删除</a>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <>
      <ProTable<StockItem>
        headerTitle="物料列表"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        request={async (params) => {
          const res = await getStockItems({
            page: params.current,
            pageSize: params.pageSize,
            keyword: params.code || params.description,
          });
          return { data: res.data || res, total: res.total || 0, success: true };
        }}
        pagination={{ defaultPageSize: 20 }}
        toolBarRender={() => [
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => openForm()}>
            新增物料
          </Button>,
        ]}
      />
      <StockItemForm
        open={formOpen}
        editingId={editingId}
        onClose={() => setFormOpen(false)}
        onSuccess={() => { setFormOpen(false); actionRef.current?.reload(); }}
      />
    </>
  );
}
