/**
 * 用户管理页面（仅管理员可见）
 */
import { useRef, useState } from 'react';
import { Button, Popconfirm, message, Modal, Form, Input, Select, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { getUsers, createUser, updateUser, deleteUser } from '../../services/settings';
import type { User } from '../../services/settings';

/** 角色标签颜色 */
const roleColors: Record<string, string> = {
  ADMIN: 'red',
  MANAGER: 'blue',
  OPERATOR: 'green',
  VIEWER: 'default',
};
const roleLabels: Record<string, string> = {
  ADMIN: '管理员',
  MANAGER: '经理',
  OPERATOR: '操作员',
  VIEWER: '查看者',
};

export default function UserManagement() {
  const actionRef = useRef<ActionType>(null);
  const [form] = Form.useForm();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  /** 打开弹窗 */
  const openModal = (record?: User) => {
    if (record) {
      setEditingId(record.id);
      form.setFieldsValue({ ...record, password: undefined });
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
        // 编辑时密码为空则不更新密码
        const payload = { ...values };
        if (!payload.password) delete payload.password;
        await updateUser(editingId, payload);
        message.success('更新成功');
      } else {
        await createUser(values);
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
      await deleteUser(id);
      message.success('删除成功');
      actionRef.current?.reload();
    } catch {
      message.error('删除失败');
    }
  };

  const columns: ProColumns<User>[] = [
    { title: '用户名', dataIndex: 'username', width: 150 },
    { title: '姓名', dataIndex: 'name', width: 150 },
    {
      title: '角色',
      dataIndex: 'role',
      width: 120,
      render: (_, record) => (
        <Tag color={roleColors[record.role]}>
          {roleLabels[record.role] || record.role}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      width: 80,
      render: (_, record) => (
        <Tag color={record.isActive ? 'green' : 'default'}>
          {record.isActive ? '启用' : '停用'}
        </Tag>
      ),
    },
    { title: '创建时间', dataIndex: 'createdAt', width: 180, valueType: 'dateTime' },
    {
      title: '操作',
      valueType: 'option',
      width: 150,
      render: (_, record) => [
        <a key="edit" onClick={() => openModal(record)}>编辑</a>,
        <Popconfirm key="delete" title="确认删除该用户？" onConfirm={() => handleDelete(record.id)}>
          <a style={{ color: '#ff4d4f' }}>删除</a>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <>
      <ProTable<User>
        headerTitle="用户管理"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        search={false}
        request={async () => {
          const res = await getUsers();
          return { data: res.data || res, success: true };
        }}
        pagination={false}
        toolBarRender={() => [
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
            新增用户
          </Button>,
        ]}
      />
      <Modal
        title={editingId ? '编辑用户' : '新增用户'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="username" label="用户名" rules={[{ required: true }]}>
            <Input disabled={!!editingId} />
          </Form.Item>
          <Form.Item
            name="password"
            label="密码"
            rules={editingId ? [] : [{ required: true, message: '请输入密码' }]}
          >
            <Input.Password placeholder={editingId ? '留空表示不修改' : '请输入密码'} />
          </Form.Item>
          <Form.Item name="name" label="姓名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="role" label="角色" rules={[{ required: true }]} initialValue="OPERATOR">
            <Select options={[
              { label: '管理员', value: 'ADMIN' },
              { label: '经理', value: 'MANAGER' },
              { label: '操作员', value: 'OPERATOR' },
              { label: '查看者', value: 'VIEWER' },
            ]} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
