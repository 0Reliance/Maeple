import { View } from './types';

export const viewToPath: Record<View, string> = {
  [View.JOURNAL]: '/journal',
  [View.DASHBOARD]: '/dashboard',
  [View.BIO_MIRROR]: '/bio-mirror',
  [View.LIVE_COACH]: '/coach',
  [View.VISION]: '/vision',
  [View.SEARCH]: '/resources',
  [View.SETTINGS]: '/settings',
  [View.GUIDE]: '/guide',
  [View.TERMS]: '/terms',
  [View.ROADMAP]: '/roadmap',
  [View.CLINICAL]: '/clinical',
};

export const pathToView: Record<string, View> = Object.entries(viewToPath).reduce((acc, [view, path]) => {
  acc[path] = view as View;
  return acc;
}, {} as Record<string, View>);

// Add root path mapping
pathToView['/'] = View.JOURNAL;
