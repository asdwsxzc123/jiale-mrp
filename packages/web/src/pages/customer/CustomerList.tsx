/**
 * 客户列表页面
 * ProTable 列表（搜索、分页、新增/编辑/删除按钮）
 */
import { useRef, useState } from 'react';
import { Button, Popconfirm, message, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { getCustomers, deleteCustomer } from '../../services/customer';
import type { Customer } from '../../services/customer';
import CustomerForm from './CustomerForm';

export default function CustomerList() {
  const actionRef = useRef<ActionType>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>();

  /** 打开新增/编辑抽屉 */
  const openForm = (id?: string) => {
    setEditingId(id);
    setFormOpen(true);
  };

  /** 删除客户 */
  const handleDelete = async (id: string) => {
    try {
      await deleteCustomer(id);
      message.success('删除成功');
      actionRef.current?.reload();
    } catch {
      message.error('删除失败');
    }
  };

  /** 表格列定义 */
  const columns: ProColumns<Customer>[] = [
    { title: '客户编码', dataIndex: 'code', width: 120 },
    { title: '公司名称', dataIndex: 'companyName', ellipsis: true },
    { title: '分类', dataIndex: 'category', width: 100, hideInSearch: true },
    { title: '联系人', dataIndex: 'attention', width: 100, hideInSearch: true },
    { title: '电话', dataIndex: 'phone', width: 130, hideInSearch: true },
    { title: '邮箱', dataIndex: 'email', width: 180, hideInSearch: true },
    { title: '币种', dataIndex: 'currency', width: 80, hideInSearch: true },
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
        <Popconfirm
          key="delete"
          title="确认删除该客户？"
          onConfirm={() => handleDelete(record.id)}
        >
          <a style={{ color: '#ff4d4f' }}>删除</a>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <>
      <ProTable<Customer>
        headerTitle="客户列表"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        /* 请求列表数据 */
        request={async (params) => {
          const res = await getCustomers({
            page: params.current,
            pageSize: params.pageSize,
            keyword: params.code || params.companyName,
          });
          return {
            data: res.data || res,
            total: res.total || 0,
            success: true,
          };
        }}
        pagination={{ defaultPageSize: 20 }}
        toolBarRender={() => [
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => openForm()}>
            新增客户
          </Button>,
        ]}
      />
      {/* 新增/编辑抽屉表单 */}
      <CustomerForm
        open={formOpen}
        editingId={editingId}
        onClose={() => setFormOpen(false)}
        onSuccess={() => {
          setFormOpen(false);
          actionRef.current?.reload();
        }}
      />
    </>
  );
}
