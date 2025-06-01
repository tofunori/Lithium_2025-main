// frontend/src/services/storageService.ts
import { supabase } from '../supabaseClient';
import { handleStorageError, getPathFromSupabaseUrl } from './errorHandling';
import { StorageItem, StorageFile, TreeNode } from './types';
import { FileObject } from '@supabase/storage-js';

// Function to upload a file to Supabase Storage
export const uploadFile = async (bucket: string, path: string, file: File): Promise<{ path: string }> => {
  console.log(`Attempting to upload file to Supabase Storage: Bucket=${bucket}, Path=${path}`);
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true,
      });

    handleStorageError(error, `uploadFile (Bucket: ${bucket}, Path: ${path})`);

    if (!data) {
      console.error(`Failed to upload file to ${bucket}/${path}, Supabase returned null data.`);
      throw new Error(`Upload failed, no data returned.`);
    }

    console.log(`Successfully uploaded file to ${bucket}/${data.path}`);
    return { path: data.path };
  } catch (error: unknown) {
    console.error(`Caught error in uploadFile (Bucket: ${bucket}, Path: ${path}):`, error instanceof Error ? error.message : error);
    throw error;
  }
};

// Function to delete a file from Supabase Storage
export const deleteFile = async (bucket: string, path: string): Promise<void> => {
  console.log(`Attempting to delete file from Supabase Storage: Bucket=${bucket}, Path=${path}`);
  if (!path) {
    console.warn("deleteFile warning: No path provided, skipping deletion.");
    return;
  }
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    handleStorageError(error, `deleteFile (Bucket: ${bucket}, Path: ${path})`);
    console.log(`Successfully requested deletion for file: ${bucket}/${path}`, data);
  } catch (error: unknown) {
    console.error(`Caught error in deleteFile (Bucket: ${bucket}, Path: ${path}):`, error instanceof Error ? error.message : error);
    throw error;
  }
};

// Function to create an empty folder (by uploading a placeholder file)
export const createFolder = async (bucket: string, folderPath: string): Promise<void> => {
  console.log(`Attempting to create folder in Supabase Storage: Bucket=${bucket}, Path=${folderPath}`);
  const placeholderPath = `${folderPath.endsWith('/') ? folderPath : folderPath + '/'}.placeholder`;
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .upload(placeholderPath, new Blob(['']), { contentType: 'text/plain', upsert: false });

    if (error && error.message !== 'The resource already exists') {
      handleStorageError(error, `createFolder (Bucket: ${bucket}, Path: ${folderPath})`);
    } else if (error && error.message === 'The resource already exists') {
      console.log(`Folder placeholder already exists at ${placeholderPath}, folder structure likely exists.`);
    } else {
      console.log(`Successfully created folder structure via placeholder: ${bucket}/${folderPath}`);
    }
  } catch (error: unknown) {
    console.error(`Caught error in createFolder (Bucket: ${bucket}, Path: ${folderPath}):`, error instanceof Error ? error.message : error);
    throw error;
  }
};

// Function to get the public URL for a file
export const getFilePublicUrl = async (bucket: string, path: string): Promise<string | null> => {
  console.log(`Attempting to get public URL for: Bucket=${bucket}, Path=${path}`);
  if (!path) {
    console.warn("getFilePublicUrl warning: No path provided.");
    return null;
  }
  try {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    if (!data || !data.publicUrl) {
      console.warn(`Could not get public URL for ${bucket}/${path}. Check if file exists and bucket permissions.`);
      return null;
    }
    console.log(`Successfully retrieved public URL for ${bucket}/${path}`);
    return data.publicUrl;
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('Not found')) {
      console.warn(`File not found when getting public URL: ${bucket}/${path}`);
      return null;
    }
    console.error(`Caught unexpected error in getFilePublicUrl (Bucket: ${bucket}, Path: ${path}):`, error instanceof Error ? error.message : error);
    throw error;
  }
};

// Function to list files within a specific path (prefix) in a bucket
export const listFiles = async (
  bucket: string,
  pathPrefix: string = '',
  options?: { limit?: number; offset?: number; sortBy?: { column: string; order: string } }
): Promise<FileObject[]> => {
  console.log(`Listing files in Supabase Storage: Bucket=${bucket}, PathPrefix=${pathPrefix}`);
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(pathPrefix, {
        limit: options?.limit || 100,
        offset: options?.offset || 0,
        sortBy: options?.sortBy || { column: 'name', order: 'asc' },
      });

    handleStorageError(error, `listFiles (Bucket: ${bucket}, PathPrefix: ${pathPrefix})`);

    if (!data) {
      console.warn(`No data returned when listing files for ${bucket}/${pathPrefix}`);
      return [];
    }

    console.log(`Successfully listed ${data.length} items in ${bucket}/${pathPrefix}`);
    return data;
  } catch (error: unknown) {
    console.error(`Caught error in listFiles (Bucket: ${bucket}, PathPrefix: ${pathPrefix}):`, error instanceof Error ? error.message : error);
    throw error;
  }
};

