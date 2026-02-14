/**
 * 来料检验表单（抽屉）
 * 包含合格/不合格操作按钮
 */
import { useEffect, useState } from 'react';
import {
  Drawer, Form, Input, Select, DatePicker, InputNumber,
  Switch, Button, Space, message, Divider,
} from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  getInspection, createInspection, updateInspection,
  passInspection, rejectInspection,
} from '../../services/inspection';
import { getSuppliers } from '../../services/supplier';
import type { Supplier } from '../../services/supplier';

interface InspectionFormProps {
  open: boolean;
  editingId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function InspectionForm({ open, editingId, onClose, onSuccess }: InspectionFormProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('PENDING');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  useEffect(() => {
    if (open) {
      getSuppliers().then((res) => setSuppliers(res.data || res));
    }
  }, [open]);

  useEffect(() => {
    if (open && editingId) {
      getInspection(editingId).then((data) => {
        form.setFieldsValue({
          ...data,
          inspectionDate: data.inspectionDate ? dayjs(data.inspectionDate) : undefined,
        });
        setStatus(data.status);
      });
    } else if (open) {
      form.resetFields();
      setStatus('PENDING');
    }
  }, [open, editingId, form]);

  /** 保存检验记录 */
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const payload = {
        ...values,
        inspectionDate: values.inspectionDate ? dayjs(values.inspectionDate).format('YYYY-MM-DD') : undefined,
      };
      if (editingId) {
        await updateInspection(editingId, payload);
        message.success('更新成功');
      } else {
        await createInspection(payload);
        message.success('创建成功');
      }
      onSuccess();
    } catch {
      message.error('操作失败');
    } finally {
      setLoading(false);
    }
  };

  /** 标记合格 */
  const handlePass = async () => {
    if (!editingId) return;
    try {
      setLoading(true);
      await passInspection(editingId);
      message.success('已标记为合格');
      onSuccess();
    } catch {
      message.error('操作失败');
    } finally {
      setLoading(false);
    }
  };

  /** 标记不合格 */
  const handleReject = async () => {
    if (!editingId) return;
    const handlingMethod = form.getFieldValue('handlingMethod');
    const handlingNotes = form.getFieldValue('handlingNotes');
    if (!handlingMethod) {
      message.warning('请选择处理方式');
      return;
    }
    try {
      setLoading(true);
      await rejectInspection(editingId, { handlingMethod, handlingNotes });
      message.success('已标记为不合格');
      onSuccess();
    } catch {
      message.error('操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      title={editingId ? '检验详情' : '新增检验'}
      open={open}
      onClose={onClose}
      width={600}
      extra={
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" onClick={handleSave} loading={loading}>保存</Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical">
        <Form.Item name="purchaseDocId" label="采购单据 ID" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="itemId" label="物料 ID" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="supplierId" label="供应商" rules={[{ required: true }]}>
          <Select showSearch optionFilterProp="label"
            options={suppliers.map((s) => ({ label: `${s.code} - ${s.companyName}`, value: s.id }))} />
        </Form.Item>
        <Form.Item name="inspectionDate" label="检验日期" rules={[{ required: true }]}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="wrongItem" label="是否错发料" valuePropName="checked" initialValue={false}>
          <Switch />
        </Form.Item>
        <Form.Item name="wrongItemDescription" label="错发料说明">
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item name="weightDifference" label="重量差异">
          <InputNumber style={{ width: '100%' }} />
        </Form.Item>

        <Divider />

        <Form.Item name="handlingMethod" label="处理方式">
          <Select allowClear options={[
            { label: '退货', value: 'RETURN' },
            { label: '补货', value: 'REPLENISH' },
            { label: '让步接收', value: 'CONCESSION' },
            { label: '报废', value: 'SCRAP' },
          ]} />
        </Form.Item>
        <Form.Item name="handlingNotes" label="处理说明">
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>

      {/* 合格/不合格操作按钮 */}
      {editingId && status === 'PENDING' && (
        <>
          <Divider />
          <Space>
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={handlePass}
              loading={loading}
              style={{ background: '#52c41a', borderColor: '#52c41a' }}
            >
              标记合格
            </Button>
            <Button
              danger
              icon={<CloseCircleOutlined />}
              onClick={handleReject}
              loading={loading}
            >
              标记不合格
            </Button>
          </Space>
        </>
      )}
    </Drawer>
  );
}
