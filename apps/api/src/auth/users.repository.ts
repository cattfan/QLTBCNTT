export interface UserRecord {
  id: number;
  name: string;
  username: string;
  email: string | null;
  role: string | null;
  departmentId: number | null;
  passwordHash: string;
}

export interface UsersRepository {
  findById(id: number): Promise<UserRecord | null>;
  findByUsername(username: string): Promise<UserRecord | null>;
  updatePassword(userId: number, passwordHash: string): Promise<void>;
}
