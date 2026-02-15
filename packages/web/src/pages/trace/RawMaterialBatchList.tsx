/**
 * 原材料批次列表页面
 * 含 QR 码显示
 */
import { useRef, useState } from 'react';
import { Tag, Modal } from 'antd';
import { ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { getRawMaterialBatches } from '../../services/trace';
import type { RawMaterialBatch } from '../../services/trace';
import QRCodeGenerator from '../../components/QRCodeGenerator';

/** 批次状态 */
const statusMap: Record<string, { text: string; color: string }> = {
  IN_STOCK: { text: '在库', color: 'green' },
  CONSUMED: { text: '已消耗', color: 'default' },
  PARTIAL: { text: '部分消耗', color: 'orange' },
};

export default function RawMaterialBatchList() {
  const actionRef = useRef<ActionType>(null);
  const [qrVisible, setQrVisible] = useState(false);
  const [qrCode, setQrCode] = useState('');

  /** 显示二维码弹窗 */
  const showQR = (code: string) => {
    setQrCode(code);
    setQrVisible(true);
  };

  const columns: ProColumns<RawMaterialBatch>[] = [
    { title: '溯源码', dataIndex: 'traceabilityCode', width: 200 },
    { title: '物料编码', dataIndex: ['item', 'code'], width: 120, hideInSearch: true },
    { title: '物料描述', dataIndex: ['item', 'description'], ellipsis: true, hideInSearch: true },
    { title: '供应商', dataIndex: ['supplier', 'companyName'], ellipsis: true, hideInSearch: true },
    { title: '重量', dataIndex: 'weight', width: 100, hideInSearch: true },
    { title: '剩余', dataIndex: 'remainingWeight', width: 100, hideInSearch: true },
    { title: '单位', dataIndex: 'weightUnit', width: 60, hideInSearch: true },
    { title: '接收日期', dataIndex: 'receivedDate', width: 120, valueType: 'date', hideInSearch: true },
    { title: '仓库', dataIndex: ['warehouseLocation', 'name'], width: 100, hideInSearch: true },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (_, record) => {
        const s = statusMap[record.status] || { text: record.status, color: 'default' };
        return <Tag color={s.color}>{s.text}</Tag>;
      },
      valueEnum: {
        IN_STOCK: { text: '在库' },
        CONSUMED: { text: '已消耗' },
        PARTIAL: { text: '部分消耗' },
      },
    },
    {
      title: '操作',
      valueType: 'option',
      width: 100,
      render: (_, record) => [
        <a key="qr" onClick={() => showQR(record.traceabilityCode)}>二维码</a>,
      ],
    },
  ];

  return (
    <>
      <ProTable<RawMaterialBatch>
        headerTitle="原材料批次"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        request={async (params) => {
          const res = await getRawMaterialBatches({
            page: params.current,
            pageSize: params.pageSize,
            status: params.status,
          });
          return { data: res.data || res, total: res.total || 0, success: true };
        }}
        pagination={{ defaultPageSize: 20 }}
      />
      {/* 二维码弹窗 */}
      <Modal
        title="原材料溯源二维码"
        open={qrVisible}
        onCancel={() => setQrVisible(false)}
        footer={null}
        width={300}
      >
        <div style={{ textAlign: 'center', padding: 24 }}>
          <QRCodeGenerator value={qrCode} label={qrCode} size={200} />
        </div>
      </Modal>
    </>
  );
}
