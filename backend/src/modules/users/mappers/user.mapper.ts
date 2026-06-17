import { User } from '../../../database/schema/users';

export class UserMapper {
  static toResponse(user: User) {
    const { password: _password, ...safe } = user;
    void _password;
    return safe;
  }

  static toResponseList(users: User[]) {
    return users.map((u) => UserMapper.toResponse(u));
  }
}
