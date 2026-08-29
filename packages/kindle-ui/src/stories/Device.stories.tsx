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
    homeButton: { control: 'boolean' },
    overlay: { control: 'boolean' },
  },
}
export default meta

type Story = StoryObj<typeof Device>

function BirdIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M20.5 11c-.4-1.2-1.5-2-2.9-2-1 0-1.9.5-2.4 1.2l-1.1-2.2c-.6-1.3-2-2-3.4-1.7-1.1.2-2 .9-2.5 1.9l-.9 1.8c-.5 1-1.6 1.6-2.8 1.6H2v2h2.7c1.8 0 3.4-1 4.2-2.6l.9-1.8c.2-.4.6-.6 1-.7.6-.1 1.2.2 1.5.7l1.6 3.2c.2.4.6.6 1 .6.4 0 .8-.2 1-.6l.7-1.4c.2-.5.7-.8 1.3-.8.8 0 1.4.6 1.4 1.4 0 .3-.1.6-.3.8l-2.6 3.1c-.4.5-.2 1.2.4 1.4l3.5 1.2v-1.8l-2.5-.8 1.8-2.2c.5-.7.8-1.6.6-2.5z" />
    </svg>
  )
}

const headerMenu = [
  { textPrimary: 'Sync' },
  { textPrimary: 'Settings' },
  { textPrimary: 'About' },
]

export const Playground: Story = {
  args: { homeButton: false, overlay: true },
  render: (args) => (
    <Device {...args}>
      <div className="flex h-full flex-col items-center justify-center p-8 text-center text-ink">
        <BirdIcon className="mb-4 h-12 w-12" />
        <p className="font-serif text-lg">The Little Prince</p>
        <p className="mt-1 font-sans text-xs text-muted">Swipe to unlock</p>
      </div>
    </Device>
  ),
}

export const LockScreen: Story = {
  args: { homeButton: false, overlay: true },
  render: (args) => (
    <Device {...args}>
      <div className="flex h-full flex-col items-center justify-center p-8 text-center text-ink">
        <BirdIcon className="mb-4 h-12 w-12" />
        <p className="font-serif text-lg">The Little Prince</p>
        <p className="mt-1 font-sans text-xs text-muted">Swipe to unlock</p>
      </div>
    </Device>
  ),
}

export const Library: Story = {
  args: { homeButton: false, overlay: true },
  render: () => {
    const [query, setQuery] = useState('')
    const [active, setActive] = useState<string | null>('1984')
    return (
      <Device>
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
  args: { homeButton: false, overlay: true },
  render: () => {
    const [query, setQuery] = useState('')
    const [tab, setTab] = useState('all')
    return (
      <Device>
        <div className="flex h-full flex-col">
          <Navbar fixed>
            <StatuBar deviceName="My Kindle" battery={72} wifi="full" />
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
  args: { homeButton: false, overlay: true },
  render: () => {
    const [airplane, setAirplane] = useState(false)
    const [wifi, setWifi] = useState(false)
    return (
      <Device>
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

export const HomeButton: Story = {
  args: { homeButton: true, overlay: true },
  render: (args) => (
    <Device {...args}>
      <div className="flex h-full items-center justify-center p-8 text-center">
        <p className="font-serif text-lg text-ink">Press the home button to refresh the screen.</p>
      </div>
    </Device>
  ),
}


