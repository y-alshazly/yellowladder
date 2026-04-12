export interface UserDeviceInfoInput {
  deviceId: string;
  platform: 'ios' | 'android' | 'web';
  osVersion: string;
  appVersion: string;
  model?: string;
  fcmToken?: string;
}

export interface UserDeviceInfo {
  id: string;
  userId: string;
  deviceId: string;
  platform: 'ios' | 'android' | 'web';
  osVersion: string;
  appVersion: string;
  model: string | null;
  fcmToken: string | null;
  lastSeenAt: string;
  createdAt: string;
}
