import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsOptional, IsBoolean } from 'class-validator';
import { CreateFeaturePackageDto } from './create-feature-package.dto';

export class UpdateFeaturePackageDto extends PartialType(CreateFeaturePackageDto) {
  @ApiPropertyOptional({
    description: 'Whether the package is active',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
