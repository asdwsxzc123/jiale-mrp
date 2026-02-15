/**
 * 采购单据表单页面
 * 可编辑行项目，额外字段：预计重量、到港时间、实际重量
 */
import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Card, Form, Input, Select, DatePicker, InputNumber,
  Button, Space, message, Table, Popconfirm, Switch, Typography,
} from 'antd';
import { PlusOutlined, DeleteOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getPurchaseDocument, createPurchaseDocument, updatePurchaseDocument } from '../../services/purchase';
import type { PurchaseDocumentItem } from '../../services/purchase';
import { getSuppliers } from '../../services/supplier';
import type { Supplier } from '../../services/supplier';
import { getStockItems } from '../../services/stock';
import type { StockItem } from '../../services/stock';

const { Title } = Typography;

const typeNames: Record<string, string> = {
  REQUEST: '采购申请', ORDER: '采购订单', GOODS_RECEIVED: '收货单',
  INVOICE: '采购发票', RETURNED: '采购退货',
};

export default function PurchaseDocumentForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const docType = searchParams.get('type') || 'REQUEST';
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Partial<PurchaseDocumentItem>[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);

  useEffect(() => {
    getSuppliers().then((res) => setSuppliers(res.data || res));
    getStockItems().then((res) => setStockItems(res.data || res));
  }, []);

  useEffect(() => {
    if (id) {
      getPurchaseDocument(id).then((data) => {
        form.setFieldsValue({ ...data, date: data.date ? dayjs(data.date) : undefined });
        setItems(data.items || []);
      });
    }
  }, [id, form]);

  /** 计算行项目 */
  const calcLine = useCallback((item: Partial<PurchaseDocumentItem>): Partial<PurchaseDocumentItem> => {
    const qty = Number(item.qty) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    const discount = Number(item.discount) || 0;
    const taxRate = Number(item.taxRate) || 0;
    const subtotal = qty * unitPrice - discount;
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;
    return { ...item, subtotal, taxAmount, total };
  }, []);

  const updateItem = (index: number, field: string, value: unknown) => {
    const updated = [...items];
    (updated[index] as Record<string, unknown>)[field] = value;
    updated[index] = calcLine(updated[index]);
    setItems(updated);
  };

  const addItem = () => {
    setItems([...items, {
      qty: 0, unitPrice: 0, discount: 0, taxRate: 0,
      taxInclusive: false, subtotal: 0, taxAmount: 0, total: 0,
      weightUnit: 'KG',
    }]);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const payload = {
        ...values, type: docType,
        date: values.date ? dayjs(values.date).format('YYYY-MM-DD') : undefined,
        items: items as PurchaseDocumentItem[],
      };
      if (id) {
        await updatePurchaseDocument(id, payload);
        message.success('更新成功');
      } else {
        await createPurchaseDocument(payload);
        message.success('创建成功');
      }
      navigate('/purchase/documents');
    } catch {
      message.error('操作失败');
    } finally {
      setLoading(false);
    }
  };

  const itemColumns = [
    { title: '物料', dataIndex: 'itemId', width: 180, render: (_: unknown, __: unknown, i: number) => (
      <Select value={items[i].itemId} onChange={(v) => updateItem(i, 'itemId', v)} showSearch optionFilterProp="label" style={{ width: '100%' }} allowClear
        options={stockItems.map((si) => ({ label: `${si.code}`, value: si.id }))} />
    )},
    { title: '数量', width: 80, render: (_: unknown, __: unknown, i: number) => (
      <InputNumber value={items[i].qty} onChange={(v) => updateItem(i, 'qty', v)} style={{ width: '100%' }} />
    )},
    { title: '单价', width: 90, render: (_: unknown, __: unknown, i: number) => (
      <InputNumber value={items[i].unitPrice} onChange={(v) => updateItem(i, 'unitPrice', v)} style={{ width: '100%' }} />
    )},
    { title: '税率(%)', width: 70, render: (_: unknown, __: unknown, i: number) => (
      <InputNumber value={items[i].taxRate} onChange={(v) => updateItem(i, 'taxRate', v)} style={{ width: '100%' }} />
    )},
    { title: '含税', width: 50, render: (_: unknown, __: unknown, i: number) => (
      <Switch checked={items[i].taxInclusive} onChange={(v) => updateItem(i, 'taxInclusive', v)} size="small" />
    )},
    { title: '合计', width: 90, render: (_: unknown, __: unknown, i: number) => (items[i].total ?? 0).toFixed(2) },
    { title: '预计重量', width: 90, render: (_: unknown, __: unknown, i: number) => (
      <InputNumber value={items[i].plannedWeight} onChange={(v) => updateItem(i, 'plannedWeight', v)} style={{ width: '100%' }} />
    )},
    { title: '实际重量', width: 90, render: (_: unknown, __: unknown, i: number) => (
      <InputNumber value={items[i].actualWeight} onChange={(v) => updateItem(i, 'actualWeight', v)} style={{ width: '100%' }} />
    )},
    { title: '到港日期', width: 120, render: (_: unknown, __: unknown, i: number) => (
      <DatePicker value={items[i].plannedArrivalDate ? dayjs(items[i].plannedArrivalDate) : undefined}
        onChange={(d) => updateItem(i, 'plannedArrivalDate', d ? dayjs(d).format('YYYY-MM-DD') : undefined)} />
    )},
    { title: '', width: 40, render: (_: unknown, __: unknown, i: number) => (
      <Popconfirm title="删除？" onConfirm={() => setItems(items.filter((_, idx) => idx !== i))}>
        <Button type="text" danger icon={<DeleteOutlined />} />
      </Popconfirm>
    )},
  ];

  return (
    <div style={{ padding: 24 }}>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/purchase/documents')}>返回</Button>
        <Title level={4} style={{ margin: 0 }}>{id ? '编辑' : '新增'}{typeNames[docType] || '采购单据'}</Title>
      </Space>
      <Card style={{ marginBottom: 16 }}>
        <Form form={form} layout="vertical">
          <Space size="large" wrap>
            <Form.Item name="supplierId" label="供应商" rules={[{ required: true }]}>
              <Select showSearch optionFilterProp="label" style={{ width: 300 }}
                options={suppliers.map((s) => ({ label: `${s.code} - ${s.companyName}`, value: s.id }))} />
            </Form.Item>
            <Form.Item name="date" label="日期" rules={[{ required: true }]}>
              <DatePicker />
            </Form.Item>
            <Form.Item name="currency" label="币种" initialValue="MYR">
              <Select style={{ width: 120 }} options={[
                { label: 'MYR', value: 'MYR' }, { label: 'RMB', value: 'RMB' }, { label: 'USD', value: 'USD' },
              ]} />
            </Form.Item>
          </Space>
          <Space size="large" wrap>
            <Form.Item name="agent" label="采购员"><Input style={{ width: 200 }} /></Form.Item>
            <Form.Item name="terms" label="付款条件"><Input style={{ width: 200 }} /></Form.Item>
            <Form.Item name="refNo" label="参考号"><Input style={{ width: 200 }} /></Form.Item>
          </Space>
          <Form.Item name="description" label="说明"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Card>
      <Card title="行项目">
        <Table dataSource={items} columns={itemColumns} rowKey={(_, i) => String(i)}
          pagination={false} size="small" scroll={{ x: 1200 }}
          footer={() => (<Button type="dashed" block icon={<PlusOutlined />} onClick={addItem}>添加行项目</Button>)} />
      </Card>
      <div style={{ marginTop: 16, textAlign: 'right' }}>
        <Button type="primary" onClick={handleSubmit} loading={loading} size="large">保存</Button>
      </div>
    </div>
  );
}
