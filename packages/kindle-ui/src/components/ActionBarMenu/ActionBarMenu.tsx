import { useState, type MouseEvent } from 'react'
import { ActionItem } from '../ActionBar/index.js'
import { Menu, MenuItem, type MenuItemProps } from '../Menu/index.js'

export interface ActionBarMenuProps {
  items?: MenuItemProps[]
}

export function ActionBarMenu({ items }: ActionBarMenuProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(e.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  return (
    <>
      <ActionItem onClick={handleClick} icon={<MoreIcon />}>
        More
      </ActionItem>
      <Menu open={Boolean(anchorEl)} onClose={handleClose} anchorEl={anchorEl}>
        {items?.map((item, i) => (
          <MenuItem
            key={`${item.textPrimary ?? i}-${i}`}
            {...item}
            onClick={(e) => {
              handleClose()
              item.onClick?.(e)
            }}
          />
        ))}
      </Menu>
    </>
  )
}

function MoreIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
    </svg>
  )
}
