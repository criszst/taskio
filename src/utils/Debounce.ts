export default function debounce<T extends (...args: any) => any>(
  callback: T,
  delay: NonNullable<number>
): (...args: Parameters<T>) => void {

  let timeoutId: ReturnType<typeof setTimeout>

  return (...args: Parameters<T>): void => {
    clearTimeout(timeoutId);

    timeoutId = setTimeout(() => callback(...args), delay);
  };
}