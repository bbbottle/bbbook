import type { Meta, StoryObj } from '@storybook/react'
import { Device } from '../components/Device/Device.js'
import { Typography } from '../components/Typography/Typography.js'

const meta: Meta<typeof Typography> = {
  title: 'Kindle UI/Typography',
  component: Typography,
  parameters: { layout: 'centered' },
}
export default meta

type Story = StoryObj<typeof Typography>

export const Article: Story = {
  render: () => (
    <Device wallpaper="">
      <div className="h-full overflow-auto p-4">
        <Typography className="max-w-xl">
          <h1>The Design of Everyday Things</h1>
          <p>
            Good design is actually a lot harder to notice than poor design, in part because good
            designs fit our needs so well that the design is invisible.
          </p>
          <h2>Affordances</h2>
          <p>
            An affordance is a relationship between the properties of an object and the capabilities
            of the agent that determines just how the thing could possibly be used.
          </p>
          <blockquote>Design must be rooted in human behavior.</blockquote>
        </Typography>
      </div>
    </Device>
  ),
}
