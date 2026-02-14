/**
 * 成品详情页面
 * 展示成品信息、溯源码和关联的原材料
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Descriptions, Tag, Table, Button, Space, Typography, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { getFinishedProduct } from '../../services/production';
import type { FinishedProduct, FinishedProductMaterial } from '../../services/production';
import QRCodeGenerator from '../../components/QRCodeGenerator';

const { Title } = Typography;

const statusMap: Record<string, { text: string; color: string }> = {
  IN_STOCK: { text: '在库', color: 'green' },
  SHIPPED: { text: '已发货', color: 'blue' },
  RESERVED: { text: '已预留', color: 'orange' },
};

export default function FinishedProductDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [product, setProduct] = useState<FinishedProduct | null>(null);

  useEffect(() => {
    if (id) {
      getFinishedProduct(id)
        .then(setProduct)
        .catch(() => message.error('加载失败'));
    }
  }, [id]);

  if (!product) return null;

  const s = statusMap[product.status] || { text: product.status, color: 'default' };

  /** 原材料列表列 */
  const materialColumns = [
    { title: '原材料批次 ID', dataIndex: 'rawMaterialBatchId', ellipsis: true },
    { title: '用量(KG)', dataIndex: 'usedWeight', width: 120 },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/production/finished')}>返回</Button>
        <Title level={4} style={{ margin: 0 }}>成品详情</Title>
      </Space>

      <Space align="start" size="large" style={{ width: '100%' }}>
        {/* 基本信息 */}
        <Card style={{ flex: 1 }}>
          <Descriptions column={2}>
            <Descriptions.Item label="溯源码">{product.traceabilityCode}</Descriptions.Item>
            <Descriptions.Item label="状态"><Tag color={s.color}>{s.text}</Tag></Descriptions.Item>
            <Descriptions.Item label="物料">{product.item?.description}</Descriptions.Item>
            <Descriptions.Item label="物料编码">{product.item?.code}</Descriptions.Item>
            <Descriptions.Item label="重量">{product.weight} {product.weightUnit}</Descriptions.Item>
            <Descriptions.Item label="颜色">{product.color || '-'}</Descriptions.Item>
            <Descriptions.Item label="生产日期">{product.productionDate || '-'}</Descriptions.Item>
            <Descriptions.Item label="仓库">{product.warehouseLocation?.name || '-'}</Descriptions.Item>
            <Descriptions.Item label="生产单">{product.jobOrder?.docNo || '-'}</Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 二维码 */}
        <Card title="溯源二维码" style={{ textAlign: 'center' }}>
          <QRCodeGenerator
            value={product.traceabilityCode}
            label={product.traceabilityCode}
            size={160}
          />
        </Card>
      </Space>

      {/* 原材料用量 */}
      <Card title="原材料用量" style={{ marginTop: 16 }}>
        <Table<FinishedProductMaterial>
          dataSource={product.materials || []}
          columns={materialColumns}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  );
}
