export interface UserDto {
  uuid: string;
  name: string;
  email: string;
}

export interface DetailedUserDto extends UserDto {
  isAdmin: boolean;
  isEmailVerified: boolean;
  createdAt: number;
  updatedAt: number;
}
