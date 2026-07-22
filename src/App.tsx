import { useState, useEffect } from 'react';
import { UserProfile, MealLog, ActivityLog, HealthStatus, ApiConfig } from './types';
import { UserProfileForm } from './components/UserProfileForm';
import { NutrientBars } from './components/NutrientBars';
import { MealSection } from './components/MealSection';
import { ExerciseLogger } from './components/ExerciseLogger';
import { WeeklyDashboard } from './components/WeeklyDashboard';
import { SummaryAndSupplements } from './components/SummaryAndSupplements';
import { ApiKeyModal } from './components/ApiKeyModal';
import { MonthlyDashboard } from './components/MonthlyDashboard';
import { Sparkles, Dumbbell, Calendar, Info, ArrowRight } from 'lucide-react';

// Seeding standard profile
const DEFAULT_PROFILE: UserProfile = {
  age: 48, // Default age matches user's screenshot
  gender: 'male',
  height: 175,
  weight: 70,
  activityLevel: 'moderate',
  goal: 'lose_weight',
  healthStatus: 'healthy',
  commonFoods: ['鸡蛋', '牛奶', '燕麦', '鸡肉', '苹果', '豆腐'],
  targetCalories: 1950,
  targetProtein: 112,
  targetVitaminC: 100,
  targetCalcium: 800,
  targetIron: 12,
  targetZinc: 12,
  targetVitaminD: 15,    // mcg
  targetVitaminB12: 2.4, // mcg
  targetMagnesium: 420,  // mg
  targetPotassium: 2500  // mg
};

