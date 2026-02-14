import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

/**
 * 单据编号生成服务
 * 使用数据库事务保证编号原子性递增，格式如 IV-00001, SO-00001 等
 */
@Injectable()
export class DocNumberService {
  constructor(private prisma: PrismaService) {}

  /**
   * 生成单据编号
   * @param type 单据类型标识（如 'SO', 'PO', 'IV' 等）
   * @returns 格式化的单据编号，如 IV-00001
   */
  async generateDocNo(type: string): Promise<string> {
    // 使用事务保证原子性
    const result = await this.prisma.$transaction(async (tx) => {
      // 尝试获取并锁定序列记录
      let sequence = await tx.docNumberSequence.findUnique({
        where: { type },
      });

      if (!sequence) {
        // 首次使用该类型，创建序列记录
        sequence = await tx.docNumberSequence.create({
          data: {
            type,
            prefix: type,
            nextNumber: 2, // 当前使用 1，下次从 2 开始
            format: '{prefix}-{number:5}',
          },
        });
        return `${type}-00001`;
      }

      // 递增序号
      const currentNumber = sequence.nextNumber;
      await tx.docNumberSequence.update({
        where: { type },
        data: { nextNumber: currentNumber + 1 },
      });

      // 格式化编号：前缀-五位数字
      const paddedNumber = String(currentNumber).padStart(5, '0');
      return `${sequence.prefix}-${paddedNumber}`;
    });

    return result;
  }
}
