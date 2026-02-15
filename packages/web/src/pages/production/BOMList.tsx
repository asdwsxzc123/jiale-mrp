/**
 * BOM 物料清单列表页面
 */
import { useRef } from 'react';
import { Button, Popconfirm, message, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { useNavigate } from 'react-router-dom';
import { getBOMs, deleteBOM } from '../../services/production';
import type { BOM } from '../../services/production';

export default function BOMList() {
  const navigate = useNavigate();
  const actionRef = useRef<ActionType>(null);

  /** 删除 BOM */
  const handleDelete = async (id: string) => {
    try {
      await deleteBOM(id);
      message.success('删除成功');
      actionRef.current?.reload();
    } catch {
      message.error('删除失败');
    }
  };

  const columns: ProColumns<BOM>[] = [
    { title: '成品编码', dataIndex: ['productItem', 'code'], width: 120 },
    { title: '成品描述', dataIndex: ['productItem', 'description'], ellipsis: true, hideInSearch: true },
    { title: '版本', dataIndex: 'version', width: 80, hideInSearch: true },
    { title: '说明', dataIndex: 'description', ellipsis: true, hideInSearch: true },
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
    { title: '更新时间', dataIndex: 'updatedAt', width: 180, valueType: 'dateTime', hideInSearch: true },
    {
      title: '操作',
      valueType: 'option',
      width: 150,
      render: (_, record) => [
        <a key="edit" onClick={() => navigate(`/production/bom/${record.id}/edit`)}>编辑</a>,
        <Popconfirm key="delete" title="确认删除？" onConfirm={() => handleDelete(record.id)}>
          <a style={{ color: '#ff4d4f' }}>删除</a>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <ProTable<BOM>
      headerTitle="BOM 物料清单"
      actionRef={actionRef}
      rowKey="id"
      columns={columns}
      request={async (params) => {
        const res = await getBOMs({ page: params.current, pageSize: params.pageSize });
        return { data: res.data || res, total: res.total || 0, success: true };
      }}
      pagination={{ defaultPageSize: 20 }}
      toolBarRender={() => [
        <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => navigate('/production/bom/new')}>
          新增 BOM
        </Button>,
      ]}
    />
  );
}
