import React, { useEffect, useState } from 'react';
import { notifications } from '@thresho/core';

export default function Notifications() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    function push(kind) {
      return ({ msg, payload }) => {
        setItems(prev => [...prev, { id: Date.now() + Math.random(), kind, msg }]);
        setTimeout(() => setItems(prev => prev.slice(1)), 4000);
      };
    }
    notifications.on('success', push('success'));
    notifications.on('error', push('error'));
    notifications.on('info', push('info'));
    return () => notifications.removeAllListeners();
  }, []);

  return (
    <div style={{ position: 'fixed', top: 12, right: 12, zIndex: 1000 }}>
      {items.map(n => (
        <div key={n.id} style={{ marginBottom: 8, padding: '10px 12px', borderRadius: 8, color: 'white', background: n.kind==='error'?'#d33':(n.kind==='success'?'#2a5':'#38f'), boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
          {n.msg}
        </div>
      ))}
    </div>
  );
}
