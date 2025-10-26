import { HttpStatus } from '@nestjs/common';
import axios from 'axios';

describe('GET /api', () => {
  it('should return a message', async () => {
    const res = await axios.get(`/api`);

    expect(res.status).toBe(HttpStatus.OK.valueOf());
    expect(res.data).toEqual({ message: 'Hello API' });
  });
});
