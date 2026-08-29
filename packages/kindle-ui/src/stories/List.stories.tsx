import type { Meta, StoryObj } from '@storybook/react'
import { List } from '../components/List/List.js'
import { ListItem } from '../components/ListItem/ListItem.js'

const meta: Meta<typeof List> = {
  title: 'Kindle UI/List',
  component: List,
}
export default meta

type Story = StoryObj<typeof List>

export const Default: Story = {
  render: () => (
    <List className="max-w-md border border-divider">
      <ListItem title="The Great Gatsby" subtitle="F. Scott Fitzgerald" meta="32%" />
      <ListItem title="1984" subtitle="George Orwell" meta="New" active />
      <ListItem title="Moby Dick" subtitle="Herman Melville" meta="Cloud" />
    </List>
  ),
}

export const WithBadge: Story = {
  render: () => (
    <List className="max-w-md border border-divider">
      {['Home', 'Library', 'Store', 'Settings'].map((item, i) => (
        <ListItem key={item} title={item} meta={i === 1 ? '12' : undefined} />
      ))}
    </List>
  ),
}
