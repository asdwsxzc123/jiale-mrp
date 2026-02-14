/**
 * 生产单详情页面
 * 包含领料/产出/完工操作
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Card, Descriptions, Tag, Table, Button, Space, message,
  Modal, Form, InputNumber, Select, Typography, Divider,
} from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { getJobOrder, issueMaterial, completeJobOrder } from '../../services/production';
import type { JobOrder, JobOrderMaterial } from '../../services/production';

const { Title } = Typography;

/** 状态标签 */
const statusMap: Record<string, { text: string; color: string }> = {
  PLANNED: { text: '已计划', color: 'default' },
  IN_PROGRESS: { text: '进行中', color: 'processing' },
  COMPLETED: { text: '已完成', color: 'success' },
  CANCELLED: { text: '已取消', color: 'error' },
};

export default function JobOrderDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [order, setOrder] = useState<JobOrder | null>(null);
  const [issueOpen, setIssueOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [issueForm] = Form.useForm();
  const [completeForm] = Form.useForm();

  /** 加载生产单数据 */
  const loadData = async () => {
    if (!id) return;
    try {
      const data = await getJobOrder(id);
      setOrder(data);
    } catch {
      message.error('加载失败');
    }
  };

  useEffect(() => { loadData(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  /** 领料操作 */
  const handleIssueMaterial = async () => {
    if (!id) return;
    try {
      const values = await issueForm.validateFields();
      setLoading(true);
      await issueMaterial(id, values);
      message.success('领料成功');
      setIssueOpen(false);
      issueForm.resetFields();
      loadData();
    } catch {
      message.error('领料失败');
    } finally {
      setLoading(false);
    }
  };

  /** 完工操作 */
  const handleComplete = async () => {
    if (!id) return;
    try {
      const values = await completeForm.validateFields();
      setLoading(true);
      await completeJobOrder(id, values);
      message.success('完工操作成功');
      setCompleteOpen(false);
      completeForm.resetFields();
      loadData();
    } catch {
      message.error('操作失败');
    } finally {
      setLoading(false);
    }
  };

  if (!order) return null;

  const s = statusMap[order.status] || { text: order.status, color: 'default' };

  /** 物料表格列 */
  const materialColumns = [
    { title: '物料', dataIndex: ['materialItem', 'description'], ellipsis: true },
    { title: '需求数量', dataIndex: 'requiredQty', width: 100 },
    { title: '已领数量', dataIndex: 'issuedQty', width: 100 },
    { title: '实际用量', dataIndex: 'actualUsedWeight', width: 100 },
    { title: '单位', dataIndex: 'uom', width: 80 },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/production/jobs')}>返回</Button>
        <Title level={4} style={{ margin: 0 }}>生产单详情: {order.docNo}</Title>
      </Space>

      {/* 基本信息 */}
      <Card style={{ marginBottom: 16 }}>
        <Descriptions column={3}>
          <Descriptions.Item label="单据号">{order.docNo}</Descriptions.Item>
          <Descriptions.Item label="成品">{order.productItem?.description}</Descriptions.Item>
          <Descriptions.Item label="状态"><Tag color={s.color}>{s.text}</Tag></Descriptions.Item>
          <Descriptions.Item label="计划数量">{order.plannedQty}</Descriptions.Item>
          <Descriptions.Item label="完成数量">{order.completedQty}</Descriptions.Item>
          <Descriptions.Item label="颜色">{order.color || '-'}</Descriptions.Item>
          <Descriptions.Item label="计划重量">{order.plannedWeight || '-'}</Descriptions.Item>
          <Descriptions.Item label="实际重量">{order.actualWeight || '-'}</Descriptions.Item>
          <Descriptions.Item label="良率">{order.yieldRate ? `${order.yieldRate}%` : '-'}</Descriptions.Item>
          <Descriptions.Item label="计划开始">{order.plannedStart || '-'}</Descriptions.Item>
          <Descriptions.Item label="计划结束">{order.plannedEnd || '-'}</Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 操作按钮 */}
      {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
        <Space style={{ marginBottom: 16 }}>
          <Button type="primary" onClick={() => setIssueOpen(true)}>领料</Button>
          <Button type="primary" onClick={() => setCompleteOpen(true)} style={{ background: '#52c41a', borderColor: '#52c41a' }}>
            产出/完工
          </Button>
        </Space>
      )}

      <Divider />

      {/* 物料清单 */}
      <Card title="物料需求">
        <Table<JobOrderMaterial>
          dataSource={order.materials || []}
          columns={materialColumns}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>

      {/* 领料弹窗 */}
      <Modal title="领料" open={issueOpen} onOk={handleIssueMaterial} onCancel={() => setIssueOpen(false)} confirmLoading={loading}>
        <Form form={issueForm} layout="vertical">
          <Form.Item name="materialId" label="物料" rules={[{ required: true }]}>
            <Select options={(order.materials || []).map((m) => ({
              label: m.materialItem?.description || m.materialItemId,
              value: m.id,
            }))} />
          </Form.Item>
          <Form.Item name="qty" label="数量" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="batchId" label="原材料批次 ID">
            <Select allowClear />
          </Form.Item>
        </Form>
      </Modal>

      {/* 完工弹窗 */}
      <Modal title="产出/完工" open={completeOpen} onOk={handleComplete} onCancel={() => setCompleteOpen(false)} confirmLoading={loading}>
        <Form form={completeForm} layout="vertical">
          <Form.Item name="completedQty" label="完成数量" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="actualWeight" label="实际重量">
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
