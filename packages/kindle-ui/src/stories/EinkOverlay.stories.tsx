import type { Meta, StoryObj } from '@storybook/react'
import { useRef } from 'react'
import { Button } from '../components/Button/Button.js'
import { EinkOverlay, type EinkOverlayHandle } from '../components/EinkOverlay/EinkOverlay.js'

const meta: Meta<typeof EinkOverlay> = {
  title: 'Kindle UI/EinkOverlay',
  component: EinkOverlay,
}
export default meta

type Story = StoryObj<typeof EinkOverlay>

export const Default: Story = {
  render: () => {
    const overlayRef = useRef<EinkOverlayHandle>(null)
    return (
      <div className="relative inline-block">
        <EinkOverlay ref={overlayRef} className="h-96 w-80">
          <div className="flex h-full flex-col items-center justify-center gap-4 bg-paper p-6 text-center text-ink">
            <h2 className="font-serif text-2xl">Ink Screen</h2>
            <p className="font-serif text-sm text-muted">
              The WebGL overlay applies ordered dither, scanlines, vignette and a page-refresh
              flash.
            </p>
          </div>
        </EinkOverlay>
        <div className="mt-4">
          <Button onClick={() => overlayRef.current?.refresh()}>Refresh Screen</Button>
        </div>
      </div>
    )
  },
}
