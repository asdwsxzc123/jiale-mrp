/**
 * 物料分类管理页面
 * 简单 CRUD 表格
 */
import { useRef, useState } from 'react';
import { Button, Popconfirm, message, Modal, Form, Input } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  getStockCategories, createStockCategory,
  updateStockCategory, deleteStockCategory,
} from '../../services/stock';
import type { StockCategory } from '../../services/stock';

export default function StockCategoryList() {
  const actionRef = useRef<ActionType>(null);
  const [form] = Form.useForm();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  /** 打开弹窗 */
  const openModal = (record?: StockCategory) => {
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
        await updateStockCategory(editingId, values);
        message.success('更新成功');
      } else {
        await createStockCategory(values);
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
      await deleteStockCategory(id);
      message.success('删除成功');
      actionRef.current?.reload();
    } catch {
      message.error('删除失败');
    }
  };

  const columns: ProColumns<StockCategory>[] = [
    { title: '名称', dataIndex: 'name' },
    { title: '描述', dataIndex: 'description', hideInSearch: true },
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
      <ProTable<StockCategory>
        headerTitle="物料分类"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        search={false}
        request={async () => {
          const res = await getStockCategories();
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
        title={editingId ? '编辑分类' : '新增分类'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
