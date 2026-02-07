"use client"

import React from "react"
import { Button } from "./Button"

type Props = {
  title?: string
  open: boolean
  onClose: () => void
  children: React.ReactNode
}

export function Modal({ title, open, onClose, children }: Props) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-gray-900 rounded-lg shadow-xl w-full max-w-lg p-4 border border-gray-700">
        <div className="flex items-center justify-between mb-3">
          {title && <h3 className="text-lg font-semibold text-white">{title}</h3>}
          <button onClick={onClose} className="text-gray-400 hover:text-gray-300">✕</button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  )
}

type ConfirmModalProps = {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: "danger" | "primary" | "success"
  loading?: boolean
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  loading = false
}: ConfirmModalProps) {
  if (!open) return null

  const iconMap = {
    danger: "⚠️",
    primary: "ℹ️",
    success: "✅"
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-900 rounded-xl shadow-2xl w-full max-w-md p-6 border border-gray-700 animate-scale-in">
        <div className="text-center mb-4">
          <div className="text-4xl mb-3">{iconMap[variant]}</div>
          <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
          <p className="text-gray-400">{message}</p>
        </div>
        <div className="flex gap-3 mt-6">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant}
            className="flex-1"
            onClick={onConfirm}
            loading={loading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}

type DeleteModalProps = {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  itemName?: string
  itemType?: string
  loading?: boolean
}

export function DeleteModal({
  open,
  onClose,
  onConfirm,
  itemName = "this item",
  itemType = "item",
  loading = false
}: DeleteModalProps) {
  return (
    <ConfirmModal
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title={`Delete ${itemType}?`}
      message={`Are you sure you want to delete "${itemName}"? This action cannot be undone.`}
      confirmText="Delete"
      cancelText="Cancel"
      variant="danger"
      loading={loading}
    />
  )
}
