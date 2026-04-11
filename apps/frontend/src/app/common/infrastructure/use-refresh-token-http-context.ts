import { HttpContextToken } from '@angular/common/http';

export const USE_REFRESH_TOKEN_HTTP_CONTEXT = new HttpContextToken<boolean>(() => false);
