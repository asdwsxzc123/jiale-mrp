/**
 * 出成率列表页面
 * 支持筛选（时间区间、客户、材料）、新增、删除、导出 Excel
 */
import { useRef, useState, useEffect } from 'react';
import { Button, Popconfirm, message, Modal, Form, Input, InputNumber, DatePicker, Select, Space } from 'antd';
import { PlusOutlined, DownloadOutlined } from '@ant-design/icons';
import { ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import dayjs from 'dayjs';
import {
  getYieldRates, createYieldRate, deleteYieldRate,
  exportYieldRate, downloadExportFile,
} from '../../services/flow';
import type { YieldRate, FlowQuery } from '../../services/flow';
import { getCustomers } from '../../services/customer';
import type { Customer } from '../../services/customer';
import { getStockItems } from '../../services/stock';
import type { StockItem } from '../../services/stock';

export default function YieldRateList() {
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
      await createYieldRate({
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
    try { await deleteYieldRate(id); message.success('删除成功'); actionRef.current?.reload(); }
    catch { message.error('删除失败'); }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const res = await exportYieldRate(currentFilters);
      downloadExportFile(res.filename);
      message.success('导出成功');
    } catch { message.error('导出失败'); }
    finally { setExporting(false); }
  };

  const columns: ProColumns<YieldRate>[] = [
    {
      title: '日期', dataIndex: 'date', valueType: 'dateRange', width: 120,
      render: (_, record) => record.date ? dayjs(record.date).format('YYYY-MM-DD') : '-',
      search: { transform: (value: [string, string]) => ({ startDate: value[0], endDate: value[1] }) },
    },
    { title: '货名', dataIndex: 'itemName', width: 120, hideInSearch: true },
    { title: '柜号/车号', dataIndex: 'containerNo', width: 140, hideInSearch: true },
    { title: '来货重量', dataIndex: 'incomingWeight', width: 100, hideInSearch: true },
    { title: '步骤', dataIndex: 'step', width: 120, hideInSearch: true },
    { title: '颗粒名称', dataIndex: 'pelletName', width: 100, hideInSearch: true },
    { title: '重量', dataIndex: 'weight', width: 80, hideInSearch: true },
    { title: '色母', dataIndex: 'colorMaster', width: 70, hideInSearch: true },
    { title: '太空袋', dataIndex: 'spaceBag', width: 80, hideInSearch: true },
    { title: '杂料', dataIndex: 'misc', width: 70, hideInSearch: true },
    { title: '胶头/杂料', dataIndex: 'glueHeadMisc', width: 90, hideInSearch: true },
    { title: '垃圾', dataIndex: 'waste', width: 70, hideInSearch: true },
    { title: '卡板', dataIndex: 'pallet', width: 70, hideInSearch: true },
    { title: '总重量', dataIndex: 'totalWeight', width: 90, hideInSearch: true },
    { title: '出成率', dataIndex: 'yieldRateVal', width: 80, hideInSearch: true },
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
      title: '操作', valueType: 'option', width: 80, fixed: 'right',
      render: (_, record) => [
        <Popconfirm key="delete" title="确认删除？" onConfirm={() => handleDelete(record.id)}>
          <a style={{ color: '#ff4d4f' }}>删除</a>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <>
      <ProTable<YieldRate>
        headerTitle="出成率"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        scroll={{ x: 1800 }}
        request={async (params) => {
          const filters: FlowQuery = {
            page: params.current, pageSize: params.pageSize,
            startDate: params.startDate, endDate: params.endDate,
            customerId: params.customerId, stockItemId: params.stockItemId,
          };
          setCurrentFilters(filters);
          const res = await getYieldRates(filters);
          return { data: res.data, total: res.total, success: true };
        }}
        pagination={{ defaultPageSize: 20 }}
        toolBarRender={() => [
          <Button key="export" icon={<DownloadOutlined />} onClick={handleExport} loading={exporting}>导出 Excel</Button>,
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={openModal}>新增</Button>,
        ]}
      />

      <Modal title="新增出成率" open={modalOpen} onOk={handleSubmit}
        onCancel={() => setModalOpen(false)} confirmLoading={loading} width={720}>
        <Form form={form} layout="vertical">
          <Space size="large" wrap>
            <Form.Item name="date" label="日期" rules={[{ required: true }]}><DatePicker /></Form.Item>
            <Form.Item name="itemName" label="货名" rules={[{ required: true, message: '请输入货名' }]}>
              <Input style={{ width: 200 }} />
            </Form.Item>
            <Form.Item name="containerNo" label="柜号/车号"><Input style={{ width: 200 }} /></Form.Item>
          </Space>
          <Space size="large" wrap>
            <Form.Item name="incomingWeight" label="来货重量"><InputNumber style={{ width: 140 }} /></Form.Item>
            <Form.Item name="step" label="步骤"><Input style={{ width: 200 }} /></Form.Item>
            <Form.Item name="pelletName" label="颗粒名称"><Input style={{ width: 200 }} /></Form.Item>
          </Space>
          <Space size="large" wrap>
            <Form.Item name="weight" label="重量"><InputNumber style={{ width: 120 }} /></Form.Item>
            <Form.Item name="colorMaster" label="色母"><InputNumber style={{ width: 120 }} /></Form.Item>
            <Form.Item name="spaceBag" label="太空袋"><InputNumber style={{ width: 120 }} /></Form.Item>
            <Form.Item name="misc" label="杂料"><InputNumber style={{ width: 120 }} /></Form.Item>
          </Space>
          <Space size="large" wrap>
            <Form.Item name="glueHeadMisc" label="胶头/杂料"><InputNumber style={{ width: 120 }} /></Form.Item>
            <Form.Item name="waste" label="垃圾"><InputNumber style={{ width: 120 }} /></Form.Item>
            <Form.Item name="pallet" label="卡板"><InputNumber style={{ width: 120 }} /></Form.Item>
            <Form.Item name="totalWeight" label="总重量"><InputNumber style={{ width: 120 }} /></Form.Item>
          </Space>
          <Space size="large" wrap>
            <Form.Item name="yieldRateVal" label="出成率"><InputNumber style={{ width: 120 }} /></Form.Item>
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
