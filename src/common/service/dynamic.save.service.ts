import { escapeQuotes } from './escape.service';

export const parseDynamicSaveObject = (entity) => {
  const save = {};
  Object.entries(entity).forEach(([key, value]) => {
    const type = value === null ? 'null' : typeof value;

    let string = value;

    if (value === undefined) {
      return;
    }

    if (type === 'null') {
      string = 'NULL';
    }

    if (type === 'object') {
      string = `'${escapeQuotes(JSON.stringify(value))}'`;
    }

    if (type === 'string') {
      string = `'${escapeQuotes(value)}'`;
    }

    const date = parseDate(value);
    if (date) {
      string = `'${date}'`;
    }

    save[key] = string;
  });

  return save;
};

const parseDate = (dateValue) => {
  if (dateValue === null || dateValue === undefined) {
    return null;
  }

  if (dateValue instanceof Date) {
    if (isNaN(dateValue.getTime())) {
      return null;
    }
    return dateValue.toISOString().replace('T', ' ').replace(/\.\d+Z$/, '');
  }

  if (typeof dateValue !== 'string') {
    return null;
  }

  if (dateValue.length < 10 || dateValue.length > 29) {
    return null;
  }

  const datetime = new Date(dateValue);

  if (isNaN(datetime.getTime())) {
    return null;
  }

  return datetime.toISOString().replace('T', ' ').replace(/\.\d+Z$/, '');
};
