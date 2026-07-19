import React, { useState } from 'react';
import { UserProfile, MealLog, ActivityLog } from '../types';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

interface NutrientBarsProps {
  profile: UserProfile;
  todayMeals: MealLog[];
  todayActivities: ActivityLog[];
  weeklyRecords: {
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
  }[];
}

export const NutrientBars: React.FC<NutrientBarsProps> = ({
  profile,
  todayMeals,
  todayActivities,
  weeklyRecords
}) => {
  const [viewMode, setViewMode] = useState<'today' | 'weekly'>('today');
  const [showMicroDetails, setShowMicroDetails] = useState(false);

  // ---------------- TODAY CALCULATIONS ----------------
  const todayEatenCal = todayMeals.reduce((sum, m) => sum + m.calories, 0);
  const todayEatenProt = todayMeals.reduce((sum, m) => sum + m.protein, 0);
  const todayBurnedCal = todayActivities.reduce((sum, a) => sum + a.caloriesBurned, 0);
  
  const todayCalTarget = profile.targetCalories + todayBurnedCal;
  const todayCalPct = todayCalTarget > 0 ? Math.min(100, (todayEatenCal / todayCalTarget) * 100) : 0;
  const todayProtPct = profile.targetProtein > 0 ? Math.min(100, (todayEatenProt / profile.targetProtein) * 100) : 0;

  // 8 Micronutrients calculations (capped at 100% per nutrient for composite score)
  const todayEatenVitC = todayMeals.reduce((sum, m) => sum + (m.micronutrients.vitaminC || 0), 0);
  const todayEatenCalcium = todayMeals.reduce((sum, m) => sum + (m.micronutrients.calcium || 0), 0);
  const todayEatenIron = todayMeals.reduce((sum, m) => sum + (m.micronutrients.iron || 0), 0);
  const todayEatenZinc = todayMeals.reduce((sum, m) => sum + (m.micronutrients.zinc || 0), 0);
  const todayEatenVitD = todayMeals.reduce((sum, m) => sum + (m.micronutrients.vitaminD || 0), 0);
  const todayEatenVitB12 = todayMeals.reduce((sum, m) => sum + (m.micronutrients.vitaminB12 || 0), 0);
  const todayEatenMagnesium = todayMeals.reduce((sum, m) => sum + (m.micronutrients.magnesium || 0), 0);
  const todayEatenPotassium = todayMeals.reduce((sum, m) => sum + (m.micronutrients.potassium || 0), 0);

  const vitCPct = profile.targetVitaminC > 0 ? Math.min(100, (todayEatenVitC / profile.targetVitaminC) * 100) : 0;
  const calciumPct = profile.targetCalcium > 0 ? Math.min(100, (todayEatenCalcium / profile.targetCalcium) * 100) : 0;
  const ironPct = profile.targetIron > 0 ? Math.min(100, (todayEatenIron / profile.targetIron) * 100) : 0;
  const zincPct = profile.targetZinc > 0 ? Math.min(100, (todayEatenZinc / profile.targetZinc) * 100) : 0;
  const vitDPct = profile.targetVitaminD > 0 ? Math.min(100, (todayEatenVitD / profile.targetVitaminD) * 100) : 0;
  const vitB12Pct = profile.targetVitaminB12 > 0 ? Math.min(100, (todayEatenVitB12 / profile.targetVitaminB12) * 100) : 0;
  const magnesiumPct = profile.targetMagnesium > 0 ? Math.min(100, (todayEatenMagnesium / profile.targetMagnesium) * 100) : 0;
  const potassiumPct = profile.targetPotassium > 0 ? Math.min(100, (todayEatenPotassium / profile.targetPotassium) * 100) : 0;

  const todayMicroScore = (vitCPct + calciumPct + ironPct + zincPct + vitDPct + vitB12Pct + magnesiumPct + potassiumPct) / 8;

  // ---------------- WEEKLY CALCULATIONS ----------------
  const weeklyEatenCal = weeklyRecords.reduce((sum, day) => sum + day.meals.reduce((s, m) => s + m.calories, 0), 0);
  const weeklyEatenProt = weeklyRecords.reduce((sum, day) => sum + day.meals.reduce((s, m) => s + m.protein, 0), 0);
  const weeklyBurnedCal = weeklyRecords.reduce((sum, day) => sum + day.activities.reduce((s, a) => s + a.caloriesBurned, 0), 0);

  const weeklyCalTarget = weeklyRecords.reduce((sum, day) => sum + day.targetCalories, 0) + weeklyBurnedCal;
  const weeklyProtTarget = weeklyRecords.reduce((sum, day) => sum + day.targetProtein, 0);

  const weeklyEatenVitC = weeklyRecords.reduce((sum, day) => sum + day.meals.reduce((s, m) => s + (m.micronutrients.vitaminC || 0), 0), 0);
  const weeklyEatenCalcium = weeklyRecords.reduce((sum, day) => sum + day.meals.reduce((s, m) => s + (m.micronutrients.calcium || 0), 0), 0);
  const weeklyEatenIron = weeklyRecords.reduce((sum, day) => sum + day.meals.reduce((s, m) => s + (m.micronutrients.iron || 0), 0), 0);
  const weeklyEatenZinc = weeklyRecords.reduce((sum, day) => sum + day.meals.reduce((s, m) => s + (m.micronutrients.zinc || 0), 0), 0);
  const weeklyEatenVitD = weeklyRecords.reduce((sum, day) => sum + day.meals.reduce((s, m) => s + (m.micronutrients.vitaminD || 0), 0), 0);
  const weeklyEatenVitB12 = weeklyRecords.reduce((sum, day) => sum + day.meals.reduce((s, m) => s + (m.micronutrients.vitaminB12 || 0), 0), 0);
  const weeklyEatenMagnesium = weeklyRecords.reduce((sum, day) => sum + day.meals.reduce((s, m) => s + (m.micronutrients.magnesium || 0), 0), 0);
  const weeklyEatenPotassium = weeklyRecords.reduce((sum, day) => sum + day.meals.reduce((s, m) => s + (m.micronutrients.potassium || 0), 0), 0);

  const weeklyVitCTarget = weeklyRecords.reduce((sum, day) => sum + (day.targetVitC || profile.targetVitaminC || 100), 0);
  const weeklyCalciumTarget = weeklyRecords.reduce((sum, day) => sum + (day.targetCalcium || profile.targetCalcium || 800), 0);
  const weeklyIronTarget = weeklyRecords.reduce((sum, day) => sum + (day.targetIron || profile.targetIron || 12), 0);
  const weeklyZincTarget = weeklyRecords.reduce((sum, day) => sum + (day.targetZinc || profile.targetZinc || 12), 0);
  const weeklyVitDTarget = weeklyRecords.reduce((sum, day) => sum + (day.targetVitaminD || profile.targetVitaminD || 15), 0);
  const weeklyVitB12Target = weeklyRecords.reduce((sum, day) => sum + (day.targetVitaminB12 || profile.targetVitaminB12 || 2.4), 0);
  const weeklyMagnesiumTarget = weeklyRecords.reduce((sum, day) => sum + (day.targetMagnesium || profile.targetMagnesium || 420), 0);
  const weeklyPotassiumTarget = weeklyRecords.reduce((sum, day) => sum + (day.targetPotassium || profile.targetPotassium || 2500), 0);

  const weeklyCalPct = weeklyCalTarget > 0 ? Math.min(100, (weeklyEatenCal / weeklyCalTarget) * 100) : 0;
  const weeklyProtPct = weeklyProtTarget > 0 ? Math.min(100, (weeklyEatenProt / weeklyProtTarget) * 100) : 0;

  const weeklyVitCPct = weeklyVitCTarget > 0 ? Math.min(100, (weeklyEatenVitC / weeklyVitCTarget) * 100) : 0;
  const weeklyCalciumPct = weeklyCalciumTarget > 0 ? Math.min(100, (weeklyEatenCalcium / weeklyCalciumTarget) * 100) : 0;
  const weeklyIronPct = weeklyIronTarget > 0 ? Math.min(100, (weeklyEatenIron / weeklyIronTarget) * 100) : 0;
  const weeklyZincPct = weeklyZincTarget > 0 ? Math.min(100, (weeklyEatenZinc / weeklyZincTarget) * 100) : 0;
  const weeklyVitDPct = weeklyVitDTarget > 0 ? Math.min(100, (weeklyEatenVitD / weeklyVitDTarget) * 100) : 0;
  const weeklyVitB12Pct = weeklyVitB12Target > 0 ? Math.min(100, (weeklyEatenVitB12 / weeklyVitB12Target) * 100) : 0;
  const weeklyMagnesiumPct = weeklyMagnesiumTarget > 0 ? Math.min(100, (weeklyEatenMagnesium / weeklyMagnesiumTarget) * 100) : 0;
  const weeklyPotassiumPct = weeklyPotassiumTarget > 0 ? Math.min(100, (weeklyEatenPotassium / weeklyPotassiumTarget) * 100) : 0;

  const weeklyMicroScore = (weeklyVitCPct + weeklyCalciumPct + weeklyIronPct + weeklyZincPct + weeklyVitDPct + weeklyVitB12Pct + weeklyMagnesiumPct + weeklyPotassiumPct) / 8;

  // Active metrics depending on viewMode
  const isWeekly = viewMode === 'weekly';
  const calEaten = isWeekly ? weeklyEatenCal : todayEatenCal;
  const calTarget = isWeekly ? weeklyCalTarget : todayCalTarget;
  const calPct = isWeekly ? weeklyCalPct : todayCalPct;
  const calBurned = isWeekly ? weeklyBurnedCal : todayBurnedCal;

  const protEaten = isWeekly ? weeklyEatenProt : todayEatenProt;
  const protTarget = isWeekly ? weeklyProtTarget : profile.targetProtein;
  const protPct = isWeekly ? weeklyProtPct : todayProtPct;

  const microScore = isWeekly ? weeklyMicroScore : todayMicroScore;

  // detail lists mapping
  const microList = [
    {
      name: '维生素 C (Vc) - 免疫抗氧',
      unit: 'mg',
      eaten: isWeekly ? weeklyEatenVitC : todayEatenVitC,
      target: isWeekly ? weeklyVitCTarget : profile.targetVitaminC,
      pct: isWeekly ? weeklyVitCPct : vitCPct,
      color: '#ff5252'
    },
    {
      name: '钙质 (Calcium) - 骨骼关节',
      unit: 'mg',
      eaten: isWeekly ? weeklyEatenCalcium : todayEatenCalcium,
      target: isWeekly ? weeklyCalciumTarget : profile.targetCalcium,
      pct: isWeekly ? weeklyCalciumPct : calciumPct,
      color: '#ff9f43'
    },
    {
      name: '维生素 D (Vit D) - 协同补钙吸纳',
      unit: 'mcg',
      eaten: isWeekly ? weeklyEatenVitD : todayEatenVitD,
      target: isWeekly ? weeklyVitDTarget : profile.targetVitaminD,
      pct: isWeekly ? weeklyVitDPct : vitDPct,
      color: '#ffd200'
    },
    {
      name: '维生素 B12 - 保护神经与红细胞',
      unit: 'mcg',
      eaten: isWeekly ? weeklyEatenVitB12 : todayEatenVitB12,
      target: isWeekly ? weeklyVitB12Target : profile.targetVitaminB12,
      pct: isWeekly ? weeklyVitB12Pct : vitB12Pct,
      color: '#00f2fe'
    },
    {
      name: '镁元素 (Magnesium) - 心脏与肌肉放松',
      unit: 'mg',
      eaten: isWeekly ? weeklyEatenMagnesium : todayEatenMagnesium,
      target: isWeekly ? weeklyMagnesiumTarget : profile.targetMagnesium,
      pct: isWeekly ? weeklyMagnesiumPct : magnesiumPct,
      color: '#9c88ff'
    },
    {
      name: '钾元素 (Potassium) - 盐排钠与稳定血压',
      unit: 'mg',
      eaten: isWeekly ? weeklyEatenPotassium : todayEatenPotassium,
      target: isWeekly ? weeklyPotassiumTarget : profile.targetPotassium,
      pct: isWeekly ? weeklyPotassiumPct : potassiumPct,
      color: '#4cd137'
    },
    {
      name: '锌元素 (Zinc) - 维持粘膜与视力',
      unit: 'mg',
      eaten: isWeekly ? weeklyEatenZinc : todayEatenZinc,
      target: isWeekly ? weeklyZincTarget : profile.targetZinc,
      pct: isWeekly ? weeklyZincPct : zincPct,
      color: '#48dbfb'
    },
    {
      name: '铁质 (Iron) - 携氧红细胞',
      unit: 'mg',
      eaten: isWeekly ? weeklyEatenIron : todayEatenIron,
      target: isWeekly ? weeklyIronTarget : profile.targetIron,
      pct: isWeekly ? weeklyIronPct : ironPct,
      color: '#e056fd'
    }
  ];

  return (
    <div className="glass-card fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Toggle Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '17px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={16} style={{ color: 'var(--accent-blue)' }} />
          营养摄入看板
        </h3>
        
        <div style={{
          display: 'flex',
          backgroundColor: 'rgba(255,255,255,0.05)',
          borderRadius: '8px',
          padding: '2px',
          border: '1px solid var(--border-color)'
        }}>
          <button
            onClick={() => setViewMode('today')}
            style={{
              padding: '4px 12px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '14px',
              fontWeight: 600,
              backgroundColor: !isWeekly ? 'rgba(0, 242, 254, 0.15)' : 'transparent',
              color: !isWeekly ? 'var(--accent-blue)' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            今日营养
          </button>
          <button
            onClick={() => setViewMode('weekly')}
            style={{
              padding: '4px 12px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '14px',
              fontWeight: 600,
              backgroundColor: isWeekly ? 'rgba(0, 242, 254, 0.15)' : 'transparent',
              color: isWeekly ? 'var(--accent-blue)' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            本周汇总
          </button>
        </div>
      </div>

      {/* 3 Energy Bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Calorie Bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px' }}>
              <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                🔥 卡路里 (Calories)
              </span>
              <span style={{ color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>{Math.round(calEaten)}</strong> / {Math.round(calTarget)} kcal
              </span>
            </div>
            {/* Calorie Formula Breakdown */}
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
              <span>计算公式: {isWeekly ? `基础配额 (${profile.targetCalories}×${weeklyRecords.length})` : '日均基础配额'} ({isWeekly ? profile.targetCalories * weeklyRecords.length : profile.targetCalories} kcal) + 运动消耗 (+{Math.round(calBurned)} kcal)</span>
              <span style={{ fontWeight: 600, color: 'var(--accent-blue)' }}>= {Math.round(calTarget)} kcal (总预算)</span>
            </div>
          </div>
          <div className="progress-bar-container" style={{ marginTop: '4px' }}>
            <div
              className="progress-bar-fill"
              style={{
                width: `${calPct}%`,
                background: 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)',
                boxShadow: '0 0 8px rgba(0, 242, 254, 0.4)'
              }}
            />
          </div>
        </div>

        {/* Protein Bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px' }}>
            <span style={{ fontWeight: 600 }}>🥩 蛋白质 (Protein)</span>
            <span style={{ color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--text-primary)' }}>{Math.round(protEaten)}g</strong> / {Math.round(protTarget)}g
            </span>
          </div>
          <div className="progress-bar-container">
            <div
              className="progress-bar-fill"
              style={{
                width: `${protPct}%`,
                background: 'linear-gradient(90deg, #00f2fe 0%, #00f5a0 100%)',
                boxShadow: '0 0 8px rgba(0, 255, 160, 0.4)'
              }}
            />
          </div>
        </div>

        {/* Micronutrients Bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div
            onClick={() => setShowMicroDetails(!showMicroDetails)}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '15px',
              cursor: 'pointer',
              userSelect: 'none'
            }}
          >
            <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              🧬 微量元素 (Micronutrients Score)
              {showMicroDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </span>
            <span style={{ color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--accent-orange)' }}>{Math.round(microScore)}%</strong>
            </span>
          </div>
          <div className="progress-bar-container" onClick={() => setShowMicroDetails(!showMicroDetails)} style={{ cursor: 'pointer' }}>
            <div
              className="progress-bar-fill"
              style={{
                width: `${microScore}%`,
                background: 'linear-gradient(90deg, #ff9f43 0%, #ff5252 100%)',
                boxShadow: '0 0 8px rgba(255, 159, 67, 0.4)'
              }}
            />
          </div>

          {/* Expanded Micro-nutrient Details */}
          {showMicroDetails && (
            <div className="fade-in" style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              padding: '12px 10px',
              backgroundColor: 'rgba(0,0,0,0.2)',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              marginTop: '6px',
              maxHeight: '260px',
              overflowY: 'auto'
            }}>
              {microList.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <span>{item.name}</span>
                    <span>{Math.round(item.eaten)}{item.unit} / {Math.round(item.target)}{item.unit}</span>
                  </div>
                  <div className="progress-bar-container" style={{ height: '6px' }}>
                    <div className="progress-bar-fill" style={{ width: `${item.pct}%`, backgroundColor: item.color }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
