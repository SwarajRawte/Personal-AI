import React from 'react';

function APIIntegrations() {
  const nodes = [
    { top: '10%', left: '10%' }, { top: '10%', left: '55%' }, { top: '10%', right: '5%' },
    { top: '55%', left: '30%' }, { top: '55%', right: '20%' }, { bottom: '5%', left: '50%' },
  ];

  return (
    <div className="db-card">
      <div className="db-card-header">
        <h2 className="db-card-title">API Integrations</h2>
      </div>
      <div className="db-api-network">
        <div className="db-api-nodes">
          {nodes.map((pos, i) => (
            <div key={i} className="db-api-node" style={pos}>
              {['⚙️', '🔗', '📡', '🔌', '⚡', '🌐'][i]}
            </div>
          ))}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.3 }}>
            <line x1="25" y1="18" x2="115" y2="18" stroke="#7c3aed" strokeWidth="1" strokeDasharray="4" />
            <line x1="115" y1="18" x2="170" y2="18" stroke="#7c3aed" strokeWidth="1" strokeDasharray="4" />
            <line x1="25" y1="18" x2="70" y2="60" stroke="#7c3aed" strokeWidth="1" strokeDasharray="4" />
            <line x1="115" y1="18" x2="140" y2="60" stroke="#7c3aed" strokeWidth="1" strokeDasharray="4" />
            <line x1="70" y1="60" x2="100" y2="88" stroke="#7c3aed" strokeWidth="1" strokeDasharray="4" />
          </svg>
        </div>
      </div>
      <p className="db-api-coming-soon">Webhooks and plugin support (coming soon)</p>
    </div>
  );
}

export default APIIntegrations;
