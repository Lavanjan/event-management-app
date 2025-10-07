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
