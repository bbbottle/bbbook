import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { List } from '../components/List/List.js'
import { ListItem } from '../components/ListItem/ListItem.js'

const meta: Meta<typeof List> = {
  title: 'Kindle UI/List',
  component: List,
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
      <List className="max-w-md border border-divider">
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
    )
  },
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
