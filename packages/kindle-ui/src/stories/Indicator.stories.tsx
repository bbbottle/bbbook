import type { Meta, StoryObj } from '@storybook/react'
import { Indicator } from '../components/Indicator/Indicator.js'

const meta: Meta<typeof Indicator> = {
  title: 'Kindle UI/Indicator',
  component: Indicator,
  parameters: { layout: 'centered' },
  argTypes: {
    status: { control: 'select', options: ['on', 'off', 'blink'] },
  },
  decorators: [
    (Story) => (
      <div
        className="bg-device-shell flex items-center justify-center"
        style={{ width: '400px', height: '120px', containerType: 'inline-size' }}
      >
        <Story />
      </div>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof Indicator>

export const On: Story = {
  args: { status: 'on' },
}

export const Off: Story = {
  args: { status: 'off' },
}

export const Blink: Story = {
  args: { status: 'blink' },
}
