import 'reflect-metadata';
import { validate, getMetadataStorage } from 'class-validator';
import { DtoColumn } from '../common/column/dto.column';
import { DtoEnumColumn } from '../common/column/dto_enum.column';
import { DtoJsonColumn } from '../common/column/dto_json.column';
import { DtoCreatedColumn } from '../common/column/dto_created.column';
import { DtoUpdatedColumn } from '../common/column/dto_updated.column';

enum Status {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

class TestDto {
  @DtoEnumColumn('status', Status)
  status: Status;
}

describe('DtoEnumColumn validation', () => {
  it('passes for valid enum value', async () => {
    const dto = new TestDto();
    dto.status = Status.ACTIVE;
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('fails for invalid enum value', async () => {
    const dto = new TestDto();
    dto.status = 'invalid' as any;
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('status');
    expect(errors[0].constraints).toHaveProperty('isEnum');
  });

  it('passes for undefined (field is optional — @IsOptional applied)', async () => {
    const dto = new TestDto();
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});

class TestJsonDto {
  @DtoJsonColumn('metadata')
  metadata: string;
}

describe('DtoJsonColumn validation', () => {
  it('passes for valid JSON string', async () => {
    const dto = new TestJsonDto();
    dto.metadata = '{"key":"value"}';
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('fails for invalid JSON string with isJson constraint', async () => {
    const dto = new TestJsonDto();
    dto.metadata = 'not-json';
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('metadata');
    expect(errors[0].constraints).toHaveProperty('isJson');
  });

  it('passes for undefined (field is optional)', async () => {
    const dto = new TestJsonDto();
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});

class TestPlainDto {
  @DtoColumn('name')
  name: string;
}

describe('DtoColumn', () => {
  it('has no class-validator metadata', () => {
    const storage = getMetadataStorage();
    const metadatas = storage.getTargetValidationMetadatas(TestPlainDto, undefined, false, false);
    expect(metadatas.length).toBe(0);
  });
});

class TestCreatedUpdatedDto {
  @DtoCreatedColumn()
  createdAt: Date;

  @DtoUpdatedColumn()
  updatedAt: Date;
}

describe('DtoCreatedColumn / DtoUpdatedColumn', () => {
  it('have no class-validator metadata', () => {
    const storage = getMetadataStorage();
    const metadatas = storage.getTargetValidationMetadatas(TestCreatedUpdatedDto, undefined, false, false);
    expect(metadatas.length).toBe(0);
  });
});
