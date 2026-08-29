import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Device } from '../components/Device/Device.js'
import { Button } from '../components/Button/Button.js'
import { List } from '../components/List/List.js'
import { ListItem } from '../components/ListItem/ListItem.js'
import { Navbar } from '../components/Navbar/Navbar.js'
import { StatusBar } from '../components/StatusBar/StatusBar.js'
import { ActionBar, ActionItem, SearchBar } from '../components/ActionBar/ActionBar.js'
import { ThemeProvider } from '../components/ThemeProvider/ThemeProvider.js'

const meta: Meta<typeof Device> = {
  title: 'Kindle UI/Device',
  component: Device,
  parameters: { layout: 'centered' },
}
export default meta

type Story = StoryObj<typeof Device>

export const LockScreen: Story = {
  render: () => (
    <Device>
      <div className="flex h-full flex-col justify-between p-8">
        <div className="text-center font-sans text-sm text-muted">9:20 AM</div>
        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="mb-4 h-40 w-28 bg-gradient-to-br from-muted to-subtle shadow-eink" />
          <p className="font-serif text-lg text-ink">The Great Gatsby</p>
          <p className="font-sans text-xs text-muted">Swipe to unlock</p>
        </div>
        <Button className="w-full">Unlock</Button>
      </div>
    </Device>
  ),
}

export const Library: Story = {
  render: () => (
    <Device>
      <div className="flex h-full flex-col">
        <StatusBar time="09:20 AM" battery={72} wifi="full" />
        <Navbar title="Library" />
        <ActionBar>
          <ActionItem>Home</ActionItem>
          <ActionItem>Back</ActionItem>
          <SearchBar placeholder="Filter" className="mx-2 flex-1" />
          <ActionItem>Sort</ActionItem>
        </ActionBar>
        <List className="flex-1 overflow-auto">
          <ListItem title="The Great Gatsby" subtitle="F. Scott Fitzgerald" meta="32%" />
          <ListItem title="1984" subtitle="George Orwell" meta="New" active />
          <ListItem title="Moby Dick" subtitle="Herman Melville" meta="Cloud" />
          <ListItem title="Invisible Man" subtitle="Ralph Ellison" />
          <ListItem title="Dune" subtitle="Frank Herbert" />
        </List>
      </div>
    </Device>
  ),
}

export const Store: Story = {
  render: () => {
    const [query, setQuery] = useState('')
    return (
      <Device>
        <div className="flex h-full flex-col">
          <StatusBar time="09:21 AM" battery={72} wifi="full" />
          <Navbar title="Store" />
          <div className="border-b border-divider p-3">
            <SearchBar
              value={query}
              onChange={setQuery}
              onSubmit={() => {}}
              placeholder="Search z-library"
            />
          </div>
          <List className="flex-1 overflow-auto">
            <ListItem title="Design Patterns" subtitle="Gang of Four" meta="EPUB" />
            <ListItem title="Clean Code" subtitle="Robert C. Martin" meta="EPUB" />
            <ListItem title="The Pragmatic Programmer" subtitle="Hunt & Thomas" meta="PDF" />
          </List>
        </div>
      </Device>
    )
  },
}

export const Dark: Story = {
  render: () => (
    <ThemeProvider defaultMode="dark">
      <Device>
        <div className="flex h-full flex-col">
          <StatusBar time="09:22 PM" battery={45} wifi="full" />
          <Navbar title="Library" />
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <p className="font-serif text-lg text-ink">Dark mode is ready.</p>
            <p className="mt-2 font-sans text-xs text-muted">
              CSS variables drive the shell and screen palettes.
            </p>
          </div>
        </div>
      </Device>
    </ThemeProvider>
  ),
}