// Uploads an image specifically for a facility, using a structured path
export const uploadFacilityImage = async (facilityId: string, file: File): Promise<string> => {
  if (!facilityId) throw new Error("Facility ID is required to upload an image.");
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}.${fileExt}`;
  const filePathInBucket = `${facilityId}/${fileName}`;

  console.log(`Uploading facility image to bucket 'facility-images' at path: ${filePathInBucket}`);
  const { path: uploadedPath } = await uploadFile('facility-images', filePathInBucket, file);
  return uploadedPath;
};

// Deletes a facility image using its storage path
export const deleteFacilityImage = async (imageUrl: string): Promise<void> => {
  const imagePath = getPathFromSupabaseUrl(imageUrl);
  if (imagePath) {
    await deleteFile('facility-images', imagePath);
  } else {
    console.warn(`Could not delete image, invalid URL or path: ${imageUrl}`);
  }
};

// Lists ONLY direct children (files and folders) for the current view pane. Non-recursive.
export const listStorageItems = async (bucket: string, pathPrefix: string = ''): Promise<StorageItem[]> => {
  console.log(`Listing direct children in: Bucket=${bucket}, PathPrefix=${pathPrefix}`);
  try {
    const { data: fileObjects, error } = await supabase.storage
      .from(bucket)
      .list(pathPrefix, {
        limit: 1000,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' },
      });

    handleStorageError(error, `listStorageItems (Bucket: ${bucket}, PathPrefix: ${pathPrefix})`);

    if (!fileObjects) {
      console.warn(`No items returned for path: ${bucket}/${pathPrefix}`);
      return [];
    }

    const storageItemsPromises = fileObjects.map(async (fileObject): Promise<StorageItem> => {
      const prefixWithSlash = pathPrefix && !pathPrefix.endsWith('/') ? `${pathPrefix}/` : pathPrefix;
      const fullPath = `${prefixWithSlash}${fileObject.name}`;

      if (fileObject.id === null) {
        return {
          name: fileObject.name,
          path: fullPath,
          type: 'folder',
          metadata: fileObject.metadata,
          created_at: fileObject.created_at,
          updated_at: fileObject.updated_at,
          last_accessed_at: fileObject.last_accessed_at,
          id: null,
          url: null,
        };
      } else {
        const publicUrl = await getFilePublicUrl(bucket, fullPath);
        return {
          name: fileObject.name,
          path: fullPath,
          type: 'file',
          url: publicUrl,
          metadata: fileObject.metadata,
          created_at: fileObject.created_at,
          updated_at: fileObject.updated_at,
          last_accessed_at: fileObject.last_accessed_at,
          id: fileObject.id,
        };
      }
    });

    const storageItems = await Promise.all(storageItemsPromises);
    console.log(`Successfully listed ${storageItems.length} direct children in ${bucket}/${pathPrefix}`);
    return storageItems;
  } catch (error: unknown) {
    console.error(`Caught error in listStorageItems (Bucket: ${bucket}, PathPrefix: ${pathPrefix}):`, error instanceof Error ? error.message : error);
    throw error;
  }
};

// Gets only files, converting StorageItem to StorageFile
export const getStorageFiles = async (bucket: string, pathPrefix?: string): Promise<StorageFile[]> => {
  const allItems = await listStorageItems(bucket, pathPrefix);
  const files = allItems.filter(item => item.type === 'file');
  return files.map(file => ({ ...file, url: null, type: 'file' as const }));
};

// Gets all items (files/folders) recursively
export const getAllStorageItems = async (bucket: string): Promise<StorageItem[]> => {
  console.log(`Getting all storage items for bucket: ${bucket}`);
  const allItems: StorageItem[] = [];
  const foldersToProcess: string[] = [''];

  try {
    while (foldersToProcess.length > 0) {
      const currentPath = foldersToProcess.shift()!;
      const { data: fileObjects, error } = await supabase.storage
        .from(bucket)
        .list(currentPath, { limit: 1000 });

      handleStorageError(error, `getAllStorageItems - list path (Bucket: ${bucket}, Path: ${currentPath})`);

      if (fileObjects) {
        const storageItemsPromises = fileObjects.map(async (fileObject): Promise<StorageItem | null> => {
          const fullPath = `${currentPath ? currentPath + '/' : ''}${fileObject.name}`;
          if (fileObject.id === null) {
            foldersToProcess.push(fullPath);
            return {
              name: fileObject.name,
              path: fullPath,
              type: 'folder',
              metadata: fileObject.metadata,
              created_at: fileObject.created_at,
              updated_at: fileObject.updated_at,
              last_accessed_at: fileObject.last_accessed_at,
              id: null,
            };
          } else {
            const publicUrl = await getFilePublicUrl(bucket, fullPath);
            return {
              name: fileObject.name,
              path: fullPath,
              type: 'file',
              url: publicUrl,
              metadata: fileObject.metadata,
              created_at: fileObject.created_at,
              updated_at: fileObject.updated_at,
              last_accessed_at: fileObject.last_accessed_at,
              id: fileObject.id,
            };
          }
        });
        const resolvedItems = await Promise.all(storageItemsPromises);
        allItems.push(...resolvedItems.filter((item): item is StorageItem => item !== null));
      }
    }

    const { data: rootObjects, error: rootError } = await supabase.storage.from(bucket).list('', { limit: 1000 });
    handleStorageError(rootError, `getAllStorageItems - list root`);
    if (rootObjects) {
      rootObjects.forEach(obj => {
        if (obj.id === null && !allItems.some(item => item.path === obj.name && item.type === 'folder')) {
          allItems.push({
            name: obj.name, path: obj.name, type: 'folder', id: null,
            metadata: obj.metadata, created_at: obj.created_at, updated_at: obj.updated_at, last_accessed_at: obj.last_accessed_at
          });
        }
      });
    }

    const uniqueItems = Array.from(new Map(allItems.map(item => [item.path, item])).values());
    console.log(`Finished getting all items. Found ${uniqueItems.length} unique items.`);
    return uniqueItems;
  } catch (error: unknown) {
    console.error(`Caught error in getAllStorageItems (Bucket: ${bucket}):`, error instanceof Error ? error.message : error);
    throw error;
  }
};

// Builds a hierarchical tree structure from a flat list of StorageItems
export const buildFolderTree = (items: StorageItem[]): TreeNode[] => {
  const tree: TreeNode[] = [];
  const map: { [key: string]: TreeNode } = {};

  items
    .sort((a, b) => {
      const depthA = a.path.split('/').length;
      const depthB = b.path.split('/').length;
      if (depthA !== depthB) return depthA - depthB;
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      return a.name.localeCompare(b.name);
    })
    .forEach(item => {
      const node: TreeNode = { ...item, children: item.type === 'folder' ? [] : undefined };
      map[item.path] = node;

      const parentPath = item.path.substring(0, item.path.lastIndexOf('/'));

      if (parentPath && map[parentPath] && map[parentPath].type === 'folder') {
        if (!map[parentPath].children) {
          map[parentPath].children = [];
        }
        map[parentPath].children!.push(node);
      } else if (!parentPath) {
        tree.push(node);
      } else {
        console.warn(`Orphaned item found or parent not processed yet: ${item.path}, Parent: ${parentPath}`);
        tree.push(node);
      }
    });

  Object.values(map).forEach(node => {
    if (node.children) {
      node.children.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
    }
  });

  tree.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return tree;
};

// Moves a file within a bucket
export const moveFile = async (bucket: string, sourcePath: string, destinationPath: string): Promise<void> => {
  console.log(`Attempting to move file in Supabase Storage: Bucket=${bucket}, From=${sourcePath}, To=${destinationPath}`);
  if (!sourcePath || !destinationPath) {
    throw new Error("Source and destination paths are required for moveFile.");
  }
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .move(sourcePath, destinationPath);

    handleStorageError(error, `moveFile (Bucket: ${bucket}, From: ${sourcePath}, To: ${destinationPath})`);
    console.log(`Successfully moved file from ${sourcePath} to ${destinationPath}`);
  } catch (error: unknown) {
    console.error(`Caught error in moveFile (Bucket: ${bucket}, From: ${sourcePath}, To: ${destinationPath}):`, error instanceof Error ? error.message : error);
    throw error;
  }
};

// Renames a folder by moving all its contents recursively
export const renameFolder = async (bucket: string, oldPathPrefix: string, newPathPrefix: string): Promise<void> => {
  console.log(`Attempting to rename folder in Supabase Storage: Bucket=${bucket}, From=${oldPathPrefix}, To=${newPathPrefix}`);
  if (!oldPathPrefix || !newPathPrefix) {
    throw new Error("Old and new path prefixes are required for renameFolder.");
  }

  const oldPrefix = oldPathPrefix.replace(/^\/|\/$/g, '');
  const newPrefix = newPathPrefix.replace(/^\/|\/$/g, '');

  if (!oldPrefix) {
    throw new Error("Cannot rename the root directory.");
  }
  if (newPrefix.startsWith(oldPrefix + '/')) {
    throw new Error("Cannot move a folder into itself.");
  }

  try {
    console.log(`Listing items under old prefix: ${oldPrefix}`);
    const allItems = await getAllStorageItems(bucket);
    const itemsToMove = allItems.filter(item => item.path.startsWith(oldPrefix + '/') || item.path === oldPrefix);

    if (itemsToMove.length === 0) {
      console.warn(`No items found under prefix ${oldPrefix} to rename.`);
      try {
        const { error: movePlaceholderError } = await supabase.storage
          .from(bucket)
          .move(`${oldPrefix}/.placeholder`, `${newPrefix}/.placeholder`);
        if (!movePlaceholderError) {
          console.log(`Successfully moved placeholder for empty folder ${oldPrefix} to ${newPrefix}`);
          return;
        } else if (movePlaceholderError.message.includes('does not exist')) {
          console.warn(`Folder ${oldPrefix} or its placeholder not found.`);
          return;
        } else {
          handleStorageError(movePlaceholderError, `renameFolder - move placeholder`);
        }
      } catch (placeholderError) {
        console.error(`Error trying to move placeholder for ${oldPrefix}:`, placeholderError);
      }
      return;
    }

    console.log(`Found ${itemsToMove.length} items to move/rename.`);

    const newParentPath = newPrefix.includes('/') ? newPrefix.substring(0, newPrefix.lastIndexOf('/')) : '';
    if (newParentPath) {
      await createFolder(bucket, newParentPath);
    }

    const filesToMove = itemsToMove.filter(item => item.type === 'file');

    for (const file of filesToMove) {
      const oldPath = file.path;
      const newPath = oldPath.replace(oldPrefix, newPrefix);
      console.log(`Moving file: ${oldPath} -> ${newPath}`);
      await moveFile(bucket, oldPath, newPath);
    }

    try {
      const { error: moveMainPlaceholderError } = await supabase.storage
        .from(bucket)
        .move(`${oldPrefix}/.placeholder`, `${newPrefix}/.placeholder`);
      if (moveMainPlaceholderError && !moveMainPlaceholderError.message.includes('does not exist')) {
        handleStorageError(moveMainPlaceholderError, `renameFolder - move main placeholder`);
      } else if (!moveMainPlaceholderError) {
        console.log(`Moved main placeholder for ${oldPrefix}`);
      }
    } catch(e) { 
      console.warn("Could not move main placeholder, might not exist."); 
    }

    console.warn(`Rename operation moved files. Manual cleanup of the old folder structure '${oldPrefix}' might be needed if Supabase move didn't handle it implicitly.`);
    console.log(`Successfully completed rename operation for folder: ${oldPrefix} -> ${newPrefix}`);
  } catch (error: unknown) {
    console.error(`Caught error in renameFolder (Bucket: ${bucket}, From: ${oldPrefix}, To: ${newPrefix}):`, error instanceof Error ? error.message : error);
    throw error;
  }
};

