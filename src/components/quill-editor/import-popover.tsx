import React from 'react'

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
  } from "@/components/ui/popover"
// import FileUploaderTest from '../extension/file-uploader-test';
// import { Button } from '../ui/button';
import Page from './upload-file';



const ImportPopover = () => { //add subscription check
  return (
    <Popover>
      <PopoverTrigger>IMPORT</PopoverTrigger>
      <PopoverContent>
        {/* <div><FileUploaderTest /></div> */}
        {/* <Button className='w-full'>GENERATE</Button> */}
        <div><Page /></div>
      </PopoverContent>
    </Popover>
  )
};

export default ImportPopover;

