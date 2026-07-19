import React, { useState } from 'react';
import { ActivityLog } from '../types';
import { Flame, Trash2, Plus, Dumbbell } from 'lucide-react';

interface ExerciseLoggerProps {
  activities: ActivityLog[];
  onAddActivity: (activity: ActivityLog) => void;
  onDeleteActivity: (id: string) => void;
}

export const ExerciseLogger: React.FC<ExerciseLoggerProps> = ({
  activities,
  onAddActivity,
  onDeleteActivity
}) => {
  const [sportType, setSportType] = useState('跑步');
  const [duration, setDuration] = useState(30);

  const sportCalorieRates: Record<string, number> = {
    '跑步': 10,       // 10 kcal/min
    '力量训练': 6,     // 6 kcal/min
    '步行/散步': 4.5,  // 4.5 kcal/min
    '骑行': 7,       // 7 kcal/min
    '游泳': 9,       // 9 kcal/min
    '瑜伽': 3        // 3 kcal/min
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (duration <= 0) return;

    const rate = sportCalorieRates[sportType] || 5;
    const caloriesBurned = Math.round(duration * rate);

    onAddActivity({
      id: Math.random().toString(36).substring(7),
      name: sportType,
      duration,
      caloriesBurned
    });

    setDuration(30);
  };

  const totalBurned = activities.reduce((sum, a) => sum + a.caloriesBurned, 0);

  return (
    <div className="glass-card fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
        <Dumbbell size={18} style={{ color: 'var(--accent-green)' }} />
        <h3 style={{ fontSize: '17px', fontWeight: 600 }}>今日运动/能量消耗记录</h3>
      </div>

      {/* Add form */}
      <form onSubmit={handleAdd} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '8px', alignItems: 'end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>运动项目</label>
          <select
            className="input-field"
            value={sportType}
            onChange={(e) => setSportType(e.target.value)}
            style={{ padding: '8px 10px' }}
          >
            {Object.keys(sportCalorieRates).map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>时间 (分钟)</label>
          <input
            type="number"
            className="input-field"
            value={duration || ''}
            onChange={(e) => setDuration(Number(e.target.value))}
            min={1}
            max={300}
            style={{ padding: '8px 10px' }}
            required
          />
        </div>

        <button type="submit" className="btn-primary" style={{ padding: '8px 10px', height: '37px', fontSize: '14px' }}>
          <Plus size={14} /> 记一下
        </button>
      </form>

      {/* List of active activities */}
      {activities.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px dashed var(--border-color)', paddingTop: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 600 }}>
            <span>已录入项目</span>
            <span style={{ color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '2px' }}>
              <Flame size={12} /> 共消耗 -{totalBurned} kcal
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '100px', overflowY: 'auto' }}>
            {activities.map(act => (
              <div
                key={act.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  border: '1px solid rgba(255,255,255,0.03)'
                }}
              >
                <span>
                  🏃 {act.name} <span style={{ color: 'var(--text-secondary)' }}>({act.duration}分钟)</span>
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>-{act.caloriesBurned} kcal</span>
                  <button
                    onClick={() => onDeleteActivity(act.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', padding: '2px' }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', padding: '6px' }}>
          今天还没有运动消耗，记一笔运动可以获得更多卡路里进食额度哦！
        </div>
      )}
    </div>
  );
};
