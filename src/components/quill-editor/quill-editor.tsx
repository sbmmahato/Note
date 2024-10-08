'use client';

import { useAppState } from '@/lib/providers/state-provider';
import { File, Folder, workspace } from '@/lib/supabase/supabase.types'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import 'quill/dist/quill.snow.css';
import { Button } from '../ui/button';
import { deleteFile, deleteFolder, findUser, getFileDetails, getFolderDetails, getWorkspaceDetails, updateFile, updateFolder, updateWorkspace } from '@/lib/supabase/queries';
import { usePathname, useRouter } from 'next/navigation';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import Image from 'next/image';
import { useSocket } from '@/lib/providers/socket-provider';
import { useSupabaseUser } from '@/lib/providers/supabase-user-provider';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import ImportPopover from './import-popover';
import Page from './upload-file';

interface QuillEditorProps {
    dirDetails: File | Folder | workspace;
    fileId: string;
    dirType: 'workspace' | 'folder' | 'file';
}

var TOOLBAR_OPTIONS = [
    ['bold', 'italic', 'underline', 'strike'], // toggled buttons
    ['blockquote', 'code-block'],
  
    [{ header: 1 }, { header: 2 }], // custom button values
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ script: 'sub' }, { script: 'super' }], // superscript/subscript
    [{ indent: '-1' }, { indent: '+1' }], // outdent/indent
    [{ direction: 'rtl' }], // text direction
  
    [{ size: ['small', false, 'large', 'huge'] }], // custom dropdown
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
  
    [{ color: [] }, { background: [] }], // dropdown with defaults from theme
    [{ font: [] }],
    [{ align: [] }],
  
    ['clean'], // remove formatting button
  ];
  

