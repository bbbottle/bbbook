import type { Meta, StoryObj } from '@storybook/react'
import { Navbar } from '../components/Navbar/Navbar.js'
import { StatusBar } from '../components/StatusBar/StatusBar.js'
import { ActionBar, ActionItem, SearchBar } from '../components/ActionBar/ActionBar.js'

const meta: Meta<typeof Navbar> = {
  title: 'Kindle UI/Navbar',
  component: Navbar,
}
export default meta

type Story = StoryObj<typeof Navbar>

export const Default: Story = {
  render: () => (
    <div className="w-full max-w-lg border border-divider">
      <StatusBar time="09:20 AM" battery={87} wifi="full" />
      <Navbar title="Library" />
      <ActionBar>
        <ActionItem>Home</ActionItem>
        <ActionItem>Back</ActionItem>
        <SearchBar placeholder="Search library" className="mx-2 flex-1" />
        <ActionItem>Menu</ActionItem>
      </ActionBar>
    </div>
  ),
}
