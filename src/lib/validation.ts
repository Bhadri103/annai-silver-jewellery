export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const phonePattern = /^[6-9]\d{9}$/;
export const namePattern = /^[A-Za-z][A-Za-z .'-]{1,79}$/;

export const clean = (value: unknown) => String(value || "").trim();

export const isEmail = (value: unknown) => {
  const text = clean(value);
  return !text || emailPattern.test(text);
};

export const isPhone = (value: unknown) => phonePattern.test(clean(value).replace(/\D/g, ""));

export const isRequired = (value: unknown) => clean(value).length > 0;

export const isName = (value: unknown) => namePattern.test(clean(value));

export const minLength = (value: unknown, length: number) => clean(value).length >= length;

export const maxLength = (value: unknown, length: number) => clean(value).length <= length;

export const isPositiveNumber = (value: unknown) => Number(value) > 0;

export const isNonNegativeNumber = (value: unknown) => Number(value) >= 0;

export const isRating = (value: unknown) => Number(value) >= 1 && Number(value) <= 5;

export const isUrl = (value: unknown) => {
  const text = clean(value);
  if (!text) return true;
  if (/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(text)) return true;
  if (/^\/uploads\/[A-Za-z0-9._/-]+$/i.test(text)) return true;
  try {
    const url = new URL(text);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
};

export const phoneDigits = (value: unknown) => clean(value).replace(/\D/g, "");

export const limitPhoneDigits = (value: unknown) => phoneDigits(value).slice(0, 10);
