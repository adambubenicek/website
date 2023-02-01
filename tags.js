/**
 * @param {TemplateStringsArray} strings
 * @param {...any} values
 * @returns {string}
 */
export function tag(strings, ...values) {
  return String.raw(
    { raw: strings },
    ...values.map((value) => (Array.isArray(value) ? value.join("\n") : value))
  );
}

export const html = tag;
export const css = tag;
