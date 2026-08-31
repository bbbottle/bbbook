import type { Meta, StoryObj } from '@storybook/react'
import { Button } from '../components/Button/Button.js'
import { Device } from '../components/Device/Device.js'

const meta: Meta<typeof Button> = {
  title: 'Kindle UI/Button',
  component: Button,
  parameters: { layout: 'centered' },
  argTypes: {
    variant: { control: 'select', options: ['default', 'outline', 'ghost'] },
    disabled: { control: 'boolean' },
  },
  render: (args) => (
    <Device wallpaper="">
      <div className="flex h-full flex-col items-center justify-center p-4">
        <Button {...args} />
      </div>
    </Device>
  ),
}
export default meta

type Story = StoryObj<typeof Button>

export const Default: Story = {
  args: { variant: 'default', children: 'Submit' },
}

export const Outline: Story = {
  args: { variant: 'outline', children: 'Cancel' },
}

export const Ghost: Story = {
  args: { variant: 'ghost', children: 'Skip' },
}

export const Disabled: Story = {
  args: { variant: 'default', children: 'Disabled', disabled: true },
}
