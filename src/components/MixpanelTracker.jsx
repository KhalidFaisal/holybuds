'use client';

import { useEffect } from 'react';
import mixpanel from 'mixpanel-browser';

export default function MixpanelTracker() {
  useEffect(() => {
    // Initialize Mixpanel with the provided token and autocapture settings
    mixpanel.init('310c51b821d7ac311385744dd9d3c370', {
      autocapture: true,
      record_sessions_percent: 100,
    });
  }, []);

  return null; // This component doesn't render anything
}
