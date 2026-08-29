import type { Meta, StoryObj } from '@storybook/react'
import { useRef, useState } from 'react'
import { Device } from '../components/Device/Device.js'
import { ActionBar, ActionGroup, ActionItem, ActionBarSpace, SearchBar } from '../components/ActionBar/ActionBar.js'
import { ActionBarMenu } from '../components/ActionBarMenu/ActionBarMenu.js'
import { Button } from '../components/Button/Button.js'
import { Icon } from '../components/Icon/Icon.js'
import { Card, CardContent, CardTitle, CardAction, CardMedia } from '../components/Card/Card.js'
import { Container } from '../components/Container/Container.js'
import { Dialog } from '../components/Dialog/Dialog.js'
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
  render: () => {
    const [query, setQuery] = useState('')
    return (
      <Device>
        <div className="flex h-full flex-col p-4">
          <ActionBar>
            <ActionGroup>
              <ActionItem icon={<Icon name="home" size={22} />}>home</ActionItem>
              <ActionItem icon={<Icon name="back" size={22} />}>back</ActionItem>
            </ActionGroup>
            <ActionBarSpace />
            <SearchBar value={query} onChange={setQuery} placeholder="Filter" />
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
    )
  },
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
  render: () => {
    const [open, setOpen] = useState(false)
    return (
      <Device>
        <div className="flex h-full flex-col items-center justify-center p-4">
          <Button onClick={() => setOpen(true)}>Open dialog</Button>
          <Dialog
            open={open}
            title="Replace Wallpaper?"
            onClose={() => setOpen(false)}
            actions={
              <>
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={() => setOpen(false)}>Replace</Button>
              </>
            }
          >
            The selected image will be processed and applied to the lock screen.
          </Dialog>
        </div>
      </Device>
    )
  },
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

export const Catalog: Story = {
  name: 'Catalog',
  render: () => {
    const [sw, setSw] = useState(false)
    const [tab, setTab] = useState('all')
    const [menuOpen, setMenuOpen] = useState(false)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [query, setQuery] = useState('')
    const menuBtnRef = useRef<HTMLButtonElement>(null)

    return (
      <Device>
        <div className="h-full space-y-2 p-3 text-sm">
          <h1 className="mb-1 text-base font-serif font-semibold text-ink">Kindle UI Primitives</h1>

          <section className="space-y-1">
            <h2 className="text-[10px] font-sans font-medium uppercase tracking-wider text-muted">Switch</h2>
            <div className="flex items-center gap-2">
              <Switch checked={sw} onChange={(v) => setSw(v)} ariaLabel="airplane mode" />
              <span className="text-ink">{sw ? 'On' : 'Off'}</span>
            </div>
          </section>

          <Divider />

          <section className="space-y-1">
            <h2 className="text-[10px] font-sans font-medium uppercase tracking-wider text-muted">Tab</h2>
            <Tab>
              {['all', 'cloud', 'device'].map((key) => (
                <TabItem key={key} active={tab === key} onClick={() => setTab(key)}>
                  {key}
                </TabItem>
              ))}
            </Tab>
          </section>

          <Divider />

          <section className="space-y-1">
            <h2 className="text-[10px] font-sans font-medium uppercase tracking-wider text-muted">Menu</h2>
            <Button ref={menuBtnRef} className="h-8 px-3 text-xs" onClick={() => setMenuOpen(true)}>
              Open menu
            </Button>
            <Menu anchorEl={menuBtnRef.current} open={menuOpen} onClose={() => setMenuOpen(false)}>
              <MenuItem textPrimary="Sort by title" onClick={() => setMenuOpen(false)} />
              <MenuItem textPrimary="Refresh" onClick={() => setMenuOpen(false)} />
            </Menu>
          </section>

          <Divider />

          <section className="space-y-1">
            <h2 className="text-[10px] font-sans font-medium uppercase tracking-wider text-muted">ActionBarMenu</h2>
            <ActionBar className="rounded-screen">
              <ActionGroup>
                <ActionItem icon={<Icon name="home" size={22} />}>home</ActionItem>
              </ActionGroup>
              <ActionBarSpace />
              <SearchBar value={query} onChange={setQuery} placeholder="Filter" />
              <ActionBarMenu items={[{ textPrimary: 'Settings' }, { textPrimary: 'About' }]} />
            </ActionBar>
          </section>

          <Divider />

          <section className="space-y-1">
            <h2 className="text-[10px] font-sans font-medium uppercase tracking-wider text-muted">Grid</h2>
            <Grid dense>
              <GridItem><div className="h-full w-full bg-muted" /></GridItem>
              <GridItem><div className="h-full w-full bg-muted" /></GridItem>
              <GridItem><div className="h-full w-full bg-muted" /></GridItem>
              <GridItem><div className="h-full w-full bg-muted" /></GridItem>
            </Grid>
          </section>

          <Divider />

          <section className="space-y-1">
            <h2 className="text-[10px] font-sans font-medium uppercase tracking-wider text-muted">Section</h2>
            <Section className="px-0">
              <SectionTitle label="Library" />
              <p className="text-xs text-muted">12 books on device</p>
            </Section>
          </section>

          <Divider />

          <section className="space-y-1">
            <h2 className="text-[10px] font-sans font-medium uppercase tracking-wider text-muted">ListItem</h2>
            <ListItem title="The Great Gatsby" subtitle="F. Scott Fitzgerald" meta="32%" />
          </section>

          <Divider />

          <section className="space-y-1">
            <h2 className="text-[10px] font-sans font-medium uppercase tracking-wider text-muted">Card</h2>
            <Card className="w-full">
              <CardMedia className="h-20" />
              <CardTitle className="text-sm">The Little Prince</CardTitle>
              <CardContent className="text-xs text-muted">Antoine de Saint-Exupéry</CardContent>
              <CardAction>
                <Button className="h-8 px-3 text-xs">Open</Button>
              </CardAction>
            </Card>
          </section>

          <Divider />

          <section className="space-y-1">
            <h2 className="text-[10px] font-sans font-medium uppercase tracking-wider text-muted">Dialog</h2>
            <Button className="h-8 px-3 text-xs" onClick={() => setDialogOpen(true)}>
              Open dialog
            </Button>
            <Dialog
              open={dialogOpen}
              onClose={() => setDialogOpen(false)}
              title="Confirm?"
              actions={
                <>
                  <Button className="h-8 px-3 text-xs" variant="ghost" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button className="h-8 px-3 text-xs" onClick={() => setDialogOpen(false)}>
                    OK
                  </Button>
                </>
              }
            >
              Apply changes to the device?
            </Dialog>
          </section>
        </div>
      </Device>
    )
  },
}
