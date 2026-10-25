import * as Crypto from "expo-crypto";
import { Directory, File, Paths } from "expo-file-system";

const imagesDir = new Directory(Paths.document, "scan-images");

const dirPrefix = () =>
  imagesDir.uri.endsWith("/") ? imagesDir.uri : `${imagesDir.uri}/`;

/**
 * Copies a (temporary) photo into permanent storage and returns just the file name.
 * Already-stored images are returned as they are, so saving twice is safe.
 */
export function persistImage(sourceUri: string): string {
  const prefix = dirPrefix();
  if (sourceUri.startsWith(prefix)) return sourceUri.slice(prefix.length);

  if (!imagesDir.exists) imagesDir.create();

  const match = sourceUri.match(/\.(jpe?g|png|webp|heic)(\?.*)?$/i);
  const extension = match ? match[1].toLowerCase() : "jpg";
  const fileName = `${Crypto.randomUUID()}.${extension}`;

  new File(sourceUri).copy(new File(imagesDir, fileName));
  return fileName;
}

export function imageUriFromFile(fileName: string): string {
  return new File(imagesDir, fileName).uri;
}

export function deleteAllImages(): void {
  if (imagesDir.exists) imagesDir.delete();
}
