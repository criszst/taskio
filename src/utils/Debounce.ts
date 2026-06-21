import { Uri } from "vscode";

export default function debounce<T extends (...args: any) => any>(
  callback: T,
  delay: NonNullable<number>,
  uriFile: Uri
): (...args: Parameters<T>) => void {

  let timeoutId: ReturnType<typeof setTimeout>

  if (uriFile) {
    timeoutId = setTimeout(() => callback(), delay);
  }

  return (...args: Parameters<T>): void => {
    clearTimeout(timeoutId);

    timeoutId = setTimeout(() => callback(...args), delay);
  };
}