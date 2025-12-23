import React from 'react';
import { TrendingUp, DollarSign, Users, Globe, AlertCircle, CheckCircle, BarChart2, Activity } from 'lucide-react';

const IconMap = {
  trend: TrendingUp,
  dollar: DollarSign,
  users: Users,
  globe: Globe,
  alert: AlertCircle,
  check: CheckCircle,
  chart: BarChart2,
  default: Activity
};

const SlideRenderer = ({ slide, id }) => {
  const { title, layout, content, template_url } = slide;

  const style = {
    backgroundImage: template_url ? `url(${template_url})` : 'none',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    padding: '40px',
    height: '450px', // Fixed aspect ratio approx
    width: '800px',
    border: '1px solid #ccc',
    position: 'relative',
    color: '#333',
    backgroundColor: 'white',
    margin: '0 auto',
    boxSizing: 'border-box',
    // The "Left Line" theme element
    borderLeft: '12px solid #646cff'
  };

  const renderContent = () => {
    switch (layout) {
      case 'cover':
        return (
          <div style={{ textAlign: 'center', marginTop: '100px' }}>
            <h1 style={{ fontSize: '3em' }}>{title}</h1>
            <h3 style={{ color: '#666' }}>{content.subtitle}</h3>
          </div>
        );
      case 'kpi_cards':
        return (
          <div>
            <h2>{title}</h2>
            <div style={{ display: 'flex', gap: '20px', marginTop: '40px', justifyContent: 'center' }}>
              {content.kpis && content.kpis.map((kpi, i) => {
                const IconComponent = IconMap[kpi.icon?.toLowerCase()] || IconMap.default;
                return (
                  <div key={i} style={{
                    border: '1px solid #eee', padding: '20px', borderRadius: '8px',
                    backgroundColor: '#f9f9f9', width: '180px', textAlign: 'center',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center'
                  }}>
                    <div style={{ marginBottom: '10px', color: '#646cff' }}>
                        <IconComponent size={32} />
                    </div>
                    <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#333' }}>{kpi.value}</div>
                    <div style={{ color: '#555', fontSize: '0.9em', marginTop: '5px' }}>{kpi.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      case 'thank_you':
        return (
            <div style={{ textAlign: 'center', marginTop: '150px' }}>
              <h1 style={{ fontSize: '3em', color: '#646cff' }}>{title}</h1>
              <p>{content.subtitle || "Thanks for watching!"}</p>
            </div>
          );
      case 'section_divider':
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', backgroundColor: '#646cff', color: 'white', marginLeft: '-40px', width: '840px' }}>
                 <h1 style={{ fontSize: '3em' }}>{title}</h1>
            </div>
        )
      default: // large_text, small_summary, etc.
        return (
          <div>
            <h2>{title}</h2>
            <ul style={{ textAlign: 'left', marginTop: '20px', fontSize: '1.2em', lineHeight: '1.6' }}>
              {content.bullet_points && content.bullet_points.map((pt, i) => (
                <li key={i}>{pt}</li>
              ))}
            </ul>
          </div>
        );
    }
  };

  return (
    <div id={id} className={`slide-container layout-${layout}`} style={style}>
      {renderContent()}
    </div>
  );
};

export default SlideRenderer;
