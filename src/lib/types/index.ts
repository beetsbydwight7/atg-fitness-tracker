export * from './exercise';
export * from './workout';
export * from './template';
export * from './pr';

export interface AppSettings {
  id: string;
  weightUnit: 'kg' | 'lbs';
  defaultRestSeconds: number;
  theme: 'light' | 'dark' | 'system';
}
