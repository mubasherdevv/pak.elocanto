export function PageSkeleton() {
  return (
    <div style={{ minHeight: '100vh', background: '#f7f8fa', padding: '24px 16px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ 
          height: 300, 
          background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
          borderRadius: 16,
          marginBottom: 24
        }} />
        <div style={{ 
          height: 200, 
          background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
          borderRadius: 16
        }} />
      </div>
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

export function AdCardSkeleton() {
  return (
    <div style={{ 
      background: 'white', 
      borderRadius: 24, 
      overflow: 'hidden',
      border: '1.5px solid #f1f5f9',
      boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ 
        aspectRatio: '4/3', 
        width: '100%',
        background: 'linear-gradient(90deg, #f8fafc 25%, #f1f5f9 50%, #f8fafc 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite'
      }} />
      <div style={{ padding: 20 }}>
        <div style={{ height: 12, width: '40%', background: '#f8fafc', borderRadius: 4, marginBottom: 12 }} />
        <div style={{ height: 22, width: '80%', background: '#f1f5f9', borderRadius: 6, marginBottom: 8 }} />
        <div style={{ height: 16, width: '90%', background: '#f1f5f9', borderRadius: 4, marginBottom: 20 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto' }}>
          <div style={{ height: 24, width: '50%', background: '#f1f5f9', borderRadius: 4 }} />
          <div style={{ height: 14, width: '20%', background: '#f8fafc', borderRadius: 4 }} />
        </div>
      </div>
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

export function CategorySkeleton() {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      gap: 12,
      padding: '16px 8px'
    }}>
      <div style={{ 
        width: 72, 
        height: 72, 
        borderRadius: 20, 
        background: 'linear-gradient(90deg, #f8fafc 25%, #f1f5f9 50%, #f8fafc 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite'
      }} />
      <div style={{ height: 12, width: 48, background: '#f1f5f9', borderRadius: 4 }} />
    </div>
  );
}