// Helper to format Date to YYYY-MM-DD in local timezone (avoiding UTC timezone shifting bugs)
const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Seeding past week/month history - can be initialized empty (all 0s) or filled with demo data
const getInitialWeeklyRecords = (profile: UserProfile, fillWithDemoData = false, daysCount = 6) => {
  const dates = [];
  const today = new Date();
  const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  for (let i = daysCount; i > 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = formatLocalDate(d);
    const dayName = dayNames[d.getDay()];

    if (!fillWithDemoData) {
      // Return empty record so weekly progress bars start at 0%
      dates.push({
        date: dateStr,
        dayName,
        healthStatus: 'healthy' as HealthStatus,
        meals: [],
        activities: [],
        targetCalories: profile.targetCalories,
        targetProtein: profile.targetProtein,
        targetVitC: profile.targetVitaminC,
        targetCalcium: profile.targetCalcium,
        targetIron: profile.targetIron,
        targetZinc: profile.targetZinc,
        targetVitaminD: profile.targetVitaminD,
        targetVitaminB12: profile.targetVitaminB12,
        targetMagnesium: profile.targetMagnesium,
        targetPotassium: profile.targetPotassium
      });
      continue;
    }

    // Demo data for showing week/month dashboard features
    let health: HealthStatus = 'healthy';
    let targetCalAdjusted = profile.targetCalories;
    let eatenCal = 1800;
    let eatenProt = 100;
    let vC = 80;
    let ca = 750;
    
    // Distribute multiple sickness episodes if daysCount is larger (e.g. 29 days)
    if (i % 10 === 3) {
      health = 'cold';
      targetCalAdjusted = Math.round(profile.targetCalories * 0.85); // Reduced calorie target
      eatenCal = 1050; // Ate very little because of cold
      eatenProt = 42;
      vC = 45;
      ca = 400;
    } else if (i % 10 === 2) {
      // Recovery day / fatigue
      health = 'fatigue';
      eatenCal = 1680;
      eatenProt = 85;
      vC = 70;
      ca = 550;
    } else if (i % 12 === 6) {
      // Indigestion episode
      health = 'indigestion';
      eatenCal = 1250;
      eatenProt = 55;
      vC = 40;
      ca = 480;
    } else {
      // Normal healthy days
      eatenCal = profile.targetCalories - 100 + Math.round((Math.random() - 0.5) * 200);
      eatenProt = profile.targetProtein - 10 + Math.round((Math.random() - 0.5) * 15);
      vC = profile.targetVitaminC - 15 + Math.round(Math.random() * 30);
      ca = profile.targetCalcium - 100 + Math.round(Math.random() * 200);
    }

    dates.push({
      date: dateStr,
      dayName,
      healthStatus: health,
      meals: [
        {
          id: `seed-b-${i}`,
          mealType: 'breakfast',
          time: '08:30',
          foodName: health === 'cold' ? '小米山药粥' : '馒头、牛奶与水煮蛋',
          calories: Math.round(eatenCal * 0.25),
          protein: Math.round(eatenProt * 0.25),
          micronutrients: { 
            vitaminC: Math.round(vC * 0.2), 
            calcium: Math.round(ca * 0.3), 
            iron: 2, 
            zinc: 1.5,
            vitaminD: 2.0,
            vitaminB12: 0.5,
            magnesium: 40,
            potassium: 350
          },
          rawDetails: health === 'cold' ? '感冒清淡中式早餐' : '常见中式早餐'
        },
        {
          id: `seed-l-${i}`,
          mealType: 'lunch',
          time: '12:30',
          foodName: health === 'cold' ? '清蒸豆腐配烂面条' : '番茄炒蛋配米饭与鸡胸肉',
          calories: Math.round(eatenCal * 0.45),
          protein: Math.round(eatenProt * 0.45),
          micronutrients: { 
            vitaminC: Math.round(vC * 0.5), 
            calcium: Math.round(ca * 0.4), 
            iron: 4, 
            zinc: 3,
            vitaminD: 0,
            vitaminB12: 0.4,
            magnesium: 90,
            potassium: 550
          },
          rawDetails: health === 'cold' ? '易消化中式午餐' : '中式荤素搭配主食午餐'
        },
        {
          id: `seed-d-${i}`,
          mealType: 'dinner',
          time: '18:45',
          foodName: health === 'cold' ? '清炖冬瓜瘦肉汤' : '清蒸鲈鱼配大米饭与炒时蔬',
          calories: Math.round(eatenCal * 0.3),
          protein: Math.round(eatenProt * 0.3),
          micronutrients: { 
            vitaminC: Math.round(vC * 0.3), 
            calcium: Math.round(ca * 0.3), 
            iron: 2, 
            zinc: 2,
            vitaminD: 4.0,
            vitaminB12: 1.2,
            magnesium: 70,
            potassium: 450
          },
          rawDetails: health === 'cold' ? '热汤暖胃晚餐' : '低碳轻盈荤素搭配主食晚餐'
        }
      ],
      activities: health === 'cold' ? [] : [{ id: `seed-a-${i}`, name: '步行/散步', duration: 40, caloriesBurned: 180 }],
      targetCalories: targetCalAdjusted,
      targetProtein: profile.targetProtein,
      targetVitC: profile.targetVitaminC,
      targetCalcium: profile.targetCalcium,
      targetIron: profile.targetIron,
      targetZinc: profile.targetZinc,
      targetVitaminD: profile.targetVitaminD,
      targetVitaminB12: profile.targetVitaminB12,
      targetMagnesium: profile.targetMagnesium,
      targetPotassium: profile.targetPotassium
    });
  }
  return dates;
};

