/**
 * 供应商新增/编辑抽屉表单
 * 包含基本信息 Tab 和分支地址 Tab
 */
import { useEffect, useState } from 'react';
import { Drawer, Form, Input, Select, Switch, Tabs, Button, Space, message, Card } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { getSupplier, createSupplier, updateSupplier } from '../../services/supplier';
import type { SupplierBranch } from '../../services/supplier';

interface SupplierFormProps {
  open: boolean;
  editingId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SupplierForm({ open, editingId, onClose, onSuccess }: SupplierFormProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState<SupplierBranch[]>([]);

  /** 编辑模式时加载供应商数据 */
  useEffect(() => {
    if (open && editingId) {
      getSupplier(editingId).then((data) => {
        form.setFieldsValue(data);
        setBranches(data.branches || []);
      });
    } else if (open) {
      form.resetFields();
      setBranches([]);
    }
  }, [open, editingId, form]);

  /** 添加分支 */
  const addBranch = () => setBranches([...branches, { branchName: '' }]);

  /** 删除分支 */
  const removeBranch = (index: number) => setBranches(branches.filter((_, i) => i !== index));

  /** 更新分支字段 */
  const updateBranch = (index: number, field: string, value: string) => {
    const updated = [...branches];
    (updated[index] as unknown as Record<string, unknown>)[field] = value;
    setBranches(updated);
  };

  /** 提交 */
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const payload = { ...values, branches };
      if (editingId) {
        await updateSupplier(editingId, payload);
        message.success('更新成功');
      } else {
        await createSupplier(payload);
        message.success('创建成功');
      }
      onSuccess();
    } catch {
      message.error('操作失败，请检查表单');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      title={editingId ? '编辑供应商' : '新增供应商'}
      open={open}
      onClose={onClose}
      width={720}
      extra={
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" onClick={handleSubmit} loading={loading}>保存</Button>
        </Space>
      }
    >
      <Tabs
        items={[
          {
            key: 'basic',
            label: '基本信息',
            children: (
              <Form form={form} layout="vertical">
                <Form.Item name="code" label="供应商编码" rules={[{ required: true, message: '请输入供应商编码' }]}>
                  <Input placeholder="如 400-0001" />
                </Form.Item>
                <Form.Item name="companyName" label="公司名称" rules={[{ required: true, message: '请输入公司名称' }]}>
                  <Input />
                </Form.Item>
                <Form.Item name="category" label="分类">
                  <Input />
                </Form.Item>
                <Form.Item name="nationality" label="国籍">
                  <Input />
                </Form.Item>
                <Form.Item name="industriesCode" label="行业代码">
                  <Input />
                </Form.Item>
                <Form.Item name="regNo" label="注册号">
                  <Input />
                </Form.Item>
                <Form.Item name="attention" label="联系人">
                  <Input />
                </Form.Item>
                <Form.Item name="phone" label="电话">
                  <Input />
                </Form.Item>
                <Form.Item name="mobile" label="手机">
                  <Input />
                </Form.Item>
                <Form.Item name="fax" label="传真">
                  <Input />
                </Form.Item>
                <Form.Item name="email" label="邮箱">
                  <Input />
                </Form.Item>
                <Form.Item name="currency" label="币种" initialValue="MYR">
                  <Select options={[
                    { label: 'MYR', value: 'MYR' },
                    { label: 'RMB', value: 'RMB' },
                    { label: 'USD', value: 'USD' },
                  ]} />
                </Form.Item>
                <Form.Item name="isActive" label="启用" valuePropName="checked" initialValue={true}>
                  <Switch />
                </Form.Item>
              </Form>
            ),
          },
          {
            key: 'branches',
            label: '分支地址',
            children: (
              <div>
                {branches.map((branch, index) => (
                  <Card
                    key={index}
                    size="small"
                    title={`分支 ${index + 1}`}
                    style={{ marginBottom: 16 }}
                    extra={
                      <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeBranch(index)} />
                    }
                  >
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Input placeholder="分支名称" value={branch.branchName} onChange={(e) => updateBranch(index, 'branchName', e.target.value)} />
                      <Input placeholder="地址 1" value={branch.address1 || ''} onChange={(e) => updateBranch(index, 'address1', e.target.value)} />
                      <Input placeholder="地址 2" value={branch.address2 || ''} onChange={(e) => updateBranch(index, 'address2', e.target.value)} />
                      <Input placeholder="城市" value={branch.city || ''} onChange={(e) => updateBranch(index, 'city', e.target.value)} />
                      <Input placeholder="州/省" value={branch.state || ''} onChange={(e) => updateBranch(index, 'state', e.target.value)} />
                      <Input placeholder="邮编" value={branch.postcode || ''} onChange={(e) => updateBranch(index, 'postcode', e.target.value)} />
                      <Input placeholder="国家" value={branch.country || ''} onChange={(e) => updateBranch(index, 'country', e.target.value)} />
                      <Input placeholder="电话" value={branch.phone || ''} onChange={(e) => updateBranch(index, 'phone', e.target.value)} />
                      <Input placeholder="邮箱" value={branch.email || ''} onChange={(e) => updateBranch(index, 'email', e.target.value)} />
                    </Space>
                  </Card>
                ))}
                <Button type="dashed" block icon={<PlusOutlined />} onClick={addBranch}>
                  添加分支地址
                </Button>
              </div>
            ),
          },
        ]}
      />
    </Drawer>
  );
}
