import React, { useState } from 'react';
import { UserProfile, HealthStatus, ActivityLevel, DietGoal } from '../types';
import { User, Activity, Flame, ShieldAlert, Heart } from 'lucide-react';

interface UserProfileFormProps {
  profile: UserProfile;
  onSave: (profile: UserProfile) => void;
}

export const UserProfileForm: React.FC<UserProfileFormProps> = ({ profile, onSave }) => {
  const [age, setAge] = useState(profile.age);
  const [gender, setGender] = useState(profile.gender);
  const [height, setHeight] = useState(profile.height);
  const [weight, setWeight] = useState(profile.weight);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(profile.activityLevel);
  const [goal, setGoal] = useState<DietGoal>(profile.goal);
  const [healthStatus, setHealthStatus] = useState<HealthStatus>(profile.healthStatus);
  const [commonFoodsInput, setCommonFoodsInput] = useState(profile.commonFoods.join('，'));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Calculate BMR (Mifflin-St Jeor)
    let bmr = 0;
    if (gender === 'male') {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    // 2. Adjust for Activity Level (TDEE)
    const activityFactors = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725
    };
    let tdee = bmr * activityFactors[activityLevel];

    // 3. Adjust for Diet Goal
    let targetCalories = tdee;
    if (goal === 'lose_weight') targetCalories = tdee - 400;
    if (goal === 'build_muscle') targetCalories = tdee + 300;

    // 4. Adjust for Health Status (Colds / Indigestion lower appetite and burn rate)
    if (healthStatus === 'cold') {
      targetCalories *= 0.85; // Drop by 15%
    } else if (healthStatus === 'indigestion') {
      targetCalories *= 0.80; // Drop by 20%
    }
    targetCalories = Math.round(targetCalories);

    // 5. Calculate Protein targets (g per kg of bodyweight)
    let proteinMultiplier = 1.2; // default maintain
    if (goal === 'lose_weight') proteinMultiplier = 1.6;
    if (goal === 'build_muscle') proteinMultiplier = 2.0;
    const targetProtein = Math.round(weight * proteinMultiplier);

    // 6. Set micronutrient targets (especially adapting for older adults)
    const targetVitaminC = 100;
    const targetCalcium = age >= 50 ? 1000 : 800; // Older adults need more calcium
    const targetIron = gender === 'female' && age < 50 ? 18 : 10; // Older women need less iron after menopause
    const targetZinc = gender === 'female' ? 8 : 11;
    const targetVitaminD = age >= 70 ? 20 : 15; // mcg, seniors need more vitamin D
    const targetVitaminB12 = 2.4; // mcg, essential for nerve health in seniors
    const targetMagnesium = gender === 'male' ? 420 : 320; // mg
    const targetPotassium = 2500; // mg

    const commonFoods = commonFoodsInput
      .split(/[，,]/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    onSave({
      age,
      gender,
      height,
      weight,
      activityLevel,
      goal,
      healthStatus,
      commonFoods,
      targetCalories,
      targetProtein,
      targetVitaminC,
      targetCalcium,
      targetIron,
      targetZinc,
      targetVitaminD,
      targetVitaminB12,
      targetMagnesium,
      targetPotassium
    });
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
        <User size={18} style={{ color: 'var(--accent-blue)' }} />
        <h3 style={{ fontSize: '17px', fontWeight: 600 }}>个人画像与健康状况设置</h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>性别</label>
          <select
            className="input-field"
            value={gender}
            onChange={(e) => setGender(e.target.value as 'male' | 'female')}
          >
            <option value="male">男</option>
            <option value="female">女</option>
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>年龄 (岁)</label>
          <input
            type="number"
            className="input-field"
            value={age || ''}
            onChange={(e) => setAge(Number(e.target.value))}
            min={1}
            max={120}
            required
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>身高 (cm)</label>
          <input
            type="number"
            className="input-field"
            value={height || ''}
            onChange={(e) => setHeight(Number(e.target.value))}
            min={50}
            max={250}
            required
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>体重 (kg)</label>
          <input
            type="number"
            className="input-field"
            value={weight || ''}
            onChange={(e) => setWeight(Number(e.target.value))}
            min={10}
            max={300}
            required
          />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label style={{ fontSize: '14px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Activity size={14} /> 运动习惯
        </label>
        <select
          className="input-field"
          value={activityLevel}
          onChange={(e) => setActivityLevel(e.target.value as ActivityLevel)}
        >
          <option value="sedentary">久坐不动（几乎无运动）</option>
          <option value="light">轻度运动（每周 1-3 天慢跑/散步）</option>
          <option value="moderate">中度运动（每周 3-5 天中强度锻炼）</option>
          <option value="active">积极运动（每周 6-7 天高强度锻炼）</option>
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label style={{ fontSize: '14px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Flame size={14} /> 塑形目标
        </label>
        <select
          className="input-field"
          value={goal}
          onChange={(e) => setGoal(e.target.value as DietGoal)}
        >
          <option value="lose_weight">科学减脂（热量赤字）</option>
          <option value="maintain">维持体态（吃练平衡）</option>
          <option value="build_muscle">强壮增肌（热量盈余）</option>
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', backgroundColor: 'rgba(255, 71, 87, 0.03)', padding: '8px', borderRadius: '8px', border: '1px dashed rgba(255, 71, 87, 0.15)' }}>
        <label style={{ fontSize: '14px', color: 'var(--accent-orange)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
          <ShieldAlert size={14} /> 今日健康状况
        </label>
        <select
          className="input-field"
          value={healthStatus}
          onChange={(e) => setHealthStatus(e.target.value as HealthStatus)}
          style={{ borderColor: healthStatus !== 'healthy' ? 'var(--accent-orange)' : 'var(--border-color)' }}
        >
          <option value="healthy">🟢 身体健康 (精力和胃口充沛)</option>
          <option value="cold">🔴 感冒发烧 (胃口差、需清淡滋补)</option>
          <option value="indigestion">🟡 消化不良 (胃胀胃酸、忌油腻硬食)</option>
          <option value="fatigue">🔵 疲劳过度 (免疫力低下、需强化抗氧化)</option>
        </select>
        {healthStatus !== 'healthy' && (
          <span style={{ fontSize: '13px', color: 'var(--accent-orange)', marginTop: '4px' }}>
            * 开启此状态后，系统将自动下调卡路里要求，AI 食谱也会自动切换为特调清淡调理餐。
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label style={{ fontSize: '14px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Heart size={14} /> 个人常吃的心仪食物
        </label>
        <input
          type="text"
          className="input-field"
          placeholder="例如：鸡蛋，牛奶，鸡胸肉，燕麦，苹果 (用逗号分隔)"
          value={commonFoodsInput}
          onChange={(e) => setCommonFoodsInput(e.target.value)}
        />
        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          * 推荐系统会参考这些食物进行配菜，让食谱更贴合您的饮食习惯。
        </span>
      </div>

      <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '8px' }}>
        更新状态并重新计算目标
      </button>
    </form>
  );
};
