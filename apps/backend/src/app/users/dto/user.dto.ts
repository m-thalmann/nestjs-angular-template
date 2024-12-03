export interface User {
  uuid: string;
  name: string;
  email: string;
}

export interface UserWithTimestamps extends User {
  emailVerifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
