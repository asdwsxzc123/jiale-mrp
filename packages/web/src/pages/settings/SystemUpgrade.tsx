/**
 * 系统升级页面
 * - 显示当前版本号
 * - 检查 Docker Hub 是否有新版本
 * - 一键升级：拉取最新镜像并重启容器
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { Button, Card, Typography, Alert, Modal, Steps, Descriptions, Tag, Space } from 'antd';
import {
  CloudSyncOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  ExclamationCircleOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { checkUpdate, triggerUpgrade, healthCheck } from '../../services/system';
import type { CheckUpdateResult } from '../../services/system';

const { Title, Paragraph } = Typography;

/** 升级状态枚举 */
type UpgradeStatus = 'idle' | 'upgrading' | 'polling' | 'success' | 'error';

/** 轮询间隔（毫秒） */
const POLL_INTERVAL = 3000;
/** 轮询超时时间（毫秒） */
const POLL_TIMEOUT = 120000;

export default function SystemUpgrade() {
  const [status, setStatus] = useState<UpgradeStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [checking, setChecking] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<CheckUpdateResult | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /** 清除轮询定时器 */
  const clearPolling = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  /** 检查更新 */
  const handleCheckUpdate = useCallback(async () => {
    setChecking(true);
    try {
      const result = await checkUpdate();
      setUpdateInfo(result);
    } catch {
      setUpdateInfo(null);
    } finally {
      setChecking(false);
    }
  }, []);

  // 页面加载时自动检查一次
  useEffect(() => {
    handleCheckUpdate();
  }, [handleCheckUpdate]);

  /**
   * 升级后轮询服务器是否恢复
   * 每 3 秒检查一次，超过 2 分钟视为超时
   */
  const startPolling = useCallback(() => {
    setStatus('polling');
    const startTime = Date.now();

    timerRef.current = setInterval(async () => {
      if (Date.now() - startTime > POLL_TIMEOUT) {
        clearPolling();
        setStatus('error');
        setErrorMsg('升级超时，请检查服务器状态');
        return;
      }

      try {
        await healthCheck();
        clearPolling();
        setStatus('success');
        // 升级成功后重新获取版本信息
        handleCheckUpdate();
      } catch {
        // 服务器尚未恢复，继续轮询
      }
    }, POLL_INTERVAL);
  }, [clearPolling, handleCheckUpdate]);

  /** 触发升级 */
  const handleUpgrade = async () => {
    setStatus('upgrading');
    setErrorMsg('');

    try {
      await triggerUpgrade();
    } catch {
      // 请求可能因容器重启而中断，属于正常情况
    }

    // 等待几秒让旧容器停止，再开始轮询新容器
    setTimeout(() => startPolling(), 5000);
  };

  /** 升级确认弹窗 */
  const confirmUpgrade = () => {
    Modal.confirm({
      title: '确认升级',
      icon: <ExclamationCircleOutlined />,
      content: '升级将拉取最新版本并重启系统，期间服务会短暂中断。确认继续？',
      okText: '确认升级',
      cancelText: '取消',
      onOk: handleUpgrade,
    });
  };

  /** 当前步骤索引 */
  const currentStep = (() => {
    switch (status) {
      case 'upgrading': return 0;
      case 'polling': return 1;
      case 'success': return 2;
      default: return -1;
    }
  })();

  const isUpgrading = status === 'upgrading' || status === 'polling';

  return (
    <Card>
      <Title level={4}>系统升级</Title>
      <Paragraph type="secondary">
        查看当前版本并检查是否有新版本可用。升级期间服务会短暂中断。
      </Paragraph>

      {/* 版本信息 */}
      <Descriptions
        bordered
        column={1}
        size="small"
        style={{ maxWidth: 500, marginBottom: 24 }}
      >
        <Descriptions.Item label="当前版本">
          {updateInfo ? (
            <Tag color="blue">v{updateInfo.current}</Tag>
          ) : (
            '-'
          )}
        </Descriptions.Item>
        <Descriptions.Item label="最新版本">
          {checking ? (
            <LoadingOutlined />
          ) : updateInfo?.latest ? (
            <Tag color={updateInfo.hasUpdate ? 'green' : 'default'}>
              v{updateInfo.latest}
            </Tag>
          ) : updateInfo?.error ? (
            <Typography.Text type="warning">{updateInfo.error}</Typography.Text>
          ) : (
            '-'
          )}
        </Descriptions.Item>
        <Descriptions.Item label="状态">
          {checking ? (
            '检查中...'
          ) : updateInfo?.hasUpdate ? (
            <Tag color="green">有新版本可用</Tag>
          ) : updateInfo && !updateInfo.error ? (
            <Tag>已是最新版本</Tag>
          ) : (
            '-'
          )}
        </Descriptions.Item>
      </Descriptions>

      {/* 操作按钮 */}
      <Space>
        <Button
          icon={<SyncOutlined spin={checking} />}
          onClick={handleCheckUpdate}
          disabled={checking || isUpgrading}
        >
          检查更新
        </Button>
        <Button
          type="primary"
          icon={<CloudSyncOutlined />}
          onClick={confirmUpgrade}
          disabled={isUpgrading}
          loading={isUpgrading}
        >
          {isUpgrading ? '升级中...' : '一键升级'}
        </Button>
      </Space>

      {/* 升级进度 */}
      {currentStep >= 0 && (
        <Steps
          current={currentStep}
          style={{ marginTop: 32, maxWidth: 600 }}
          items={[
            {
              title: '拉取镜像',
              description: '下载最新版本',
              icon: status === 'upgrading' ? <LoadingOutlined /> : undefined,
            },
            {
              title: '重启服务',
              description: '等待服务恢复',
              icon: status === 'polling' ? <LoadingOutlined /> : undefined,
            },
            {
              title: '升级完成',
              icon: status === 'success' ? <CheckCircleOutlined /> : undefined,
            },
          ]}
        />
      )}

      {/* 升级成功提示 */}
      {status === 'success' && (
        <Alert
          type="success"
          message="升级成功"
          description="系统已更新到最新版本。"
          showIcon
          style={{ marginTop: 24, maxWidth: 600 }}
        />
      )}

      {/* 升级失败提示 */}
      {status === 'error' && (
        <Alert
          type="error"
          message="升级异常"
          description={errorMsg || '请检查服务器日志'}
          showIcon
          style={{ marginTop: 24, maxWidth: 600 }}
        />
      )}
    </Card>
  );
}
