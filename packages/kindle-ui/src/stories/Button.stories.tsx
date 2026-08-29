import type { Meta, StoryObj } from '@storybook/react'
import { Button } from '../components/Button/Button.js'

const meta: Meta<typeof Button> = {
  title: 'Kindle UI/Button',
  component: Button,
  argTypes: {
    variant: { control: 'select', options: ['default', 'outline', 'ghost'] },
    disabled: { control: 'boolean' },
  },
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
