/**
 * 溯源结果展示页面
 * 展示完整溯源链路
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Card, Descriptions, Tag, Table, Button, Space, Typography,
  Spin, Result, Timeline,
} from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { traceByCode } from '../../services/trace';
import type { TraceResultData } from '../../services/trace';
import QRCodeGenerator from '../../components/QRCodeGenerator';

const { Title, Text } = Typography;

export default function TraceResult() {
  const navigate = useNavigate();
  const { code } = useParams();
  const [data, setData] = useState<TraceResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  /** 加载溯源数据 */
  useEffect(() => {
    if (!code) return;
    setLoading(true);
    setError(false);
    traceByCode(decodeURIComponent(code))
      .then((res) => { setData(res); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [code]);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  if (error || !data) {
    return (
      <Result
        status="warning"
        title="未找到溯源信息"
        subTitle={`溯源码: ${code}`}
        extra={<Button onClick={() => navigate('/trace/scan')}>返回扫码</Button>}
      />
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/trace/scan')}>返回</Button>
        <Title level={4} style={{ margin: 0 }}>溯源结果</Title>
      </Space>

      <Space align="start" size="large" style={{ width: '100%' }}>
        {/* 基本信息卡片 */}
        <Card style={{ flex: 1 }}>
          <Descriptions column={2} title="基本信息">
            <Descriptions.Item label="溯源码">{data.traceabilityCode}</Descriptions.Item>
            <Descriptions.Item label="类型">
              <Tag color={data.type === 'raw_material' ? 'blue' : 'green'}>
                {data.type === 'raw_material' ? '原材料' : '成品'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="物料编码">{data.item?.code}</Descriptions.Item>
            <Descriptions.Item label="物料描述">{data.item?.description}</Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 二维码 */}
        <Card>
          <QRCodeGenerator value={data.traceabilityCode} label={data.traceabilityCode} size={140} />
        </Card>
      </Space>

      {/* 原材料详情 */}
      {data.rawMaterial && (
        <Card title="原材料批次信息" style={{ marginTop: 16 }}>
          <Descriptions column={2}>
            <Descriptions.Item label="重量">{data.rawMaterial.weight} {data.rawMaterial.weightUnit}</Descriptions.Item>
            <Descriptions.Item label="剩余重量">{data.rawMaterial.remainingWeight} {data.rawMaterial.weightUnit}</Descriptions.Item>
            <Descriptions.Item label="接收日期">{data.rawMaterial.receivedDate}</Descriptions.Item>
            <Descriptions.Item label="状态">{data.rawMaterial.status}</Descriptions.Item>
            <Descriptions.Item label="供应商">{data.rawMaterial.supplier?.companyName}</Descriptions.Item>
            <Descriptions.Item label="采购单">{data.rawMaterial.purchaseDoc?.docNo}</Descriptions.Item>
            <Descriptions.Item label="检验状态">{data.rawMaterial.inspection?.status || '-'}</Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      {/* 成品详情 */}
      {data.finishedProduct && (
        <>
          <Card title="成品信息" style={{ marginTop: 16 }}>
            <Descriptions column={2}>
              <Descriptions.Item label="重量">{data.finishedProduct.weight} {data.finishedProduct.weightUnit}</Descriptions.Item>
              <Descriptions.Item label="生产日期">{data.finishedProduct.productionDate || '-'}</Descriptions.Item>
              <Descriptions.Item label="颜色">{data.finishedProduct.color || '-'}</Descriptions.Item>
              <Descriptions.Item label="状态">{data.finishedProduct.status}</Descriptions.Item>
              <Descriptions.Item label="生产单">{data.finishedProduct.jobOrder?.docNo || '-'}</Descriptions.Item>
            </Descriptions>
          </Card>

          {/* 溯源链路 - 原材料追溯 */}
          {data.finishedProduct.materials && data.finishedProduct.materials.length > 0 && (
            <Card title="原材料追溯链" style={{ marginTop: 16 }}>
              <Timeline
                items={data.finishedProduct.materials.map((m, i) => ({
                  key: i,
                  children: (
                    <div>
                      <Text strong>批次: {m.batch?.traceabilityCode || m.rawMaterialBatchId}</Text>
                      <br />
                      <Text type="secondary">
                        物料: {m.batch?.item?.code} - {m.batch?.item?.description}
                      </Text>
                      <br />
                      <Text type="secondary">供应商: {m.batch?.supplier?.companyName || '-'}</Text>
                      <br />
                      <Text>用量: {m.usedWeight} KG</Text>
                    </div>
                  ),
                }))}
              />
            </Card>
          )}

          {/* 原材料列表 */}
          {data.finishedProduct.materials && data.finishedProduct.materials.length > 0 && (
            <Card title="原材料用量明细" style={{ marginTop: 16 }}>
              <Table
                dataSource={data.finishedProduct.materials}
                rowKey="rawMaterialBatchId"
                pagination={false}
                size="small"
                columns={[
                  { title: '批次溯源码', dataIndex: ['batch', 'traceabilityCode'], ellipsis: true },
                  { title: '物料', dataIndex: ['batch', 'item', 'description'], ellipsis: true },
                  { title: '供应商', dataIndex: ['batch', 'supplier', 'companyName'], ellipsis: true },
                  { title: '用量(KG)', dataIndex: 'usedWeight', width: 100 },
                ]}
              />
            </Card>
          )}
        </>
      )}
    </div>
  );
}
