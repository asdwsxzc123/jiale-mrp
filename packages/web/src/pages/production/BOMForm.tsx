/**
 * BOM 编辑页面
 * 可视化 BOM 编辑（物料列表子表）
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Card, Form, Input, Select, Switch, Button, Space,
  message, Table, InputNumber, Popconfirm, Typography,
} from 'antd';
import { PlusOutlined, DeleteOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { getBOM, createBOM, updateBOM } from '../../services/production';
import type { BOMItem } from '../../services/production';
import { getStockItems } from '../../services/stock';
import type { StockItem } from '../../services/stock';

const { Title } = Typography;

export default function BOMForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Partial<BOMItem>[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);

  /** 加载物料下拉 */
  useEffect(() => {
    getStockItems().then((res) => setStockItems(res.data || res));
  }, []);

  /** 编辑模式加载 BOM 数据 */
  useEffect(() => {
    if (id) {
      getBOM(id).then((data) => {
        form.setFieldsValue(data);
        setItems(data.items || []);
      });
    }
  }, [id, form]);

  /** 更新行项目 */
  const updateItem = (index: number, field: string, value: unknown) => {
    const updated = [...items];
    (updated[index] as Record<string, unknown>)[field] = value;
    setItems(updated);
  };

  /** 添加物料行 */
  const addItem = () => {
    setItems([...items, { materialItemId: '', quantity: 0, uom: 'KG', isSubAssembly: false }]);
  };

  /** 提交 */
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (items.length === 0) {
        message.warning('请至少添加一个物料');
        return;
      }
      setLoading(true);
      const payload = { ...values, items: items as BOMItem[] };
      if (id) {
        await updateBOM(id, payload);
        message.success('更新成功');
      } else {
        await createBOM(payload);
        message.success('创建成功');
      }
      navigate('/production/bom');
    } catch {
      message.error('操作失败');
    } finally {
      setLoading(false);
    }
  };

  /** 子表列定义 */
  const columns = [
    {
      title: '物料', dataIndex: 'materialItemId', width: 250,
      render: (_: unknown, __: unknown, index: number) => (
        <Select value={items[index].materialItemId} onChange={(v) => updateItem(index, 'materialItemId', v)}
          showSearch optionFilterProp="label" style={{ width: '100%' }}
          options={stockItems.map((si) => ({ label: `${si.code} - ${si.description}`, value: si.id }))} />
      ),
    },
    {
      title: '数量', dataIndex: 'quantity', width: 120,
      render: (_: unknown, __: unknown, index: number) => (
        <InputNumber value={items[index].quantity} onChange={(v) => updateItem(index, 'quantity', v)} style={{ width: '100%' }} />
      ),
    },
    {
      title: '单位', dataIndex: 'uom', width: 100,
      render: (_: unknown, __: unknown, index: number) => (
        <Input value={items[index].uom} onChange={(e) => updateItem(index, 'uom', e.target.value)} />
      ),
    },
    {
      title: '子装配', dataIndex: 'isSubAssembly', width: 80,
      render: (_: unknown, __: unknown, index: number) => (
        <Switch checked={items[index].isSubAssembly} onChange={(v) => updateItem(index, 'isSubAssembly', v)} />
      ),
    },
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
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/production/bom')}>返回</Button>
        <Title level={4} style={{ margin: 0 }}>{id ? '编辑' : '新增'} BOM</Title>
      </Space>

      <Card style={{ marginBottom: 16 }}>
        <Form form={form} layout="vertical">
          <Form.Item name="productItemId" label="成品物料" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="label" style={{ width: 400 }}
              options={stockItems.map((si) => ({ label: `${si.code} - ${si.description}`, value: si.id }))} />
          </Form.Item>
          <Space size="large">
            <Form.Item name="version" label="版本" initialValue="V1.0">
              <Input style={{ width: 150 }} />
            </Form.Item>
            <Form.Item name="isActive" label="启用" valuePropName="checked" initialValue={true}>
              <Switch />
            </Form.Item>
          </Space>
          <Form.Item name="description" label="说明">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Card>

      <Card title="BOM 物料列表">
        <Table
          dataSource={items}
          columns={columns}
          rowKey={(_, index) => String(index)}
          pagination={false}
          size="small"
          footer={() => (
            <Button type="dashed" block icon={<PlusOutlined />} onClick={addItem}>
              添加物料
            </Button>
          )}
        />
      </Card>

      <div style={{ marginTop: 16, textAlign: 'right' }}>
        <Button type="primary" onClick={handleSubmit} loading={loading} size="large">保存</Button>
      </div>
    </div>
  );
}
