import { ILike, Like } from 'typeorm';

export const prepareLike = () => {
  if (process.env.DB_TYPE === 'postgres') {
    return 'ILIKE';
  }

  return 'LIKE';
};

export const prepareLikeOrm = (value: string) => {
  if (process.env.DB_TYPE === 'postgres') {
    return ILike(value);
  }

  return Like(value);
};
