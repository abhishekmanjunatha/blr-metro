export default function TestApp() {
  return (
    <div style={{ 
      padding: '40px', 
      textAlign: 'center',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <h1 style={{ color: '#8B008B', fontSize: '32px', marginBottom: '20px' }}>
        🚇 Namma Metro Navigator
      </h1>
      <p style={{ fontSize: '18px', color: '#666' }}>
        If you can see this, React is working!
      </p>
      <div style={{ marginTop: '30px' }}>
        <a 
          href="/" 
          style={{ 
            display: 'inline-block',
            padding: '12px 24px',
            backgroundColor: '#8B008B',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px'
          }}
        >
          Go to Main App
        </a>
      </div>
    </div>
  );
}
