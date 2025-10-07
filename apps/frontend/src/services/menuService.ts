import { api } from './api';

export interface MenuItemDto {
  name: string;
  href?: string;
  icon: string;
  children?: MenuItemDto[];
  isActive?: boolean;
  hasAccess: boolean;
}

export interface UserMenuDto {
  menuItems: MenuItemDto[];
  userInfo: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    userType: string;
    isProductAdmin: boolean;
    isOrganizationAdmin: boolean;
  };
}

class MenuService {
  async getUserMenu(): Promise<UserMenuDto> {
    const response = await api.get('/auth/menu');
    return response.data.data;
  }
}

export const menuService = new MenuService();
