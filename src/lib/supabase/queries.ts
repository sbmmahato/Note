'use server';

import { revalidatePath } from 'next/cache';
import { files, folders, users, workspaces } from '../../../migrations/schema';
import db from './db';
import { collaborators } from './schema';
import {File, Folder, Subscription, User, workspace} from './supabase.types';
import { and, eq, ilike, notExists } from 'drizzle-orm';
import { validate } from 'uuid';

export const getUserSubscriptionStatus=async (userId:string)=>{
    try{
        const data = await db.query.subscriptions.findFirst({
            where: (s, { eq } ) => eq(s.user_id,userId)
        });
        if (data) return {data:data as Subscription, error:null};
        else return {data:null, error:null};
    }catch(error){
        // console.log(error);
        return {data:null, error:`Error ${error}`};
    }
};

export const getFiles = async (folderId: string) => {
    const isValid = validate(folderId);
    if (!isValid) return { data: null, error: 'Error' };
    try {
      const results = (await db
        .select()
        .from(files)
        .orderBy(files.created_at)
        .where(eq(files.folder_id, folderId))) as File[] | [];
      return { data: results, error: null };
    } catch (error) {
      console.log(error);
      return { data: null, error: 'Error' };
    }
  };

  export const createWorkspace = async (workspace: workspace) => {
    try {
      const response = await db.insert(workspaces).values(workspace);
      return { data: null, error: null };
    } catch (error) {
      console.log(error);
      return { data: null, error: 'Error' };
    }
  };

  export const deleteWorkspace = async (workspaceId: string) => {
    if (!workspaceId) return;
    await db.delete(workspaces).where(eq(workspaces.id, workspaceId));
  };

export const getFolders  = async (workspaceId:string) => {
  const isValid=validate(workspaceId);
  if(!isValid) return {data:null, error:'Error'};

    try{
      const results: Folder[] | []=await db.select().from(folders).orderBy(folders.created_at).where(eq(folders.workspace_id,workspaceId));
      return {data:results,error:null};
    }catch(error){
      return {data:null,error:'Error'};
  }
}

export const getWorkspaceDetails = async (workspaceId: string) => {
  const isValid = validate(workspaceId);
  if (!isValid)
    return {
      data: [],
      error: 'Error',
    };

  try {
    const response = (await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1)) as workspace[];
    return { data: response, error: null };
  } catch (error) {
    console.log(error);
    return { data: [], error: 'Error' };
  }
};

export const getFileDetails = async (fileId: string) => {
  const isValid = validate(fileId);
  if (!isValid) {
    data: [];
    error: 'Error';
  }
  try {
    const response = (await db
      .select()
      .from(files)
      .where(eq(files.id, fileId))
      .limit(1)) as File[];
    return { data: response, error: null };
  } catch (error) {
    console.log('🔴Error', error);
    return { data: [], error: 'Error' };
  }
};

export const deleteFile = async (fileId: string) => {
  if (!fileId) return;
  await db.delete(files).where(eq(files.id, fileId));
};

export const deleteFolder = async (folderId: string) => {
  if (!folderId) return;
  await db.delete(files).where(eq(files.id, folderId));
};

export const getFolderDetails = async (folderId: string) => {
  const isValid = validate(folderId);
  if (!isValid) {
    data: [];
    error: 'Error';
  }

  try {
    const response = (await db
      .select()
      .from(folders)
      .where(eq(folders.id, folderId))
      .limit(1)) as Folder[];

    return { data: response, error: null };
  } catch (error) {
    return { data: [], error: 'Error' };
  }
};

export const getPrivateWorkspaces = async (userId:string)=>{
  if (!userId) return [];
  const privateWorkspaces=(await db
  .select({
    id:workspaces.id,
    created_at:workspaces.created_at,
    workspace_owner:workspaces.workspace_owner,
    title:workspaces.title,
    icon_id:workspaces.icon_id,
    data:workspaces.data,
    in_trash:workspaces.in_trash,
    logo:workspaces.logo
  })
  .from(workspaces).where(and(notExists(
    db
    .select()
    .from(collaborators)
    .where(eq(collaborators.workspaceId,workspaces.id))
      ),eq(workspaces.workspace_owner,userId)
    )
  )) as workspace[];
  return privateWorkspaces;
}

