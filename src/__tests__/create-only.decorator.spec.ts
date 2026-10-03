import 'reflect-metadata';
import { CreateOnly, createOnlyFieldsOf, stripCreateOnlyFields } from '../common/decorator/create-only.decorator';
import { CommonDto } from '../common/common.dto';
import { CommonService } from '../common/common.service';
import { BaseEntity, DeepPartial, EntityManager, Repository } from 'typeorm';

class AnswerDto extends CommonDto {
  choice?: boolean;
  note?: string;
}

class SeedDto extends AnswerDto {
  // inherited create-only field must still be stripped
}

describe('create-only.decorator', () => {
  describe('metadata + createOnlyFieldsOf', () => {
    it('collects decorated fields', () => {
      CreateOnly()(AnswerDto.prototype, 'choice');

      expect(createOnlyFieldsOf(new AnswerDto())).toEqual(['choice']);
      expect(createOnlyFieldsOf({} as any)).toEqual([]);
      expect(createOnlyFieldsOf(null)).toEqual([]);
    });

    it('includes inherited decorated fields', () => {
      CreateOnly()(AnswerDto.prototype, 'choice');
      expect(createOnlyFieldsOf(new SeedDto())).toEqual(['choice']);
    });
  });

  describe('stripCreateOnlyFields', () => {
    it('removes create-only fields from entity', () => {
      const entity: any = { choice: true, note: 'keep' };
      stripCreateOnlyFields(entity, new AnswerDto());
      expect(entity).toEqual({ note: 'keep' });
    });
  });

  describe('CommonService integration', () => {
    const makeService = (exists = { id: 1 } as any) => {
      CreateOnly()(AnswerDto.prototype, 'choice');

      let captured: DeepPartial<any>;
      const persistUpdate = jest.fn(async (entity: DeepPartial<any>) => {
        captured = entity;
        return entity;
      });

      const repo = {
        metadata: { target: 'AnswerEntity', columns: [], relations: [], indices: [] },
        manager: {
          transaction: async (cb: (m: EntityManager) => Promise<any>) =>
            cb({} as EntityManager),
        },
      } as unknown as Repository<any>;

      const service = new (class extends CommonService<AnswerDto, BaseEntity> {
        protected readonly repository = repo;
        findOne = jest.fn().mockResolvedValue(exists);
        persistUpdate = persistUpdate;
        error = (e: unknown) => {
          throw e;
        };
      })();

      return { service, persistUpdate, get captured() { return captured; } };
    };

    it('update strips create-only fields (DTO instance, как после ValidationPipe)', async () => {
      const ctx = makeService();
      const dto = new AnswerDto();
      Object.assign(dto, { id: 1, choice: true, note: 'x' });
      await ctx.service.update(1, dto);
      expect(ctx.captured).toEqual({ id: 1, note: 'x' });
    });

    it('plain object (без класса) не имеет контракта — поля проходят как есть', async () => {
      const ctx = makeService();
      await ctx.service.update(1, { id: 1, choice: true, note: 'x' } as AnswerDto);
      expect(ctx.captured).toEqual({ id: 1, choice: true, note: 'x' });
    });

    it('create keeps create-only fields', async () => {
      CreateOnly()(AnswerDto.prototype, 'choice');

      let captured: DeepPartial<any>;
      const repo = {
        metadata: { target: 'AnswerEntity', columns: [], relations: [], indices: [] },
        manager: {
          transaction: async (cb: (m: EntityManager) => Promise<any>) =>
            cb({} as EntityManager),
        },
      } as unknown as Repository<any>;

      const service = new (class extends CommonService<AnswerDto, BaseEntity> {
        protected readonly repository = repo;
        findOne = jest.fn().mockResolvedValue({ id: 9, choice: true } as any);
        persistCreate = jest.fn(async (entity: DeepPartial<any>) => {
          captured = entity;
          return { id: 9 };
        });
        error = (e: unknown) => {
          throw e;
        };
      })();

      await service.create({ choice: true } as AnswerDto);
      expect(captured).toEqual({ choice: true });
    });
  });
});
