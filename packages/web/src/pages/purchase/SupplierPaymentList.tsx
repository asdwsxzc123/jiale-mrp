/**
 * 供应商付款列表页面
 */
import { useRef, useState } from 'react';
import { Button, Popconfirm, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { getSupplierPayments, deleteSupplierPayment } from '../../services/purchase';
import type { SupplierPayment } from '../../services/purchase';
import SupplierPaymentForm from './SupplierPaymentForm';

export default function SupplierPaymentList() {
  const actionRef = useRef<ActionType>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>();

  const openForm = (id?: string) => {
    setEditingId(id);
    setFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSupplierPayment(id);
      message.success('删除成功');
      actionRef.current?.reload();
    } catch {
      message.error('删除失败');
    }
  };

  const columns: ProColumns<SupplierPayment>[] = [
    { title: '单据号', dataIndex: 'docNo', width: 150 },
    { title: '供应商', dataIndex: ['supplier', 'companyName'], ellipsis: true, hideInSearch: true },
    { title: '日期', dataIndex: 'date', width: 120, valueType: 'date', hideInSearch: true },
    { title: '金额', dataIndex: 'amount', width: 120, valueType: 'money', hideInSearch: true },
    { title: '币种', dataIndex: 'currency', width: 80, hideInSearch: true },
    { title: '付款方式', dataIndex: 'method', width: 100, hideInSearch: true },
    {
      title: '操作',
      valueType: 'option',
      width: 150,
      render: (_, record) => [
        <a key="edit" onClick={() => openForm(record.id)}>编辑</a>,
        <Popconfirm key="delete" title="确认删除？" onConfirm={() => handleDelete(record.id)}>
          <a style={{ color: '#ff4d4f' }}>删除</a>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <>
      <ProTable<SupplierPayment>
        headerTitle="供应商付款"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        request={async (params) => {
          const res = await getSupplierPayments({ page: params.current, pageSize: params.pageSize });
          return { data: res.data || res, total: res.total || 0, success: true };
        }}
        pagination={{ defaultPageSize: 20 }}
        toolBarRender={() => [
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => openForm()}>
            新增付款
          </Button>,
        ]}
      />
      <SupplierPaymentForm
        open={formOpen}
        editingId={editingId}
        onClose={() => setFormOpen(false)}
        onSuccess={() => { setFormOpen(false); actionRef.current?.reload(); }}
      />
    </>
  );
}
