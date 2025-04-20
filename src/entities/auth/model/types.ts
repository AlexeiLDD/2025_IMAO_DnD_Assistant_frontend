export type TokenData = {
  refreshToken: string;
  accessToken: string;
  idToken: string;
  tokenType: string;
  expiresIn: number;
  userID: string;
  state: string;
  scope: string;
}