'use client';

import { useAppState } from '@/lib/providers/state-provider';
import { workspace } from '@/lib/supabase/supabase.types';
import React, { useEffect, useState } from 'react';
import SelectedWorkspace from './selected-workspace';
import CustomDialogTrigger from '../global/custom-dialog-trigger';
import WorkspaceCreator from '../global/workspace-creator';

interface WorkspaceDropdownProps {
    privateWorkspaces: workspace[] | [];
    collaboratingworkspaces: workspace[] | [];
    defaultValue: workspace | undefined;
}

const WorkspaceDropdown: React.FC<WorkspaceDropdownProps> = 
({privateWorkspaces,collaboratingworkspaces,defaultValue}) => {
    const {dispatch,state}=useAppState();
    const [selectedOption,setSelectedoption]=useState(defaultValue);
    const [isOpen,setisOpen]=useState(false);

    useEffect(() => {
        if (!state.workspaces.length) {
          dispatch({
            type: 'SET_WORKSPACES',
            payload: {
              workspaces: [
                ...privateWorkspaces,
                ...collaboratingworkspaces,
              ].map((workspace) => ({ ...workspace, folders: [] })),
            },
          });
        }
      }, [privateWorkspaces, collaboratingworkspaces]);

    const handleSelect=(option: workspace) => {
            setSelectedoption(option);
            setisOpen(false);
    }

    useEffect(() => {
      const findSelectedWorkspace = state.workspaces.find(
        (workspace) => workspace.id === defaultValue?.id
      );
      if (findSelectedWorkspace) setSelectedoption(findSelectedWorkspace);
    }, [state, defaultValue]);

  return (
    <div className='relative inline-block text-left'>
        <div>
            <span onClick={()=>setisOpen(!isOpen)}>
                {selectedOption ? <SelectedWorkspace workspace={selectedOption} /> : 'Select a Workspace'}
            </span>
        </div>
        {isOpen && <div className='origin-top-right absolute w-full rounded-md shadow-md z-50 h-[190px] bg-black/10 backdrop-blur-lg group overflow-scroll  border-[1px] border-muted'>
            <div className=' rounded-md flex flex-col'>
                <div className='!p-2'>
                    {!!privateWorkspaces.length && (<>
                        <p className='text-muted-foreground'>Private</p>
                        <hr></hr>
                        {privateWorkspaces.map((option)=>(
                            <SelectedWorkspace key={option.id} workspace={option} onClick={handleSelect} />
                        ))}
                    </>
                )}
                {!!collaboratingworkspaces.length && (<>
                        <p className='text-muted-foreground'>Collaborating</p>
                        <hr></hr>
                        {collaboratingworkspaces.map((option)=>(
                            <SelectedWorkspace key={option.id} workspace={option} onClick={handleSelect} />
                        ))}
                    </>
                )}
                </div>
                <CustomDialogTrigger header="Create A Workspace" content={<WorkspaceCreator />} description='lorem ipsum jghchgxjfcjfcjgchgcjhcjcjhfjfcjfj'>
                <></>
                <div className='flex transition-all hover:bg-muted justify-center items-center gap-2 p-2 w-full '>
                    <article className='text-slate-500 rounded-full bg-slate-800 2-4 h-4 flex items-center justify-center'>
                        +
                    </article>
                    Create Workspace
                </div>
                </CustomDialogTrigger>
            </div>
        </div>}
    </div>
  )
}

export default WorkspaceDropdown