export default function App() {
  const [apiConfig, setApiConfig] = useState<ApiConfig>(() => {
    const savedProvider = localStorage.getItem('nutritionist_api_provider') as 'google' | 'deepseek' || 'google';
    const savedGoogleKey = localStorage.getItem('nutritionist_google_key') || '';
    const savedDeepseekKey = localStorage.getItem('nutritionist_deepseek_key') || '';
    return {
      provider: savedProvider,
      googleKey: savedGoogleKey,
      deepseekKey: savedDeepseekKey
    };
  });
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('nutritionist_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_PROFILE, ...parsed };
      } catch (e) {
        console.error("Failed to parse user profile:", e);
      }
    }
    return DEFAULT_PROFILE;
  });
  const [todayMeals, setTodayMeals] = useState<MealLog[]>(() => {
    const saved = localStorage.getItem('nutritionist_today_meals');
    return saved ? JSON.parse(saved) : [];
  });
  const [todayActivities, setTodayActivities] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem('nutritionist_today_activities');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Consolidated history storage (weekly + monthly -> single repository)
  const [history, setHistory] = useState<any[]>(() => {
    const saved = localStorage.getItem('nutritionist_history');
    if (saved) return JSON.parse(saved);
    const oldWeekly = localStorage.getItem('nutritionist_weekly_history');
    if (oldWeekly) {
      const parsed = JSON.parse(oldWeekly);
      localStorage.setItem('nutritionist_history', oldWeekly);
      return parsed;
    }
    return getInitialWeeklyRecords(profile, false, 29); // Generate 29 blank days
  });

  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Persistence
  useEffect(() => {
    localStorage.setItem('nutritionist_profile', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('nutritionist_today_meals', JSON.stringify(todayMeals));
  }, [todayMeals]);

  useEffect(() => {
    localStorage.setItem('nutritionist_today_activities', JSON.stringify(todayActivities));
  }, [todayActivities]);

  useEffect(() => {
    localStorage.setItem('nutritionist_history', JSON.stringify(history));
  }, [history]);

  const handleSaveApiConfig = (config: ApiConfig) => {
    setApiConfig(config);
    localStorage.setItem('nutritionist_api_provider', config.provider);
    localStorage.setItem('nutritionist_google_key', config.googleKey);
    localStorage.setItem('nutritionist_deepseek_key', config.deepseekKey);
  };

  const handleUpdateProfile = (newProfile: UserProfile) => {
    setProfile(newProfile);
    setShowProfileEdit(false);
  };

  // Add/Delete Meal
  const handleLogMeal = (log: MealLog) => {
    setTodayMeals(prev => {
      const filtered = prev.filter(m => m.mealType !== log.mealType);
      return [...filtered, log];
    });
  };

  const handleDeleteMeal = (id: string) => {
    setTodayMeals(prev => prev.filter(m => m.id !== id));
  };

  // Add/Delete Exercise
  const handleAddActivity = (act: ActivityLog) => {
    setTodayActivities(prev => [...prev, act]);
  };

  const handleDeleteActivity = (id: string) => {
    setTodayActivities(prev => prev.filter(a => a.id !== id));
  };

  // Export local state to JSON backup file
  const handleExportBackup = () => {
    try {
      const backupData = {
        profile,
        todayMeals,
        todayActivities,
        history,
        apiConfig
      };
      
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(backupData, null, 2)
      )}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute('download', `nutritionist_backup_${formatLocalDate(new Date())}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e: any) {
      alert(`数据备份导出失败: ${e.message}`);
    }
  };

  // Import JSON backup file to overwrite local state
  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const file = event.target.files?.[0];
    if (!file) return;

    fileReader.onload = (e) => {
      try {
        const parsedData = JSON.parse(e.target?.result as string);
        
        if (!parsedData.profile || !parsedData.history) {
          throw new Error("备份文件格式错误，未包含画像信息或历史记录。");
        }

        if (parsedData.profile) setProfile(parsedData.profile);
        if (parsedData.todayMeals) setTodayMeals(parsedData.todayMeals);
        if (parsedData.todayActivities) setTodayActivities(parsedData.todayActivities);
        if (parsedData.history) setHistory(parsedData.history);
        if (parsedData.apiConfig) setApiConfig(parsedData.apiConfig);

        localStorage.setItem('nutritionist_profile', JSON.stringify(parsedData.profile));
        localStorage.setItem('nutritionist_today_meals', JSON.stringify(parsedData.todayMeals || []));
        localStorage.setItem('nutritionist_today_activities', JSON.stringify(parsedData.todayActivities || []));
        localStorage.setItem('nutritionist_history', JSON.stringify(parsedData.history));
        
        if (parsedData.apiConfig) {
          localStorage.setItem('nutritionist_api_provider', parsedData.apiConfig.provider);
          localStorage.setItem('nutritionist_google_key', parsedData.apiConfig.googleKey);
          localStorage.setItem('nutritionist_deepseek_key', parsedData.apiConfig.deepseekKey);
        }

        alert("🎉 营养健康档案数据恢复成功！");
        window.location.reload();
      } catch (err: any) {
        alert(`导入数据失败: ${err.message || err}`);
      }
    };
    fileReader.readAsText(file);
  };

  // Compile history records including today
  const todayDateStr = formatLocalDate(new Date());
  const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const todayDayName = dayNames[new Date().getDay()];

  const todaySummaryRecord = {
    date: todayDateStr,
    dayName: `${todayDayName}(今天)`,
    meals: todayMeals,
    activities: todayActivities,
    targetCalories: profile.targetCalories,
    targetProtein: profile.targetProtein,
    targetVitC: profile.targetVitaminC,
    targetCalcium: profile.targetCalcium,
    targetIron: profile.targetIron,
    targetZinc: profile.targetZinc,
    targetVitaminD: profile.targetVitaminD,
    targetVitaminB12: profile.targetVitaminB12,
    targetMagnesium: profile.targetMagnesium,
    targetPotassium: profile.targetPotassium,
    healthStatus: profile.healthStatus
  };

  // Compile slices for weekly (7 days) and monthly (30 days)
  const fullHistoryRecordsRaw = [...history, todaySummaryRecord];
  
  // Deduplicate by date (keep the latest/newest record for each date to avoid UI duplicates)
  const fullHistoryRecords = fullHistoryRecordsRaw.reduce((acc: any[], current) => {
    const existingIndex = acc.findIndex(item => item.date === current.date);
    if (existingIndex >= 0) {
      acc[existingIndex] = current;
    } else {
      acc.push(current);
    }
    return acc;
  }, []);

  const fullWeeklyRecords = fullHistoryRecords.slice(-7);
  const fullMonthlyRecords = fullHistoryRecords.slice(-30);

  // Clear current day data (Simulate Next Day)
  const handleNextDay = () => {
    if (window.confirm("确定要进入下一天吗？这会将今天的打卡记录归档到历史数据，并清空本日日志。")) {
      setHistory(prev => {
        // Filter out any existing record with today's date to avoid duplicates in local storage database
        const filtered = prev.filter(d => d.date !== todayDateStr);
        const updated = [...filtered, {
          date: todayDateStr,
          dayName: todayDayName,
          meals: todayMeals,
          activities: todayActivities,
          targetCalories: profile.targetCalories,
          targetProtein: profile.targetProtein,
          targetVitC: profile.targetVitaminC,
          targetCalcium: profile.targetCalcium,
          targetIron: profile.targetIron,
          targetZinc: profile.targetZinc,
          targetVitaminD: profile.targetVitaminD,
          targetVitaminB12: profile.targetVitaminB12,
          targetMagnesium: profile.targetMagnesium,
          targetPotassium: profile.targetPotassium,
          healthStatus: profile.healthStatus
        }];
        return updated.slice(-60); // Keep last 60 days
      });
      setTodayMeals([]);
      setTodayActivities([]);
    }
  };

  const handleLoadDemoData = () => {
    const demo = getInitialWeeklyRecords(profile, true, 29); // Generate 29 days of mock data
    setHistory(demo);
    alert("成功导入本周及本月 (共29天) 的模拟历史打卡数据！您可以切换到【周度趋势】和【月度趋势】来体验所有的趋势明细与 AI 分析评估服务。");
  };

  const handleClearWeeklyHistory = () => {
    if (window.confirm("确定要清空所有的历史归档数据吗？清空后趋势统计将归零。")) {
      const clean = getInitialWeeklyRecords(profile, false, 29);
      setHistory(clean);
      localStorage.setItem('nutritionist_history', JSON.stringify(clean));
      alert("历史归档数据已成功归零！");
    }
  };

  return (
    <div className="app-container">
      {/* HEADER NAVBAR */}
      <header style={{
        padding: '18px 20px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(15, 23, 42, 0.4)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--accent-blue) 0%, var(--accent-purple) 100%)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            boxShadow: '0 0 10px rgba(0, 242, 254, 0.3)'
          }}>
            <Sparkles size={16} style={{ color: '#000' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '17px', fontWeight: 700, letterSpacing: '0.5px' }}>私人营养师</h1>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>AI NUTRITIONIST</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Key status indicator & Direct button */}
          <button
            onClick={() => setShowApiModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: (apiConfig.provider === 'google' ? apiConfig.googleKey : apiConfig.deepseekKey) ? 'rgba(0, 245, 160, 0.12)' : 'rgba(255, 159, 67, 0.15)',
              border: `1px solid ${(apiConfig.provider === 'google' ? apiConfig.googleKey : apiConfig.deepseekKey) ? 'rgba(0, 245, 160, 0.3)' : 'rgba(255, 159, 67, 0.3)'}`,
              padding: '6px 10px',
              borderRadius: '20px',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: 600,
              color: (apiConfig.provider === 'google' ? apiConfig.googleKey : apiConfig.deepseekKey) ? 'var(--accent-green)' : 'var(--accent-orange)'
            }}
          >
            <span style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: (apiConfig.provider === 'google' ? apiConfig.googleKey : apiConfig.deepseekKey) ? 'var(--accent-green)' : 'var(--accent-orange)',
              boxShadow: (apiConfig.provider === 'google' ? apiConfig.googleKey : apiConfig.deepseekKey) ? '0 0 6px var(--accent-green)' : '0 0 6px var(--accent-orange)'
            }} />
            {(apiConfig.provider === 'google' ? apiConfig.googleKey : apiConfig.deepseekKey) 
              ? `⚙️ ${apiConfig.provider === 'google' ? 'Google' : 'DeepSeek'} AI 已连接` 
              : '⚙️ 点击配置 AI 密钥'}
          </button>
        </div>
      </header>

      {/* MAIN CONTENT WRAPPER */}
      <main style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {/* PROFILE CHIP SUMMARY / FORM TOGGLE */}
        {showProfileEdit ? (
          <div className="fade-in">
            <UserProfileForm profile={profile} onSave={handleUpdateProfile} />
            <button
              onClick={() => setShowProfileEdit(false)}
              className="btn-secondary"
              style={{ width: '100%', marginTop: '8px', padding: '6px' }}
            >
              取消修改
            </button>
          </div>
        ) : (
          <div className="glass-card" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            background: 'rgba(30, 41, 59, 0.3)',
            borderColor: profile.healthStatus !== 'healthy' ? 'rgba(255, 159, 67, 0.3)' : 'var(--border-color)'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '15px', fontWeight: 600 }}>
                  👤 {profile.gender === 'male' ? '男' : '女'} · {profile.age}岁 · {profile.weight}kg
                </span>
                <span style={{
                  fontSize: '11px',
                  backgroundColor: 'rgba(0, 242, 254, 0.1)',
                  color: 'var(--accent-blue)',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  fontWeight: 600
                }}>
                  {profile.goal === 'lose_weight' ? '减脂中' : profile.goal === 'build_muscle' ? '增肌中' : '健康维护'}
                </span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <span>今日状态: {
                  profile.healthStatus === 'healthy' ? '🟢健康' :
                  profile.healthStatus === 'cold' ? '🔴感冒生病😷' :
                  profile.healthStatus === 'indigestion' ? '🟡消化不良🤢' : '🔵疲劳过度'
                }</span>
                {profile.commonFoods.length > 0 && (
                  <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                    🍔 喜好: {profile.commonFoods.slice(0, 3).join('/')}
                  </span>
                )}
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '6px', flexDirection: 'column' }}>
              <button
                onClick={() => setShowApiModal(true)}
                className="btn-primary"
                style={{ padding: '5px 10px', fontSize: '12px', borderRadius: '8px' }}
              >
                ⚙️ AI模型配置
              </button>
              <button
                onClick={() => setShowProfileEdit(true)}
                className="btn-secondary"
                style={{ padding: '5px 10px', fontSize: '12px', borderRadius: '8px' }}
              >
                修改画像
              </button>
            </div>
          </div>
        )}

        {/* TAB CONTROLS (DAILY LOG VS WEEKLY STATUS VS MONTHLY STATUS) */}
        <div style={{
          display: 'flex',
          backgroundColor: 'rgba(255,255,255,0.02)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '4px'
        }}>
          <button
            onClick={() => setActiveSubTab('daily')}
            style={{
              flex: 1,
              padding: '8px',
              border: 'none',
              borderRadius: '8px',
              backgroundColor: activeSubTab === 'daily' ? 'rgba(0, 242, 254, 0.1)' : 'transparent',
              color: activeSubTab === 'daily' ? 'var(--accent-blue)' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Dumbbell size={14} /> 今日打卡
          </button>
          <button
            onClick={() => setActiveSubTab('weekly')}
            style={{
              flex: 1,
              padding: '8px',
              border: 'none',
              borderRadius: '8px',
              backgroundColor: activeSubTab === 'weekly' ? 'rgba(0, 242, 254, 0.1)' : 'transparent',
              color: activeSubTab === 'weekly' ? 'var(--accent-blue)' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Calendar size={14} /> 周度趋势
          </button>
          <button
            onClick={() => setActiveSubTab('monthly')}
            style={{
              flex: 1,
              padding: '8px',
              border: 'none',
              borderRadius: '8px',
              backgroundColor: activeSubTab === 'monthly' ? 'rgba(0, 242, 254, 0.1)' : 'transparent',
              color: activeSubTab === 'monthly' ? 'var(--accent-blue)' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <Calendar size={14} /> 月度趋势
          </button>
        </div>

        {activeSubTab === 'daily' ? (
          /* DAILY VIEW CONTENT */
          <>
            {/* NUTRIENT PROGRESS BARS */}
            <NutrientBars
              profile={profile}
              todayMeals={todayMeals}
              todayActivities={todayActivities}
              weeklyRecords={fullWeeklyRecords}
            />

            {/* MEALS SECTION */}
            <MealSection
              apiConfig={apiConfig}
              profile={profile}
              todayMeals={todayMeals}
              onLogMeal={handleLogMeal}
              onDeleteMeal={handleDeleteMeal}
            />

            {/* SPORT LOG */}
            <ExerciseLogger
              activities={todayActivities}
              onAddActivity={handleAddActivity}
              onDeleteActivity={handleDeleteActivity}
            />

            {/* DIET ADVICE AND SUPPLEMENT RECOMMENDER */}
            <SummaryAndSupplements
              apiConfig={apiConfig}
              profile={profile}
              todayMeals={todayMeals}
              todayActivities={todayActivities}
            />

            {/* FOOTER ACTIONS */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              <button onClick={handleNextDay} className="btn-secondary" style={{ flex: 1, padding: '10px', fontSize: '14px' }}>
                归档记录并开始明天 <ArrowRight size={12} />
              </button>
            </div>
          </>
        ) : activeSubTab === 'weekly' ? (
          /* WEEKLY VIEW CONTENT */
          <>
            {/* WEEKLY CALENDAR & CUMULATIVE GAPS */}
            <WeeklyDashboard apiConfig={apiConfig} weeklyRecords={fullWeeklyRecords} />

            {/* WEEKLY BARS (Reuses NutrientBars component but preset to weekly mode) */}
            <NutrientBars
              profile={profile}
              todayMeals={todayMeals}
              todayActivities={todayActivities}
              weeklyRecords={fullWeeklyRecords}
            />

            <button
              onClick={handleLoadDemoData}
              className="btn-secondary"
              style={{ width: '100%', padding: '10px', fontSize: '14px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(0, 242, 254, 0.05)', borderColor: 'rgba(0, 242, 254, 0.2)', color: 'var(--accent-blue)' }}
            >
              ✨ 导入本周模拟演示数据 (含感冒日打卡)
            </button>

            <button
              onClick={handleClearWeeklyHistory}
              className="btn-secondary"
              style={{ width: '100%', padding: '10px', fontSize: '14px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginTop: '8px', color: 'var(--accent-red)', borderColor: 'rgba(255, 71, 87, 0.2)' }}
            >
              🗑️ 清空历史归档数据
            </button>

            <div style={{
              backgroundColor: 'rgba(255,255,255,0.01)',
              border: '1px solid var(--border-color)',
              padding: '12px',
              borderRadius: '12px',
              fontSize: '13px',
              color: 'var(--text-secondary)',
              lineHeight: '1.4',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '6px',
              marginTop: '10px'
            }}>
              <Info size={14} style={{ color: 'var(--accent-blue)', flexShrink: 0, marginTop: '2px' }} />
              <span>
                <strong>说明：</strong>周度统计数据包含了今天已打卡的记录以及前6天归档的饮食历史。点击上方按钮可一键填充模拟数据以查看演示效果。
              </span>
            </div>
          </>
        ) : (
          /* MONTHLY VIEW CONTENT */
          <>
            {/* MONTHLY CALENDAR & CUMULATIVE GAPS */}
            <MonthlyDashboard apiConfig={apiConfig} monthlyRecords={fullMonthlyRecords} />

            {/* MONTHLY BARS (Reuses NutrientBars component but preset to monthly mode) */}
            <NutrientBars
              profile={profile}
              todayMeals={todayMeals}
              todayActivities={todayActivities}
              weeklyRecords={fullMonthlyRecords}
            />

            <button
              onClick={handleLoadDemoData}
              className="btn-secondary"
              style={{ width: '100%', padding: '10px', fontSize: '14px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(0, 242, 254, 0.05)', borderColor: 'rgba(0, 242, 254, 0.2)', color: 'var(--accent-blue)' }}
            >
              ✨ 导入月度模拟演示数据 (包含生病与运动)
            </button>

            <button
              onClick={handleClearWeeklyHistory}
              className="btn-secondary"
              style={{ width: '100%', padding: '10px', fontSize: '14px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginTop: '8px', color: 'var(--accent-red)', borderColor: 'rgba(255, 71, 87, 0.2)' }}
            >
              🗑️ 清空历史归档数据
            </button>

            <div style={{
              backgroundColor: 'rgba(255,255,255,0.01)',
              border: '1px solid var(--border-color)',
              padding: '12px',
              borderRadius: '12px',
              fontSize: '13px',
              color: 'var(--text-secondary)',
              lineHeight: '1.4',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '6px',
              marginTop: '10px'
            }}>
              <Info size={14} style={{ color: 'var(--accent-blue)', flexShrink: 0, marginTop: '2px' }} />
              <span>
                <strong>说明：</strong>月度统计数据包含了今天已打卡的记录以及前29天归档的饮食历史。点击上方按钮可一键填充模拟数据以查看演示效果。
              </span>
            </div>
          </>
        )}

        {/* DATA BACKUP & RESTORE SECTION */}
        <div className="glass-card" style={{
          marginTop: '10px',
          backgroundColor: 'rgba(30, 41, 59, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          padding: '14px'
        }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            💾 档案数据管理与迁移备份
          </span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleExportBackup}
              className="btn-secondary"
              style={{ flex: 1, padding: '8px', fontSize: '12px' }}
            >
              📤 导出数据备份 (JSON)
            </button>
            <label className="btn-secondary" style={{ flex: 1, padding: '8px', fontSize: '12px', cursor: 'pointer', textAlign: 'center' }}>
              📥 导入数据恢复 (JSON)
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>
      </main>

      {/* API KEY CONFIGURATION MODAL */}
      <ApiKeyModal
        isOpen={showApiModal}
        onClose={() => setShowApiModal(false)}
        apiConfig={apiConfig}
        onSave={handleSaveApiConfig}
      />
    </div>
  );
}
