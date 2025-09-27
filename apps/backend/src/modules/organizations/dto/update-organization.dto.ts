import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateOrganizationDto } from './create-organization.dto';
import { IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateOrganizationDto extends PartialType(
  OmitType(CreateOrganizationDto, ['admin'] as const)
) {
  @ApiPropertyOptional({ description: 'Whether the organization is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
