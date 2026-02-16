/**
 * 入库流水列表页面
 * 支持筛选（时间区间、客户、材料）、新增、删除、导出 Excel
 */
import { useRef, useState, useEffect } from 'react';
import { Button, Popconfirm, message, Modal, Form, Input, InputNumber, DatePicker, Select, Space } from 'antd';
import { PlusOutlined, DownloadOutlined } from '@ant-design/icons';
import { ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import dayjs from 'dayjs';
import {
  getInboundFlows, createInboundFlow, deleteInboundFlow,
  exportInboundFlow, downloadExportFile,
} from '../../services/flow';
import type { InboundFlow, FlowQuery } from '../../services/flow';
import { getCustomers } from '../../services/customer';
import type { Customer } from '../../services/customer';
import { getStockItems } from '../../services/stock';
import type { StockItem } from '../../services/stock';

export default function InboundFlowList() {
  const actionRef = useRef<ActionType>(null);
  const [form] = Form.useForm();
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  /** 当前筛选条件（导出时复用） */
  const [currentFilters, setCurrentFilters] = useState<FlowQuery>({});

  /** 加载客户和材料下拉数据 */
  useEffect(() => {
    getCustomers({ pageSize: 999 }).then((res: any) => setCustomers(res.data || res));
    getStockItems({ pageSize: 999 }).then((res: any) => setStockItems(res.data || res));
  }, []);

  /** 打开新增弹窗 */
  const openModal = () => {
    form.resetFields();
    setModalOpen(true);
  };

  /** 提交新增 */
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await createInboundFlow({
        ...values,
        date: values.date ? dayjs(values.date).format('YYYY-MM-DD') : undefined,
      });
      message.success('新增成功');
      setModalOpen(false);
      actionRef.current?.reload();
    } catch {
      message.error('操作失败');
    } finally {
      setLoading(false);
    }
  };

  /** 删除记录 */
  const handleDelete = async (id: string) => {
    try {
      await deleteInboundFlow(id);
      message.success('删除成功');
      actionRef.current?.reload();
    } catch {
      message.error('删除失败');
    }
  };

  /** 导出 Excel */
  const handleExport = async () => {
    try {
      setExporting(true);
      const res = await exportInboundFlow(currentFilters);
      downloadExportFile(res.filename);
      message.success('导出成功');
    } catch {
      message.error('导出失败');
    } finally {
      setExporting(false);
    }
  };

  /** 表格列定义 */
  const columns: ProColumns<InboundFlow>[] = [
    {
      title: '日期', dataIndex: 'date', valueType: 'dateRange',
      width: 120,
      render: (_, record) => record.date ? dayjs(record.date).format('YYYY-MM-DD') : '-',
      search: {
        transform: (value: [string, string]) => ({
          startDate: value[0],
          endDate: value[1],
        }),
      },
    },
    { title: '序号', dataIndex: 'serialNo', width: 100, hideInSearch: true },
    { title: '柜号/车号', dataIndex: 'containerNo', width: 160, hideInSearch: true },
    { title: '货名', dataIndex: 'itemName', width: 150, hideInSearch: true },
    { title: '提单重量', dataIndex: 'billWeight', width: 100, hideInSearch: true },
    { title: '实际重量', dataIndex: 'actualWeight', width: 100, hideInSearch: true },
    { title: '仓库位置', dataIndex: 'location', width: 100, hideInSearch: true },
    { title: '实际总重', dataIndex: 'totalWeight', width: 100, hideInSearch: true },
    { title: '备注', dataIndex: 'remark', ellipsis: true, hideInSearch: true },
    { title: '重差', dataIndex: 'weightDiff', width: 80, hideInSearch: true },
    {
      title: '客户', dataIndex: 'customerId', width: 140,
      render: (_, record) => record.customer?.companyName || '-',
      renderFormItem: () => (
        <Select allowClear placeholder="选择客户" showSearch optionFilterProp="label"
          options={customers.map((c) => ({ label: c.companyName, value: c.id }))} />
      ),
    },
    {
      title: '材料', dataIndex: 'stockItemId', width: 140,
      render: (_, record) => record.stockItem?.description || '-',
      renderFormItem: () => (
        <Select allowClear placeholder="选择材料" showSearch optionFilterProp="label"
          options={stockItems.map((s) => ({ label: s.description, value: s.id }))} />
      ),
    },
    {
      title: '操作', valueType: 'option', width: 80,
      render: (_, record) => [
        <Popconfirm key="delete" title="确认删除？" onConfirm={() => handleDelete(record.id)}>
          <a style={{ color: '#ff4d4f' }}>删除</a>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <>
      <ProTable<InboundFlow>
        headerTitle="入库流水"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        request={async (params) => {
          // 保存筛选条件供导出使用
          const filters: FlowQuery = {
            page: params.current,
            pageSize: params.pageSize,
            startDate: params.startDate,
            endDate: params.endDate,
            customerId: params.customerId,
            stockItemId: params.stockItemId,
          };
          setCurrentFilters(filters);
          const res = await getInboundFlows(filters);
          return { data: res.data, total: res.total, success: true };
        }}
        pagination={{ defaultPageSize: 20 }}
        toolBarRender={() => [
          <Button key="export" icon={<DownloadOutlined />} onClick={handleExport} loading={exporting}>
            导出 Excel
          </Button>,
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={openModal}>
            新增
          </Button>,
        ]}
      />

      {/* 新增弹窗 */}
      <Modal title="新增入库流水" open={modalOpen} onOk={handleSubmit}
        onCancel={() => setModalOpen(false)} confirmLoading={loading} width={640}>
        <Form form={form} layout="vertical">
          <Space size="large" wrap>
            <Form.Item name="date" label="日期" rules={[{ required: true }]}>
              <DatePicker />
            </Form.Item>
            <Form.Item name="serialNo" label="序号">
              <Input style={{ width: 150 }} />
            </Form.Item>
          </Space>
          <Form.Item name="containerNo" label="柜号/车号">
            <Input />
          </Form.Item>
          <Form.Item name="itemName" label="货名" rules={[{ required: true, message: '请输入货名' }]}>
            <Input />
          </Form.Item>
          <Space size="large" wrap>
            <Form.Item name="billWeight" label="提单重量">
              <InputNumber style={{ width: 150 }} />
            </Form.Item>
            <Form.Item name="actualWeight" label="实际重量">
              <InputNumber style={{ width: 150 }} />
            </Form.Item>
            <Form.Item name="weightDiff" label="重差">
              <InputNumber style={{ width: 150 }} />
            </Form.Item>
          </Space>
          <Space size="large" wrap>
            <Form.Item name="location" label="仓库位置">
              <Input style={{ width: 150 }} />
            </Form.Item>
            <Form.Item name="totalWeight" label="实际总重">
              <InputNumber style={{ width: 150 }} />
            </Form.Item>
          </Space>
          <Space size="large" wrap>
            <Form.Item name="customerId" label="客户">
              <Select allowClear showSearch optionFilterProp="label" style={{ width: 200 }}
                options={customers.map((c) => ({ label: c.companyName, value: c.id }))} />
            </Form.Item>
            <Form.Item name="stockItemId" label="材料">
              <Select allowClear showSearch optionFilterProp="label" style={{ width: 200 }}
                options={stockItems.map((s) => ({ label: s.description, value: s.id }))} />
            </Form.Item>
          </Space>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
