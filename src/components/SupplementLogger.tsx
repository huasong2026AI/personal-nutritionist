import React, { useState } from 'react';
import { SupplementLog } from '../types';
import { Pill, Trash2, Plus } from 'lucide-react';

interface SupplementLoggerProps {
  supplements: SupplementLog[];
  onAddSupplement: (supplement: SupplementLog) => void;
  onDeleteSupplement: (id: string) => void;
}

export const SupplementLogger: React.FC<SupplementLoggerProps> = ({
  supplements,
  onAddSupplement,
  onDeleteSupplement
}) => {
  const [selectedPreset, setSelectedPreset] = useState('calcium');
  const [customName, setCustomName] = useState('');
  const [dosage, setDosage] = useState('1片');

  const presets = [
    { id: 'calcium', label: '💊 碳酸钙D3片', name: '碳酸钙D3片', defaultDosage: '1片', nutrients: { calcium: 300, vitaminD: 5 } },
    { id: 'citrate', label: '💊 柠檬酸钙片', name: '柠檬酸钙片', defaultDosage: '1片', nutrients: { calcium: 250 } },
    { id: 'vitc', label: '💊 维生素C咀嚼片', name: '维生素C咀嚼片', defaultDosage: '1片', nutrients: { vitaminC: 100 } },
    { id: 'vitd', label: '💊 维生素D3胶囊', name: '维生素D3胶囊', defaultDosage: '1粒', nutrients: { vitaminD: 10 } },
    { id: 'vitb12', label: '💊 复合维生素B族', name: '复合维生素B族', defaultDosage: '1片', nutrients: { vitaminB12: 2.4 } },
    { id: 'potmag', label: '💊 门冬氨酸钾镁片', name: '门冬氨酸钾镁片', defaultDosage: '1片', nutrients: { magnesium: 100, potassium: 150 } },
    { id: 'protein', label: '🧪 蛋白粉冲剂', name: '蛋白粉', defaultDosage: '1勺', calories: 80, protein: 20, nutrients: {} },
    { id: 'custom', label: '✏️ 自定义补剂...', name: '', defaultDosage: '1片', nutrients: {} }
  ];

  const activePreset = presets.find(p => p.id === selectedPreset);

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedPreset(id);
    const p = presets.find(pr => pr.id === id);
    if (p) {
      setDosage(p.defaultDosage);
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    let name = '';
    let micronutrients = {};
    let calories = 0;
    let protein = 0;

    if (selectedPreset === 'custom') {
      name = customName.trim();
      if (!name) return;
    } else if (activePreset) {
      name = activePreset.name;
      micronutrients = activePreset.nutrients || {};
      calories = activePreset.calories || 0;
      protein = activePreset.protein || 0;
    }

    onAddSupplement({
      id: Math.random().toString(36).substring(7),
      name,
      dosage,
      time: timeStr,
      calories,
      protein,
      micronutrients
    });

    setCustomName('');
  };

  return (
    <div className="glass-card fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
        <Pill size={18} style={{ color: 'var(--accent-orange)' }} />
        <h3 style={{ fontSize: '17px', fontWeight: 600 }}>今日营养补剂服食记录</h3>
      </div>

      {/* Logger form */}
      <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>选择补剂</label>
            <select
              className="input-field"
              value={selectedPreset}
              onChange={handlePresetChange}
              style={{ padding: '8px 10px', width: '100%', boxSizing: 'border-box' }}
            >
              {presets.map(p => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>

          {selectedPreset === 'custom' && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>补剂名称</label>
              <input
                type="text"
                placeholder="例如: 辅酶Q10"
                className="input-field"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                style={{ padding: '8px 10px', width: '100%', boxSizing: 'border-box' }}
                required
              />
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', alignItems: 'end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>服用量</label>
              <input
                type="text"
                className="input-field"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                style={{ padding: '8px 10px', width: '100%', boxSizing: 'border-box' }}
                required
              />
            </div>

            <button type="submit" className="btn-primary" style={{ padding: '8px 6px', height: '37px', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', backgroundColor: 'var(--accent-orange)', borderColor: 'var(--accent-orange)', color: '#000', boxSizing: 'border-box' }}>
              <Plus size={14} /> 添加补剂
            </button>
          </div>
        </div>
      </form>

      {/* List of active supplements */}
      {supplements.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px dashed var(--border-color)', paddingTop: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 600 }}>
            <span>今天已服食</span>
            <span style={{ color: 'var(--accent-orange)' }}>共服食 {supplements.length} 种补剂</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '150px', overflowY: 'auto' }}>
            {supplements.map(sup => {
              // Nutrient tip description
              const microTips = [];
              if (sup.micronutrients) {
                if (sup.micronutrients.calcium) microTips.push(`钙+${sup.micronutrients.calcium}mg`);
                if (sup.micronutrients.vitaminD) microTips.push(`维D+${sup.micronutrients.vitaminD}mcg`);
                if (sup.micronutrients.vitaminC) microTips.push(`维C+${sup.micronutrients.vitaminC}mg`);
                if (sup.micronutrients.vitaminB12) microTips.push(`维B12+${sup.micronutrients.vitaminB12}mcg`);
                if (sup.micronutrients.magnesium) microTips.push(`镁+${sup.micronutrients.magnesium}mg`);
                if (sup.micronutrients.potassium) microTips.push(`钾+${sup.micronutrients.potassium}mg`);
              }
              if (sup.protein) microTips.push(`蛋白质+${sup.protein}g`);
              const tipStr = microTips.length > 0 ? ` (${microTips.join(', ')})` : '';

              return (
                <div
                  key={sup.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: 'rgba(255,255,255,0.02)',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    border: '1px solid rgba(255,255,255,0.03)',
                    gap: '10px'
                  }}
                >
                  <span style={{ flex: 1, wordBreak: 'break-word', fontSize: '13.5px', lineHeight: '1.3' }}>
                    💊 {sup.name} <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>({sup.dosage})</span>
                    <span style={{ fontSize: '11px', color: 'var(--accent-green)', marginLeft: '4px', display: 'block', marginTop: '2px' }}>{tipStr}</span>
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{sup.time}</span>
                    <button
                      onClick={() => onDeleteSupplement(sup.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', padding: '2px' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', padding: '6px' }}>
          今天还没有服食补剂。如果有服用钙片、维D/B12等补剂，记得登记在这里哦！
        </div>
      )}
    </div>
  );
};
