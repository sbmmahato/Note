'use client';  

import { useAppState } from '@/lib/providers/state-provider';
import { Folder } from '@/lib/supabase/supabase.types';
import React, { useEffect, useState } from 'react'
import TooltipComponent from '../global/tooltip-component';
import { PlusIcon } from 'lucide-react';
import { v4 } from 'uuid';
import { createFolder } from '@/lib/supabase/queries';
import { useToast } from '../ui/use-toast';
import { Accordion } from '../ui/accordion';
import Dropdown from './Dropdown';
import useSupabaseRealtime from '@/lib/hooks/useSupabaseRealtime';
import { useSubscriptionModal } from '@/lib/providers/subscription-modal-provider';
import { useSupabaseUser } from '@/lib/providers/supabase-user-provider';

interface FoldersDropdownListProps {
    workspaceFolders: Folder[];
    workspaceId: string;
  }

const FoldersDropdownList:React.FC<FoldersDropdownListProps> = ({workspaceFolders,workspaceId}) => {
    //local state folders 
    useSupabaseRealtime();
    const {state,dispatch,folder_id}=useAppState();
    const {open,setOpen} = useSubscriptionModal();
    const {subscription} = useSupabaseUser();
    const [folders,setFolders]=useState(workspaceFolders);
    const {toast} = useToast();
    const [x,setX]=useState(false);

    //effect - set initial  state server app  state
    useEffect(()=>{
      if (workspaceFolders.length > 0){
        dispatch({type:"SET_FOLDERS", payload: {workspace_id:workspaceId, folders: workspaceFolders.map((folder)=>({...folder,files:state.workspaces.find((workspace)=>workspace.id===workspaceId)?.folders.find((f)=> f.id === folder.id)?.files || [],
      }))}});
      }
    },[workspaceFolders, workspaceId]);
    
    //state
    useEffect(() => {
      setFolders(
        state.workspaces.find((workspace) => workspace.id === workspaceId)?.folders || []
      );console.log('folders');console.log(folders);
    }, [state]);

    //add folder
    const addFolderHandler=async ()=>{
      if(folders.length>=3 && !subscription){
        setOpen(true);
        return;
      }
      const newFolder: Folder = {
        data: null,
        id: v4(),
        created_at: new Date().toISOString(),
        title: 'Untitled',
        icon_id: '📄',
        in_trash: null,
        workspace_id: workspaceId,
      };
      dispatch({
        type:"ADD_FOLDER",
        payload: {workspace_id: workspaceId, folder: {...newFolder, files: []}}
      });
      const {data, error}=await createFolder(newFolder);
      if(error){
        toast({title:"Error", variant:"destructive", description:"Couldn't create the folder"});
      }else{
        toast({title:"Success", description:"Folder created"});
      }
    }
    

  return (
    <>
    <div className="flex
        sticky 
        z-20 
        top-0 
        bg-background 
        w-full  
        h-10 
        group/title 
        justify-between 
        items-center 
        pr-4 
        text-Neutrals/neutrals-8">
          <span className="text-Neutrals-8 font-bold text-xs">
            FOLDERS
          </span> 
          <TooltipComponent message="Create Folder">
            <PlusIcon size={16} className='group-hover/title:inline-block hidden cursor-pointer hover:dark:text-white' onClick={addFolderHandler} />
          </TooltipComponent>
    </div>
    <Accordion type="multiple" defaultValue={[folder_id || '']} className='pb-20'>
            {folders.filter((folder)=>!folder.in_trash).map((folder)=> (
              <Dropdown key={folder.id} title={folder.title} listType='folder' id={folder.id} iconId={folder.icon_id} />
              
            ))}
    </Accordion>
    
    </>
  )
}

export default FoldersDropdownList