import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Device } from '../components/Device/Device.js'
import { Navbar } from '../components/Navbar/Navbar.js'
import { StatuBar } from '../components/StatuBar/StatuBar.js'
import { ActionBar, ActionGroup, ActionItem, SearchBar, ActionBarSpace } from '../components/ActionBar/ActionBar.js'
import { ActionBarMenu } from '../components/ActionBarMenu/ActionBarMenu.js'
import { Icon } from '../components/Icon/Icon.js'

const meta: Meta<typeof Navbar> = {
  title: 'Kindle UI/Navbar',
  component: Navbar,
  parameters: { layout: 'centered' },
  argTypes: {
    fixed: { control: 'boolean' },
  },
}
export default meta

type Story = StoryObj<typeof Navbar>

const menuItems = [
  { textPrimary: 'Sync' },
  { textPrimary: 'Settings' },
  { textPrimary: 'About' },
]

export const Header: Story = {
  args: { fixed: false },
  render: (args) => {
    const [query, setQuery] = useState('')
    return (
      <Device wallpaper="">
        <div className="flex h-full flex-col">
          <Navbar {...args}>
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
                  placeholder="Search"
                />
                <ActionBarMenu items={menuItems} />
              </ActionGroup>
            </ActionBar>
          </Navbar>
        </div>
      </Device>
    )
  },
}
