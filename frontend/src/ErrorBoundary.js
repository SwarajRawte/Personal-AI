import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('Component error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '16px',
          margin: '16px auto',
          maxWidth: 480,
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '8px',
          color: '#fca5a5',
          textAlign: 'center',
          fontSize: '0.9rem'
        }}>
          ⚠️ {this.props.name || 'This section'} encountered an error.
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
