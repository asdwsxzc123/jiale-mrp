/**
 * 税码管理页面
 */
import { useRef, useState } from 'react';
import { Button, Popconfirm, message, Modal, Form, Input, InputNumber } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { getTaxCodes, createTaxCode, updateTaxCode, deleteTaxCode } from '../../services/settings';
import type { TaxCode } from '../../services/settings';

export default function TaxCodeSettings() {
  const actionRef = useRef<ActionType>(null);
  const [form] = Form.useForm();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  /** 打开弹窗 */
  const openModal = (record?: TaxCode) => {
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
        await updateTaxCode(editingId, values);
        message.success('更新成功');
      } else {
        await createTaxCode(values);
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
      await deleteTaxCode(id);
      message.success('删除成功');
      actionRef.current?.reload();
    } catch {
      message.error('删除失败');
    }
  };

  const columns: ProColumns<TaxCode>[] = [
    { title: '税码', dataIndex: 'code', width: 120 },
    { title: '描述', dataIndex: 'description' },
    { title: '税率(%)', dataIndex: 'rate', width: 100 },
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
      <ProTable<TaxCode>
        headerTitle="税码管理"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        search={false}
        request={async () => {
          const res = await getTaxCodes();
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
        title={editingId ? '编辑税码' : '新增税码'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="code" label="税码" rules={[{ required: true }]}>
            <Input placeholder="如 SR-6, ZRL" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input />
          </Form.Item>
          <Form.Item name="rate" label="税率(%)" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} max={100} step={0.5} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
