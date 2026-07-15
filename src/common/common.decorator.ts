import {
  applyDecorators,
  createParamDecorator,
  ExecutionContext,
  UseGuards,
} from '@nestjs/common';
import { FindDoc } from './doc/find.doc';
import { FindOneDoc } from './doc/find_one.doc';
import { FindFirstDoc } from './doc/find_first.doc';
import { FindManyDoc } from './doc/find_many.doc';
import { SelfDoc } from './doc/self.doc';
import { CountDoc } from './doc/count.doc';
import { CreateDoc } from './doc/create.doc';
import { UpdateDoc } from './doc/update.doc';
import { RemoveDoc } from './doc/remove.doc';
import { SortPositionDoc } from './doc/position_sort.doc';
import { MovePositionDoc } from './doc/position_move.doc';
import { SecureGuard } from './guard/secure.guard';
import { SimpleSecureGuard } from './guard/simple.secure.guard';

export const Data = createParamDecorator(
  async (arg = '', context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    const { body, query } = request;
    const data = { ...query, ...body };
    let result = arg ? data[arg] : data;
    if (typeof result === 'string') {
      try {
        result = JSON.parse(result);
      } catch {}
    }
    return result;
  },
);

export const Doc = (type, classDto) => {
  if (type === 'find') {
    return applyDecorators(FindDoc(classDto));
  }
  if (type === 'findOne') {
    return applyDecorators(FindOneDoc(classDto));
  }
  if (type === 'findFirst') {
    return applyDecorators(FindFirstDoc(classDto));
  }
  if (type === 'findMany') {
    return applyDecorators(FindManyDoc(classDto));
  }
  if (type === 'self') {
    return applyDecorators(SelfDoc(classDto));
  }
  if (type === 'count') {
    return applyDecorators(CountDoc(classDto));
  }
  if (type === 'create') {
    return applyDecorators(CreateDoc(classDto));
  }
  if (type === 'update') {
    return applyDecorators(UpdateDoc(classDto));
  }
  if (type === 'remove') {
    return applyDecorators(RemoveDoc());
  }
  if (type === 'sortPosition') {
    return applyDecorators(SortPositionDoc(classDto));
  }
  if (type === 'movePosition') {
    return applyDecorators(MovePositionDoc());
  }
};

export const Secure = () => {
  return applyDecorators(UseGuards(SecureGuard));
};

export const SimpleSecure = () => {
  return applyDecorators(UseGuards(SimpleSecureGuard));
};