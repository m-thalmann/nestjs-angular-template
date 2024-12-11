import { HttpStatus } from '@nestjs/common';
import axios from 'axios';

describe('Auth', () => {
  it('refresh tokens work', async () => {
    const res = await axios.post<{ data: { accessToken: string; refreshToken: string } }>(`/auth/login`, {
      email: 'm@t.com',
      password: 'password',
    });

    expect(res.status).toBe(HttpStatus.OK);

    const { accessToken, refreshToken } = res.data.data;

    const users = await axios.get(`/users`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      validateStatus: () => true,
    });

    expect(users.status).toBe(HttpStatus.OK);

    const usersNotAuthorized = await axios.get(`/users`, {
      headers: {
        Authorization: `Bearer ${refreshToken}`,
      },
      validateStatus: () => true,
    });

    expect(usersNotAuthorized.status).toBe(HttpStatus.UNAUTHORIZED);

    const refreshNotAuthorized = await axios.post<{ data: { accessToken: string; refreshToken: string } }>(
      `/auth/refresh`,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        validateStatus: () => true,
      },
    );

    expect(refreshNotAuthorized.status).toBe(HttpStatus.UNAUTHORIZED);

    const refresh = await axios.post<{ data: { accessToken: string; refreshToken: string } }>(
      `/auth/refresh`,
      {},
      {
        headers: {
          Authorization: `Bearer ${refreshToken}`,
        },
        validateStatus: () => true,
      },
    );

    expect(refresh.status).toBe(HttpStatus.CREATED);

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = refresh.data.data;

    const usersWithNewToken = await axios.get(`/users`, {
      headers: {
        Authorization: `Bearer ${newAccessToken}`,
      },
      validateStatus: () => true,
    });

    expect(usersWithNewToken.status).toBe(HttpStatus.OK);

    const reuseRefresh = await axios.post<{ data: { accessToken: string; refreshToken: string } }>(
      `/auth/refresh`,
      {},
      {
        headers: {
          Authorization: `Bearer ${refreshToken}`,
        },
        validateStatus: () => true,
      },
    );

    expect(reuseRefresh.status).toBe(HttpStatus.UNAUTHORIZED);

    const reuseAccess = await axios.get(`/users`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      validateStatus: () => true,
    });

    expect(reuseAccess.status).toBe(HttpStatus.UNAUTHORIZED);

    const reuseNewRefresh = await axios.post<{ data: { accessToken: string; refreshToken: string } }>(
      `/auth/refresh`,
      {},
      {
        headers: {
          Authorization: `Bearer ${newRefreshToken}`,
        },
        validateStatus: () => true,
      },
    );

    expect(reuseNewRefresh.status).toBe(HttpStatus.UNAUTHORIZED);
  });
});