const QuillEditor: React.FC<QuillEditorProps> = ({dirDetails, fileId, dirType}) => {
    const supabase = createClientComponentClient();
    const router = useRouter();
    const {state, workspace_id, folder_id, dispatch} = useAppState();
    const {socket, isConnected} = useSocket();
    const {user} = useSupabaseUser();
    const pathname=usePathname();
    const [quill, setQuill] = useState<any>(null);
    const [collaborators, setCollaborators]=useState<{id :string, email: string, avatarUrl: string}[]>();
    const [saving,setSaving]=useState(false);
    const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();
    const [localCursors, setLocalCursors] = useState<any>([]);

    const details = useMemo(()=>{
        let selectedDir;
        if (dirType === 'file'){
            selectedDir = state.workspaces.find((workspace) => workspace.id === workspace_id)?.folders.find((folder) => folder.id === folder_id)?.files.find((file) => file.id === fileId);
        }
        if (dirType === 'folder'){
            selectedDir = state.workspaces.find((workspace) => workspace.id === workspace_id)?.folders.find((folder) => folder.id === fileId);
        }
        if (dirType === 'workspace'){
            selectedDir = state.workspaces.find((workspace) => workspace.id === fileId
            );
        }

        if(selectedDir){return selectedDir;}

        return {
            title: dirDetails.title,
            icon_id: dirDetails.icon_id,
            created_at: dirDetails.created_at,
            data: dirDetails.data,
            in_trash: dirDetails.in_trash
        } as workspace | Folder | File;
    },[state, workspace_id, folder_id]);

    const breadCrumbs = useMemo(() => {
        if (!pathname || !state.workspaces || !workspace_id) return;
        const segments = pathname
          .split('/')
          .filter((val) => val !== 'dashboard' && val);
        const workspaceDetails = state.workspaces.find(
          (workspace) => workspace.id === workspace_id
        );
        const workspaceBreadCrumb = workspaceDetails
          ? `${workspaceDetails.icon_id} ${workspaceDetails.title}`
          : '';
        if (segments.length === 1) {
          return workspaceBreadCrumb;
        }
    
        const folderSegment = segments[1];
        const folderDetails = workspaceDetails?.folders.find(
          (folder) => folder.id === folderSegment
        );
        const folderBreadCrumb = folderDetails
          ? `/ ${folderDetails.icon_id} ${folderDetails.title}`
          : '';
    
        if (segments.length === 2) {
          return `${workspaceBreadCrumb} ${folderBreadCrumb}`;
        }
    
        const fileSegment = segments[2];
        const fileDetails = folderDetails?.files.find(
          (file) => file.id === fileSegment
        );
        const fileBreadCrumb = fileDetails
          ? `/ ${fileDetails.icon_id} ${fileDetails.title}`
          : '';
    
        return `${workspaceBreadCrumb} ${folderBreadCrumb} ${fileBreadCrumb}`;
      }, [state, pathname, workspace_id]);


    const wrapperRef=useCallback(async (wrapper: any)=>{
        if(typeof window !== 'undefined'){
            if(wrapper===null) return;
            wrapper.innerHTML='';
            const editor=document.createElement('div');
            wrapper.append(editor);
            const Quill=(await import('quill')).default;
            const QuillCursors=(await import('quill-cursors')).default;
            Quill.register('modules/cursors', QuillCursors);
            const q=new Quill(editor, {
                theme: 'snow',
                modules: {
                    toolbar: TOOLBAR_OPTIONS,
                    cursors: {
                      transformOnTextChange: true,
                    }
                }
            });
            setQuill(q);
        }
    },[]);

    const restoreFileHandler = async () => {
        if (dirType === 'file') {
          if (!folder_id || !workspace_id) return;
          dispatch({
            type: 'UPDATE_FILE',
            payload: { file: { in_trash: '' }, file_id:fileId, folder_id, workspace_id },
          });
          await updateFile({ in_trash: '' }, fileId);
        }
        if (dirType === 'folder') {
          if (!workspace_id) return;
          dispatch({
            type: 'UPDATE_FOLDER',
            payload: { folder: { in_trash: '' }, folder_id: fileId, workspace_id },
          });
          await updateFolder({ in_trash: '' }, fileId);
        }
      };

    const deleteFileHandler = async () => {
    if (dirType === 'file') {
      if (!folder_id || !workspace_id) return;
      dispatch({
        type: 'DELETE_FILE',
        payload: { file_id:fileId, folder_id, workspace_id },
      });
      await deleteFile(fileId);
      router.replace(`/dashboard/${workspace_id}`);
    }
    if (dirType === 'folder') {
      if (!workspace_id) return;
      dispatch({
        type: 'DELETE_FOLDER',
        payload: { folder_id: fileId, workspace_id },
      });
      await deleteFolder(fileId);
      router.replace(`/dashboard/${workspace_id}`);
    }
  };

  useEffect(()=>{
    if (!fileId) return;
    let selectedDir;
    const fetchInformation = async () => {
        if(dirType==='file'){
            const {data:selectedDir,error}=await getFileDetails(fileId);
            if(error || !selectedDir){
                return router.replace('/dashboard');
            }
            if(!selectedDir[0]){
                if(!workspace_id) return;
                return router.replace(`/dashboard/${workspace_id}`)    //NC no workspace editor, redirect to first folder in workspace OR show all contents inside the workspace 
            }
            if(!workspace_id || quill===null) return;
            if(!selectedDir[0].data) return;
            quill.setContents(JSON.parse(selectedDir[0].data || ''));
            dispatch({
                type: 'UPDATE_FILE',
                payload: {file:{data: selectedDir[0].data}, file_id:fileId, folder_id:selectedDir[0].folder_id, workspace_id }
            })
        }
        if(dirType === 'folder'){
            const {data : selectedDir, error} = await getFolderDetails(fileId);
            if(error || !selectedDir){
                return router.replace('/dashboard');
            }

            if(!selectedDir[0]){
                router.replace(`/dashboard/${workspace_id}`);
            }
            if (quill === null) return;
            if(!selectedDir[0].data) return;
            quill.setContents(JSON.parse(selectedDir[0].data || ''));
            dispatch({type: 'UPDATE_FOLDER',
                payload: {
                    folder_id:fileId,
                    folder:{data: selectedDir[0].data},
                    workspace_id: selectedDir[0].workspace_id,
                }
            })
        }
        if(dirType === 'workspace'){
            const {data: selectedDir, error} = await getWorkspaceDetails(fileId);
            if(error || !selectedDir){return router.replace('/dashboard');}
            if(!selectedDir[0] || quill===null) return;
            if(!selectedDir[0].data) return;
            quill.setContents(JSON.parse(selectedDir[0].data || ''));
            dispatch({
                type: 'UPDATE_WORKSPACE',
                payload: {workspace: {data: selectedDir[0].data}, workspace_id: fileId},
            });
        }
    };
    fetchInformation();
  },[fileId, workspace_id, quill, dirType])

  useEffect(() => {
    if (quill === null || socket === null || !fileId || !localCursors.length)
      return;
    const socketHandler = (range: any, roomId: string, cursorId: string) => {
      if (roomId === fileId) {
        const cursorToMove = localCursors.find(
          (c: any) => c.cursors()?.[0].id === cursorId
        );
        if (cursorToMove) {
          cursorToMove.moveCursor(cursorId, range);
        }
      }
    };
    socket.on('receive-cursor-move', socketHandler);
    return () => {
      socket.off('receive-cursor-move', socketHandler);
    };
  }, [quill, socket, fileId, localCursors]);

   // rooms
   useEffect(()=>{
    if (socket === null || quill === null || !fileId) return;
    socket.emit('create-room', fileId);
   },[socket, quill, fileId])

   //send quill changes to all clients
   useEffect(()=>{
    if(quill===null || socket===null || !fileId || !user) return;
    //WORK IN PROGRESS cursor update
    const selectionChangeHandler = (cursorId: string) => {
      return (range: any, oldRange: any, source: any) => {
        if (source === 'user' && cursorId) {
          socket.emit('send-cursor-move', range, fileId, cursorId);
        }
      };
    };

    const quillHandler=(delta:any,oldDelta:any,source:any)=>{
      if(source !== 'user') return;
      if(saveTimerRef.current) clearTimeout(saveTimerRef.current);
      setSaving(true);
      const contents=quill.getContents();
      const quillLength=quill.getLength();
      saveTimerRef.current=setTimeout(async ()=> {
        if(contents  && fileId){
          if(dirType=='workspace'){
            dispatch({type:"UPDATE_WORKSPACE",
              payload: {
                workspace:{data:JSON.stringify(contents)},
                workspace_id: fileId
              }
            });
            await updateWorkspace({data: JSON.stringify(contents)}, fileId);
          }
          if(dirType=='folder'){
            if(!workspace_id) return;
            dispatch({type:"UPDATE_FOLDER",
              payload: {
                folder:{data:JSON.stringify(contents)},
                workspace_id,
                folder_id: fileId
              }
            });
            await updateFolder({data: JSON.stringify(contents)}, fileId);
          }
          if(dirType=='file'){
            if(!workspace_id || !folder_id) return;
            dispatch({type:"UPDATE_FILE",
              payload: {
                file:{data:JSON.stringify(contents)},
                workspace_id,
                folder_id,
                file_id:  fileId
              }
            });
            await updateFile({data: JSON.stringify(contents)}, fileId);
          }
        }
        setSaving(false);
      }, 850);
      socket.emit('send-changes', delta, fileId);
    };
    quill.on('text-change', quillHandler);
    quill.on('selection-change', selectionChangeHandler(user.id));

    return ()=>{
      quill.off('text-change', quillHandler);
      quill.on('selection-change', selectionChangeHandler)
      
      if(saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
   }, [quill, socket, fileId, user, details, workspace_id]);

   useEffect(()=>{
    if (quill===null || socket===null) return;
    const socketHandler=(deltas:any, id:string)=>{
      if(id===fileId){
        quill.updateContents(deltas);
      }
    };
    socket.on('receive-changes', socketHandler);
    return()=>{
      socket.off('receive-changes', socketHandler);
    }
   }, [quill,  socket, fileId])

   useEffect(() => {
    if (!fileId || quill === null) return;
    const room = supabase.channel(fileId);
    const subscription = room
      .on('presence', { event: 'sync' }, () => {
        const newState = room.presenceState();
        const newCollaborators = Object.values(newState).flat() as any;
        setCollaborators(newCollaborators);
        if (user) {
          const allCursors: any = [];
          newCollaborators.forEach(
            (collaborator: { id: string; email: string; avatar: string }) => {
              if (collaborator.id !== user.id) {
                const userCursor = quill.getModule('cursors');
                userCursor.createCursor(
                  collaborator.id,
                  collaborator.email.split('@')[0],
                  `#${Math.random().toString(16).slice(2, 8)}`
                );
                allCursors.push(userCursor);
              }
            }
          );
          setLocalCursors(allCursors);
        }
      })
      .subscribe(async (status) => {
        if (status !== 'SUBSCRIBED' || !user) return;
        const response = await findUser(user.id);
        if (!response) return;

        room.track({
          id: user.id,
          email: user.email?.split('@')[0],
          avatarUrl: '',
        });
      });
    return () => {
      supabase.removeChannel(room);
    };
  }, [fileId, quill, supabase, user]);

  return (
    <>
    <div className='relative'>
        {details.in_trash && (
            <article className='py-2 z-40 bg-[#EB5757]    flex md:flex-row flex-col justify-center items-center gap-4 flex-wrap'>
                <div className='flex flex-col md:flex-row gap-2 justify-center items-center'>
                    <span className='text-white'>
                        This {dirType} is in the trash
                    </span>
                    <Button size='sm' variant='outline' className='bg-transparent border-white text-white hover:bg-white hover:text-[#EB5757]' onClick={restoreFileHandler}>
                        Restore
                    </Button>
                    <Button size='sm' variant='outline' className='bg-transparent border-white text-white hover:bg-white hover:text-[#EB5757]' onClick={deleteFileHandler}>
                        Delete
                    </Button>
                </div>
                <span className='text-sm text-white'>{details.in_trash}</span>
            </article>
        )}
        <div className='flex flex-col-reverse sm:flex-row  sm:justify-between justify-center sm:items-center sm:p-2 p-8'>
            <div>{breadCrumbs}</div>
            <div className='flex items-center gap-4'>
             <div className='flex items-center justify-center h-10'>
                {collaborators?.map((collaborator) => (
                    <TooltipProvider key={collaborator.id}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Avatar className='-ml-3  bg-background border-2  flex items-center  justify-center border-white  h-8 w-8 rounded-full'>
                                <AvatarImage src={collaborator.avatarUrl ? collaborator.avatarUrl : ''} className='rounded-full' />
                                <AvatarFallback>
                                    {collaborator.email.substring(0,2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                        </TooltipTrigger>
                        <TooltipContent>{collaborator.email}</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                ))}
             </div>
             {saving ? (<Badge variant='secondary' className='bg-orange-600 top-4 text-white right-4 z-50'>
                Saving...
             </Badge>) : (<Badge variant='secondary' className='bg-emerald-600 top-4 text-white right-4 z-50'>
                Saved</Badge>)}
                {/* <div><button>IMPORT</button></div> */}
                <div><ImportPopover/></div>
                {/* <div><Page /></div> */}
            </div>

            
        </div>
    </div>

    {/* <div className='relative w-full h-[200px]'>
        <Image src={} fill className='w-full md:h-48 h-20 object-cover' alt='Banner Image' />
    </div> */}
    <div className='flex justify-center items-center flex-col mt-2 relative'>
        <span className='text-muted-foreground text-3xl font-bold h-9'>
            {details.title}
        </span>
        <span className='text-muted-foreground text-sm'>
            {dirType.toUpperCase()}
        </span>
     <div id='container' className='max-w-[800px]' ref={wrapperRef}>

     </div>
    </div>
    </>
  )
}

export default QuillEditor;