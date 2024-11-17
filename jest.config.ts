import { getJestProjectsAsync } from '@nx/jest';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export default async () => ({
  projects: await getJestProjectsAsync(),
});
