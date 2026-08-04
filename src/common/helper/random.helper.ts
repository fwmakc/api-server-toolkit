const SETS = {
  ru: 'абвгдеёжзийклмнопрстуфхцчшщъыьюя',
  RU: 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЮЯ',
  en: 'abcdefghijklmnopqrstuvwxyz',
  EN: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  num: '0123456789',
  hex: '0123456789ABCDEF',
  sym: '!@#$%^&*()_+-=/{}:;",.?<> ',
};

const NAME_CONFIG = {
  generic: { vowels: 'aeiouy', consonants: 'bdghklmnprstv', normals: [2, 2] },
  en: {
    vowels: 'aeiou',
    consonants: 'bcdfghklmnprstw',
    endings: [
      ['a', 'ana', 'e', 'en', 'er', 'ia', 'ie', 'ina', 'ine', 'y', 'yn'],
      ['ald', 'an', 'ard', 'art', 'arth', 'arts', 'e', 'ech', 'eck', 'eld', 'ell', 'en', 'er', 'erd', 'ert', 'erts', 'es', 'ich', 'ick', 'ill', 'in', 'ith', 'low', 'man', 'n', 'och', 'ock', 'old', 'oll', 'or', 'ord', 'ort', 'orth', 'orts', 's', 'son', 'ton', 'uch', 'uck', 'y'],
    ],
  },
  ru: {
    vowels: 'аеиоу',
    consonants: 'бвгдзклмнпрстчш',
    endings: [
      [['а', 'ана', 'ена', 'ика', 'ина', 'ия', 'яна'], ['ан', 'ей', 'ер', 'еслав', 'ил', 'им', 'имир', 'ис', 'ислав', 'омир', 'он', 'ор', 'ослав', 'ур']],
      [['ова', 'ева', 'ян', 'ич', 'ко', 'ман', 'ная', 'ер'], ['ев', 'ин', 'кий', 'ко', 'ман', 'ный', 'ов', 'ян']],
      [['евна', 'овна'], ['евич', 'ович']],
    ],
  },
};

export const randomInt = (min: number, max: number, step = 1): number => {
  const mmax = max;
  const koeff = 1 / step;
  max *= koeff;
  const rand = min + Math.random() * (max + 1 - min);
  let result = Math.floor(rand) / koeff;
  if (result > mmax) result -= step;
  if (result < min) result += step;
  return result;
};

export const randomString = (
  min: number,
  max?: number,
  charset = SETS.en,
): string => {
  if (!max) {
    max = min;
  } else if (min !== max) {
    max = randomInt(min, max);
  }
  let result = '';
  const { length } = charset;
  for (let i = 0; i < max; i++) {
    result += charset.charAt(Math.floor(Math.random() * length));
  }
  return result;
};

export const randomFromSet = (
  min: number,
  max?: number,
  ...setNames: string[]
): string => {
  let charset = '';
  const names = setNames.length > 0 ? setNames : Object.keys(SETS);
  names.forEach((name) => {
    charset += SETS[name] || '';
  });
  return randomString(min, max, charset);
};

export const randomNum = (min: number, max?: number): string =>
  randomString(min, max, SETS.num);

export const randomHex = (min: number, max?: number): string =>
  randomString(min, max, SETS.hex);

export const randomBin = (min: number, max?: number): string =>
  randomString(min, max, '01');

export const randomEmail = (min = 9, max = 30): string => {
  const charset = '0123456789abcdefghijklmnopqrstuvwxyz._-';
  const result = randomString(min, max, charset);
  const middle = Math.floor(result.length / 2);
  const tld = randomString(2, 4, 'abcdefghijklmnopqrstuvwxyz');
  return `${result.substring(0, middle)}@${result.substring(middle)}.${tld}`
    .replace(/\W*@\W*/u, '@')
    .replace(/\.{2,}/u, '.');
};

export const randomOption = <T>(...args: T[]): T => {
  if (!args || !args.length) return undefined;
  const options = Array.isArray(args[0]) ? args[0] : args;
  const index = randomInt(1, options.length) - 1;
  return options[index];
};

export const shuffleArray = <T>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

export const randomArray = <T>(n: number, callback: (i: number) => T = (i) => i as T): T[] => {
  return [...Array(n)].map((_, i) => callback(i));
};

interface NameParams {
  min?: number;
  max?: number;
  vowels: string;
  consonants: string;
  normals?: number[];
  finals?: number[];
  endings?: string[];
}

const randomName = (params: NameParams): string => {
  const {
    min = 5,
    max = 8,
    vowels,
    consonants,
    normals = [1, 1],
    finals = [0, 1],
    endings,
  } = params;

  const letters = [`${vowels}${vowels}`.toLowerCase(), consonants.toLowerCase()];
  let string = randomString(min, max, letters.join(''));

  normals?.forEach((num, index) => {
    const regexp = new RegExp(`[${letters[index]}]{${+num + 1},}`, 'gu');
    string.match(regexp)?.forEach((n) => {
      string = string.replace(n, n.substring(0, +num));
    });
  });

  finals?.forEach((num, index) => {
    const regexp = `[${letters[index]}]{${+num + 1},}$`;
    const regexpMatch = new RegExp(regexp, 'iu');
    const regexpReplace = new RegExp(`(.*?)${regexp}`, 'iu');
    string.match(regexpMatch)?.forEach((n) => {
      string = string.replace(regexpReplace, `$1${n.substring(0, +num)}`);
    });
  });

  if (!string.match(new RegExp(`[${letters[0]}]+`, 'iu'))) {
    string = `${string}${randomString(1, 1, letters[0])}`;
  }
  if (!string.match(new RegExp(`[${letters[1]}]+`, 'iu'))) {
    string = `${string}${randomString(1, 1, letters[1])}`;
  }

  string = `${string.substring(0, 1).toUpperCase()}${string.substring(1)}`;
  const ending = endings && endings.length ? randomOption(endings) : '';
  return `${string}${ending}`;
};

export const randomNames = (words = 1): Array<string | number> => {
  const gender = randomInt(0, 1);
  const { vowels, consonants, normals } = NAME_CONFIG.generic;
  const finals = [gender ? 2 : 0, gender ? 0 : 2];
  const result: Array<string | number> = [gender];

  while (words > 0) {
    result.push(randomName({ vowels, consonants, normals, finals }));
    words -= 1;
  }
  return result;
};

export const randomEnNames = (words = 1): Array<string | number> => {
  const { vowels, consonants } = NAME_CONFIG.en;
  const woman = NAME_CONFIG.en.endings[0];
  const families = NAME_CONFIG.en.endings[1];
  const gender = randomInt(0, 1);
  const result: Array<string | number> = [gender];

  while (words > 0) {
    result.push(
      randomName({
        vowels,
        consonants,
        endings: words === 1 ? families : gender ? woman : undefined,
      }),
    );
    words -= 1;
  }
  return result;
};

export const randomRuNames = (words = 1): Array<string | number> => {
  const { vowels, consonants, endings } = NAME_CONFIG.ru;
  const gender = randomInt(0, 1);
  const result: Array<string | number> = [gender];

  let n = 0;
  while (words > 0) {
    result.push(
      randomName({
        min: n === 1 ? 5 : 3,
        max: n === 1 ? 8 : 5,
        vowels,
        consonants,
        endings: endings[n]?.[gender] || [],
      }),
    );
    words -= 1;
    n += 1;
  }
  return result;
};
