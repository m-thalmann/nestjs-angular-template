import { HttpContextToken } from '@angular/common/http';

export const ApiHttpContext = {
  UseRefreshToken: new HttpContextToken<boolean>(() => false),
  NoAuth: new HttpContextToken<boolean>(() => false),
  SkipRefreshingTokenOnUnauthorized: new HttpContextToken<boolean>(() => false),
  RequestRefreshTried: new HttpContextToken<boolean>(() => false),
} as const;
