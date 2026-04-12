export const OtpPurpose = {
  EmailVerification: 'EMAIL_VERIFICATION',
} as const;

export type OtpPurpose = (typeof OtpPurpose)[keyof typeof OtpPurpose];