// Deletes a folder and all its contents recursively
export const deleteFolder = async (bucket: string, folderPathPrefix: string): Promise<void> => {
  console.warn(`Attempting to recursively delete folder and all its contents: Bucket=${bucket}, PathPrefix=${folderPathPrefix}`);
  if (!folderPathPrefix) {
    throw new Error("Folder path prefix cannot be empty for deleteFolder.");
  }

  const prefix = folderPathPrefix.replace(/^\/|\/$/g, '');
  if (!prefix) {
    throw new Error("Cannot delete the root directory.");
  }

  try {
    console.log(`Listing files to delete under prefix: ${prefix}`);
    const allItems = await getAllStorageItems(bucket);
    const itemsToDelete = allItems.filter(item => item.path.startsWith(prefix + '/') || item.path === prefix);
    const filesToDelete = itemsToDelete.filter(item => item.type === 'file').map(item => item.path);

    if (filesToDelete.length > 0) {
      console.log(`Found ${filesToDelete.length} files to delete.`);
      const { data: deletedFilesData, error: deleteFilesError } = await supabase.storage
        .from(bucket)
        .remove(filesToDelete);

      handleStorageError(deleteFilesError, `deleteFolder - remove files (Bucket: ${bucket}, Prefix: ${prefix})`);
      console.log(`Successfully deleted ${deletedFilesData?.length || 0} files under prefix: ${prefix}`);
    } else {
      console.log(`No files found under prefix ${prefix} to delete.`);
    }

    console.log(`Completed delete operation for folder prefix: ${prefix}. Note: Empty folder structures might persist if not automatically cleaned by Supabase.`);
  } catch (error: unknown) {
    console.error(`Caught error in deleteFolder (Bucket: ${bucket}, Prefix: ${prefix}):`, error instanceof Error ? error.message : error);
    throw error;
  }
};