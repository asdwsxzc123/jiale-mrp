/**
 * 生产单列表页面
 */
import { useRef, useState } from 'react';
import { Button, Popconfirm, message, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { useNavigate } from 'react-router-dom';
import { getJobOrders, deleteJobOrder } from '../../services/production';
import type { JobOrder } from '../../services/production';
import JobOrderForm from './JobOrderForm';

/** 状态标签 */
const statusMap: Record<string, { text: string; color: string }> = {
  PLANNED: { text: '已计划', color: 'default' },
  IN_PROGRESS: { text: '进行中', color: 'processing' },
  COMPLETED: { text: '已完成', color: 'success' },
  CANCELLED: { text: '已取消', color: 'error' },
};

export default function JobOrderList() {
  const navigate = useNavigate();
  const actionRef = useRef<ActionType>(null);
  const [formOpen, setFormOpen] = useState(false);

  const handleDelete = async (id: string) => {
    try {
      await deleteJobOrder(id);
      message.success('删除成功');
      actionRef.current?.reload();
    } catch {
      message.error('删除失败');
    }
  };

  const columns: ProColumns<JobOrder>[] = [
    { title: '单据号', dataIndex: 'docNo', width: 150 },
    { title: '成品', dataIndex: ['productItem', 'description'], ellipsis: true, hideInSearch: true },
    { title: '计划数量', dataIndex: 'plannedQty', width: 100, hideInSearch: true },
    { title: '完成数量', dataIndex: 'completedQty', width: 100, hideInSearch: true },
    { title: '计划开始', dataIndex: 'plannedStart', width: 120, valueType: 'date', hideInSearch: true },
    { title: '计划结束', dataIndex: 'plannedEnd', width: 120, valueType: 'date', hideInSearch: true },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (_, record) => {
        const s = statusMap[record.status] || { text: record.status, color: 'default' };
        return <Tag color={s.color}>{s.text}</Tag>;
      },
      valueEnum: {
        PLANNED: { text: '已计划' },
        IN_PROGRESS: { text: '进行中' },
        COMPLETED: { text: '已完成' },
        CANCELLED: { text: '已取消' },
      },
    },
    {
      title: '操作',
      valueType: 'option',
      width: 180,
      render: (_, record) => [
        <a key="detail" onClick={() => navigate(`/production/jobs/${record.id}`)}>详情</a>,
        <Popconfirm key="delete" title="确认删除？" onConfirm={() => handleDelete(record.id)}>
          <a style={{ color: '#ff4d4f' }}>删除</a>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <>
      <ProTable<JobOrder>
        headerTitle="生产单"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        request={async (params) => {
          const res = await getJobOrders({
            page: params.current,
            pageSize: params.pageSize,
            status: params.status,
          });
          return { data: res.data || res, total: res.total || 0, success: true };
        }}
        pagination={{ defaultPageSize: 20 }}
        toolBarRender={() => [
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => setFormOpen(true)}>
            新增生产单
          </Button>,
        ]}
      />
      <JobOrderForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={() => { setFormOpen(false); actionRef.current?.reload(); }}
      />
    </>
  );
}
