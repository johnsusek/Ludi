let UPPERCASE = /[\p{Lu}]/u;
let LOWERCASE = /[\p{Ll}]/u;
let LEADING_CAPITAL = /^[\p{Lu}](?![\p{Lu}])/gu;
let IDENTIFIER = /([\p{Alpha}\p{N}_]|$)/u;
let SEPARATORS = /[_.\- ]+/;

let LEADING_SEPARATORS = new RegExp('^' + SEPARATORS.source);
let SEPARATORS_AND_IDENTIFIER = new RegExp(SEPARATORS.source + IDENTIFIER.source, 'gu');
let NUMBERS_AND_IDENTIFIER = new RegExp('\\d+' + IDENTIFIER.source, 'gu');

let preserveCamelCase = (string, toLowerCase, toUpperCase, preserveConsecutiveUppercase) => {
  let isLastCharLower = false;
  let isLastCharUpper = false;
  let isLastLastCharUpper = false;
  let isLastLastCharPreserved = false;

  for (let index = 0; index < string.length; index++) {
    let character = string[index];
    isLastLastCharPreserved = index > 2 ? string[index - 3] === '-' : true;

    if (isLastCharLower && UPPERCASE.test(character)) {
      string = string.slice(0, index) + '-' + string.slice(index);
      isLastCharLower = false;
      isLastLastCharUpper = isLastCharUpper;
      isLastCharUpper = true;
      index++;
    }
    else if (isLastCharUpper && isLastLastCharUpper && LOWERCASE.test(character) && (!isLastLastCharPreserved || preserveConsecutiveUppercase)) {
      string = string.slice(0, index - 1) + '-' + string.slice(index - 1);
      isLastLastCharUpper = isLastCharUpper;
      isLastCharUpper = false;
      isLastCharLower = true;
    }
    else {
      isLastCharLower = toLowerCase(character) === character && toUpperCase(character) !== character;
      isLastLastCharUpper = isLastCharUpper;
      isLastCharUpper = toUpperCase(character) === character && toLowerCase(character) !== character;
    }
  }

  return string;
};

let preserveConsecutiveUppercase = (input, toLowerCase) => {
  LEADING_CAPITAL.lastIndex = 0;

  return input.replaceAll(LEADING_CAPITAL, match => toLowerCase(match));
};

let postProcess = (input, toUpperCase) => {
  SEPARATORS_AND_IDENTIFIER.lastIndex = 0;
  NUMBERS_AND_IDENTIFIER.lastIndex = 0;

  return input
    .replaceAll(NUMBERS_AND_IDENTIFIER, (match, pattern, offset) => ['_', '-'].includes(input.charAt(offset + match.length)) ? match : toUpperCase(match))
    .replaceAll(SEPARATORS_AND_IDENTIFIER, (_, identifier) => toUpperCase(identifier));
};

export function camelCase(input, options) {
  if (!(typeof input === 'string' || Array.isArray(input))) {
    throw new TypeError('Expected the input to be `string | string[]`');
  }

  options = {
    pascalCase: false,
    preserveConsecutiveUppercase: false,
    ...options
  };

  if (Array.isArray(input)) {
    input = input.map(x => x.trim())
      .filter(x => x.length)
      .join('-');
  }
  else {
    input = input.trim();
  }

  if (input.length === 0) {
    return '';
  }

  let toLowerCase = options.locale === false
    ? string => string.toLowerCase()
    : string => string.toLocaleLowerCase(options.locale);

  let toUpperCase = options.locale === false
    ? string => string.toUpperCase()
    : string => string.toLocaleUpperCase(options.locale);

  if (input.length === 1) {
    if (SEPARATORS.test(input)) {
      return '';
    }

    return options.pascalCase ? toUpperCase(input) : toLowerCase(input);
  }

  let hasUpperCase = input !== toLowerCase(input);

  if (hasUpperCase) {
    input = preserveCamelCase(input, toLowerCase, toUpperCase, options.preserveConsecutiveUppercase);
  }

  input = input.replace(LEADING_SEPARATORS, '');
  input = options.preserveConsecutiveUppercase ? preserveConsecutiveUppercase(input, toLowerCase) : toLowerCase(input);

  if (options.pascalCase) {
    input = toUpperCase(input.charAt(0)) + input.slice(1);
  }

  return postProcess(input, toUpperCase);
}

const handlePreserveConsecutiveUppercase = (decamelized, separator) => {
	// Lowercase all single uppercase characters. As we
	// want to preserve uppercase sequences, we cannot
	// simply lowercase the separated string at the end.
	// `data_For_USACounties` → `data_for_USACounties`
	decamelized = decamelized.replace(
		/((?<![\p{Uppercase_Letter}\d])[\p{Uppercase_Letter}\d](?![\p{Uppercase_Letter}\d]))/gu,
		$0 => $0.toLowerCase(),
	);

	// Remaining uppercase sequences will be separated from lowercase sequences.
	// `data_For_USACounties` → `data_for_USA_counties`
	return decamelized.replace(
		/(\p{Uppercase_Letter}+)(\p{Uppercase_Letter}\p{Lowercase_Letter}+)/gu,
		(_, $1, $2) => $1 + separator + $2.toLowerCase(),
	);
};

export function decamelize(
	text,
	{
		separator = '_',
		preserveConsecutiveUppercase = false,
	} = {},
) {
	if (!(typeof text === 'string' && typeof separator === 'string')) {
		throw new TypeError(
			'The `text` and `separator` arguments should be of type `string`',
		);
	}

	// Checking the second character is done later on. Therefore process shorter strings here.
	if (text.length < 2) {
		return preserveConsecutiveUppercase ? text : text.toLowerCase();
	}

	const replacement = `$1${separator}$2`;

	// Split lowercase sequences followed by uppercase character.
	// `dataForUSACounties` → `data_For_USACounties`
	// `myURLstring → `my_URLstring`
	const decamelized = text.replace(
		/([\p{Lowercase_Letter}\d])(\p{Uppercase_Letter})/gu,
		replacement,
	);

	if (preserveConsecutiveUppercase) {
		return handlePreserveConsecutiveUppercase(decamelized, separator);
	}

	// Split multiple uppercase characters followed by one or more lowercase characters.
	// `my_URLstring` → `my_ur_lstring`
	return decamelized
		.replace(
			/(\p{Uppercase_Letter})(\p{Uppercase_Letter}\p{Lowercase_Letter}+)/gu,
			replacement,
		)
		.toLowerCase();
}