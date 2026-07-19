import React, { useState } from 'react';
import { ApiConfig } from '../types';
import { Key, ShieldCheck, AlertCircle, X, Sparkles } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiConfig: ApiConfig;
  onSave: (config: ApiConfig) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, apiConfig, onSave }) => {
  const [provider, setProvider] = useState<'google' | 'deepseek'>(apiConfig.provider);
  const [googleKey, setGoogleKey] = useState(apiConfig.googleKey);
  const [deepseekKey, setDeepseekKey] = useState(apiConfig.deepseekKey);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; msg: string } | null>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      provider,
      googleKey,
      deepseekKey
    });
    onClose();
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);

    const activeKey = provider === 'google' ? googleKey : deepseekKey;

    if (!activeKey.trim()) {
      setTestResult({ success: false, msg: '请输入 API 密钥后再进行测试' });
      setTesting(false);
      return;
    }

    try {
      if (provider === 'google') {
        // Test Google Gemini API
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${googleKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "Hello" }] }]
          })
        });
        
        if (res.ok) {
          setTestResult({ success: true, msg: 'Google AI 连接成功！密钥有效。' });
        } else {
          const errData = await res.json().catch(() => ({}));
          const errMsg = errData.error?.message || `HTTP 错误: ${res.status}`;
          setTestResult({ success: false, msg: `Google AI 验证失败: ${errMsg}` });
        }
      } else {
        // Test DeepSeek API (using OpenAI compatible endpoint)
        const res = await fetch(`https://api.deepseek.com/v1/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${deepseekKey}`
          },
          body: JSON.stringify({
            model: 'deepseek-v4-flash',
            messages: [{ role: 'user', content: 'Hello' }],
            max_tokens: 5
          })
        });

        if (res.ok) {
          setTestResult({ success: true, msg: 'DeepSeek AI 连接成功！密钥有效。' });
        } else {
          const errData = await res.json().catch(() => ({}));
          const errMsg = errData.error?.message || `HTTP 错误: ${res.status}`;
          setTestResult({ success: false, msg: `DeepSeek 验证失败: ${errMsg}` });
        }
      }
    } catch (e: any) {
      setTestResult({ success: false, msg: `网络连接异常: ${e.message || e}` });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(5, 7, 15, 0.85)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      padding: '16px',
      backdropFilter: 'blur(8px)'
    }}>
      <div className="glass-card fade-in" style={{
        width: '100%',
        maxWidth: '400px',
        padding: '24px',
        border: '1px solid rgba(0, 242, 254, 0.2)',
        boxShadow: '0 10px 40px rgba(0, 242, 254, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Key size={20} style={{ color: 'var(--accent-blue)' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 600 }}>配置 AI 模型接口</h3>
          </div>
          <button onClick={onClose} style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '4px'
          }}>
            <X size={18} />
          </button>
        </div>

        {/* Provider Tabs */}
        <div style={{
          display: 'flex',
          backgroundColor: 'rgba(255,255,255,0.05)',
          borderRadius: '10px',
          padding: '2px',
          border: '1px solid var(--border-color)'
        }}>
          <button
            onClick={() => { setProvider('google'); setTestResult(null); }}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '14px',
              fontWeight: 600,
              backgroundColor: provider === 'google' ? 'rgba(0, 242, 254, 0.15)' : 'transparent',
              color: provider === 'google' ? 'var(--accent-blue)' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Google Gemini AI
          </button>
          <button
            onClick={() => { setProvider('deepseek'); setTestResult(null); }}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '14px',
              fontWeight: 600,
              backgroundColor: provider === 'deepseek' ? 'rgba(0, 242, 254, 0.15)' : 'transparent',
              color: provider === 'deepseek' ? 'var(--accent-blue)' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            DeepSeek AI (国内推荐)
          </button>
        </div>

        {/* Config Inputs */}
        {provider === 'google' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
              输入 Google Gemini API Key
            </label>
            <input
              type="password"
              className="input-field"
              placeholder="AIzaSy..."
              value={googleKey}
              onChange={(e) => setGoogleKey(e.target.value)}
              style={{ width: '100%', letterSpacing: googleKey ? '3px' : '0' }}
            />
            
            {/* Google Priority List */}
            <div style={{
              backgroundColor: 'rgba(255,255,255,0.01)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '10px',
              fontSize: '13px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              marginTop: '6px'
            }}>
              <span style={{ fontWeight: 600, color: 'var(--accent-blue)' }}>谷歌级联降级策略 (RPD 排序)：</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>1. gemini-3.1-flash-lite (主推)</span>
                  <span style={{ color: 'var(--accent-green)' }}>500 RPD</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>2. gemini-2.5-flash (备用一)</span>
                  <span>20 RPD</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>3. gemini-2.5-flash-lite (备用二)</span>
                  <span>20 RPD</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>4. gemini-3-flash (备用三)</span>
                  <span>20 RPD</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
              输入 DeepSeek API Key
            </label>
            <input
              type="password"
              className="input-field"
              placeholder="sk-..."
              value={deepseekKey}
              onChange={(e) => setDeepseekKey(e.target.value)}
              style={{ width: '100%', letterSpacing: deepseekKey ? '3px' : '0' }}
            />
            
            {/* DeepSeek Model info */}
            <div style={{
              backgroundColor: 'rgba(255,255,255,0.01)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '10px',
              fontSize: '13px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              marginTop: '6px',
              lineHeight: '1.4'
            }}>
              <span style={{ fontWeight: 600, color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Sparkles size={12} />
                多模态自动切换逻辑：
              </span>
              <span style={{ color: 'var(--text-secondary)' }}>
                - **文字录入与菜谱推荐**：默认使用低时延、轻量级的 <strong>deepseek-v4-flash</strong> 模型进行问答。
                <br />
                - **图像拍照/食物识别**：当检测到图片输入时，代码会<strong>自动重定向并切换至 deepseek-v4-pro</strong> 高阶多模态视觉模型，以实现超精细图像营养估算，确保流畅度与高精度兼得。
              </span>
            </div>
          </div>
        )}

        {testResult && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            padding: '10px',
            borderRadius: '8px',
            backgroundColor: testResult.success ? 'rgba(0, 245, 160, 0.06)' : 'rgba(255, 71, 87, 0.06)',
            border: `1px solid ${testResult.success ? 'rgba(0, 245, 160, 0.2)' : 'rgba(255, 71, 87, 0.2)'}`,
            color: testResult.success ? 'var(--accent-green)' : 'var(--accent-red)'
          }}>
            {testResult.success ? <ShieldCheck size={16} /> : <AlertCircle size={16} />}
            <span style={{ wordBreak: 'break-word' }}>{testResult.msg}</span>
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
          <button
            onClick={handleTest}
            disabled={testing}
            className="btn-secondary"
            style={{ flex: 1, padding: '10px', fontSize: '15px' }}
          >
            {testing ? '测试中...' : '测试连接'}
          </button>
          <button
            onClick={handleSave}
            className="btn-primary"
            style={{ flex: 1, padding: '10px', fontSize: '15px' }}
          >
            保存并应用
          </button>
        </div>
      </div>
    </div>
  );
};