export const getCollaboratingWorkspaces = async (userId: string) => {
  if (!userId) return [];
  const collaboratedWorkspaces = (await db
    .select({
      id: workspaces.id,
      created_at: workspaces.created_at,
      workspace_owner: workspaces.workspace_owner,
      title: workspaces.title,
      icon_id: workspaces.icon_id,
      data: workspaces.data,
      in_trash: workspaces.in_trash,
      logo: workspaces.logo,
    })
    .from(users)
    .innerJoin(collaborators, eq(users.id, collaborators.userId))
    .innerJoin(workspaces, eq(collaborators.workspaceId, workspaces.id))
    .where(eq(users.id, userId))) as workspace[];
  return collaboratedWorkspaces;
};

export const addCollaborators = async (users: User[], workspaceId: string) => {
  const response = users.forEach(async (user: User) => {
    const userExists = await db.query.collaborators.findFirst({
      where: (u, { eq }) =>
        and(eq(u.user_id, user.id), eq(u.workspace_id, workspaceId)),
    });
    if (!userExists)
      await db.insert(collaborators).values({ workspaceId, userId: user.id });
  });
};

export const removeCollaborators = async (
  users: User[],
  workspaceId: string
) => {
  const response = users.forEach(async (user: User) => {
    const userExists = await db.query.collaborators.findFirst({
      where: (u, { eq }) =>
        and(eq(u.user_id, user.id), eq(u.workspace_id, workspaceId)),
    });
    if (userExists)
      await db
        .delete(collaborators)
        .where(
          and(
            eq(collaborators.workspaceId, workspaceId),
            eq(collaborators.userId, user.id)
          )
        );
  });
};

export const findUser = async (userId: string) => {
  const response = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.id, userId),
  });
  return response;
};

export const createFolder = async (folder: Folder) => {
  try {
    const results = await db.insert(folders).values(folder);
    return { data: null, error: null };
  } catch (error) {
    console.log(error);
    return { data: null, error: 'Error' };
  }
};

export const createFile = async (file: File) => {
  try {
    await db.insert(files).values(file);
    return { data: null, error: null };
  } catch (error) {
    console.log(error);
    return { data: null, error: 'Error' };
  }
};

export const updateFolder = async (
  folder: Partial<Folder>,
  folderId: string
) => {
  try {
    await db.update(folders).set(folder).where(eq(folders.id, folderId));
    return { data: null, error: null };
  } catch (error) {
    console.log(error);
    return { data: null, error: 'Error' };
  }
};

export const updateFile = async (file: Partial<File>, fileId: string) => {
  try {
    const response = await db
      .update(files)
      .set(file)
      .where(eq(files.id, fileId));
    return { data: null, error: null };
  } catch (error) {
    console.log(error);
    return { data: null, error: 'Error' };
  }
};

export const updateWorkspace = async (
  workspace: Partial<workspace>,
  workspaceId: string
) => {
  if (!workspaceId) return;
  try {
    await db
      .update(workspaces)
      .set(workspace)
      .where(eq(workspaces.id, workspaceId));
    return { data: null, error: null };
  } catch (error) {
    console.log(error);
    return { data: null, error: 'Error' };
  }
};

export const getCollaborators = async (workspaceId: string) => {
  const response = await db
    .select()
    .from(collaborators)
    .where(eq(collaborators.workspaceId, workspaceId));
  if (!response.length) return [];
  const userInformation: Promise<User | undefined>[] = response.map(
    async (user) => {
      const exists = await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.id, user.userId),
      });
      return exists;
    }
  );
  const resolvedUsers = await Promise.all(userInformation);
  return resolvedUsers.filter(Boolean) as User[];
};

export const getUserFromSearch=async (email: string)=>{
  if(!email) return [];
  const accounts=db.select().from(users).where(ilike(users.email, `${email}%`));
  return accounts;
};