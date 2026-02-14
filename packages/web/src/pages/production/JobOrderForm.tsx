/**
 * 生产单新增表单（抽屉）
 */
import { useEffect, useState } from 'react';
import { Drawer, Form, Input, Select, DatePicker, InputNumber, Button, Space, message } from 'antd';
import dayjs from 'dayjs';
import { createJobOrder } from '../../services/production';
import { getStockItems } from '../../services/stock';
import type { StockItem } from '../../services/stock';
import { getBOMs } from '../../services/production';
import type { BOM } from '../../services/production';

interface JobOrderFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function JobOrderForm({ open, onClose, onSuccess }: JobOrderFormProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [boms, setBoms] = useState<BOM[]>([]);

  /** 加载下拉选项 */
  useEffect(() => {
    if (open) {
      getStockItems().then((res) => setStockItems(res.data || res));
      getBOMs().then((res) => setBoms(res.data || res));
      form.resetFields();
    }
  }, [open, form]);

  /** 提交 */
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await createJobOrder({
        ...values,
        plannedStart: values.plannedStart ? dayjs(values.plannedStart).format('YYYY-MM-DD') : undefined,
        plannedEnd: values.plannedEnd ? dayjs(values.plannedEnd).format('YYYY-MM-DD') : undefined,
      });
      message.success('创建成功');
      onSuccess();
    } catch {
      message.error('操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      title="新增生产单"
      open={open}
      onClose={onClose}
      width={600}
      extra={
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" onClick={handleSubmit} loading={loading}>保存</Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical">
        <Form.Item name="productItemId" label="成品物料" rules={[{ required: true }]}>
          <Select showSearch optionFilterProp="label"
            options={stockItems.map((si) => ({ label: `${si.code} - ${si.description}`, value: si.id }))} />
        </Form.Item>
        <Form.Item name="bomId" label="BOM">
          <Select allowClear showSearch optionFilterProp="label"
            options={boms.map((b) => ({ label: `${b.productItem?.code || ''} - ${b.version}`, value: b.id }))} />
        </Form.Item>
        <Form.Item name="plannedQty" label="计划数量" rules={[{ required: true }]}>
          <InputNumber style={{ width: '100%' }} min={0} />
        </Form.Item>
        <Form.Item name="color" label="颜色">
          <Input />
        </Form.Item>
        <Space size="large">
          <Form.Item name="plannedWeight" label="计划重量">
            <InputNumber style={{ width: 200 }} />
          </Form.Item>
          <Form.Item name="productionCycle" label="生产周期(天)">
            <InputNumber style={{ width: 200 }} />
          </Form.Item>
        </Space>
        <Space size="large">
          <Form.Item name="plannedStart" label="计划开始">
            <DatePicker />
          </Form.Item>
          <Form.Item name="plannedEnd" label="计划结束">
            <DatePicker />
          </Form.Item>
        </Space>
      </Form>
    </Drawer>
  );
}
