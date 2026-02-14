/**
 * 库存操作表单（抽屉）
 * 支持入库/出库/调整/调拨等操作类型
 */
import { useEffect, useState } from 'react';
import {
  Drawer, Form, Input, Select, DatePicker, Button,
  Space, message, Table, InputNumber, Popconfirm,
} from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { createStockTransaction, getStockLocations, getStockItems } from '../../services/stock';
import type { StockTransactionItem, StockLocation, StockItem } from '../../services/stock';
import dayjs from 'dayjs';

interface StockTransactionFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function StockTransactionForm({ open, onClose, onSuccess }: StockTransactionFormProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Partial<StockTransactionItem>[]>([]);
  const [locations, setLocations] = useState<StockLocation[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);

  /** 加载下拉选项 */
  useEffect(() => {
    if (open) {
      getStockLocations().then((res) => setLocations(res.data || res));
      getStockItems().then((res) => setStockItems(res.data || res));
      form.resetFields();
      setItems([]);
    }
  }, [open, form]);

  /** 添加行项目 */
  const addItem = () => {
    setItems([...items, { itemId: '', qty: 0, uom: 'KG', unitCost: 0 }]);
  };

  /** 删除行项目 */
  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  /** 更新行项目字段 */
  const updateItem = (index: number, field: string, value: unknown) => {
    const updated = [...items];
    (updated[index] as Record<string, unknown>)[field] = value;
    setItems(updated);
  };

  /** 提交 */
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (items.length === 0) {
        message.warning('请添加至少一个行项目');
        return;
      }
      setLoading(true);
      await createStockTransaction({
        ...values,
        date: values.date ? dayjs(values.date).format('YYYY-MM-DD') : undefined,
        items: items as StockTransactionItem[],
      });
      message.success('创建成功');
      onSuccess();
    } catch {
      message.error('操作失败');
    } finally {
      setLoading(false);
    }
  };

  /** 行项目表格列 */
  const columns = [
    {
      title: '物料',
      dataIndex: 'itemId',
      width: 200,
      render: (_: unknown, __: unknown, index: number) => (
        <Select
          value={items[index].itemId}
          onChange={(v) => updateItem(index, 'itemId', v)}
          placeholder="选择物料"
          showSearch
          optionFilterProp="label"
          style={{ width: '100%' }}
          options={stockItems.map((si) => ({ label: `${si.code} - ${si.description}`, value: si.id }))}
        />
      ),
    },
    {
      title: '数量',
      dataIndex: 'qty',
      width: 120,
      render: (_: unknown, __: unknown, index: number) => (
        <InputNumber value={items[index].qty} onChange={(v) => updateItem(index, 'qty', v)} style={{ width: '100%' }} />
      ),
    },
    {
      title: '单位',
      dataIndex: 'uom',
      width: 80,
      render: (_: unknown, __: unknown, index: number) => (
        <Input value={items[index].uom} onChange={(e) => updateItem(index, 'uom', e.target.value)} />
      ),
    },
    {
      title: '单位成本',
      dataIndex: 'unitCost',
      width: 120,
      render: (_: unknown, __: unknown, index: number) => (
        <InputNumber value={items[index].unitCost} onChange={(v) => updateItem(index, 'unitCost', v)} style={{ width: '100%' }} />
      ),
    },
    {
      title: '备注',
      dataIndex: 'notes',
      render: (_: unknown, __: unknown, index: number) => (
        <Input value={items[index].notes || ''} onChange={(e) => updateItem(index, 'notes', e.target.value)} />
      ),
    },
    {
      title: '',
      width: 50,
      render: (_: unknown, __: unknown, index: number) => (
        <Popconfirm title="删除？" onConfirm={() => removeItem(index)}>
          <Button type="text" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <Drawer
      title="新建库存操作"
      open={open}
      onClose={onClose}
      width={900}
      extra={
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" onClick={handleSubmit} loading={loading}>保存</Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical">
        <Space size="large">
          <Form.Item name="type" label="操作类型" rules={[{ required: true }]}>
            <Select style={{ width: 200 }} options={[
              { label: '入库', value: 'RECEIVED' },
              { label: '出库', value: 'ISSUE' },
              { label: '调整', value: 'ADJUSTMENT' },
              { label: '调拨', value: 'TRANSFER' },
            ]} />
          </Form.Item>
          <Form.Item name="date" label="日期" rules={[{ required: true }]}>
            <DatePicker />
          </Form.Item>
        </Space>
        <Space size="large">
          <Form.Item name="locationFromId" label="来源仓库">
            <Select allowClear style={{ width: 200 }} placeholder="选择仓库"
              options={locations.map((l) => ({ label: l.name, value: l.id }))}
            />
          </Form.Item>
          <Form.Item name="locationToId" label="目标仓库">
            <Select allowClear style={{ width: 200 }} placeholder="选择仓库"
              options={locations.map((l) => ({ label: l.name, value: l.id }))}
            />
          </Form.Item>
        </Space>
      </Form>

      {/* 行项目表格 */}
      <Table
        dataSource={items}
        columns={columns}
        rowKey={(_, index) => String(index)}
        pagination={false}
        size="small"
        style={{ marginTop: 16 }}
        footer={() => (
          <Button type="dashed" block icon={<PlusOutlined />} onClick={addItem}>
            添加行项目
          </Button>
        )}
      />
    </Drawer>
  );
}
