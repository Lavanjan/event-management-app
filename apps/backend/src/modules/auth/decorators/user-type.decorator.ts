import { SetMetadata } from '@nestjs/common';
import { UserType } from '../../../database/entities';

export const REQUIRE_USER_TYPE_KEY = 'requireUserType';
export const RequireUserType = (...userTypes: UserType[]) => SetMetadata(REQUIRE_USER_TYPE_KEY, userTypes);
