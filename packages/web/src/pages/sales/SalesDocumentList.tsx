/**
 * 销售单据列表页面
 * Tabs 切换单据类型（报价单、销售单、出货单、发票、现金销售）
 */
import { useRef, useState } from 'react';
import { Button, Popconfirm, message, Tag, Tabs } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { useNavigate } from 'react-router-dom';
import { getSalesDocuments, deleteSalesDocument } from '../../services/sales';
import type { SalesDocument } from '../../services/sales';

/** 单据类型映射 */
const docTypes = [
  { key: 'QUOTATION', label: '报价单' },
  { key: 'SALES_ORDER', label: '销售单' },
  { key: 'DELIVERY_ORDER', label: '出货单' },
  { key: 'INVOICE', label: '发票' },
  { key: 'CASH_SALE', label: '现金销售' },
];

/** 状态标签颜色 */
const statusColors: Record<string, string> = {
  DRAFT: 'default',
  APPROVED: 'green',
  CANCELLED: 'red',
  TRANSFERRED: 'blue',
};

const statusLabels: Record<string, string> = {
  DRAFT: '草稿',
  APPROVED: '已审批',
  CANCELLED: '已取消',
  TRANSFERRED: '已转单',
};

export default function SalesDocumentList() {
  const navigate = useNavigate();
  const actionRef = useRef<ActionType>(null);
  const [activeType, setActiveType] = useState('QUOTATION');

  /** 删除单据 */
  const handleDelete = async (id: string) => {
    try {
      await deleteSalesDocument(id);
      message.success('删除成功');
      actionRef.current?.reload();
    } catch {
      message.error('删除失败');
    }
  };

  /** 表格列定义 */
  const columns: ProColumns<SalesDocument>[] = [
    { title: '单据号', dataIndex: 'docNo', width: 150 },
    { title: '客户', dataIndex: ['customer', 'companyName'], ellipsis: true, hideInSearch: true },
    { title: '日期', dataIndex: 'date', width: 120, valueType: 'date', hideInSearch: true },
    { title: '币种', dataIndex: 'currency', width: 80, hideInSearch: true },
    { title: '小计', dataIndex: 'subtotal', width: 120, hideInSearch: true, valueType: 'money' },
    { title: '税额', dataIndex: 'taxAmount', width: 100, hideInSearch: true, valueType: 'money' },
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
        <a key="edit" onClick={() => navigate(`/sales/documents/${record.id}/edit?type=${activeType}`)}>
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
      {/* 单据类型 Tabs */}
      <Tabs
        activeKey={activeType}
        onChange={(key) => {
          setActiveType(key);
          actionRef.current?.reload();
        }}
        items={docTypes.map((dt) => ({ key: dt.key, label: dt.label }))}
      />
      <ProTable<SalesDocument>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        request={async (params) => {
          const res = await getSalesDocuments({
            type: activeType,
            page: params.current,
            pageSize: params.pageSize,
            keyword: params.docNo,
          });
          return { data: res.data || res, total: res.total || 0, success: true };
        }}
        pagination={{ defaultPageSize: 20 }}
        toolBarRender={() => [
          <Button
            key="add"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate(`/sales/documents/new?type=${activeType}`)}
          >
            新增
          </Button>,
        ]}
      />
    </div>
  );
}
