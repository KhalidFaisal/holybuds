'use client';

import { useEffect } from 'react';

export default function AIUpdaterTrigger() {
  useEffect(() => {
    // Send a silent request to trigger the AI generation
    fetch('/api/admin/ai-staff-picks', {
      method: 'POST',
      headers: {
        'x-public-trigger': 'true'
      }
    }).catch(e => console.error('Silent AI update failed', e));
  }, []);

  return null;
}
