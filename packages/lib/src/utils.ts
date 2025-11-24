import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

//Alternative function:

/** Function combines CSS classes
 *
 * @params values: string, boolean, undefined, null
 * filters false values so that only valid classes remain
 * @returns a single space-joined string of valid class names
 */

// export function cn(...classes: (string | boolean | undefined | null)[]) {
//   return classes.filter(Boolean).join(' '); //checks for classes under true
// }
