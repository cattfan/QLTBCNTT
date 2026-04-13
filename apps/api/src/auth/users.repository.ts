export interface UserRecord {
  id: string;
  createdAt: string;
  name: string;
  username: string;
  passwordHash: string;
}

export interface UsersRepository {
  findById(id: string): Promise<UserRecord | null>;
  findByUsername(username: string): Promise<UserRecord | null>;
  updatePassword(userId: string, passwordHash: string): Promise<void>;
}
