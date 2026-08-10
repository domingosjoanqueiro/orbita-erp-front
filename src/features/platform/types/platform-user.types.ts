export interface PlatformUser {
  id: number;
  uuid: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  phone?: string;
  avatar?: string;
  isRoot: boolean;
  isActive: boolean;
  roles: {
    id: number;
    name: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlatformUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  phone?: string;
  roleIds: number[];
}

export interface UpdatePlatformUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  username?: string;
  phone?: string;
  isActive?: boolean;
  roleIds?: number[];
}

export interface PlatformUserFilters {
  search?: string;
  isActive?: boolean;
  isRoot?: boolean;
  page?: number;
  limit?: number;
}