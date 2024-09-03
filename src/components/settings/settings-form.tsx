'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useToast } from '../ui/use-toast';
import { useAppState } from '@/lib/providers/state-provider';
import { User, workspace } from '@/lib/supabase/supabase.types';
import { useSupabaseUser } from '@/lib/providers/supabase-user-provider';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Briefcase, CreditCard, ExternalLink, Lock, LogOut, Plus, Share, UserIcon } from 'lucide-react';
import { Separator } from '../ui/separator';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { addCollaborators, deleteWorkspace, getCollaborators, removeCollaborators, updateWorkspace } from '@/lib/supabase/queries';
import { v4 } from 'uuid';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import CollaboratorSearch from '../global/collaborator-search';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import LogoutButton from '../global/logout-button';
import Link from 'next/link';
import { useSubscriptionModal } from '@/lib/providers/subscription-modal-provider';

const SettingsForm = () => {
  const { toast } = useToast();
  const { user, subscription } = useSupabaseUser();
  const { open, setOpen } = useSubscriptionModal(); 
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { state, workspace_id, dispatch } = useAppState();
  const [permissions, setPermissions] = useState('private');
  const [collaborators, setCollaborators] = useState<User[] | []>([]);
  const [openAlertMessage, setOpenAlertMessage] = useState(false);
  const [workspaceDetails, setWorkspaceDetails] = useState<workspace>();
  const titleTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const [uploadingProfilePic, setUploadingProfilePic] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  //WORK IN PROGRESS PAYMENT PORTAL
  
  //addCollaborators
  const addCollaborator = async (profile: User) => {
    if (!workspace_id) return;
    // if (subscription?.status !== 'active' && collaborators.length >= 2) {
    //   setOpen(true);
    //   return;
    // }
    await addCollaborators([profile], workspace_id);
    setCollaborators([...collaborators, profile]);
    // router.refresh();
  };
  //remove collaborators
  const removeCollaborator = async (user: User) => {
    if (!workspace_id) return;
    if (collaborators.length === 1) {
      setPermissions('private');
    }
    await removeCollaborators([user], workspace_id);
    setCollaborators(
      collaborators.filter((collaborator) => collaborator.id !== user.id)
    );
    router.refresh();
  };
  //on change 
  const workspaceNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!workspace_id || !e.target.value) return;
    dispatch({
      type: 'UPDATE_WORKSPACE',
      payload: { workspace: { title: e.target.value }, workspace_id },
    });
    if (titleTimerRef.current) clearTimeout(titleTimerRef.current);
    titleTimerRef.current = setTimeout(async () => {
      // await updateWorkspace({ title: e.target.value }, workspaceId);
    }, 500);
  };

  const onChangeWorkspaceLogo = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!workspace_id) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const uuid = v4();
    setUploadingLogo(true);
    const { data, error } = await supabase.storage
      .from('workspace-logos')
      .upload(`workspaceLogo.${uuid}`, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (!error) {
      dispatch({
        type: 'UPDATE_WORKSPACE',
        payload: { workspace: { logo: data.path }, workspace_id },
      });
      await updateWorkspace({ logo: data.path }, workspace_id);
      setUploadingLogo(false);
    }
  };

  const onClickAlertConfirm = async ()=> {
    if(!workspace_id) return;
    if(collaborators.length>0){
      await removeCollaborators(collaborators, workspace_id);
    }
    setPermissions('private');
    setOpenAlertMessage(false);
  };

  const onPermissionsChange = (val: string) => {
    if (val === 'private') {
      setOpenAlertMessage(true);
    } else setPermissions(val);
  };
  
  //onClicks
  //fetching avatar details
  //get workspace details
  //get all collaborators
  //WORK IN PROGRESS payment portal redirect
  useEffect(() => {
    const showingWorkspace = state.workspaces.find(
      (workspace) => workspace.id === workspace_id
    );
    if (showingWorkspace) setWorkspaceDetails(showingWorkspace);
  }, [workspace_id, state]);

  useEffect(()=>{
    if(!workspace_id)  return;
    const fetchCollaborators=async ()=>{
      const response = await getCollaborators(workspace_id);
      if(response.length){
        setPermissions('shared');
        setCollaborators(response);
      }
    };
    fetchCollaborators();
  }, [])

  return (
    <div className='flex gap-4 flex-col'>
        <p className='flex items-center gap-2 mt-6'>
            <Briefcase size={20} />
            Workspace
        </p>
        <Separator />
        <div className='flex flex-col gap-2'>
            <Label htmlFor='workspaceName' className='text-sm text-muted-foreground'>Name</Label>
            <Input name='workspaceName' value={workspaceDetails ? workspaceDetails.title : ''} placeholder='Workspace Name' onChange={workspaceNameChange} />
            <Label htmlFor='workspaceLogo' className='text-sm text-muted-foreground'>Workspace Logo</Label>
            <Input name='workspaceLogo' type='file' accept='image/*' placeholder='Workspace Logo' onChange={onChangeWorkspaceLogo} disabled={uploadingLogo || subscription?.status !== 'active'} />
            {subscription?.status !== 'active' && (<small className='text-muted-foreground'>
              To customize your workspace, you need to be on a Pro Plan
            </small>)}
        </div>
        <>
        <Label htmlFor='permissions'>Permissions</Label>
        <Select onValueChange={onPermissionsChange} value={permissions}>
                <SelectTrigger className='w-full h-26 -mt-3'>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectItem value='private'>
                            <div className='p-2 flex gap-4 justify-center items-center '>
                                <Lock />
                                <article  className='text-left flex flex-col'>
                                    <span>Private</span>
                                    <p>Your workspace will be private to you</p>
                                </article>
                            </div>
                        </SelectItem>
                        <SelectItem value='shared'>
                            <div className='p-2 flex gap-4 justify-center items-center '>
                                <Share />
                                <article  className='text-left flex flex-col'>
                                    <span>Shared</span>
                                    <p>You can invite collaborators</p>
                                </article>
                            </div>
                        </SelectItem>
                    </SelectGroup>
                </SelectContent>
            </Select>
        
        {permissions==='shared' && <div><CollaboratorSearch existingCollaborators={collaborators} getCollaborator={(user)=>{
            addCollaborator(user);
        }}>
            <Button type="button" className='text-sm mt-4'>
                <Plus />
                Add Collaborators
            </Button>
        </CollaboratorSearch>
            <div className='mt-4'>
                <span className='text-sm text-muted-foreground'>
                    Collaborators {collaborators.length || ''}
                </span>
                <ScrollArea className='h-[120px] overflow-y-scroll w-full rounded-md border border-muted-foreground/20'>
                {collaborators.length ? collaborators.map((c)=> <div className='p-4 flex justify-between items-center'  key={c.id}>
                    <div className='flex gap=-4 items-center'>
                        <Avatar>
                            <AvatarImage src=""></AvatarImage>
                            <AvatarFallback>PJ</AvatarFallback>
                        </Avatar>
                        <div className='text-sm gap-2 text-muted-foreground overflow-hidden overflow-ellipsis sm:w-[300px] w-[140px]'>
                            {c.email}
                        </div>
                    </div>
                    <Button variant="secondary" onClick={()=> removeCollaborator(c)}>Remove</Button>
                </div>) : (<div className='absolute right-0 left-0 top-0 bottom-0 flex justify-center items-center '>
                    <span className='text-muted-foreground text-sm'>You have no collaborators</span>
                </div>)}
                </ScrollArea>
            </div>
        </div>}
        <Alert variant={'destructive'}>
            <AlertDescription>
                Warning! Deleting your workspace will delete all the content inside it.
            </AlertDescription>
            <Button type='submit' size={'sm'} variant={'destructive'} className='mt-4 text-sm  bg-destructive/40 border-2 border-ddestructive'  onClick={async () => {
              if (!workspace_id) return;
              await deleteWorkspace(workspace_id);
              toast({ title: 'Successfully deleted your workspae' });
              dispatch({ type: 'DELETE_WORKSPACE', payload: workspace_id });
              router.replace('/dashboard');
            }}>Delete Workspace</Button>
        </Alert>
        <p className='flex items-center gap-2 mt-6'>
          <UserIcon size={20} /> Profile
        </p>
        <Separator />
        <div className='flex items-center'>
          <Avatar>
            <AvatarImage src={''} />
            <AvatarFallback></AvatarFallback>
          </Avatar>
          <div className='flex flex-col ml-6'>
            <small className='text-muted-foreground cursor-not-allowed'>{user ? user.email : ''}</small>
            <Label htmlFor='profilePicture' className='text-sm text-muted-foreground'>
              Profile Picture
            </Label>
            <Input name='profilePicture' type='file' accept='image/*' placeholder='Profile Picture'  disabled={uploadingProfilePic} />
          </div>
        </div>
        <LogoutButton>
          <div className='flex items-center'>
            <LogOut />
          </div>
        </LogoutButton>
        <p className='flex items-center gap-2 mt-6'>
          <CreditCard size={20} /> Billing & Plan
        </p>
        <Separator />
        <p className='text-muted-foreground'>
          You are currently on a{' '}
          {subscription?.status === 'active' ? 'Pro' : 'Free'} Plan
        </p>
        <Link href='/' target="_blank" className='text-muted-foreground flex flex-row items-center gap-2'>
        View Plans <ExternalLink size={16} /></Link>
        {subscription?.status === 'active' ? (<div>
          <Button type='button' size='sm' variant={'secondary'} 
          // disabled={loaingPortal} 
          className='text-sm' 
          //WORK IN PROGRESS onClick={redirectToCustomerPortal}
          >
            Manage Subscription
          </Button>
        </div>) : (
          <Button type='button' size='sm' variant={'secondary'} className='text-sm' onClick={()=>{
            setOpen(true);
          }} ></Button>
        )}
        </>
        <AlertDialog open={openAlertMessage}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDescription>Changing a Shared workspace to a Private workspace will remove all collaborators permanantly.</AlertDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={()=> setOpenAlertMessage(false)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onClickAlertConfirm}>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </div>
  )
}

export default SettingsForm