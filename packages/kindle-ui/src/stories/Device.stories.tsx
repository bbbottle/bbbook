import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Device } from '../components/Device/Device.js'
import { Button } from '../components/Button/Button.js'
import { List } from '../components/List/List.js'
import { ListItem } from '../components/ListItem/ListItem.js'
import { Navbar } from '../components/Navbar/Navbar.js'
import { StatusBar } from '../components/StatusBar/StatusBar.js'
import { ActionBar, ActionGroup, ActionItem, SearchBar, ActionBarSpace } from '../components/ActionBar/ActionBar.js'
import { ActionBarMenu } from '../components/ActionBarMenu/ActionBarMenu.js'
import { ThemeProvider } from '../components/ThemeProvider/ThemeProvider.js'
import { Section, SectionTitle } from '../components/Section/Section.js'
import { Tab, TabItem } from '../components/Tab/Tab.js'
import { Grid, GridItem } from '../components/Grid/Grid.js'
import { Switch } from '../components/Switch/Switch.js'
import { TimeBar } from '../components/TimeBar/TimeBar.js'
import { Divider } from '../components/Divider/Divider.js'
import { Card, CardContent, CardTitle, CardAction } from '../components/Card/Card.js'
import { KindleOasis } from '../components/KindleOasis/KindleOasis.js'

const meta: Meta<typeof Device> = {
  title: 'Kindle UI/Device',
  component: Device,
  parameters: { layout: 'centered' },
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

export const LockScreen: Story = {
  render: () => (
    <Device>
      <div className="flex h-full flex-col items-center justify-center bg-device-screen p-8 text-ink">
        <BirdIcon className="mb-4 h-12 w-12" />
        <p className="font-serif text-lg">The Little Prince</p>
        <p className="mt-1 font-sans text-xs text-muted">Swipe to unlock</p>
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
          <ActionGroup>
            <ActionItem>Home</ActionItem>
            <ActionItem>Back</ActionItem>
          </ActionGroup>
          <ActionBarSpace />
          <SearchBar placeholder="Filter" className="mx-2 w-32" />
          <ActionBarMenu
            items={[
              { textPrimary: 'Sort by title' },
              { textPrimary: 'Sort by author' },
              { textPrimary: 'Refresh' },
            ]}
          />
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
    const [tab, setTab] = useState('all')
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
          <Tab>
            <TabItem active={tab === 'all'} onClick={() => setTab('all')}>All</TabItem>
            <TabItem active={tab === 'downloaded'} onClick={() => setTab('downloaded')}>Downloaded</TabItem>
          </Tab>
          <Section>
            <SectionTitle label="Results" />
            <Grid dense>
              <GridItem><div className="h-full w-full bg-muted" /></GridItem>
              <GridItem><div className="h-full w-full bg-muted" /></GridItem>
              <GridItem><div className="h-full w-full bg-muted" /></GridItem>
              <GridItem><div className="h-full w-full bg-muted" /></GridItem>
            </Grid>
          </Section>
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

export const Components: Story = {
  render: () => (
    <Device>
      <div className="flex h-full flex-col p-4 overflow-auto">
        <TimeBar className="mb-2" />
        <SectionTitle label="Settings" />
        <Card>
          <CardTitle>Device Options</CardTitle>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm">Airplane mode</span>
              <Switch checked={false} />
            </div>
            <Divider className="my-2" />
            <div className="flex items-center justify-between">
              <span className="text-sm">Dark mode</span>
              <Switch checked />
            </div>
          </CardContent>
          <CardAction>
            <Button>Done</Button>
          </CardAction>
        </Card>
      </div>
    </Device>
  ),
}

export const HomeButton: Story = {
  render: () => (
    <Device homeButton>
      <div className="flex h-full items-center justify-center p-8 text-center">
        <p className="font-serif text-lg text-ink">Press the home button to refresh the screen.</p>
      </div>
    </Device>
  ),
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

export const Oasis: Story = {
  render: () => (
    <KindleOasis>
      <div className="flex h-full flex-col items-center justify-center p-6 text-center">
        <StatusBar time="10:04 AM" battery={88} wifi="full" />
        <p className="font-serif text-lg text-ink">Kindle Oasis frame</p>
        <p className="mt-2 font-sans text-xs text-muted">Landscape layout with page-turn grip.</p>
      </div>
    </KindleOasis>
  ),
}
