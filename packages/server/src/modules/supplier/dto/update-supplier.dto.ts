import { PartialType } from '@nestjs/swagger';
import { CreateSupplierDto } from './create-supplier.dto.js';

/**
 * 更新供应商 DTO - 所有字段可选
 */
export class UpdateSupplierDto extends PartialType(CreateSupplierDto) {}
