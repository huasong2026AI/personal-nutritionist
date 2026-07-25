import { useState, useEffect } from 'react';
import { UserProfile, MealLog, ActivityLog, HealthStatus, ApiConfig, SupplementLog } from './types';
import { UserProfileForm } from './components/UserProfileForm';
import { NutrientBars } from './components/NutrientBars';
import { MealSection } from './components/MealSection';
import { ExerciseLogger } from './components/ExerciseLogger';
import { WeeklyDashboard } from './components/WeeklyDashboard';
import { SummaryAndSupplements } from './components/SummaryAndSupplements';
import { ApiKeyModal } from './components/ApiKeyModal';
import { MonthlyDashboard } from './components/MonthlyDashboard';
import { SupplementLogger } from './components/SupplementLogger';
import { ArchiveModal } from './components/ArchiveModal';
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
  const [todaySupplements, setTodaySupplements] = useState<SupplementLog[]>(() => {
    const saved = localStorage.getItem('nutritionist_today_supplements');
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

  const todayDateStr = formatLocalDate(new Date());
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedEditDate, setSelectedEditDate] = useState<string | null>(null);
  const [showArchiveModal, setShowArchiveModal] = useState(false);

  const isEditingToday = !selectedEditDate;

  // Derive active meals & activities based on the selected edit date
  const activeMeals = isEditingToday 
    ? todayMeals 
    : (history.find((h: any) => h.date === selectedEditDate)?.meals || (selectedEditDate === todayDateStr ? todayMeals : []));

  const activeActivities = isEditingToday 
    ? todayActivities 
    : (history.find((h: any) => h.date === selectedEditDate)?.activities || (selectedEditDate === todayDateStr ? todayActivities : []));

  const activeSupplements = isEditingToday
    ? todaySupplements
    : (history.find((h: any) => h.date === selectedEditDate)?.supplements || (selectedEditDate === todayDateStr ? todaySupplements : []));

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
    localStorage.setItem('nutritionist_today_supplements', JSON.stringify(todaySupplements));
  }, [todaySupplements]);

  useEffect(() => {
    localStorage.setItem('nutritionist_history', JSON.stringify(history));
  }, [history]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // 1. Startup check for date change (auto-archives previous day if user closed the app)
  useEffect(() => {
    const todayStr = formatLocalDate(new Date());
    const lastSavedDate = localStorage.getItem('nutritionist_last_saved_date');
    const lastArchivedDate = localStorage.getItem('nutritionist_last_archived_date');

    if (lastSavedDate && lastSavedDate !== todayStr) {
      if (lastArchivedDate !== lastSavedDate) {
        const savedMealsStr = localStorage.getItem('nutritionist_today_meals');
        const savedActivitiesStr = localStorage.getItem('nutritionist_today_activities');
        const savedSupplementsStr = localStorage.getItem('nutritionist_today_supplements');

        const savedMeals = savedMealsStr ? JSON.parse(savedMealsStr) : [];
        const savedActivities = savedActivitiesStr ? JSON.parse(savedActivitiesStr) : [];
        const savedSupplements = savedSupplementsStr ? JSON.parse(savedSupplementsStr) : [];

        if (savedMeals.length > 0 || savedActivities.length > 0 || savedSupplements.length > 0) {
          setHistory(prev => {
            const filtered = prev.filter(d => d.date !== lastSavedDate);
            const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
            let dayName = '';
            try {
              dayName = dayNames[new Date(lastSavedDate + 'T00:00:00').getDay()];
            } catch (e) {
              dayName = dayNames[new Date().getDay()];
            }

            const updated = [...filtered, {
              date: lastSavedDate,
              dayName: dayName,
              meals: savedMeals,
              activities: savedActivities,
              supplements: savedSupplements,
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
            return updated.slice(-60);
          });

          setTodayMeals([]);
          setTodayActivities([]);
          setTodaySupplements([]);

          localStorage.removeItem('nutritionist_today_meals');
          localStorage.removeItem('nutritionist_today_activities');
          localStorage.removeItem('nutritionist_today_supplements');

          localStorage.setItem('nutritionist_last_archived_date', lastSavedDate);
          setToastMessage(`已自动为您归档昨日 (${lastSavedDate}) 的健康打卡记录！`);
        }
      }
    }
    localStorage.setItem('nutritionist_last_saved_date', todayStr);
  }, []);

  // 2. Keep track of last saved date whenever logs are modified
  useEffect(() => {
    const todayStr = formatLocalDate(new Date());
    localStorage.setItem('nutritionist_last_saved_date', todayStr);
  }, [todayMeals, todayActivities, todaySupplements]);

  // 3. Periodic check for crossing 22:30 (auto-archives active day if app is open)
  useEffect(() => {
    const checkArchiveInterval = setInterval(() => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const todayStr = formatLocalDate(now);
      const lastArchivedDate = localStorage.getItem('nutritionist_last_archived_date');

      // Past 22:30 trigger (22:30 - 23:59)
      const isPastArchiveTime = (hours === 22 && minutes >= 30) || (hours === 23);

      if (isPastArchiveTime && lastArchivedDate !== todayStr) {
        if (todayMeals.length > 0 || todayActivities.length > 0 || todaySupplements.length > 0) {
          setHistory(prev => {
            const filtered = prev.filter(d => d.date !== todayStr);
            const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
            const dayName = dayNames[now.getDay()];

            const updated = [...filtered, {
              date: todayStr,
              dayName: dayName,
              meals: todayMeals,
              activities: todayActivities,
              supplements: todaySupplements,
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
            return updated.slice(-60);
          });

          setTodayMeals([]);
          setTodayActivities([]);
          setTodaySupplements([]);

          localStorage.removeItem('nutritionist_today_meals');
          localStorage.removeItem('nutritionist_today_activities');
          localStorage.removeItem('nutritionist_today_supplements');

          localStorage.setItem('nutritionist_last_archived_date', todayStr);
          setToastMessage(`🕛 22:30 自动归档完成！今日打卡已保存并进入下一天。`);
        }
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(checkArchiveInterval);
  }, [todayMeals, todayActivities, todaySupplements, profile]);

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

  // Add/Delete Meal (Supports both Today and History editing)
  const handleLogMeal = (log: MealLog) => {
    const hasArchive = history.some((h: any) => h.date === selectedEditDate);
    if (isEditingToday || (selectedEditDate === todayDateStr && !hasArchive)) {
      setTodayMeals(prev => {
        const filtered = prev.filter((m: MealLog) => m.mealType !== log.mealType);
        return [...filtered, log];
      });
    } else {
      setHistory(prev => prev.map(h => {
        if (h.date === selectedEditDate) {
          const filtered = (h.meals || []).filter((m: MealLog) => m.mealType !== log.mealType);
          return {
            ...h,
            meals: [...filtered, log]
          };
        }
        return h;
      }));
    }
  };

  const handleDeleteMeal = (id: string) => {
    const hasArchive = history.some((h: any) => h.date === selectedEditDate);
    if (isEditingToday || (selectedEditDate === todayDateStr && !hasArchive)) {
      setTodayMeals(prev => prev.filter((m: MealLog) => m.id !== id));
    } else {
      setHistory(prev => prev.map(h => {
        if (h.date === selectedEditDate) {
          return {
            ...h,
            meals: (h.meals || []).filter((m: MealLog) => m.id !== id)
          };
        }
        return h;
      }));
    }
  };

  // Add/Delete Exercise (Supports both Today and History editing)
  const handleAddActivity = (act: ActivityLog) => {
    const hasArchive = history.some((h: any) => h.date === selectedEditDate);
    if (isEditingToday || (selectedEditDate === todayDateStr && !hasArchive)) {
      setTodayActivities(prev => [...prev, act]);
    } else {
      setHistory(prev => prev.map(h => {
        if (h.date === selectedEditDate) {
          return {
            ...h,
            activities: [...(h.activities || []), act]
          };
        }
        return h;
      }));
    }
  };

  const handleDeleteActivity = (id: string) => {
    const hasArchive = history.some((h: any) => h.date === selectedEditDate);
    if (isEditingToday || (selectedEditDate === todayDateStr && !hasArchive)) {
      setTodayActivities(prev => prev.filter((a: ActivityLog) => a.id !== id));
    } else {
      setHistory(prev => prev.map(h => {
        if (h.date === selectedEditDate) {
          return {
            ...h,
            activities: (h.activities || []).filter((a: ActivityLog) => a.id !== id)
          };
        }
        return h;
      }));
    }
  };

  // Add/Delete Supplement (Supports both Today and History editing)
  const handleAddSupplement = (sup: SupplementLog) => {
    const hasArchive = history.some((h: any) => h.date === selectedEditDate);
    if (isEditingToday || (selectedEditDate === todayDateStr && !hasArchive)) {
      setTodaySupplements(prev => [...prev, sup]);
    } else {
      setHistory(prev => prev.map(h => {
        if (h.date === selectedEditDate) {
          return {
            ...h,
            supplements: [...(h.supplements || []), sup]
          };
        }
        return h;
      }));
    }
  };

  const handleDeleteSupplement = (id: string) => {
    const hasArchive = history.some((h: any) => h.date === selectedEditDate);
    if (isEditingToday || (selectedEditDate === todayDateStr && !hasArchive)) {
      setTodaySupplements(prev => prev.filter((s: SupplementLog) => s.id !== id));
    } else {
      setHistory(prev => prev.map(h => {
        if (h.date === selectedEditDate) {
          return {
            ...h,
            supplements: (h.supplements || []).filter((s: SupplementLog) => s.id !== id)
          };
        }
        return h;
      }));
    }
  };

  // Export local state to JSON backup file
  const handleExportBackup = () => {
    try {
      const backupData = {
        profile,
        todayMeals,
        todayActivities,
        todaySupplements,
        history,
        apiConfig
      };
      
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', url);
      downloadAnchor.setAttribute('download', `nutritionist_backup_${formatLocalDate(new Date())}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(`数据备份导出失败: ${e.message}`);
    }
  };

  // Import JSON backup file with maximum backward compatibility and auto-backfill
  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const file = event.target.files?.[0];
    if (!file) return;

    fileReader.onload = (e) => {
      try {
        const rawText = e.target?.result as string;
        if (!rawText.trim()) {
          throw new Error("文件内容为空");
        }
        
        const parsedData = JSON.parse(rawText);
        
        // 1. Process and merge profile (with DEFAULT fallback)
        const importedProfile = parsedData.profile || {};
        const mergedProfile = { ...DEFAULT_PROFILE, ...importedProfile };
        setProfile(mergedProfile);
        localStorage.setItem('nutritionist_profile', JSON.stringify(mergedProfile));

        // 2. Process today's meals
        const importedMeals = parsedData.todayMeals || parsedData.meals || [];
        setTodayMeals(importedMeals);
        localStorage.setItem('nutritionist_today_meals', JSON.stringify(importedMeals));

        // 3. Process today's activities
        const importedActivities = parsedData.todayActivities || parsedData.activities || [];
        setTodayActivities(importedActivities);
        localStorage.setItem('nutritionist_today_activities', JSON.stringify(importedActivities));

        // 3.5. Process today's supplements
        const importedSupplements = parsedData.todaySupplements || parsedData.supplements || [];
        setTodaySupplements(importedSupplements);
        localStorage.setItem('nutritionist_today_supplements', JSON.stringify(importedSupplements));

        // 4. Process and migrate history (supports legacy weekly_history keys)
        let importedHistory = parsedData.history || 
                              parsedData.weeklyHistory || 
                              parsedData.weekly_history || 
                              parsedData.weeklyRecords || 
                              null;
                              
        if (!importedHistory) {
          // If no history found, initialize with default blank days
          importedHistory = getInitialWeeklyRecords(mergedProfile, false, 29);
        }
        setHistory(importedHistory);
        localStorage.setItem('nutritionist_history', JSON.stringify(importedHistory));

        // 5. Process API configs
        if (parsedData.apiConfig) {
          setApiConfig(parsedData.apiConfig);
          localStorage.setItem('nutritionist_api_provider', parsedData.apiConfig.provider || 'google');
          localStorage.setItem('nutritionist_google_key', parsedData.apiConfig.googleKey || '');
          localStorage.setItem('nutritionist_deepseek_key', parsedData.apiConfig.deepseekKey || '');
        } else {
          const provider = parsedData.provider || parsedData.apiProvider || 'google';
          const googleKey = parsedData.googleKey || '';
          const deepseekKey = parsedData.deepseekKey || '';
          const newApiConfig = { provider, googleKey, deepseekKey };
          setApiConfig(newApiConfig);
          localStorage.setItem('nutritionist_api_provider', provider);
          localStorage.setItem('nutritionist_google_key', googleKey);
          localStorage.setItem('nutritionist_deepseek_key', deepseekKey);
        }

        alert("🎉 营养健康档案数据恢复成功！");
        window.location.reload();
      } catch (err: any) {
        alert(`导入数据失败: ${err.message || "文件解析错误，请确保选择正确的备份 JSON 文件"}`);
      }
    };
    fileReader.readAsText(file);
  };

  // Compile history records including today
  const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const todayDayName = dayNames[new Date().getDay()];

  const todaySummaryRecord = {
    date: todayDateStr,
    dayName: `${todayDayName}(今天)`,
    meals: todayMeals,
    activities: todayActivities,
    supplements: todaySupplements,
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
  // If the user has already archived today, the history array contains todayDateStr.
  // We only append todaySummaryRecord if today is not already archived OR the user has logged new active meals/activities/supplements.
  // Otherwise, the empty todaySummaryRecord will overwrite the archived record in the deduplication step.
  const todayHasArchive = history.some((h: any) => h.date === todayDateStr);
  const includeToday = !todayHasArchive || todayMeals.length > 0 || todayActivities.length > 0 || todaySupplements.length > 0;

  const fullHistoryRecordsRaw = includeToday ? [...history, todaySummaryRecord] : history;
  
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

  // Confirm and save archive to a specific date (allows backfilling)
  const handleConfirmArchive = (selectedDate: string) => {
    setHistory(prev => {
      // Filter out any existing record with the selected date to avoid duplicates in local storage database
      const filtered = prev.filter(d => d.date !== selectedDate);
      const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      let dayName = '';
      try {
        dayName = dayNames[new Date(selectedDate + 'T00:00:00').getDay()];
      } catch (e) {
        dayName = dayNames[new Date().getDay()];
      }

      const updated = [...filtered, {
        date: selectedDate,
        dayName: dayName,
        meals: todayMeals,
        activities: todayActivities,
        supplements: todaySupplements,
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

    // Clear active logs
    setTodayMeals([]);
    setTodayActivities([]);
    setTodaySupplements([]);

    // Clear local storage
    localStorage.removeItem('nutritionist_today_meals');
    localStorage.removeItem('nutritionist_today_activities');
    localStorage.removeItem('nutritionist_today_supplements');

    // Mark as archived under this date
    localStorage.setItem('nutritionist_last_archived_date', selectedDate);
    setToastMessage(`🎉 成功归档数据到 ${selectedDate}！`);
    setShowArchiveModal(false);
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
      {toastMessage && (
        <div className="fade-in" style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid var(--accent-orange)',
          boxShadow: '0 4px 20px rgba(255, 159, 67, 0.25)',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: '12px',
          zIndex: 9999,
          fontSize: '14.5px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          width: '90%',
          maxWidth: '350px',
          textAlign: 'center',
          justifyContent: 'center',
          boxSizing: 'border-box'
        }}>
          ✨ {toastMessage}
        </div>
      )}
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
            {/* HISTORICAL EDIT MODE WARNING BANNER */}
            {!isEditingToday && (
              <div style={{
                backgroundColor: 'rgba(255, 159, 67, 0.15)',
                border: '1px solid var(--accent-orange)',
                color: 'var(--accent-orange)',
                padding: '10px 14px',
                borderRadius: '12px',
                fontSize: '15px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontWeight: 600,
                marginTop: '4px',
                boxShadow: '0 0 10px rgba(255, 159, 67, 0.1)'
              }}>
                <span>📅 正在修改历史记录: {selectedEditDate}</span>
                <button
                  onClick={() => setSelectedEditDate(null)}
                  className="btn-primary"
                  style={{
                    backgroundColor: 'var(--accent-orange)',
                    borderColor: 'var(--accent-orange)',
                    color: '#000',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    boxShadow: 'none'
                  }}
                >
                  返回今天
                </button>
              </div>
            )}

            {/* NUTRIENT PROGRESS BARS */}
            <NutrientBars
              profile={profile}
              todayMeals={activeMeals}
              todayActivities={activeActivities}
              todaySupplements={activeSupplements}
              weeklyRecords={fullWeeklyRecords}
            />

            {/* MEALS SECTION */}
            <MealSection
              apiConfig={apiConfig}
              profile={profile}
              todayMeals={activeMeals}
              onLogMeal={handleLogMeal}
              onDeleteMeal={handleDeleteMeal}
            />

            {/* SPORT LOG */}
            <ExerciseLogger
              activities={activeActivities}
              onAddActivity={handleAddActivity}
              onDeleteActivity={handleDeleteActivity}
            />

            {/* SUPPLEMENTS LOG */}
            <SupplementLogger
              supplements={activeSupplements}
              onAddSupplement={handleAddSupplement}
              onDeleteSupplement={handleDeleteSupplement}
            />

            {/* DIET ADVICE AND SUPPLEMENT RECOMMENDER */}
            <SummaryAndSupplements
              apiConfig={apiConfig}
              profile={profile}
              todayMeals={activeMeals}
              todayActivities={activeActivities}
              todaySupplements={activeSupplements}
            />

            {/* FOOTER ACTIONS */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
              {isEditingToday ? (
                <button onClick={() => setShowArchiveModal(true)} className="btn-secondary" style={{ flex: 1, padding: '10px', fontSize: '14px' }}>
                  归档记录并开始明天 <ArrowRight size={12} />
                </button>
              ) : (
                <button onClick={() => setSelectedEditDate(null)} className="btn-primary" style={{ flex: 1, padding: '10px', fontSize: '14px', backgroundColor: 'var(--accent-orange)', borderColor: 'var(--accent-orange)', color: '#000', fontWeight: 'bold' }}>
                  保存并返回今天 ↩️
                </button>
              )}
            </div>
          </>
        ) : activeSubTab === 'weekly' ? (
          /* WEEKLY VIEW CONTENT */
          <>
            {/* WEEKLY CALENDAR & CUMULATIVE GAPS */}
            <WeeklyDashboard 
              apiConfig={apiConfig} 
              weeklyRecords={fullWeeklyRecords} 
              onSelectDay={(date) => {
                setSelectedEditDate(date);
                setActiveSubTab('daily');
              }}
            />

            {/* WEEKLY BARS (Reuses NutrientBars component but preset to weekly mode) */}
            <NutrientBars
              profile={profile}
              todayMeals={activeMeals}
              todayActivities={activeActivities}
              todaySupplements={activeSupplements}
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
            <MonthlyDashboard 
              apiConfig={apiConfig} 
              monthlyRecords={fullMonthlyRecords} 
              onSelectDay={(date) => {
                setSelectedEditDate(date);
                setActiveSubTab('daily');
              }}
            />

            {/* MONTHLY BARS (Reuses NutrientBars component but preset to monthly mode) */}
            <NutrientBars
              profile={profile}
              todayMeals={activeMeals}
              todayActivities={activeActivities}
              todaySupplements={activeSupplements}
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
                accept=".json,application/json,text/plain,.txt"
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

      {/* ARCHIVE MODAL (WITH DATE PICKER) */}
      <ArchiveModal
        isOpen={showArchiveModal}
        onClose={() => setShowArchiveModal(false)}
        onConfirm={handleConfirmArchive}
        todayMeals={todayMeals}
        todayActivities={todayActivities}
        todaySupplements={todaySupplements}
        todayDateStr={todayDateStr}
      />
    </div>
  );
}
