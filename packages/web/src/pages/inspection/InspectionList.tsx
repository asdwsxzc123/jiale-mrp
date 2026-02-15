/**
 * 来料检验列表页面
 */
import { useRef, useState } from 'react';
import { Button, Tag, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { getInspections } from '../../services/inspection';
import type { IncomingInspection } from '../../services/inspection';
import InspectionForm from './InspectionForm';

/** 检验状态 */
const statusMap: Record<string, { text: string; color: string }> = {
  PENDING: { text: '待检', color: 'orange' },
  PASSED: { text: '合格', color: 'green' },
  REJECTED: { text: '不合格', color: 'red' },
  CONCESSION: { text: '让步接收', color: 'blue' },
};

export default function InspectionList() {
  const actionRef = useRef<ActionType>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>();

  const openForm = (id?: string) => {
    setEditingId(id);
    setFormOpen(true);
  };

  const columns: ProColumns<IncomingInspection>[] = [
    { title: '采购单号', dataIndex: 'purchaseDocId', width: 150 },
    { title: '供应商', dataIndex: ['supplier', 'companyName'], ellipsis: true, hideInSearch: true },
    { title: '检验日期', dataIndex: 'inspectionDate', width: 120, valueType: 'date', hideInSearch: true },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (_, record) => {
        const s = statusMap[record.status] || { text: record.status, color: 'default' };
        return <Tag color={s.color}>{s.text}</Tag>;
      },
      valueEnum: {
        PENDING: { text: '待检' },
        PASSED: { text: '合格' },
        REJECTED: { text: '不合格' },
        CONCESSION: { text: '让步接收' },
      },
    },
    { title: '错发料', dataIndex: 'wrongItem', width: 80, hideInSearch: true, render: (_, r) => r.wrongItem ? '是' : '否' },
    { title: '重量差异', dataIndex: 'weightDifference', width: 100, hideInSearch: true },
    {
      title: '操作',
      valueType: 'option',
      width: 100,
      render: (_, record) => [
        <a key="edit" onClick={() => openForm(record.id)}>详情</a>,
      ],
    },
  ];

  return (
    <>
      <ProTable<IncomingInspection>
        headerTitle="来料检验"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        request={async (params) => {
          try {
            const res = await getInspections({
              page: params.current,
              pageSize: params.pageSize,
              status: params.status,
            });
            return { data: res.data || res, total: res.total || 0, success: true };
          } catch {
            message.error('加载检验列表失败');
            return { data: [], total: 0, success: false };
          }
        }}
        pagination={{ defaultPageSize: 20 }}
        toolBarRender={() => [
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => openForm()}>
            新增检验
          </Button>,
        ]}
      />
      <InspectionForm
        open={formOpen}
        editingId={editingId}
        onClose={() => setFormOpen(false)}
        onSuccess={() => { setFormOpen(false); actionRef.current?.reload(); }}
      />
    </>
  );
}
