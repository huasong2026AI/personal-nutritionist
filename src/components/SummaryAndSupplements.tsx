import React, { useState } from 'react';
import { UserProfile, MealLog, ActivityLog, SupplementRecommendation, ApiConfig, SupplementLog } from '../types';
import { recommendSupplements } from '../services/ai';
import { Sparkles, Loader, Award, ShieldAlert } from 'lucide-react';

interface SummaryAndSupplementsProps {
  apiConfig: ApiConfig;
  profile: UserProfile;
  todayMeals: MealLog[];
  todayActivities: ActivityLog[];
  todaySupplements?: SupplementLog[];
}

export const SummaryAndSupplements: React.FC<SummaryAndSupplementsProps> = ({
  apiConfig,
  profile,
  todayMeals,
  todayActivities,
  todaySupplements = []
}) => {
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState<SupplementRecommendation | null>(null);
  const [aiStatus, setAiStatus] = useState<string | null>(null);
  const [errInfo, setErrInfo] = useState<string | null>(null);

  const totalEatenCal = todayMeals.reduce((sum, m) => sum + m.calories, 0) +
                        todaySupplements.reduce((sum, s) => sum + (s.calories || 0), 0);
  const totalEatenProt = todayMeals.reduce((sum, m) => sum + m.protein, 0) +
                         todaySupplements.reduce((sum, s) => sum + (s.protein || 0), 0);
  const totalBurnedCal = todayActivities.reduce((sum, a) => sum + a.caloriesBurned, 0);

  // Targets
  const targetCal = profile.targetCalories;
  const targetProt = profile.targetProtein;

  // 8 Micronutrients eaten
  const eatenVitC = todayMeals.reduce((sum, m) => sum + (m.micronutrients.vitaminC || 0), 0) +
                    todaySupplements.reduce((sum, s) => sum + (s.micronutrients?.vitaminC || 0), 0);
  const eatenCalcium = todayMeals.reduce((sum, m) => sum + (m.micronutrients.calcium || 0), 0) +
                       todaySupplements.reduce((sum, s) => sum + (s.micronutrients?.calcium || 0), 0);
  const eatenIron = todayMeals.reduce((sum, m) => sum + (m.micronutrients.iron || 0), 0) +
                    todaySupplements.reduce((sum, s) => sum + (s.micronutrients?.iron || 0), 0);
  const eatenZinc = todayMeals.reduce((sum, m) => sum + (m.micronutrients.zinc || 0), 0) +
                    todaySupplements.reduce((sum, s) => sum + (s.micronutrients?.zinc || 0), 0);
  const eatenVitD = todayMeals.reduce((sum, m) => sum + (m.micronutrients.vitaminD || 0), 0) +
                    todaySupplements.reduce((sum, s) => sum + (s.micronutrients?.vitaminD || 0), 0);
  const eatenVitB12 = todayMeals.reduce((sum, m) => sum + (m.micronutrients.vitaminB12 || 0), 0) +
                      todaySupplements.reduce((sum, s) => sum + (s.micronutrients?.vitaminB12 || 0), 0);
  const eatenMagnesium = todayMeals.reduce((sum, m) => sum + (m.micronutrients.magnesium || 0), 0) +
                         todaySupplements.reduce((sum, s) => sum + (s.micronutrients?.magnesium || 0), 0);
  const eatenPotassium = todayMeals.reduce((sum, m) => sum + (m.micronutrients.potassium || 0), 0) +
                         todaySupplements.reduce((sum, s) => sum + (s.micronutrients?.potassium || 0), 0);

  // Gaps (Negative = deficit, Positive = excess)
  const gapCal = Math.round(totalEatenCal - (targetCal + totalBurnedCal));
  const gapProt = Math.round(totalEatenProt - targetProt);
  
  const gapVitC = Math.round(eatenVitC - (profile.targetVitaminC || 100));
  const gapCalcium = Math.round(eatenCalcium - (profile.targetCalcium || 800));
  const gapIron = Math.round(eatenIron - (profile.targetIron || 12));
  const gapZinc = Math.round(eatenZinc - (profile.targetZinc || 12));
  const gapVitD = Math.round(eatenVitD - (profile.targetVitaminD || 15));
  const gapVitB12 = Number((eatenVitB12 - (profile.targetVitaminB12 || 2.4)).toFixed(1));
  const gapMagnesium = Math.round(eatenMagnesium - (profile.targetMagnesium || 420));
  const gapPotassium = Math.round(eatenPotassium - (profile.targetPotassium || 2500));

  const getSupplementAdvice = async () => {
    setLoading(true);
    setErrInfo(null);
    setAiStatus('AI 正在深度评估今天的营养结构并定制补剂方案...');
    try {
      const result = await recommendSupplements(
        apiConfig,
        {
          calories: gapCal,
          protein: gapProt,
          vitaminC: gapVitC,
          calcium: gapCalcium,
          iron: gapIron,
          zinc: gapZinc,
          vitaminD: gapVitD,
          vitaminB12: gapVitB12,
          magnesium: gapMagnesium,
          potassium: gapPotassium
        },
        profile.healthStatus
      );

      setAdvice(result.data);
      setAiStatus(`补剂建议生成成功 (由 ${result.modelUsed} 精准运算)`);
    } catch (e: any) {
      setErrInfo(e.message || '生成建议失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
        <Sparkles size={18} style={{ color: 'var(--accent-orange)' }} />
        <h3 style={{ fontSize: '17px', fontWeight: 600 }}>日终缺口诊断与补剂推荐</h3>
      </div>

      {todayMeals.length === 0 ? (
        <div style={{ textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)', padding: '20px 0' }}>
          记录至少一餐后，即可解锁日终营养缺口分析与 AI 补剂建议！
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Quick analysis summary */}
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.01)',
            border: '1px solid var(--border-color)',
            padding: '12px',
            borderRadius: '12px',
            fontSize: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>本日差值诊断：</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              <span style={{ padding: '3px 8px', borderRadius: '6px', backgroundColor: gapCal < -150 ? 'rgba(255, 71, 87, 0.08)' : 'rgba(0, 245, 160, 0.08)', color: gapCal < -150 ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                卡路里: {gapCal < 0 ? `缺口 ${Math.abs(gapCal)}` : `盈余 ${gapCal}`} kcal
              </span>
              <span style={{ padding: '3px 8px', borderRadius: '6px', backgroundColor: gapProt < -5 ? 'rgba(255, 71, 87, 0.08)' : 'rgba(0, 245, 160, 0.08)', color: gapProt < -5 ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                蛋白质: {gapProt < 0 ? `缺口 ${Math.abs(gapProt)}g` : `达标`}
              </span>
              <span style={{ padding: '3px 8px', borderRadius: '6px', backgroundColor: gapVitC < -10 ? 'rgba(255, 159, 67, 0.08)' : 'rgba(0, 245, 160, 0.08)', color: gapVitC < -10 ? 'var(--accent-orange)' : 'var(--accent-green)' }}>
                维生素C: {gapVitC < 0 ? `缺 ${Math.abs(gapVitC)}mg` : `达标`}
              </span>
              <span style={{ padding: '3px 8px', borderRadius: '6px', backgroundColor: gapCalcium < -100 ? 'rgba(255, 159, 67, 0.08)' : 'rgba(0, 245, 160, 0.08)', color: gapCalcium < -100 ? 'var(--accent-orange)' : 'var(--accent-green)' }}>
                钙: {gapCalcium < 0 ? `缺 ${Math.abs(gapCalcium)}mg` : `达标`}
              </span>
              <span style={{ padding: '3px 8px', borderRadius: '6px', backgroundColor: gapVitD < -3 ? 'rgba(255, 159, 67, 0.08)' : 'rgba(0, 245, 160, 0.08)', color: gapVitD < -3 ? 'var(--accent-orange)' : 'var(--accent-green)' }}>
                维生素D: {gapVitD < 0 ? `缺 ${Math.abs(gapVitD)}mcg` : `达标`}
              </span>
              <span style={{ padding: '3px 8px', borderRadius: '6px', backgroundColor: gapVitB12 < -0.3 ? 'rgba(255, 159, 67, 0.08)' : 'rgba(0, 245, 160, 0.08)', color: gapVitB12 < -0.3 ? 'var(--accent-orange)' : 'var(--accent-green)' }}>
                维生素B12: {gapVitB12 < 0 ? `缺 ${Math.abs(gapVitB12)}mcg` : `达标`}
              </span>
              <span style={{ padding: '3px 8px', borderRadius: '6px', backgroundColor: gapMagnesium < -40 ? 'rgba(255, 159, 67, 0.08)' : 'rgba(0, 245, 160, 0.08)', color: gapMagnesium < -40 ? 'var(--accent-orange)' : 'var(--accent-green)' }}>
                镁: {gapMagnesium < 0 ? `缺 ${Math.abs(gapMagnesium)}mg` : `达标`}
              </span>
              <span style={{ padding: '3px 8px', borderRadius: '6px', backgroundColor: gapPotassium < -250 ? 'rgba(255, 159, 67, 0.08)' : 'rgba(0, 245, 160, 0.08)', color: gapPotassium < -250 ? 'var(--accent-orange)' : 'var(--accent-green)' }}>
                钾: {gapPotassium < 0 ? `缺 ${Math.abs(gapPotassium)}mg` : `达标`}
              </span>
            </div>
          </div>

          {/* Sickness custom alert */}
          {profile.healthStatus === 'cold' && (
            <div style={{
              backgroundColor: 'rgba(255, 71, 87, 0.05)',
              border: '1px solid rgba(255, 71, 87, 0.15)',
              borderRadius: '8px',
              padding: '10px',
              fontSize: '13px',
              color: 'var(--text-primary)',
              lineHeight: '1.4',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '6px'
            }}>
              <ShieldAlert size={14} style={{ color: 'var(--accent-red)', flexShrink: 0, marginTop: '2px' }} />
              <span>
                <strong>感冒状态特别提示：</strong>感冒导致您的身体机能处于应激状态，今日卡路里及高蛋白缺口较大属于正常生理反应。生病期间不要勉强多吃，请优先服用维生素C和水，维持轻度代谢即可。
              </span>
            </div>
          )}

          {/* Button to request AI advice */}
          {!advice && (
            <button
              onClick={getSupplementAdvice}
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', padding: '10px', fontSize: '15px' }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Loader size={14} className="shimmer" /> 正在诊断并定制补剂建议...
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  🧠 获取 AI 营养师定制建议
                </span>
              )}
            </button>
          )}

          {aiStatus && (
            <div style={{ fontSize: '13px', color: 'var(--accent-blue)', backgroundColor: 'rgba(0, 242, 254, 0.05)', padding: '6px 10px', borderRadius: '6px', borderLeft: '3px solid var(--accent-blue)' }}>
              {aiStatus}
            </div>
          )}

          {errInfo && (
            <div style={{ fontSize: '13px', color: 'var(--accent-red)', backgroundColor: 'rgba(255, 71, 87, 0.05)', padding: '6px 10px', borderRadius: '6px', borderLeft: '3px solid var(--accent-red)' }}>
              {errInfo}
            </div>
          )}

          {/* Supplement Advice Details */}
          {advice && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--accent-orange)' }}>
                📋 AI 专属补剂补充策略：
              </div>
              
              {advice.suggestions.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {advice.suggestions.map((sug, i) => (
                    <div key={i} style={{
                      backgroundColor: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--border-color)',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          💊 {sug.name}
                        </span>
                        <span style={{ fontSize: '12px', backgroundColor: 'rgba(255, 159, 67, 0.1)', color: 'var(--accent-orange)', padding: '2px 6px', borderRadius: '8px' }}>
                          {sug.dose}
                        </span>
                      </div>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                        {sug.reason}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  backgroundColor: 'rgba(0, 245, 160, 0.03)',
                  border: '1px dashed rgba(0, 245, 160, 0.2)',
                  borderRadius: '10px',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: 'var(--accent-green)',
                  fontSize: '14px'
                }}>
                  <Award size={16} />
                  <span>恭喜！今日所有微量元素指标完成极其出色，无需额外补剂。继续保持完美的饮食结构！</span>
                </div>
              )}

              <div style={{
                backgroundColor: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border-color)',
                padding: '12px',
                borderRadius: '10px',
                fontSize: '13px',
                color: 'var(--text-secondary)',
                lineHeight: '1.5'
              }}>
                <strong style={{ color: 'var(--text-primary)' }}>💡 营养师贴心指导：</strong>
                <p style={{ marginTop: '4px', margin: 0 }}>{advice.generalAdvice}</p>
              </div>

              <button
                onClick={getSupplementAdvice}
                disabled={loading}
                className="btn-secondary"
                style={{ width: '100%', padding: '6px', fontSize: '13px', marginTop: '4px' }}
              >
                {loading ? '正在重新评估...' : '🔄 重新评估诊断'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
