/**
 * 供应商付款表单（抽屉）
 */
import { useEffect, useState } from 'react';
import { Drawer, Form, Input, Select, DatePicker, InputNumber, Button, Space, message } from 'antd';
import dayjs from 'dayjs';
import { getSupplierPayment, createSupplierPayment, updateSupplierPayment } from '../../services/purchase';
import { getSuppliers } from '../../services/supplier';
import type { Supplier } from '../../services/supplier';

interface SupplierPaymentFormProps {
  open: boolean;
  editingId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SupplierPaymentForm({ open, editingId, onClose, onSuccess }: SupplierPaymentFormProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  useEffect(() => {
    if (open) {
      getSuppliers().then((res) => setSuppliers(res.data || res));
    }
  }, [open]);

  useEffect(() => {
    if (open && editingId) {
      getSupplierPayment(editingId).then((data) => {
        form.setFieldsValue({ ...data, date: data.date ? dayjs(data.date) : undefined });
      });
    } else if (open) {
      form.resetFields();
    }
  }, [open, editingId, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const payload = { ...values, date: values.date ? dayjs(values.date).format('YYYY-MM-DD') : undefined };
      if (editingId) {
        await updateSupplierPayment(editingId, payload);
        message.success('更新成功');
      } else {
        await createSupplierPayment(payload);
        message.success('创建成功');
      }
      onSuccess();
    } catch {
      message.error('操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      title={editingId ? '编辑付款' : '新增付款'}
      open={open}
      onClose={onClose}
      width={500}
      extra={
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" onClick={handleSubmit} loading={loading}>保存</Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical">
        <Form.Item name="supplierId" label="供应商" rules={[{ required: true }]}>
          <Select showSearch optionFilterProp="label"
            options={suppliers.map((s) => ({ label: `${s.code} - ${s.companyName}`, value: s.id }))} />
        </Form.Item>
        <Form.Item name="date" label="日期" rules={[{ required: true }]}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="amount" label="金额" rules={[{ required: true }]}>
          <InputNumber style={{ width: '100%' }} min={0} precision={2} />
        </Form.Item>
        <Form.Item name="currency" label="币种" initialValue="MYR">
          <Select options={[
            { label: 'MYR', value: 'MYR' }, { label: 'RMB', value: 'RMB' }, { label: 'USD', value: 'USD' },
          ]} />
        </Form.Item>
        <Form.Item name="method" label="付款方式">
          <Select allowClear options={[
            { label: '现金', value: 'CASH' },
            { label: '银行转账', value: 'BANK_TRANSFER' },
            { label: '支票', value: 'CHEQUE' },
          ]} />
        </Form.Item>
        <Form.Item name="refNo" label="参考号"><Input /></Form.Item>
        <Form.Item name="notes" label="备注"><Input.TextArea rows={3} /></Form.Item>
      </Form>
    </Drawer>
  );
}
