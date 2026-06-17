// Define a strict type for your custom language codes to ensure type safety
export interface User {
  userId: number;
  displayName?: string;
  userName: string;
  role: number;
  emailConfirmed: boolean;
  use2FALogin: boolean;
}
