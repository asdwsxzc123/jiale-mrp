/**
 * QR 码生成 + 打印组件
 * 使用 qrcode.react 的 QRCodeSVG 生成二维码
 */
import { useRef } from 'react';
import { Button, Space, Typography } from 'antd';
import { PrinterOutlined } from '@ant-design/icons';
import { QRCodeSVG } from 'qrcode.react';

const { Text } = Typography;

interface QRCodeGeneratorProps {
  /** 二维码内容 */
  value: string;
  /** 二维码尺寸，默认 128 */
  size?: number;
  /** 底部标签文字 */
  label?: string;
  /** 是否显示打印按钮 */
  showPrint?: boolean;
}

export default function QRCodeGenerator({
  value,
  size = 128,
  label,
  showPrint = true,
}: QRCodeGeneratorProps) {
  const printRef = useRef<HTMLDivElement>(null);

  /** 打印二维码 */
  const handlePrint = () => {
    if (!printRef.current) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    // 构建打印 HTML
    printWindow.document.write(`
      <html>
        <head><title>打印二维码</title></head>
        <body style="display:flex;justify-content:center;align-items:center;min-height:100vh;">
          <div style="text-align:center;">
            ${printRef.current.innerHTML}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
  };

  return (
    <Space direction="vertical" align="center">
      <div ref={printRef} style={{ textAlign: 'center' }}>
        <QRCodeSVG value={value} size={size} />
        {label && (
          <div style={{ marginTop: 8 }}>
            <Text strong>{label}</Text>
          </div>
        )}
      </div>
      {showPrint && (
        <Button icon={<PrinterOutlined />} size="small" onClick={handlePrint}>
          打印
        </Button>
      )}
    </Space>
  );
}
