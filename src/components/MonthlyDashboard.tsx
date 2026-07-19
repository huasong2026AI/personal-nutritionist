import React, { useState, useEffect } from 'react';
import { MealLog, ActivityLog, ApiConfig } from '../types';
import { Calendar, TrendingUp, Sparkles, Loader } from 'lucide-react';
import { analyzeTrend } from '../services/ai';

interface DayRecordSummary {
  date: string;
  dayName: string;
  meals: MealLog[];
  activities: ActivityLog[];
  targetCalories: number;
  targetProtein: number;
  targetVitC: number;
  targetCalcium: number;
  targetIron: number;
  targetZinc: number;
  targetVitaminD: number;
  targetVitaminB12: number;
  targetMagnesium: number;
  targetPotassium: number;
  healthStatus: string;
}

interface MonthlyDashboardProps {
  apiConfig: ApiConfig;
  monthlyRecords: DayRecordSummary[];
}

export const MonthlyDashboard: React.FC<MonthlyDashboardProps> = ({ apiConfig, monthlyRecords }) => {
  const [loading, setLoading] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [aiStatus, setAiStatus] = useState<string | null>(null);
  const [errInfo, setErrInfo] = useState<string | null>(null);

  // Cache AI assessment by the last date of records to avoid multiple calls
  const lastRecordDate = monthlyRecords[monthlyRecords.length - 1]?.date || 'empty';
  const cacheKey = `nutritionist_trend_monthly_${lastRecordDate}`;

  useEffect(() => {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      setAiReport(cached);
    } else {
      setAiReport(null);
    }
    setErrInfo(null);
    setAiStatus(null);
  }, [cacheKey]);

  // Aggregate metrics
  const totalDays = monthlyRecords.length;
  const eatenCal = monthlyRecords.reduce((sum, day) => sum + day.meals.reduce((s, m) => s + m.calories, 0), 0);
  const eatenProt = monthlyRecords.reduce((sum, day) => sum + day.meals.reduce((s, m) => s + m.protein, 0), 0);
  const eatenCalcium = monthlyRecords.reduce((sum, day) => sum + day.meals.reduce((s, m) => s + (m.micronutrients.calcium || 0), 0), 0);

  // Averages
  const avgCal = totalDays > 0 ? Math.round(eatenCal / totalDays) : 0;
  const avgProt = totalDays > 0 ? Math.round(eatenProt / totalDays) : 0;
  const avgCalcium = totalDays > 0 ? Math.round(eatenCalcium / totalDays) : 0;

  const sickDaysCount = monthlyRecords.filter(r => r.healthStatus !== 'healthy').length;

  const handleRequestAiReport = async () => {
    if (monthlyRecords.length === 0) return;
    setLoading(true);
    setErrInfo(null);
    setAiStatus('AI 正在深度统计并生成月度健康趋势分析...');
    try {
      const result = await analyzeTrend(apiConfig, monthlyRecords, 'monthly');
      setAiReport(result.data);
      localStorage.setItem(cacheKey, result.data);
      setAiStatus(`月度趋势评估成功 (由 ${result.modelUsed} 生成)`);
    } catch (e: any) {
      setErrInfo(e.message || '趋势分析失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
        <Calendar size={18} style={{ color: 'var(--accent-blue)' }} />
        <h3 style={{ fontSize: '17px', fontWeight: 600 }}>月度营养健康总览 (过去30天)</h3>
      </div>

      {/* Grid of 30 days (Compact 5x6 Grid) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px' }}>
        {monthlyRecords.map((day, i) => {
          const dayCal = day.meals.reduce((sum, m) => sum + m.calories, 0);
          const dayBurned = day.activities.reduce((sum, a) => sum + a.caloriesBurned, 0);
          const dayTarget = day.targetCalories + dayBurned;
          const calPercent = dayTarget > 0 ? (dayCal / dayTarget) * 100 : 0;
          
          let borderGlow = 'rgba(255,255,255,0.05)';
          let bgColor = 'rgba(255,255,255,0.02)';
          let dotColor = '#64748b'; // default empty
          let label = '-';

          if (day.healthStatus === 'cold') {
            borderGlow = 'rgba(255, 71, 87, 0.4)';
            bgColor = 'rgba(255, 71, 87, 0.05)';
            dotColor = 'var(--accent-red)';
            label = '感冒';
          } else if (day.healthStatus === 'indigestion') {
            borderGlow = 'rgba(255, 159, 67, 0.4)';
            bgColor = 'rgba(255, 159, 67, 0.05)';
            dotColor = 'var(--accent-orange)';
            label = '胃胀';
          } else if (day.healthStatus === 'fatigue') {
            borderGlow = 'rgba(156, 136, 255, 0.4)';
            bgColor = 'rgba(156, 136, 255, 0.05)';
            dotColor = '#9c88ff';
            label = '疲劳';
          } else if (calPercent >= 80 && calPercent <= 110) {
            borderGlow = 'rgba(0, 245, 160, 0.4)';
            bgColor = 'rgba(0, 245, 160, 0.05)';
            dotColor = 'var(--accent-green)';
            label = `${Math.round(calPercent)}%`;
          } else if (dayCal > 0) {
            borderGlow = 'rgba(0, 242, 254, 0.4)';
            bgColor = 'rgba(0, 242, 254, 0.05)';
            dotColor = 'var(--accent-blue)';
            label = `${Math.round(calPercent)}%`;
          }

          const dateParts = day.date.split('-');
          const shortDate = dateParts.length > 2 ? `${dateParts[1]}/${dateParts[2]}` : day.date;

          return (
            <div
              key={i}
              title={`${day.date} [${day.dayName}] - 摄入:${dayCal}kcal / 目标:${dayTarget}kcal`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '6px 2px',
                borderRadius: '8px',
                backgroundColor: bgColor,
                border: `1px solid ${borderGlow}`,
                fontSize: '11px',
                gap: '2px',
                textAlign: 'center'
              }}
            >
              <span style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '11px' }}>{shortDate}</span>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: dotColor,
                margin: '2px 0'
              }} />
              <span style={{ fontSize: '9px', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', width: '100%' }}>{label}</span>
            </div>
          );
        })}
      </div>

      {/* Averages summary */}
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <span style={{ fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-purple)' }}>
          <TrendingUp size={14} />
          月度日均营养洞察
        </span>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.1)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>日均热量:</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{avgCal} kcal</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.1)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>日均蛋白质:</span>
            <span style={{ fontWeight: 600, color: 'var(--accent-green)' }}>{avgProt} g</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.1)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>日均钙摄入:</span>
            <span style={{ fontWeight: 600, color: 'var(--accent-orange)' }}>{avgCalcium} mg</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.1)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>月生病天数:</span>
            <span style={{ fontWeight: 600, color: sickDaysCount > 0 ? 'var(--accent-red)' : 'var(--text-muted)' }}>{sickDaysCount} 天</span>
          </div>
        </div>
      </div>

      {/* AI Trend Analysis Card */}
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-blue)' }}>
            <Sparkles size={14} />
            🧠 AI 月度趋势健康诊断
          </span>
          {aiReport && (
            <button
              onClick={handleRequestAiReport}
              disabled={loading}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '11px', textDecoration: 'underline' }}
            >
              重新诊断
            </button>
          )}
        </div>

        {aiStatus && (
          <div style={{ fontSize: '11px', color: 'var(--accent-blue)', backgroundColor: 'rgba(0, 242, 254, 0.05)', padding: '6px 10px', borderRadius: '6px' }}>
            {aiStatus}
          </div>
        )}

        {errInfo && (
          <div style={{ fontSize: '11px', color: 'var(--accent-red)', backgroundColor: 'rgba(255, 71, 87, 0.05)', padding: '6px 10px', borderRadius: '6px' }}>
            {errInfo}
          </div>
        )}

        {aiReport ? (
          <div style={{
            fontSize: '13px',
            color: 'var(--text-secondary)',
            lineHeight: '1.6',
            whiteSpace: 'pre-line',
            backgroundColor: 'rgba(0, 0, 0, 0.15)',
            padding: '12px',
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.02)'
          }}>
            {aiReport}
          </div>
        ) : (
          <button
            onClick={handleRequestAiReport}
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', padding: '10px', fontSize: '13px' }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Loader size={14} className="shimmer" /> 正在进行深度健康统计评估...
              </span>
            ) : (
              '✨ 获取 AI 月度趋势深度评估'
            )}
          </button>
        )}
      </div>
    </div>
  );
};
