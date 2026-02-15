/**
 * 采购单据列表页面
 * Tabs 切换单据类型
 */
import { useRef, useState } from 'react';
import { Button, Popconfirm, message, Tag, Tabs } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { useNavigate } from 'react-router-dom';
import { getPurchaseDocuments, deletePurchaseDocument } from '../../services/purchase';
import type { PurchaseDocument } from '../../services/purchase';

/** 单据类型映射 */
const docTypes = [
  { key: 'REQUEST', label: '采购申请' },
  { key: 'ORDER', label: '采购订单' },
  { key: 'GOODS_RECEIVED', label: '收货单' },
  { key: 'INVOICE', label: '采购发票' },
  { key: 'RETURNED', label: '采购退货' },
];

/** 状态标签 */
const statusColors: Record<string, string> = {
  DRAFT: 'default', APPROVED: 'green', CANCELLED: 'red', TRANSFERRED: 'blue',
};
const statusLabels: Record<string, string> = {
  DRAFT: '草稿', APPROVED: '已审批', CANCELLED: '已取消', TRANSFERRED: '已转单',
};

export default function PurchaseDocumentList() {
  const navigate = useNavigate();
  const actionRef = useRef<ActionType>(null);
  const [activeType, setActiveType] = useState('REQUEST');

  /** 删除 */
  const handleDelete = async (id: string) => {
    try {
      await deletePurchaseDocument(id);
      message.success('删除成功');
      actionRef.current?.reload();
    } catch {
      message.error('删除失败');
    }
  };

  const columns: ProColumns<PurchaseDocument>[] = [
    { title: '单据号', dataIndex: 'docNo', width: 150 },
    { title: '供应商', dataIndex: ['supplier', 'companyName'], ellipsis: true, hideInSearch: true },
    { title: '日期', dataIndex: 'date', width: 120, valueType: 'date', hideInSearch: true },
    { title: '币种', dataIndex: 'currency', width: 80, hideInSearch: true },
    { title: '合计', dataIndex: 'total', width: 120, hideInSearch: true, valueType: 'money' },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      hideInSearch: true,
      render: (_, record) => (
        <Tag color={statusColors[record.status]}>
          {statusLabels[record.status] || record.status}
        </Tag>
      ),
    },
    {
      title: '操作',
      valueType: 'option',
      width: 150,
      render: (_, record) => [
        <a key="edit" onClick={() => navigate(`/purchase/documents/${record.id}/edit?type=${activeType}`)}>
          编辑
        </a>,
        <Popconfirm key="delete" title="确认删除？" onConfirm={() => handleDelete(record.id)}>
          <a style={{ color: '#ff4d4f' }}>删除</a>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <div>
      <Tabs
        activeKey={activeType}
        onChange={(key) => { setActiveType(key); actionRef.current?.reload(); }}
        items={docTypes.map((dt) => ({ key: dt.key, label: dt.label }))}
      />
      <ProTable<PurchaseDocument>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        request={async (params) => {
          const res = await getPurchaseDocuments({
            type: activeType,
            page: params.current,
            pageSize: params.pageSize,
            keyword: params.docNo,
          });
          return { data: res.data || res, total: res.total || 0, success: true };
        }}
        pagination={{ defaultPageSize: 20 }}
        toolBarRender={() => [
          <Button key="add" type="primary" icon={<PlusOutlined />}
            onClick={() => navigate(`/purchase/documents/new?type=${activeType}`)}>
            新增
          </Button>,
        ]}
      />
    </div>
  );
}
