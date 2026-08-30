import { useState, type MouseEvent } from 'react'
import { ActionItem } from '../ActionBar/index.js'
import { Icon } from '../Icon/index.js'
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
      <ActionItem onClick={handleClick} icon={<Icon name="menu" size={20} />} />
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


