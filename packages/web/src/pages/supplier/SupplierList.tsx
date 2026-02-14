/**
 * 供应商列表页面
 * ProTable 列表（搜索、分页、新增/编辑/删除按钮）
 */
import { useRef, useState } from 'react';
import { Button, Popconfirm, message, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { getSuppliers, deleteSupplier } from '../../services/supplier';
import type { Supplier } from '../../services/supplier';
import SupplierForm from './SupplierForm';

export default function SupplierList() {
  const actionRef = useRef<ActionType>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>();

  /** 打开新增/编辑抽屉 */
  const openForm = (id?: string) => {
    setEditingId(id);
    setFormOpen(true);
  };

  /** 删除供应商 */
  const handleDelete = async (id: string) => {
    try {
      await deleteSupplier(id);
      message.success('删除成功');
      actionRef.current?.reload();
    } catch {
      message.error('删除失败');
    }
  };

  /** 表格列定义 */
  const columns: ProColumns<Supplier>[] = [
    { title: '供应商编码', dataIndex: 'code', width: 120 },
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
          title="确认删除该供应商？"
          onConfirm={() => handleDelete(record.id)}
        >
          <a style={{ color: '#ff4d4f' }}>删除</a>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <>
      <ProTable<Supplier>
        headerTitle="供应商列表"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        request={async (params) => {
          const res = await getSuppliers({
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
            新增供应商
          </Button>,
        ]}
      />
      <SupplierForm
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
