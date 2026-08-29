import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Button } from '../components/Button/Button.js'
import { Dialog } from '../components/Dialog/Dialog.js'

const meta: Meta<typeof Dialog> = {
  title: 'Kindle UI/Dialog',
  component: Dialog,
}
export default meta

type Story = StoryObj<typeof Dialog>

export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(true)
    return (
      <div>
        <Button onClick={() => setOpen(true)}>Open Dialog</Button>
        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          title="Replace Wallpaper?"
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
