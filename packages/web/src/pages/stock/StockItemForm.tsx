/**
 * 物料新增/编辑抽屉表单
 * 包含基本信息和 UOM 子表
 */
import { useEffect, useState } from 'react';
import {
  Drawer, Form, Input, InputNumber, Select, Switch,
  Button, Space, message, Table, Popconfirm,
} from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import {
  getStockItem, createStockItem, updateStockItem,
  getStockGroups, getStockCategories,
} from '../../services/stock';
import type { StockItemUOM, StockGroup, StockCategory } from '../../services/stock';

interface StockItemFormProps {
  open: boolean;
  editingId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function StockItemForm({ open, editingId, onClose, onSuccess }: StockItemFormProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [uoms, setUoms] = useState<StockItemUOM[]>([]);
  const [groups, setGroups] = useState<StockGroup[]>([]);
  const [categories, setCategories] = useState<StockCategory[]>([]);

  /** 加载下拉选项 */
  useEffect(() => {
    if (open) {
      getStockGroups().then((res) => setGroups(res.data || res));
      getStockCategories().then((res) => setCategories(res.data || res));
    }
  }, [open]);

  /** 编辑模式时加载物料数据 */
  useEffect(() => {
    if (open && editingId) {
      getStockItem(editingId).then((data) => {
        form.setFieldsValue(data);
        setUoms(data.uoms || []);
      });
    } else if (open) {
      form.resetFields();
      setUoms([]);
    }
  }, [open, editingId, form]);

  /** 添加 UOM 行 */
  const addUom = () => {
    setUoms([...uoms, { uom: '', rate: 1, refCost: 0, refPrice: 0, isBase: false }]);
  };

  /** 删除 UOM 行 */
  const removeUom = (index: number) => {
    setUoms(uoms.filter((_, i) => i !== index));
  };

  /** 更新 UOM 字段 */
  const updateUom = (index: number, field: string, value: unknown) => {
    const updated = [...uoms];
    (updated[index] as unknown as Record<string, unknown>)[field] = value;
    setUoms(updated);
  };

  /** 提交表单 */
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const payload = { ...values, uoms };
      if (editingId) {
        await updateStockItem(editingId, payload);
        message.success('更新成功');
      } else {
        await createStockItem(payload);
        message.success('创建成功');
      }
      onSuccess();
    } catch {
      message.error('操作失败');
    } finally {
      setLoading(false);
    }
  };

  /** UOM 子表列定义 */
  const uomColumns = [
    {
      title: '单位',
      dataIndex: 'uom',
      render: (_: unknown, __: unknown, index: number) => (
        <Input value={uoms[index].uom} onChange={(e) => updateUom(index, 'uom', e.target.value)} />
      ),
    },
    {
      title: '换算率',
      dataIndex: 'rate',
      render: (_: unknown, __: unknown, index: number) => (
        <InputNumber value={uoms[index].rate} onChange={(v) => updateUom(index, 'rate', v)} style={{ width: '100%' }} />
      ),
    },
    {
      title: '参考成本',
      dataIndex: 'refCost',
      render: (_: unknown, __: unknown, index: number) => (
        <InputNumber value={uoms[index].refCost} onChange={(v) => updateUom(index, 'refCost', v)} style={{ width: '100%' }} />
      ),
    },
    {
      title: '参考售价',
      dataIndex: 'refPrice',
      render: (_: unknown, __: unknown, index: number) => (
        <InputNumber value={uoms[index].refPrice} onChange={(v) => updateUom(index, 'refPrice', v)} style={{ width: '100%' }} />
      ),
    },
    {
      title: '基本单位',
      dataIndex: 'isBase',
      width: 80,
      render: (_: unknown, __: unknown, index: number) => (
        <Switch checked={uoms[index].isBase} onChange={(v) => updateUom(index, 'isBase', v)} />
      ),
    },
    {
      title: '操作',
      width: 60,
      render: (_: unknown, __: unknown, index: number) => (
        <Popconfirm title="确认删除？" onConfirm={() => removeUom(index)}>
          <Button type="text" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <Drawer
      title={editingId ? '编辑物料' : '新增物料'}
      open={open}
      onClose={onClose}
      width={800}
      extra={
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" onClick={handleSubmit} loading={loading}>保存</Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical">
        <Form.Item name="code" label="物料编码" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="description" label="描述" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Space style={{ width: '100%' }} size="large">
          <Form.Item name="groupId" label="物料组">
            <Select allowClear placeholder="选择物料组" style={{ width: 200 }}
              options={groups.map((g) => ({ label: g.name, value: g.id }))}
            />
          </Form.Item>
          <Form.Item name="categoryId" label="分类">
            <Select allowClear placeholder="选择分类" style={{ width: 200 }}
              options={categories.map((c) => ({ label: c.name, value: c.id }))}
            />
          </Form.Item>
        </Space>
        <Form.Item name="baseUom" label="基本单位" initialValue="KG">
          <Input style={{ width: 200 }} />
        </Form.Item>
        <Space size="large">
          <Form.Item name="reorderLevel" label="再订货点" initialValue={0}>
            <InputNumber style={{ width: 150 }} />
          </Form.Item>
          <Form.Item name="reorderQty" label="再订货量" initialValue={0}>
            <InputNumber style={{ width: 150 }} />
          </Form.Item>
          <Form.Item name="leadTime" label="交货周期(天)" initialValue={0}>
            <InputNumber style={{ width: 150 }} />
          </Form.Item>
        </Space>
        <Space size="large">
          <Form.Item name="refCost" label="参考成本" initialValue={0}>
            <InputNumber style={{ width: 150 }} />
          </Form.Item>
          <Form.Item name="refPrice" label="参考售价" initialValue={0}>
            <InputNumber style={{ width: 150 }} />
          </Form.Item>
        </Space>
        <Form.Item name="barcode" label="条码">
          <Input style={{ width: 300 }} />
        </Form.Item>
        <Space size="large">
          <Form.Item name="stockControl" label="库存管控" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
          <Form.Item name="isActive" label="启用" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
        </Space>
      </Form>

      {/* UOM 子表 */}
      <div style={{ marginTop: 24 }}>
        <h4>单位换算</h4>
        <Table
          dataSource={uoms}
          columns={uomColumns}
          rowKey={(_, index) => String(index)}
          pagination={false}
          size="small"
          footer={() => (
            <Button type="dashed" block icon={<PlusOutlined />} onClick={addUom}>
              添加单位
            </Button>
          )}
        />
      </div>
    </Drawer>
  );
}
