import React, { useState } from 'react';
import { UserProfile, MealLog, MealRecommendation, MealType, ApiConfig } from '../types';
import { recommendMeal, analyzeMeal } from '../services/ai';
import { Utensils, Check, Sparkles, Loader, Camera, Plus, RotateCcw, AlertTriangle } from 'lucide-react';

interface MealSectionProps {
  apiConfig: ApiConfig;
  profile: UserProfile;
  todayMeals: MealLog[];
  onLogMeal: (log: MealLog) => void;
  onDeleteMeal: (id: string) => void;
}

export const MealSection: React.FC<MealSectionProps> = ({
  apiConfig,
  profile,
  todayMeals,
  onLogMeal,
  onDeleteMeal
}) => {
  const [activeTab, setActiveTab] = useState<MealType>('breakfast');
  const [recs, setRecs] = useState<Record<MealType, MealRecommendation | null>>({
    breakfast: null,
    lunch: null,
    dinner: null
  });
  const [loadingRec, setLoadingRec] = useState(false);
  const [loadingAnalyze, setLoadingAnalyze] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [aiStatus, setAiStatus] = useState<string | null>(null);
  const [errInfo, setErrInfo] = useState<string | null>(null);

  const currentMealLog = todayMeals.find(m => m.mealType === activeTab);

  // Check if previous meals are completed to prompt sequence
  const isBreakfastLogged = todayMeals.some(m => m.mealType === 'breakfast');
  const isLunchLogged = todayMeals.some(m => m.mealType === 'lunch');

  const getRecommendation = async () => {
    setLoadingRec(true);
    setErrInfo(null);
    try {
      const result = await recommendMeal(apiConfig, activeTab, profile, todayMeals);
      setRecs(prev => ({ ...prev, [activeTab]: result.data }));
      setAiStatus(`推荐生成成功 (由 ${result.modelUsed} 提供)`);
    } catch (e: any) {
      setErrInfo(e.message || '获取推荐失败，请重试');
    } finally {
      setLoadingRec(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSimulatePhoto = () => {
    // Generate a beautiful mock base64 food image (a small transparent canvas representing food)
    // Here we'll use a placeholder food pixel base64 to simulate vision upload
    const mockImages: Record<MealType, string> = {
      breakfast: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', // blue dot
      lunch: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      dinner: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
    };
    setSelectedImage(mockImages[activeTab]);
    setTextInput(
      activeTab === 'breakfast' 
        ? '一盘全麦吐司煎蛋和一杯牛奶' 
        : activeTab === 'lunch'
        ? '香煎鳕鱼排配炒西蓝花与米饭'
        : '时蔬鱼片粥配清蒸豆腐'
    );
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim() && !selectedImage) {
      setErrInfo('请先输入餐品描述或选择/模拟拍摄美食照片！');
      return;
    }
    setLoadingAnalyze(true);
    setErrInfo(null);
    setAiStatus(`正在调用 ${apiConfig.provider === 'google' ? 'Google AI' : 'DeepSeek AI'} 膳食营养评估...`);
    try {
      const result = await analyzeMeal(
        apiConfig,
        { text: textInput, imageBase64: selectedImage || undefined },
        profile.healthStatus,
        profile.commonFoods
      );

      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      onLogMeal({
        id: Math.random().toString(36).substring(7),
        mealType: activeTab,
        time: timeStr,
        foodName: result.data.foodName,
        calories: result.data.calories,
        protein: result.data.protein,
        micronutrients: result.data.micronutrients,
        rawDetails: result.data.rawDetails,
        imageUrl: result.data.imageUrl
      });

      // Clear input fields
      setTextInput('');
      setSelectedImage(null);
      setAiStatus(`记录成功 (经 ${result.modelUsed} 智能估算)`);
    } catch (e: any) {
      setErrInfo(e.message || 'AI 膳食识别失败，请重试');
    } finally {
      setLoadingAnalyze(false);
    }
  };

  const adoptRecommendation = () => {
    const rec = recs[activeTab];
    if (!rec) return;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    onLogMeal({
      id: Math.random().toString(36).substring(7),
      mealType: activeTab,
      time: timeStr,
      foodName: rec.title,
      calories: rec.calories,
      protein: rec.protein,
      micronutrients: rec.micronutrients,
      rawDetails: `采纳AI推荐：${rec.dishes.map(d => `${d.name}(${d.portion})`).join(', ')}。${rec.rationale}`,
    });

    setAiStatus('已采纳AI健康食谱推荐并自动记录！');
  };

  return (
    <div className="glass-card fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '2px',
        gap: '12px'
      }}>
        {(['breakfast', 'lunch', 'dinner'] as MealType[]).map(type => {
          const isLogged = todayMeals.some(m => m.mealType === type);
          const label = type === 'breakfast' ? '🍳 早餐' : type === 'lunch' ? '🍛 午餐' : '🍲 晚餐';
          return (
            <button
              key={type}
              onClick={() => {
                setActiveTab(type);
                setErrInfo(null);
                setAiStatus(null);
              }}
              style={{
                flex: 1,
                padding: '8px 4px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === type ? '2px solid var(--accent-blue)' : '2px solid transparent',
                color: activeTab === type ? 'var(--accent-blue)' : 'var(--text-secondary)',
                fontWeight: activeTab === type ? '600' : '400',
                fontSize: '15px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}
            >
              {label}
              {isLogged && <Check size={12} style={{ color: 'var(--accent-green)' }} />}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div>
        {currentMealLog ? (
          /* LOGGED MEAL VIEW */
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              backgroundColor: 'rgba(0, 245, 160, 0.04)',
              border: '1px solid rgba(0, 245, 160, 0.15)',
              padding: '12px',
              borderRadius: '12px'
            }}>
              <div>
                <span style={{ fontSize: '13px', color: 'var(--accent-green)', fontWeight: 600 }}>
                  已于 {currentMealLog.time} 记录实际摄入：
                </span>
                <h4 style={{ fontSize: '18px', fontWeight: 600, marginTop: '4px' }}>
                  {currentMealLog.foodName}
                </h4>
              </div>
              <button
                onClick={() => onDeleteMeal(currentMealLog.id)}
                className="btn-secondary"
                style={{ padding: '6px 10px', fontSize: '13px', color: 'var(--accent-red)', borderColor: 'rgba(255, 71, 87, 0.2)' }}
              >
                <RotateCcw size={12} /> 撤销
              </button>
            </div>

            {/* Nutrient details of the logged meal */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 2fr',
              gap: '8px',
              backgroundColor: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border-color)',
              padding: '10px',
              borderRadius: '10px',
              fontSize: '14px'
            }}>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>热量</span>
                <p style={{ fontWeight: 600, fontSize: '16px', color: 'var(--accent-blue)' }}>{currentMealLog.calories} kcal</p>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>蛋白质</span>
                <p style={{ fontWeight: 600, fontSize: '16px', color: 'var(--accent-green)' }}>{currentMealLog.protein}g</p>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>微量元素估算</span>
                <p style={{ fontSize: '13px', color: 'var(--accent-orange)' }}>
                  Vc: {currentMealLog.micronutrients.vitaminC}mg | Ca: {currentMealLog.micronutrients.calcium}mg | Fe: {currentMealLog.micronutrients.iron}mg | Zn: {currentMealLog.micronutrients.zinc}mg
                </p>
              </div>
            </div>

            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', fontStyle: 'italic', backgroundColor: 'rgba(255,255,255,0.01)', padding: '8px', borderRadius: '8px', borderLeft: '3px solid var(--accent-purple)' }}>
              {currentMealLog.rawDetails}
            </p>
          </div>
        ) : (
          /* UNLOGGED MEAL VIEW */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Sequence Alert */}
            {activeTab === 'lunch' && !isBreakfastLogged && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(255, 159, 67, 0.05)', border: '1px solid rgba(255, 159, 67, 0.2)', padding: '10px', borderRadius: '10px', fontSize: '14px', color: 'var(--accent-orange)' }}>
                <AlertTriangle size={14} />
                <span>建议优先记录早餐，AI将根据早餐剩余的能量推荐更精准的午餐。</span>
              </div>
            )}
            {activeTab === 'dinner' && !isLunchLogged && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(255, 159, 67, 0.05)', border: '1px solid rgba(255, 159, 67, 0.2)', padding: '10px', borderRadius: '10px', fontSize: '14px', color: 'var(--accent-orange)' }}>
                <AlertTriangle size={14} />
                <span>建议优先记录午餐，以根据午餐后的剩余营养配额定制晚餐。</span>
              </div>
            )}

            {/* AI Recommendation Panel */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(79, 172, 254, 0.05) 0%, rgba(0, 242, 254, 0.05) 100%)',
              border: '1px solid rgba(0, 242, 254, 0.15)',
              borderRadius: '16px',
              padding: '14px',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-blue)' }}>
                  <Sparkles size={14} />
                  智能定制健康推荐
                </span>
                {!recs[activeTab] && (
                  <button
                    onClick={getRecommendation}
                    disabled={loadingRec}
                    className="btn-primary"
                    style={{ padding: '4px 10px', fontSize: '13px', borderRadius: '8px' }}
                  >
                    {loadingRec ? <Loader size={12} className="shimmer" /> : '生成推荐'}
                  </button>
                )}
              </div>

              {recs[activeTab] ? (
                <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#fff' }}>{recs[activeTab]?.title}</h4>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {recs[activeTab]?.dishes.map((dish, i) => (
                      <div key={i} style={{ fontSize: '14px', display: 'flex', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.02)', padding: '6px 8px', borderRadius: '6px' }}>
                        <span>
                          <strong>{dish.name}</strong> <span style={{ color: 'var(--text-muted)' }}>({dish.portion})</span>
                        </span>
                        <span style={{ fontSize: '13px', color: dish.isCommon ? 'var(--accent-green)' : 'var(--text-secondary)' }}>
                          {dish.description} {dish.isCommon && '✨常吃'}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '12px', fontSize: '13px', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
                    <span>🔥 {recs[activeTab]?.calories} kcal</span>
                    <span>🥩 蛋白质 {recs[activeTab]?.protein}g</span>
                    <span style={{ color: 'var(--accent-orange)' }}>
                      微矿充足 (Vc, Ca, Fe, Zn)
                    </span>
                  </div>

                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', backgroundColor: 'rgba(0,0,0,0.1)', padding: '8px', borderRadius: '6px', lineHeight: '1.4' }}>
                    {recs[activeTab]?.rationale}
                  </p>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <button onClick={adoptRecommendation} className="btn-primary" style={{ flex: 1, padding: '8px', fontSize: '14px' }}>
                      <Check size={14} /> 采纳此健康推荐
                    </button>
                    <button onClick={getRecommendation} disabled={loadingRec} className="btn-secondary" style={{ padding: '8px' }}>
                      {loadingRec ? <Loader size={14} /> : '重试'}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80px', fontSize: '14px', color: 'var(--text-secondary)', textAlign: 'center' }}>
                  {loadingRec ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                      <Loader size={20} className="shimmer" style={{ animation: 'spin 2s infinite linear' }} />
                      <span>正在分析营养缺口并根据避重原则生成食谱...</span>
                    </div>
                  ) : (
                    <span>基于您的健康状况及前几餐摄入，生成荤素搭配、不重复的营养推荐</span>
                  )}
                </div>
              )}
            </div>

            {/* Actual Intake Input Form */}
            <form onSubmit={handleAnalyze} style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px dashed var(--border-color)', paddingTop: '16px' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Utensils size={14} style={{ color: 'var(--accent-green)' }} />
                记录实际饮食 (文字或拍照)
              </span>

              <textarea
                className="input-field"
                placeholder="例如：我吃了两片全麦土司，一个水水煮蛋，喝了一杯脱脂牛奶"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                style={{ height: '70px', resize: 'none', width: '100%', fontSize: '15px' }}
              />

              {/* Image Input */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                    id={`file-upload-${activeTab}`}
                  />
                  <label
                    htmlFor={`file-upload-${activeTab}`}
                    className="btn-secondary"
                    style={{ width: '100%', display: 'flex', cursor: 'pointer', padding: '8px 12px', fontSize: '14px' }}
                  >
                    <Camera size={14} /> 选择美食照片
                  </label>
                </div>
                
                <button
                  type="button"
                  onClick={handleSimulatePhoto}
                  className="btn-secondary"
                  style={{ flex: 1, padding: '8px 12px', fontSize: '14px' }}
                >
                  <Sparkles size={14} style={{ color: 'var(--accent-blue)' }} /> 模拟拍照上传
                </button>
              </div>

              {selectedImage && (
                <div className="fade-in" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)'
                }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--accent-blue)', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#333' }}>
                    <img src={selectedImage} alt="food" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '13px', color: 'var(--accent-blue)', fontWeight: 600 }}>图片已加载</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', width: '200px' }}>
                      将调用 AI Vision 图像分析估算营养成分
                    </span>
                  </div>
                  <button onClick={() => setSelectedImage(null)} style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', fontSize: '13px' }}>清除</button>
                </div>
              )}

              {/* System Alerts */}
              {aiStatus && (
                <div style={{ fontSize: '13px', color: 'var(--accent-green)', backgroundColor: 'rgba(0, 245, 160, 0.05)', padding: '8px', borderRadius: '6px', borderLeft: '3px solid var(--accent-green)' }}>
                  {aiStatus}
                </div>
              )}
              {errInfo && (
                <div style={{ fontSize: '13px', color: 'var(--accent-red)', backgroundColor: 'rgba(255, 71, 87, 0.05)', padding: '8px', borderRadius: '6px', borderLeft: '3px solid var(--accent-red)' }}>
                  {errInfo}
                </div>
              )}

              <button
                type="submit"
                disabled={loadingAnalyze}
                className="btn-primary"
                style={{ width: '100%', padding: '10px', fontSize: '15px' }}
              >
                {loadingAnalyze ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Loader size={14} className="shimmer" /> AI 分析膳食中...
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Plus size={14} /> AI 智能识别并录入
                  </span>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
      
      {/* Keyframes spin animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
