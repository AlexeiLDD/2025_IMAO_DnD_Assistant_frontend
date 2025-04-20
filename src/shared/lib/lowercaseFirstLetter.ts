export const lowercaseFirstLetter = (word: string): string => {
    if (!word) return '';
    return word.charAt(0).toLowerCase() + word.slice(1);
  };
  