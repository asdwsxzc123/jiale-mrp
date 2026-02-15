/**
 * 货币管理页面
 */
import { useRef, useState } from 'react';
import { Button, Popconfirm, message, Modal, Form, Input, InputNumber, Switch } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { getCurrencies, createCurrency, updateCurrency, deleteCurrency } from '../../services/settings';
import type { Currency } from '../../services/settings';

export default function CurrencySettings() {
  const actionRef = useRef<ActionType>(null);
  const [form] = Form.useForm();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  /** 打开弹窗 */
  const openModal = (record?: Currency) => {
    if (record) {
      setEditingId(record.id);
      form.setFieldsValue(record);
    } else {
      setEditingId(undefined);
      form.resetFields();
    }
    setModalOpen(true);
  };

  /** 提交 */
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      if (editingId) {
        await updateCurrency(editingId, values);
        message.success('更新成功');
      } else {
        await createCurrency(values);
        message.success('创建成功');
      }
      setModalOpen(false);
      actionRef.current?.reload();
    } catch {
      message.error('操作失败');
    } finally {
      setLoading(false);
    }
  };

  /** 删除 */
  const handleDelete = async (id: string) => {
    try {
      await deleteCurrency(id);
      message.success('删除成功');
      actionRef.current?.reload();
    } catch {
      message.error('删除失败');
    }
  };

  const columns: ProColumns<Currency>[] = [
    { title: '代码', dataIndex: 'code', width: 100 },
    { title: '名称', dataIndex: 'name', width: 150 },
    { title: '符号', dataIndex: 'symbol', width: 80 },
    { title: '汇率', dataIndex: 'exchangeRate', width: 120 },
    {
      title: '基准货币',
      dataIndex: 'isBase',
      width: 100,
      render: (_, record) => record.isBase ? '是' : '否',
    },
    {
      title: '操作',
      valueType: 'option',
      width: 150,
      render: (_, record) => [
        <a key="edit" onClick={() => openModal(record)}>编辑</a>,
        <Popconfirm key="delete" title="确认删除？" onConfirm={() => handleDelete(record.id)}>
          <a style={{ color: '#ff4d4f' }}>删除</a>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <>
      <ProTable<Currency>
        headerTitle="货币管理"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        search={false}
        request={async () => {
          const res = await getCurrencies();
          return { data: res.data || res, success: true };
        }}
        pagination={false}
        toolBarRender={() => [
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
            新增
          </Button>,
        ]}
      />
      <Modal
        title={editingId ? '编辑货币' : '新增货币'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="code" label="货币代码" rules={[{ required: true }]}>
            <Input placeholder="如 MYR, USD" />
          </Form.Item>
          <Form.Item name="name" label="货币名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="symbol" label="符号" rules={[{ required: true }]}>
            <Input placeholder="如 RM, $" />
          </Form.Item>
          <Form.Item name="exchangeRate" label="汇率" initialValue={1}>
            <InputNumber style={{ width: '100%' }} min={0} step={0.01} />
          </Form.Item>
          <Form.Item name="isBase" label="基准货币" valuePropName="checked" initialValue={false}>
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
