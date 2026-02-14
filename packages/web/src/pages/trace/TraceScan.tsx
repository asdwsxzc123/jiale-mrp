/**
 * 扫码查询页面
 * 支持摄像头扫码 + 手动输入
 */
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Input, Button, Space, Typography, message, Divider } from 'antd';
import { CameraOutlined, SearchOutlined } from '@ant-design/icons';
import { Html5Qrcode } from 'html5-qrcode';

const { Title, Text } = Typography;

export default function TraceScan() {
  const navigate = useNavigate();
  const [manualCode, setManualCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerDivId = 'qr-scanner-region';

  /** 手动输入查询 */
  const handleManualSearch = () => {
    const code = manualCode.trim();
    if (!code) {
      message.warning('请输入溯源码');
      return;
    }
    navigate(`/trace/result/${encodeURIComponent(code)}`);
  };

  /** 启动摄像头扫码 */
  const startScan = async () => {
    try {
      const scanner = new Html5Qrcode(scannerDivId);
      scannerRef.current = scanner;
      setScanning(true);

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          // 扫码成功
          stopScan();
          navigate(`/trace/result/${encodeURIComponent(decodedText)}`);
        },
        () => {
          // 扫码失败（忽略，持续扫描）
        },
      );
    } catch {
      message.error('无法启动摄像头，请检查权限');
      setScanning(false);
    }
  };

  /** 停止扫码 */
  const stopScan = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {
        // 忽略停止错误
      }
      scannerRef.current = null;
    }
    setScanning(false);
  };

  /** 组件卸载时停止扫码 */
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
      <Title level={3}>溯源查询</Title>

      {/* 手动输入区域 */}
      <Card title="手动输入溯源码" style={{ marginBottom: 24 }}>
        <Space.Compact style={{ width: '100%' }}>
          <Input
            placeholder="输入溯源码"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            onPressEnter={handleManualSearch}
            prefix={<SearchOutlined />}
            size="large"
          />
          <Button type="primary" size="large" onClick={handleManualSearch}>
            查询
          </Button>
        </Space.Compact>
      </Card>

      <Divider>或</Divider>

      {/* 摄像头扫码区域 */}
      <Card title="摄像头扫码">
        <div style={{ textAlign: 'center' }}>
          {!scanning ? (
            <Button
              type="primary"
              icon={<CameraOutlined />}
              size="large"
              onClick={startScan}
            >
              启动摄像头扫码
            </Button>
          ) : (
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text type="secondary">请将二维码对准摄像头</Text>
              <div id={scannerDivId} style={{ width: '100%', maxWidth: 400, margin: '0 auto' }} />
              <Button danger onClick={stopScan}>
                停止扫码
              </Button>
            </Space>
          )}
        </div>
      </Card>
    </div>
  );
}
