import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import React from 'react'
import {cookies} from 'next/headers';
import { getCollaboratingWorkspaces, getFolders, getPrivateWorkspaces, getUserSubscriptionStatus } from '@/lib/supabase/queries';
import { redirect } from 'next/navigation';
import { twMerge } from 'tailwind-merge';
import WorkspaceDropdown from './workspace-dropdown';
import PlanUsage from './plan-usage';
import NativeNavigation from './native-navigation';
import { ScrollArea } from '../ui/scroll-area';
import FoldersDropdownList from './folders-dropdown-list';

interface SidebarProps {
    params:{ workspaceId:string};
    className?:string;
}

const Sidebar: React.FC<SidebarProps> = async ({params,className}) => {
    const supabase=createServerComponentClient({cookies})
    //user
    const {data: { user }} = await supabase.auth.getUser();

    if (!user) return;

    //subscription status
    const { data:subscriptionData,error:subscriptionError } = await getUserSubscriptionStatus(user.id);

    //folders
    const { data:workspaceFolderData,error:foldersError } = await getFolders(params.workspaceId);

    //errors
    if(subscriptionError || foldersError) redirect('/dashboard');
    //get all the different workspaces private collabaorating shared  
    const [privateWorkspaces,collaboratedWorkspaces] = await Promise.all([getPrivateWorkspaces(user.id),getCollaboratingWorkspaces(user.id)]);
  return (
    <aside className={twMerge('hidden  sm:flex sm:flex-col w-[280px] shrink-0 p-4 md:gap-4 !justify-between',className)}>
        <div>
            <WorkspaceDropdown privateWorkspaces={privateWorkspaces} 
            collaboratingworkspaces={collaboratedWorkspaces} 
            defaultValue={[
                ...privateWorkspaces,
                ...collaboratedWorkspaces,
            ].find((workspace)=> workspace.id === params.workspaceId)} />
            <PlanUsage foldersLength={workspaceFolderData?.length || 0} subscription={subscriptionData} />
            <NativeNavigation myWorkspaceId={params.workspaceId} />
            <ScrollArea className='overflow-scroll relative h-[450px]'>
                <div className='pointer-events-none w-full absolute bottom-0 h-20 bg-gradient-to-t from-background  to-transparent z-40 ' />
                <FoldersDropdownList workspaceFolders={workspaceFolderData || []} workspaceId={params.workspaceId} />
            </ScrollArea>
        </div>
    </aside>
  )
}

export default Sidebar