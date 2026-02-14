/**
 * 销售单据表单页面（独立页面，非抽屉）
 * 可编辑行项目表格，行内计算（数量 x 单价 - 折扣 + 税）
 */
import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Card, Form, Input, Select, DatePicker, InputNumber,
  Button, Space, message, Table, Popconfirm, Switch, Typography,
} from 'antd';
import { PlusOutlined, DeleteOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getSalesDocument, createSalesDocument, updateSalesDocument } from '../../services/sales';
import type { SalesDocumentItem } from '../../services/sales';
import { getCustomers } from '../../services/customer';
import type { Customer } from '../../services/customer';
import { getStockItems } from '../../services/stock';
import type { StockItem } from '../../services/stock';

const { Title } = Typography;

/** 单据类型名称映射 */
const typeNames: Record<string, string> = {
  QUOTATION: '报价单',
  SALES_ORDER: '销售单',
  DELIVERY_ORDER: '出货单',
  INVOICE: '发票',
  CASH_SALE: '现金销售',
};

export default function SalesDocumentForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const docType = searchParams.get('type') || 'QUOTATION';
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Partial<SalesDocumentItem>[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);

  /** 加载下拉数据 */
  useEffect(() => {
    getCustomers().then((res) => setCustomers(res.data || res));
    getStockItems().then((res) => setStockItems(res.data || res));
  }, []);

  /** 编辑模式加载单据数据 */
  useEffect(() => {
    if (id) {
      getSalesDocument(id).then((data) => {
        form.setFieldsValue({ ...data, date: data.date ? dayjs(data.date) : undefined });
        setItems(data.items || []);
      });
    }
  }, [id, form]);

  /** 计算行项目金额 */
  const calcLineItem = useCallback((item: Partial<SalesDocumentItem>): Partial<SalesDocumentItem> => {
    const qty = Number(item.qty) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    const discount = Number(item.discount) || 0;
    const taxRate = Number(item.taxRate) || 0;
    const subtotal = qty * unitPrice - discount;
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;
    return { ...item, subtotal, taxAmount, total };
  }, []);

  /** 更新行项目字段并自动重算 */
  const updateItem = (index: number, field: string, value: unknown) => {
    const updated = [...items];
    (updated[index] as Record<string, unknown>)[field] = value;
    updated[index] = calcLineItem(updated[index]);
    setItems(updated);
  };

  /** 添加行项目 */
  const addItem = () => {
    setItems([...items, { qty: 0, unitPrice: 0, discount: 0, taxRate: 0, taxInclusive: false, subtotal: 0, taxAmount: 0, total: 0 }]);
  };

  /** 提交表单 */
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const payload = {
        ...values,
        type: docType,
        date: values.date ? dayjs(values.date).format('YYYY-MM-DD') : undefined,
        items: items as SalesDocumentItem[],
      };
      if (id) {
        await updateSalesDocument(id, payload);
        message.success('更新成功');
      } else {
        await createSalesDocument(payload);
        message.success('创建成功');
      }
      navigate('/sales/documents');
    } catch {
      message.error('操作失败');
    } finally {
      setLoading(false);
    }
  };

  /** 行项目表格列 */
  const itemColumns = [
    {
      title: '物料', dataIndex: 'itemId', width: 200,
      render: (_: unknown, __: unknown, index: number) => (
        <Select value={items[index].itemId} onChange={(v) => updateItem(index, 'itemId', v)}
          showSearch optionFilterProp="label" style={{ width: '100%' }} allowClear
          options={stockItems.map((si) => ({ label: `${si.code} - ${si.description}`, value: si.id }))} />
      ),
    },
    {
      title: '描述', dataIndex: 'description', width: 150,
      render: (_: unknown, __: unknown, index: number) => (
        <Input value={items[index].description || ''} onChange={(e) => updateItem(index, 'description', e.target.value)} />
      ),
    },
    {
      title: '数量', dataIndex: 'qty', width: 100,
      render: (_: unknown, __: unknown, index: number) => (
        <InputNumber value={items[index].qty} onChange={(v) => updateItem(index, 'qty', v)} style={{ width: '100%' }} />
      ),
    },
    {
      title: '单价', dataIndex: 'unitPrice', width: 100,
      render: (_: unknown, __: unknown, index: number) => (
        <InputNumber value={items[index].unitPrice} onChange={(v) => updateItem(index, 'unitPrice', v)} style={{ width: '100%' }} />
      ),
    },
    {
      title: '折扣', dataIndex: 'discount', width: 80,
      render: (_: unknown, __: unknown, index: number) => (
        <InputNumber value={items[index].discount} onChange={(v) => updateItem(index, 'discount', v)} style={{ width: '100%' }} />
      ),
    },
    {
      title: '税率(%)', dataIndex: 'taxRate', width: 80,
      render: (_: unknown, __: unknown, index: number) => (
        <InputNumber value={items[index].taxRate} onChange={(v) => updateItem(index, 'taxRate', v)} style={{ width: '100%' }} />
      ),
    },
    {
      title: '含税', dataIndex: 'taxInclusive', width: 60,
      render: (_: unknown, __: unknown, index: number) => (
        <Switch checked={items[index].taxInclusive} onChange={(v) => updateItem(index, 'taxInclusive', v)} size="small" />
      ),
    },
    { title: '小计', dataIndex: 'subtotal', width: 100, render: (_: unknown, __: unknown, i: number) => (items[i].subtotal ?? 0).toFixed(2) },
    { title: '税额', dataIndex: 'taxAmount', width: 80, render: (_: unknown, __: unknown, i: number) => (items[i].taxAmount ?? 0).toFixed(2) },
    { title: '合计', dataIndex: 'total', width: 100, render: (_: unknown, __: unknown, i: number) => (items[i].total ?? 0).toFixed(2) },
    {
      title: '', width: 50,
      render: (_: unknown, __: unknown, index: number) => (
        <Popconfirm title="删除？" onConfirm={() => setItems(items.filter((_, i) => i !== index))}>
          <Button type="text" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/sales/documents')}>返回</Button>
        <Title level={4} style={{ margin: 0 }}>{id ? '编辑' : '新增'}{typeNames[docType] || '销售单据'}</Title>
      </Space>

      <Card style={{ marginBottom: 16 }}>
        <Form form={form} layout="vertical">
          <Space size="large" wrap>
            <Form.Item name="customerId" label="客户" rules={[{ required: true }]}>
              <Select showSearch optionFilterProp="label" style={{ width: 300 }}
                options={customers.map((c) => ({ label: `${c.code} - ${c.companyName}`, value: c.id }))} />
            </Form.Item>
            <Form.Item name="date" label="日期" rules={[{ required: true }]}>
              <DatePicker />
            </Form.Item>
            <Form.Item name="currency" label="币种" initialValue="MYR">
              <Select style={{ width: 120 }} options={[
                { label: 'MYR', value: 'MYR' },
                { label: 'RMB', value: 'RMB' },
                { label: 'USD', value: 'USD' },
              ]} />
            </Form.Item>
            <Form.Item name="exchangeRate" label="汇率" initialValue={1}>
              <InputNumber style={{ width: 120 }} />
            </Form.Item>
          </Space>
          <Space size="large" wrap>
            <Form.Item name="agent" label="业务员">
              <Input style={{ width: 200 }} />
            </Form.Item>
            <Form.Item name="terms" label="付款条件">
              <Input style={{ width: 200 }} />
            </Form.Item>
            <Form.Item name="refNo" label="参考号">
              <Input style={{ width: 200 }} />
            </Form.Item>
          </Space>
          <Form.Item name="description" label="说明">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Card>

      {/* 可编辑行项目表格 */}
      <Card title="行项目">
        <Table
          dataSource={items}
          columns={itemColumns}
          rowKey={(_, index) => String(index)}
          pagination={false}
          size="small"
          scroll={{ x: 1200 }}
          footer={() => (
            <Button type="dashed" block icon={<PlusOutlined />} onClick={addItem}>
              添加行项目
            </Button>
          )}
        />
      </Card>

      <div style={{ marginTop: 16, textAlign: 'right' }}>
        <Button type="primary" onClick={handleSubmit} loading={loading} size="large">
          保存
        </Button>
      </div>
    </div>
  );
}
