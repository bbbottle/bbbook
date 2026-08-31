import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Device } from '../components/Device/Device.js'
import { List } from '../components/List/List.js'
import { ListItem } from '../components/ListItem/ListItem.js'

const meta: Meta<typeof List> = {
  title: 'Kindle UI/List',
  component: List,
  parameters: { layout: 'centered' },
}
export default meta

type Story = StoryObj<typeof List>

const books = [
  { title: 'The Great Gatsby', subtitle: 'F. Scott Fitzgerald', meta: '32%' },
  { title: '1984', subtitle: 'George Orwell', meta: 'New' },
  { title: 'Moby Dick', subtitle: 'Herman Melville', meta: 'Cloud' },
  { title: 'Invisible Man', subtitle: 'Ralph Ellison' },
]

export const Default: Story = {
  render: () => {
    const [active, setActive] = useState<string | null>('1984')
    return (
      <Device wallpaper="">
        <div className="flex h-full flex-col p-4">
          <List>
            {books.map((book) => (
              <ListItem
                key={book.title}
                title={book.title}
                subtitle={book.subtitle}
                meta={book.meta}
                active={active === book.title}
                onClick={() => setActive(book.title)}
              />
            ))}
          </List>
        </div>
      </Device>
    )
  },
}

export const WithBadge: Story = {
  render: () => (
    <Device wallpaper="">
      <div className="flex h-full flex-col p-4">
        <List>
          {['Home', 'Library', 'Store', 'Settings'].map((item, i) => (
            <ListItem key={item} title={item} meta={i === 1 ? '12' : undefined} />
          ))}
        </List>
      </div>
    </Device>
  ),
}
