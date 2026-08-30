import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Device } from '../components/Device/Device.js'
import { Button } from '../components/Button/Button.js'
import { List } from '../components/List/List.js'
import { ListItem } from '../components/ListItem/ListItem.js'
import { Navbar } from '../components/Navbar/Navbar.js'
import { StatuBar } from '../components/StatuBar/StatuBar.js'
import { ActionBar, ActionGroup, ActionItem, SearchBar, ActionBarSpace } from '../components/ActionBar/ActionBar.js'
import { ActionBarMenu } from '../components/ActionBarMenu/ActionBarMenu.js'

import { Section, SectionTitle } from '../components/Section/Section.js'
import { Tab, TabItem } from '../components/Tab/Tab.js'
import { Grid, GridItem } from '../components/Grid/Grid.js'
import { Switch } from '../components/Switch/Switch.js'
import { TimeBar } from '../components/TimeBar/TimeBar.js'
import { Divider } from '../components/Divider/Divider.js'
import { Card, CardTitle, CardContent, CardAction } from '../components/Card/Card.js'
import { Icon } from '../components/Icon/Icon.js'

const meta: Meta<typeof Device> = {
  title: 'Kindle UI/Device',
  component: Device,
  parameters: { layout: 'centered' },
  argTypes: {
    overlay: { control: 'boolean' },
  },
}
export default meta

type Story = StoryObj<typeof Device>

const headerMenu = [
  { textPrimary: 'Sync' },
  { textPrimary: 'Settings' },
  { textPrimary: 'About' },
]

export const Playground: Story = {
  args: { overlay: true },
  render: (args) => (
    <Device {...args}>
      <div className="flex h-full flex-col items-center justify-center p-8 text-center text-ink">
        <p className="font-serif text-lg">The Little Prince</p>
        <p className="mt-1 font-sans text-xs text-muted">Swipe to unlock</p>
      </div>
    </Device>
  ),
}

export const LockScreen: Story = {
  args: { overlay: true },
  render: (args) => (
    <Device {...args}>
      <div className="flex h-full flex-col items-center justify-center p-8 text-center text-ink">
        <p className="font-serif text-lg">The Little Prince</p>
        <p className="mt-1 font-sans text-xs text-muted">Swipe to unlock</p>
      </div>
    </Device>
  ),
}

export const Library: Story = {
  args: { overlay: true },
  render: () => {
    const [query, setQuery] = useState('')
    const [active, setActive] = useState<string | null>('1984')
    return (
      <Device wallpaper="">
        <div className="flex h-full flex-col">
          <Navbar fixed>
            <StatuBar
              deviceName="My Kindle"
              battery={86}
              celluar={{ on: true, label: 'LTE', signal: 3 }}
            />
            <ActionBar>
              <ActionGroup>
                <ActionItem icon={<Icon name="home" size={22} />}>home</ActionItem>
                <ActionItem icon={<Icon name="back" size={22} />}>back</ActionItem>
                <ActionItem icon={<Icon name="settings" size={22} />}>settings</ActionItem>
              </ActionGroup>
              <ActionBarSpace />
              <ActionGroup>
                <SearchBar
                  value={query}
                  onChange={setQuery}
                  onSubmit={(value) => console.log('search', value)}
                  placeholder="Search"
                />
                <ActionBarMenu items={headerMenu} />
              </ActionGroup>
            </ActionBar>
          </Navbar>
          <List className="flex-1 overflow-auto">
            {[
              { title: 'The Great Gatsby', subtitle: 'F. Scott Fitzgerald', meta: '32%' },
              { title: '1984', subtitle: 'George Orwell', meta: 'New' },
              { title: 'Moby Dick', subtitle: 'Herman Melville', meta: 'Cloud' },
              { title: 'Invisible Man', subtitle: 'Ralph Ellison', meta: '10%' },
              { title: 'Dune', subtitle: 'Frank Herbert', meta: 'Cloud' },
            ].map((book) => (
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

export const Store: Story = {
  args: { overlay: true },
  render: () => {
    const [query, setQuery] = useState('')
    const [tab, setTab] = useState('all')
    return (
      <Device wallpaper="">
        <div className="flex h-full flex-col">
          <Navbar fixed>
            <StatuBar
              deviceName="My Kindle"
              battery={72}
              celluar={{ on: true, label: 'LTE', signal: 3 }}
            />
            <ActionBar>
              <ActionGroup>
                <ActionItem icon={<Icon name="home" size={22} />}>home</ActionItem>
                <ActionItem icon={<Icon name="back" size={22} />}>back</ActionItem>
              </ActionGroup>
              <ActionBarSpace />
              <ActionGroup>
                <SearchBar
                  value={query}
                  onChange={setQuery}
                  onSubmit={(value) => console.log('search', value)}
                  placeholder="Search"
                />
                <ActionBarMenu items={headerMenu} />
              </ActionGroup>
            </ActionBar>
          </Navbar>
          <Tab>
            <TabItem active={tab === 'all'} onClick={() => setTab('all')}>All</TabItem>
            <TabItem active={tab === 'downloaded'} onClick={() => setTab('downloaded')}>Downloaded</TabItem>
          </Tab>
          <Section className="flex-1 overflow-auto">
            <SectionTitle label="Results" />
            <Grid dense>
              {Array.from({ length: 4 }).map((_, i) => (
                <GridItem key={i}><div className="h-full w-full bg-muted" /></GridItem>
              ))}
            </Grid>
            <List>
              <ListItem title="Design Patterns" subtitle="Gang of Four" meta="EPUB" />
              <ListItem title="Clean Code" subtitle="Robert C. Martin" meta="EPUB" />
              <ListItem title="The Pragmatic Programmer" subtitle="Hunt & Thomas" meta="PDF" />
            </List>
          </Section>
        </div>
      </Device>
    )
  },
}

export const Components: Story = {
  args: { overlay: true },
  render: () => {
    const [airplane, setAirplane] = useState(false)
    const [wifi, setWifi] = useState(false)
    return (
      <Device wallpaper="">
        <div className="flex h-full flex-col overflow-auto p-4">
          <TimeBar className="mb-2" />
          <Card>
            <CardTitle>Device Options</CardTitle>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm">Airplane mode</span>
                <Switch checked={airplane} onChange={setAirplane} ariaLabel="Airplane mode" />
              </div>
              <Divider className="my-2" />
              <div className="flex items-center justify-between">
                <span className="text-sm">Wi-Fi</span>
                <Switch checked={wifi} onChange={setWifi} ariaLabel="Wi-Fi" />
              </div>
            </CardContent>
            <CardAction>
              <Button onClick={() => { setAirplane(false); setWifi(false) }}>Reset</Button>
              <Button>Done</Button>
            </CardAction>
          </Card>
        </div>
      </Device>
    )
  },
}


