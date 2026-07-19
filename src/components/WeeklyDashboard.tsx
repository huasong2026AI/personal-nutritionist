import React, { useState, useEffect } from 'react';
import { MealLog, ActivityLog, ApiConfig } from '../types';
import { Calendar, AlertCircle, TrendingUp, Sparkles, Loader } from 'lucide-react';
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

interface WeeklyDashboardProps {
  apiConfig: ApiConfig;
  weeklyRecords: DayRecordSummary[];
}

export const WeeklyDashboard: React.FC<WeeklyDashboardProps> = ({ apiConfig, weeklyRecords }) => {
  const [loading, setLoading] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [aiStatus, setAiStatus] = useState<string | null>(null);
  const [errInfo, setErrInfo] = useState<string | null>(null);

  // Cache AI assessment by the last date of records to avoid multiple calls
  const lastRecordDate = weeklyRecords[weeklyRecords.length - 1]?.date || 'empty';
  const cacheKey = `nutritionist_trend_weekly_${lastRecordDate}`;

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

  // Weekly aggregation
  const eatenCal = weeklyRecords.reduce((sum, day) => sum + day.meals.reduce((s, m) => s + m.calories, 0), 0);
  const targetCal = weeklyRecords.reduce((sum, day) => sum + day.targetCalories, 0) + 
                    weeklyRecords.reduce((sum, day) => sum + day.activities.reduce((s, a) => s + a.caloriesBurned, 0), 0);

  const eatenProt = weeklyRecords.reduce((sum, day) => sum + day.meals.reduce((s, m) => s + m.protein, 0), 0);
  const targetProt = weeklyRecords.reduce((sum, day) => sum + day.targetProtein, 0);

  const eatenVitC = weeklyRecords.reduce((sum, day) => sum + day.meals.reduce((s, m) => s + (m.micronutrients.vitaminC || 0), 0), 0);
  const targetVitC = weeklyRecords.reduce((sum, day) => sum + day.targetVitC, 0);

  const eatenCalcium = weeklyRecords.reduce((sum, day) => sum + day.meals.reduce((s, m) => s + (m.micronutrients.calcium || 0), 0), 0);
  const targetCalcium = weeklyRecords.reduce((sum, day) => sum + day.targetCalcium, 0);

  const eatenIron = weeklyRecords.reduce((sum, day) => sum + day.meals.reduce((s, m) => s + (m.micronutrients.iron || 0), 0), 0);
  const targetIron = weeklyRecords.reduce((sum, day) => sum + day.targetIron, 0);

  const eatenZinc = weeklyRecords.reduce((sum, day) => sum + day.meals.reduce((s, m) => s + (m.micronutrients.zinc || 0), 0), 0);
  const targetZinc = weeklyRecords.reduce((sum, day) => sum + day.targetZinc, 0);

  // Gaps
  const gapCal = Math.round(eatenCal - targetCal);
  const gapProt = Math.round(eatenProt - targetProt);
  const gapVitC = Math.round(eatenVitC - targetVitC);
  const gapCalcium = Math.round(eatenCalcium - targetCalcium);
  const gapIron = Math.round(eatenIron - targetIron);
  const gapZinc = Math.round(eatenZinc - targetZinc);

  const handleRequestAiReport = async () => {
    if (weeklyRecords.length === 0) return;
    setLoading(true);
    setErrInfo(null);
    setAiStatus('AI 正在深度统计并生成周度健康趋势分析...');
    try {
      const result = await analyzeTrend(apiConfig, weeklyRecords, 'weekly');
      setAiReport(result.data);
      localStorage.setItem(cacheKey, result.data);
      setAiStatus(`周度趋势评估成功 (由 ${result.modelUsed} 生成)`);
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
        <h3 style={{ fontSize: '17px', fontWeight: 600 }}>本周营养健康总览 (过去7天)</h3>
      </div>

      {/* Grid of 7 days */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
        {weeklyRecords.map((day, i) => {
          const dayCal = day.meals.reduce((sum, m) => sum + m.calories, 0);
          const dayBurned = day.activities.reduce((sum, a) => sum + a.caloriesBurned, 0);
          const dayTarget = day.targetCalories + dayBurned;
          
          const calPercent = dayTarget > 0 ? (dayCal / dayTarget) * 100 : 0;
          
          let borderGlow = 'rgba(255,255,255,0.05)';
          let bgColor = 'rgba(255,255,255,0.02)';
          let iconColor = 'var(--text-muted)';

          if (day.healthStatus === 'cold') {
            borderGlow = 'rgba(255, 71, 87, 0.4)';
            bgColor = 'rgba(255, 71, 87, 0.05)';
            iconColor = 'var(--accent-red)';
          } else if (day.healthStatus === 'indigestion') {
            borderGlow = 'rgba(255, 159, 67, 0.4)';
            bgColor = 'rgba(255, 159, 67, 0.05)';
            iconColor = 'var(--accent-orange)';
          } else if (day.healthStatus === 'fatigue') {
            borderGlow = 'rgba(156, 136, 255, 0.4)';
            bgColor = 'rgba(156, 136, 255, 0.05)';
            iconColor = '#9c88ff';
          } else if (calPercent >= 80 && calPercent <= 110) {
            borderGlow = 'rgba(0, 245, 160, 0.4)';
            bgColor = 'rgba(0, 245, 160, 0.05)';
            iconColor = 'var(--accent-green)';
          } else if (dayCal > 0) {
            borderGlow = 'rgba(255, 159, 67, 0.4)';
            bgColor = 'rgba(255, 159, 67, 0.05)';
            iconColor = 'var(--accent-orange)';
          }

          const dateParts = day.date.split('-');
          const shortDate = dateParts.length > 2 ? `${dateParts[1]}/${dateParts[2]}` : day.date;

          return (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '8px 2px',
                borderRadius: '10px',
                backgroundColor: bgColor,
                border: `1px solid ${borderGlow}`,
                fontSize: '13px',
                gap: '4px',
                textAlign: 'center'
              }}
            >
              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{day.dayName}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{shortDate}</span>
              
              {day.healthStatus === 'cold' ? (
                <span style={{ fontSize: '11px', color: 'var(--accent-red)', fontWeight: 600 }}>感冒😷</span>
              ) : day.healthStatus === 'indigestion' ? (
                <span style={{ fontSize: '11px', color: 'var(--accent-orange)', fontWeight: 600 }}>胃胀🤢</span>
              ) : day.healthStatus === 'fatigue' ? (
                <span style={{ fontSize: '11px', color: '#9c88ff', fontWeight: 600 }}>疲劳😴</span>
              ) : calPercent > 0 ? (
                <span style={{ fontSize: '12px', color: iconColor, fontWeight: 'bold' }}>
                  {Math.round(calPercent)}%
                </span>
              ) : (
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>-</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Weekly aggregates gaps card */}
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
          本周累计营养差值分析
        </span>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.1)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>卡路里差值:</span>
            <span style={{ fontWeight: 600, color: gapCal < 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
              {gapCal > 0 ? `+${gapCal}` : gapCal} kcal
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.1)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>蛋白质缺口:</span>
            <span style={{ fontWeight: 600, color: gapProt >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
              {gapProt > 0 ? `+${gapProt}` : gapProt} g
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.1)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>维C 缺口:</span>
            <span style={{ fontWeight: 600, color: gapVitC >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
              {gapVitC > 0 ? `+${gapVitC}` : gapVitC} mg
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.1)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>钙质 缺口:</span>
            <span style={{ fontWeight: 600, color: gapCalcium >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
              {gapCalcium > 0 ? `+${gapCalcium}` : gapCalcium} mg
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.1)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>铁质 缺口:</span>
            <span style={{ fontWeight: 600, color: gapIron >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
              {gapIron > 0 ? `+${gapIron}` : gapIron} mg
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', borderRadius: '6px', backgroundColor: 'rgba(0,0,0,0.1)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>锌元素 缺口:</span>
            <span style={{ fontWeight: 600, color: gapZinc >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
              {gapZinc > 0 ? `+${gapZinc}` : gapZinc} mg
            </span>
          </div>
        </div>

        {/* Weekly recovery strategy */}
        {weeklyRecords.some(d => d.healthStatus === 'cold') && (
          <div style={{
            backgroundColor: 'rgba(255, 71, 87, 0.04)',
            border: '1px solid rgba(255, 71, 87, 0.15)',
            padding: '10px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '6px',
            fontSize: '13px',
            color: 'var(--text-primary)',
            lineHeight: '1.4'
          }}>
            <AlertCircle size={14} style={{ color: 'var(--accent-red)', flexShrink: 0, marginTop: '2px' }} />
            <span>
              <strong>周健康提示：</strong>本周您曾处于<strong>感冒发烧</strong>状态，导致摄入量下降。胃口恢复期请继续保持细软温和饮食，逐步恢复高蛋白摄入。
            </span>
          </div>
        )}
      </div>

      {/* AI Weekly Trend Diagnostic Card */}
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
            🧠 AI 周度趋势健康诊断
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
                <Loader size={14} className="shimmer" /> 正在生成周度趋势评估报告...
              </span>
            ) : (
              '✨ 获取 AI 周度趋势深度评估'
            )}
          </button>
        )}
      </div>
    </div>
  );
};
