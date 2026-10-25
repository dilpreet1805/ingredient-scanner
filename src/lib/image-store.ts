import * as Crypto from "expo-crypto";
import { Directory, File, Paths } from "expo-file-system";

const imagesDir = new Directory(Paths.document, "scan-images");

/** Copies a (temporary) photo into permanent storage. Returns just the file name. */
export function persistImage(sourceUri: string): string {
  if (!imagesDir.exists) imagesDir.create();

  const match = sourceUri.match(/\.(jpe?g|png|webp|heic)(\?.*)?$/i);
  const extension = match ? match[1].toLowerCase() : "jpg";
  const fileName = `${Crypto.randomUUID()}.${extension}`;

  new File(sourceUri).copy(new File(imagesDir, fileName));
  return fileName;
}

/** Turns a stored file name back into a full URI. */
export function imageUriFromFile(fileName: string): string {
  return new File(imagesDir, fileName).uri;
}
