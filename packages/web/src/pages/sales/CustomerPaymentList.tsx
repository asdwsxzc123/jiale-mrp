/**
 * 客户付款列表页面
 */
import { useRef, useState } from 'react';
import { Button, Popconfirm, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { getCustomerPayments, deleteCustomerPayment } from '../../services/sales';
import type { CustomerPayment } from '../../services/sales';
import CustomerPaymentForm from './CustomerPaymentForm';

export default function CustomerPaymentList() {
  const actionRef = useRef<ActionType>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>();

  /** 打开新增/编辑抽屉 */
  const openForm = (id?: string) => {
    setEditingId(id);
    setFormOpen(true);
  };

  /** 删除 */
  const handleDelete = async (id: string) => {
    try {
      await deleteCustomerPayment(id);
      message.success('删除成功');
      actionRef.current?.reload();
    } catch {
      message.error('删除失败');
    }
  };

  const columns: ProColumns<CustomerPayment>[] = [
    { title: '单据号', dataIndex: 'docNo', width: 150 },
    { title: '客户', dataIndex: ['customer', 'companyName'], ellipsis: true, hideInSearch: true },
    { title: '日期', dataIndex: 'date', width: 120, valueType: 'date', hideInSearch: true },
    { title: '金额', dataIndex: 'amount', width: 120, valueType: 'money', hideInSearch: true },
    { title: '币种', dataIndex: 'currency', width: 80, hideInSearch: true },
    { title: '付款方式', dataIndex: 'method', width: 100, hideInSearch: true },
    { title: '参考号', dataIndex: 'refNo', width: 120, hideInSearch: true },
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
      <ProTable<CustomerPayment>
        headerTitle="客户付款"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        request={async (params) => {
          const res = await getCustomerPayments({
            page: params.current,
            pageSize: params.pageSize,
          });
          return { data: res.data || res, total: res.total || 0, success: true };
        }}
        pagination={{ defaultPageSize: 20 }}
        toolBarRender={() => [
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => openForm()}>
            新增付款
          </Button>,
        ]}
      />
      <CustomerPaymentForm
        open={formOpen}
        editingId={editingId}
        onClose={() => setFormOpen(false)}
        onSuccess={() => { setFormOpen(false); actionRef.current?.reload(); }}
      />
    </>
  );
}
