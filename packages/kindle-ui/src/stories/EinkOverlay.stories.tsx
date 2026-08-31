import type { Meta, StoryObj } from '@storybook/react'
import { useRef } from 'react'
import { Button } from '../components/Button/Button.js'
import { Device } from '../components/Device/Device.js'
import { type ScreenHandle } from '../components/Screen/index.js'

const meta: Meta<typeof Device> = {
  title: 'Kindle UI/EinkOverlay',
  component: Device,
  parameters: { layout: 'centered' },
}
export default meta

type Story = StoryObj<typeof Device>

export const Default: Story = {
  render: () => {
    const deviceRef = useRef<ScreenHandle>(null)
    return (
      <div className="flex flex-col items-center gap-4">
        <Device ref={deviceRef} />
        <Button onClick={() => deviceRef.current?.refresh()}>Refresh Screen</Button>
      </div>
    )
  },
}
