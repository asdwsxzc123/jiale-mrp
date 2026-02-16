/**
 * 出库流水列表页面
 * 支持筛选（时间区间、客户、材料）、新增、删除、导出 Excel
 */
import { useRef, useState, useEffect } from 'react';
import { Button, Popconfirm, message, Modal, Form, Input, InputNumber, DatePicker, Select, Space } from 'antd';
import { PlusOutlined, DownloadOutlined } from '@ant-design/icons';
import { ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import dayjs from 'dayjs';
import {
  getOutboundFlows, createOutboundFlow, deleteOutboundFlow,
  exportOutboundFlow, downloadExportFile,
} from '../../services/flow';
import type { OutboundFlow, FlowQuery } from '../../services/flow';
import { getCustomers } from '../../services/customer';
import type { Customer } from '../../services/customer';
import { getStockItems } from '../../services/stock';
import type { StockItem } from '../../services/stock';

export default function OutboundFlowList() {
  const actionRef = useRef<ActionType>(null);
  const [form] = Form.useForm();
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [currentFilters, setCurrentFilters] = useState<FlowQuery>({});

  useEffect(() => {
    getCustomers({ pageSize: 999 }).then((res: any) => setCustomers(res.data || res));
    getStockItems({ pageSize: 999 }).then((res: any) => setStockItems(res.data || res));
  }, []);

  const openModal = () => { form.resetFields(); setModalOpen(true); };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await createOutboundFlow({
        ...values,
        date: values.date ? dayjs(values.date).format('YYYY-MM-DD') : undefined,
      });
      message.success('新增成功');
      setModalOpen(false);
      actionRef.current?.reload();
    } catch { message.error('操作失败'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    try { await deleteOutboundFlow(id); message.success('删除成功'); actionRef.current?.reload(); }
    catch { message.error('删除失败'); }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const res = await exportOutboundFlow(currentFilters);
      downloadExportFile(res.filename);
      message.success('导出成功');
    } catch { message.error('导出失败'); }
    finally { setExporting(false); }
  };

  const columns: ProColumns<OutboundFlow>[] = [
    {
      title: '日期', dataIndex: 'date', valueType: 'dateRange', width: 120,
      render: (_, record) => record.date ? dayjs(record.date).format('YYYY-MM-DD') : '-',
      search: { transform: (value: [string, string]) => ({ startDate: value[0], endDate: value[1] }) },
    },
    { title: '序号', dataIndex: 'serialNo', width: 100, hideInSearch: true },
    { title: '归属', dataIndex: 'belonging', width: 120, hideInSearch: true },
    { title: '柜号', dataIndex: 'containerNo', width: 160, hideInSearch: true },
    { title: '品名', dataIndex: 'itemName', width: 150, hideInSearch: true },
    { title: '重量', dataIndex: 'weight', width: 100, hideInSearch: true },
    { title: '包数', dataIndex: 'packageCount', width: 80, hideInSearch: true },
    { title: '总重', dataIndex: 'totalWeight', width: 100, hideInSearch: true },
    { title: '备注', dataIndex: 'remark', ellipsis: true, hideInSearch: true },
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
      <ProTable<OutboundFlow>
        headerTitle="出库流水"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        request={async (params) => {
          const filters: FlowQuery = {
            page: params.current, pageSize: params.pageSize,
            startDate: params.startDate, endDate: params.endDate,
            customerId: params.customerId, stockItemId: params.stockItemId,
          };
          setCurrentFilters(filters);
          const res = await getOutboundFlows(filters);
          return { data: res.data, total: res.total, success: true };
        }}
        pagination={{ defaultPageSize: 20 }}
        toolBarRender={() => [
          <Button key="export" icon={<DownloadOutlined />} onClick={handleExport} loading={exporting}>导出 Excel</Button>,
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={openModal}>新增</Button>,
        ]}
      />

      <Modal title="新增出库流水" open={modalOpen} onOk={handleSubmit}
        onCancel={() => setModalOpen(false)} confirmLoading={loading} width={640}>
        <Form form={form} layout="vertical">
          <Space size="large" wrap>
            <Form.Item name="date" label="日期" rules={[{ required: true }]}><DatePicker /></Form.Item>
            <Form.Item name="serialNo" label="序号"><Input style={{ width: 150 }} /></Form.Item>
          </Space>
          <Space size="large" wrap>
            <Form.Item name="belonging" label="归属"><Input style={{ width: 200 }} /></Form.Item>
            <Form.Item name="containerNo" label="柜号"><Input style={{ width: 200 }} /></Form.Item>
          </Space>
          <Form.Item name="itemName" label="品名" rules={[{ required: true, message: '请输入品名' }]}>
            <Input />
          </Form.Item>
          <Space size="large" wrap>
            <Form.Item name="weight" label="重量"><InputNumber style={{ width: 150 }} /></Form.Item>
            <Form.Item name="packageCount" label="包数"><InputNumber style={{ width: 150 }} precision={0} /></Form.Item>
            <Form.Item name="totalWeight" label="总重"><InputNumber style={{ width: 150 }} /></Form.Item>
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
          <Form.Item name="remark" label="备注"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </>
  );
}
