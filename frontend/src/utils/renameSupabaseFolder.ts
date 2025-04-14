import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Renames a "folder" in Supabase Storage by copying all files to the new prefix and deleting the originals.
 * @param supabase Supabase client instance
 * @param bucketName Name of the storage bucket
 * @param oldFolderPath Old folder path (e.g., 'my-folder/')
 * @param newFolderPath New folder path (e.g., 'renamed-folder/')
 */
export async function renameSupabaseFolder(
  supabase: SupabaseClient,
  bucketName: string,
  oldFolderPath: string,
  newFolderPath: string
): Promise<void> {
  // Ensure folder paths end with '/'
  if (!oldFolderPath.endsWith('/')) oldFolderPath += '/';
  if (!newFolderPath.endsWith('/')) newFolderPath += '/';

  // 1. List all files in the old folder
  const { data: files, error: listError } = await supabase
    .storage
    .from(bucketName)
    .list(oldFolderPath, { limit: 10000, offset: 0, search: '' }); // Increased limit, adjust if needed

  if (listError) throw new Error('Failed to list files: ' + listError.message);
  if (!files || files.length === 0) {
    console.warn(`No files found in folder '${oldFolderPath}' or folder does not exist.`);
    // Decide if this should be an error or just a warning.
    // If the folder might legitimately be empty, returning might be okay.
    // throw new Error('No files found in the folder.');
    return;
  }

  const copyPromises: Promise<any>[] = [];
  const deletePaths: string[] = [];

  // 2. Prepare copy operations and collect paths for deletion
  for (const file of files) {
    // Skip the placeholder empty file Supabase might create for empty folders
    if (file.name === '.emptyFolderPlaceholder') {
        continue;
    }
    if (file.name) {
      const oldPath = oldFolderPath + file.name;
      const newPath = newFolderPath + file.name;
      deletePaths.push(oldPath); // Add to list for bulk delete later

      // Add copy operation to promise array
      copyPromises.push(
        supabase.storage.from(bucketName).copy(oldPath, newPath)
      );
    }
  }

  // Execute all copy operations concurrently
  const copyResults = await Promise.allSettled(copyPromises);

  // Check for copy errors
  const copyErrors = copyResults
    .filter(result => result.status === 'rejected')
    // @ts-ignore
    .map(result => result.reason?.message || 'Unknown copy error');

  if (copyErrors.length > 0) {
    // Optional: Attempt to clean up successfully copied files if any copy failed?
    // This adds complexity. For now, just report errors.
    throw new Error(`Failed to copy some files: ${copyErrors.join(', ')}`);
  }

  // 3. Delete original files in bulk if all copies succeeded
  if (deletePaths.length > 0) {
      const { error: deleteError } = await supabase
        .storage
        .from(bucketName)
        .remove(deletePaths);

      if (deleteError) {
        // This is problematic - copies succeeded but originals couldn't be deleted.
        // Manual cleanup might be required.
        throw new Error(`Files copied, but failed to delete originals: ${deleteError.message}`);
      }
  }

  console.log(`Folder '${oldFolderPath}' successfully renamed to '${newFolderPath}' in bucket '${bucketName}'.`);
}