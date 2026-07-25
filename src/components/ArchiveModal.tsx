import React, { useState, useEffect } from 'react';
import { MealLog, ActivityLog, SupplementLog } from '../types';
import { Calendar, CheckCircle2, X } from 'lucide-react';

interface ArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (date: string) => void;
  todayMeals: MealLog[];
  todayActivities: ActivityLog[];
  todaySupplements: SupplementLog[];
  todayDateStr: string;
}

export const ArchiveModal: React.FC<ArchiveModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  todayMeals,
  todayActivities,
  todaySupplements,
  todayDateStr
}) => {
  // Yesterday's date string calculation
  const getYesterdayDateStr = () => {
    try {
      const today = new Date(todayDateStr + 'T00:00:00');
      today.setDate(today.getDate() - 1);
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, '0');
      const d = String(today.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    } catch (e) {
      return '';
    }
  };

  const yesterdayDateStr = getYesterdayDateStr();
  const [dateType, setDateType] = useState<'today' | 'yesterday' | 'custom'>('today');
  const [customDate, setCustomDate] = useState(todayDateStr);

  useEffect(() => {
    if (isOpen) {
      setDateType('today');
      setCustomDate(todayDateStr);
    }
  }, [isOpen, todayDateStr]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    let finalDate = todayDateStr;
    if (dateType === 'yesterday') {
      finalDate = yesterdayDateStr;
    } else if (dateType === 'custom') {
      finalDate = customDate;
    }
    onConfirm(finalDate);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.8)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: '24px 16px',
      zIndex: 9999,
      overflowY: 'auto'
    }}>
      <div className="glass-card fade-in" style={{
        width: '100%',
        maxWidth: '400px',
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        borderColor: 'var(--border-color)',
        padding: '20px',
        borderRadius: '16px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        marginTop: '10vh'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} style={{ color: 'var(--accent-orange)' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 600 }}>归档健康记录</h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Summary */}
        <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
          请选择要归档的日期。系统会将当前主页面的打卡数据保存到该天的历史趋势中，并清空当前打卡栏。
        </div>

        <div style={{
          backgroundColor: 'rgba(255,255,255,0.02)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>待归档数据摘要：</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', fontSize: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>🍔 {todayMeals.length} 餐食</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>🏃‍♂️ {todayActivities.length} 运动</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>💊 {todaySupplements.length} 补剂</div>
          </div>
        </div>

        {/* Date selection form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <label style={{ fontSize: '14px', fontWeight: 600 }}>选择归档目标日期：</label>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Today option */}
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 12px',
              borderRadius: '8px',
              backgroundColor: dateType === 'today' ? 'rgba(255, 159, 67, 0.15)' : 'rgba(255,255,255,0.01)',
              border: `1px solid ${dateType === 'today' ? 'var(--accent-orange)' : 'var(--border-color)'}`,
              cursor: 'pointer',
              fontSize: '14px'
            }}>
              <input
                type="radio"
                name="archiveDate"
                checked={dateType === 'today'}
                onChange={() => setDateType('today')}
                style={{ accentColor: 'var(--accent-orange)' }}
              />
              <div>
                <strong>归档到今天</strong> <span style={{ color: 'var(--text-secondary)', fontSize: '12.5px' }}>({todayDateStr})</span>
              </div>
            </label>

            {/* Yesterday option */}
            {yesterdayDateStr && (
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 12px',
                borderRadius: '8px',
                backgroundColor: dateType === 'yesterday' ? 'rgba(255, 159, 67, 0.15)' : 'rgba(255,255,255,0.01)',
                border: `1px solid ${dateType === 'yesterday' ? 'var(--accent-orange)' : 'var(--border-color)'}`,
                cursor: 'pointer',
                fontSize: '14px'
              }}>
                <input
                  type="radio"
                  name="archiveDate"
                  checked={dateType === 'yesterday'}
                  onChange={() => setDateType('yesterday')}
                  style={{ accentColor: 'var(--accent-orange)' }}
                />
                <div>
                  <strong>归档到昨天 (补填)</strong> <span style={{ color: 'var(--text-secondary)', fontSize: '12.5px' }}>({yesterdayDateStr})</span>
                </div>
              </label>
            )}

            {/* Custom date option */}
            <label style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              padding: '10px 12px',
              borderRadius: '8px',
              backgroundColor: dateType === 'custom' ? 'rgba(255, 159, 67, 0.15)' : 'rgba(255,255,255,0.01)',
              border: `1px solid ${dateType === 'custom' ? 'var(--accent-orange)' : 'var(--border-color)'}`,
              cursor: 'pointer',
              fontSize: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="radio"
                  name="archiveDate"
                  checked={dateType === 'custom'}
                  onChange={() => setDateType('custom')}
                  style={{ accentColor: 'var(--accent-orange)' }}
                />
                <strong>自定义其他日期 (补填)</strong>
              </div>
              {dateType === 'custom' && (
                <input
                  type="date"
                  className="input-field"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  max={todayDateStr}
                  style={{ marginTop: '4px', padding: '6px 10px', fontSize: '14px', width: '100%', boxSizing: 'border-box' }}
                  required
                />
              )}
            </label>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
          <button
            onClick={onClose}
            className="btn-secondary"
            style={{ flex: 1, padding: '10px' }}
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            className="btn-primary"
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: 'var(--accent-orange)',
              borderColor: 'var(--accent-orange)',
              color: '#000',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}
          >
            <CheckCircle2 size={16} /> 确认归档
          </button>
        </div>
      </div>
    </div>
  );
};
