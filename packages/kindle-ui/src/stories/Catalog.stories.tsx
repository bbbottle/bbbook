import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Device } from '../components/Device/Device.js'
import { ActionBar, ActionGroup, ActionItem, ActionBarSpace, SearchBar } from '../components/ActionBar/ActionBar.js'
import { ActionBarMenu } from '../components/ActionBarMenu/ActionBarMenu.js'
import { Button } from '../components/Button/Button.js'
import { Card, CardContent, CardTitle, CardAction, CardMedia } from '../components/Card/Card.js'
import { Container } from '../components/Container/Container.js'
import { Dialog } from '../components/Dialog/Dialog.js'
import { DialogContent } from '../components/Dialog/DialogContent.js'
import { DialogAction } from '../components/Dialog/DialogAction.js'
import { Divider } from '../components/Divider/Divider.js'
import { Grid, GridItem } from '../components/Grid/Grid.js'
import { ListItem } from '../components/ListItem/ListItem.js'
import { ListItemIcon } from '../components/ListItem/ListItemIcon.js'
import { ListItemText } from '../components/ListItem/ListItemText.js'
import { Menu, MenuItem } from '../components/Menu/Menu.js'
import { Section, SectionTitle } from '../components/Section/Section.js'
import { Switch } from '../components/Switch/Switch.js'
import { Tab, TabItem } from '../components/Tab/Tab.js'
import { TimeBar } from '../components/TimeBar/TimeBar.js'

const meta: Meta = {
  title: 'Kindle UI/Primitives',
}
export default meta

type Story = StoryObj

export const CardStory: Story = {
  name: 'Card',
  render: () => (
    <Device>
      <div className="flex h-full flex-col items-center justify-center p-4">
        <Card className="w-full">
          <CardMedia />
          <CardTitle>The Little Prince</CardTitle>
          <CardContent>Antoine de Saint-Exupéry</CardContent>
          <CardAction>
            <Button>Open</Button>
          </CardAction>
        </Card>
      </div>
    </Device>
  ),
}

export const SwitchStory: Story = {
  name: 'Switch',
  render: () => {
    const [on, setOn] = useState(false)
    return (
      <Device>
        <div className="flex h-full flex-col items-center justify-center p-4">
          <Switch checked={on} onChange={(v) => setOn(v)} ariaLabel="Airplane mode" />
          <p className="mt-4 text-sm text-muted">{on ? 'On' : 'Off'}</p>
        </div>
      </Device>
    )
  },
}

export const TabStory: Story = {
  name: 'Tab',
  render: () => {
    const [active, setActive] = useState('all')
    return (
      <Device>
        <div className="flex h-full flex-col p-4">
          <Tab>
            <TabItem active={active === 'all'} onClick={() => setActive('all')}>All</TabItem>
            <TabItem active={active === 'downloaded'} onClick={() => setActive('downloaded')}>Downloaded</TabItem>
            <TabItem active={active === 'cloud'} onClick={() => setActive('cloud')}>Cloud</TabItem>
          </Tab>
          <div className="mt-4 text-sm text-muted">Active: {active}</div>
        </div>
      </Device>
    )
  },
}

export const MenuStory: Story = {
  name: 'Menu',
  render: () => {
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
    return (
      <Device>
        <div className="flex h-full flex-col items-center justify-center p-4">
          <Button onClick={(e) => setAnchorEl(e.currentTarget)}>Open menu</Button>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
            <MenuItem textPrimary="Sort by title" onClick={() => setAnchorEl(null)} />
            <MenuItem textPrimary="Sort by author" onClick={() => setAnchorEl(null)} />
            <MenuItem textPrimary="Refresh" onClick={() => setAnchorEl(null)} />
          </Menu>
        </div>
      </Device>
    )
  },
}

export const ActionBarMenuStory: Story = {
  name: 'ActionBarMenu',
  render: () => (
    <Device>
      <div className="flex h-full flex-col p-4">
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
      </div>
    </Device>
  ),
}

export const DividerStory: Story = {
  name: 'Divider',
  render: () => (
    <Device>
      <div className="flex h-full flex-col p-8">
        <p className="text-sm text-ink">Section A</p>
        <Divider className="my-4" />
        <p className="text-sm text-ink">Section B</p>
      </div>
    </Device>
  ),
}

export const GridStory: Story = {
  name: 'Grid',
  render: () => (
    <Device>
      <div className="flex h-full flex-col p-4">
        <Grid dense>
          <GridItem><div className="h-full w-full bg-muted" /></GridItem>
          <GridItem><div className="h-full w-full bg-muted" /></GridItem>
          <GridItem><div className="h-full w-full bg-muted" /></GridItem>
          <GridItem><div className="h-full w-full bg-muted" /></GridItem>
        </Grid>
      </div>
    </Device>
  ),
}

export const SectionStory: Story = {
  name: 'Section',
  render: () => (
    <Device>
      <div className="flex h-full flex-col p-4">
        <TimeBar className="mb-2" />
        <Section>
          <SectionTitle label="Library" />
          <p className="text-sm text-muted">12 books on device</p>
        </Section>
      </div>
    </Device>
  ),
}

export const ListItemStory: Story = {
  name: 'ListItem',
  render: () => (
    <Device>
      <div className="flex h-full flex-col p-4">
        <ListItem title="The Great Gatsby" subtitle="F. Scott Fitzgerald" meta="32%" />
        <Divider />
        <ListItem title="1984" subtitle="George Orwell" meta="New" active />
        <Divider />
        <ListItem>
          <ListItemIcon>📖</ListItemIcon>
          <ListItemText primary="Custom layout" secondary="With icon and text" />
        </ListItem>
      </div>
    </Device>
  ),
}

export const DialogStory: Story = {
  name: 'Dialog',
  render: () => (
    <Device>
      <Dialog open title="Replace Wallpaper?" onClose={() => {}}>
        <DialogContent>The selected image will be processed and applied to the lock screen.</DialogContent>
        <DialogAction>
          <Button variant="ghost">Cancel</Button>
          <Button>Replace</Button>
        </DialogAction>
      </Dialog>
    </Device>
  ),
}

export const ContainerStory: Story = {
  name: 'Container',
  render: () => (
    <Container className="p-8">
      <h2 className="text-lg font-semibold">Container</h2>
      <p className="text-sm text-muted">Provides surface and typography defaults.</p>
    </Container>
  ),
}
