"use client"

import { useState, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth } from './auth-provider'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { LogOut, User, Trash2 } from 'lucide-react'
import { deleteAccount } from '@/app/actions/delete-account'

export function UserMenu() {
  const t = useTranslations('auth')
  const { user, signOut } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!user) return null

  const handleSignOut = () => {
    setIsOpen(false)
    signOut()
  }

  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    const result = await deleteAccount()

    if (!result.error) {
      await signOut()
      window.location.href = '/'
    } else {
      setIsDeleting(false)
    }
  }

  const openDeleteDialog = () => {
    setIsOpen(false)
    setShowDeleteDialog(true)
  }

  return (
    <>
      <div className="relative" ref={menuRef}>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-2"
          onClick={() => setIsOpen(!isOpen)}
        >
          {user.user_metadata?.avatar_url ? (
            <img
              src={user.user_metadata.avatar_url}
              alt="Avatar"
              className="h-6 w-6 rounded-full"
            />
          ) : (
            <User className="h-4 w-4" />
          )}
          <span className="hidden sm:inline text-sm">
            {user.user_metadata?.full_name || user.email?.split('@')[0]}
          </span>
        </Button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-1 z-50 bg-background border rounded-md shadow-lg py-1 min-w-[160px]">
            <button
              onClick={handleSignOut}
              className="w-full px-3 py-2 text-sm text-left flex items-center gap-2 hover:bg-accent"
            >
              <LogOut className="h-4 w-4" />
              {t('signOut')}
            </button>
            <button
              onClick={openDeleteDialog}
              className="w-full px-3 py-2 text-sm text-left flex items-center gap-2 hover:bg-accent text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              {t('deleteAccount')}
            </button>
          </div>
        )}
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{t('deleteAccountTitle')}</DialogTitle>
            <DialogDescription>
              {t('deleteAccountConfirm')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              {t('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isDeleting}
            >
              {isDeleting ? '...' : t('deleteAccountButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
