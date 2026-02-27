export default function debounce<T extends (...args: any) => any>(
  callback: T,
  delay: NonNullable<number>
): (...args: Parameters<T>) => ReturnType<T> {

  let timeoutId: ReturnType<typeof setTimeout>

  return (...args: Parameters<T>): ReturnType<T> => {
    let result: any;

    timeoutId && clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      result = callback(...args);
    }, delay);

    return result;
  };

}