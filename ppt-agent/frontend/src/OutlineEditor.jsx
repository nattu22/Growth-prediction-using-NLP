import React, { useState } from 'react';

const OutlineEditor = ({ outline, onUpdate, onGenerate }) => {
  const [items, setItems] = useState(outline);

  const handleLayoutChange = (index, newLayout) => {
    const newItems = [...items];
    newItems[index].suggested_layout = newLayout;
    setItems(newItems);
    onUpdate(newItems);
  };

  const layoutOptions = [
    { value: 'cover', label: 'Cover' },
    { value: 'thank_you', label: 'Thank You' },
    { value: 'section_divider', label: 'Section Divider' },
    { value: 'kpi_cards', label: 'KPI Cards' },
    { value: 'large_text', label: 'Large Text' },
    { value: 'small_summary', label: 'Summary' },
    { value: 'table', label: 'Table' },
    { value: 'chart', label: 'Chart' }
  ];

  return (
    <div className="outline-editor">
      <h2>Proposed Outline</h2>
      <p>Review and select layouts for your slides.</p>

      <div className="outline-list">
        {items.map((item, index) => (
          <div key={index} className="outline-item" style={{
            display: 'flex', gap: '10px', alignItems: 'center',
            marginBottom: '10px', padding: '10px', border: '1px solid #eee'
          }}>
            <span style={{ fontWeight: 'bold', width: '30px' }}>{index + 1}.</span>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <strong>{item.title}</strong>
              <div style={{ fontSize: '0.8em', color: '#666' }}>{item.intent}</div>
            </div>

            <select
              value={item.suggested_layout}
              onChange={(e) => handleLayoutChange(index, e.target.value)}
              style={{ padding: '5px' }}
            >
              {layoutOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <button onClick={() => onGenerate(items)} className="generate-btn" style={{ marginTop: '20px' }}>
        Generate All Slides
      </button>
    </div>
  );
};

export default OutlineEditor;
