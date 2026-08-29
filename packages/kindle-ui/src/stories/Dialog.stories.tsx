import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Button } from '../components/Button/Button.js'
import { Dialog } from '../components/Dialog/Dialog.js'

const meta: Meta<typeof Dialog> = {
  title: 'Kindle UI/Dialog',
  component: Dialog,
  argTypes: {
    open: { control: 'boolean' },
    title: { control: 'text' },
  },
}
export default meta

type Story = StoryObj<typeof Dialog>

export const Default: Story = {
  args: { open: true, title: 'Replace Wallpaper?' },
  render: (args) => {
    const [open, setOpen] = useState(args.open ?? true)
    return (
      <div>
        <Button onClick={() => setOpen(true)}>Open Dialog</Button>
        <Dialog
          {...args}
          open={open}
          onClose={() => setOpen(false)}
          actions={
            <>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setOpen(false)}>Replace</Button>
            </>
          }
        >
          The selected image will be processed and applied to the lock screen.
        </Dialog>
      </div>
    )
  },
}
